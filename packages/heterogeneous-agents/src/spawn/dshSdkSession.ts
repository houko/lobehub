import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';

import { DshAdapter } from '../adapters/dsh';
import type { HeterogeneousAgentEvent } from '../types';

/**
 * Drives a DeepSeek Harness SDK runtime (`@deepseek-ai/dsh-jsonrpc`) over
 * newline-delimited JSON-RPC on stdio.
 *
 * This is the bidirectional counterpart to `spawnAgent`: the harness is a
 * server we send requests to (`initialize`, `session/prompt`, `shutdown`), not
 * a CLI that prints a transcript and exits, so the CLI spawn pipeline does not
 * fit. Its stdout carries protocol frames only.
 */
export interface DshSdkSessionOptions {
  /** Arguments for the runtime binary; the harness requires a `cordis.yml` path. */
  args: string[];
  /** Runtime binary — the bundled executable, or `node` when launching from source. */
  command: string;
  /**
   * Agent workspace. Sent as the harness session `cwd`, which is what the
   * filesystem tools resolve relative paths against, and used as the child's
   * working directory unless {@link spawnCwd} overrides it.
   */
  cwd: string;
  env?: Record<string, string>;
  maxTokens?: number;
  model: string;
  provider: string;
  /**
   * Session id to prompt. Unknown ids lazily create the agent, so a caller
   * chooses this rather than discovering it. The adapter binds to it so
   * sibling sessions in the same runtime are filtered out.
   */
  sessionId: string;
  /**
   * Child process working directory, when it must differ from the workspace.
   * The packaged runtime needs no override; a source launch does, because Node
   * resolves `--import` loader specifiers against the process cwd.
   */
  spawnCwd?: string;
  /** Wall-clock ceiling for the whole run. */
  timeoutMs?: number;
}

export interface DshSdkSessionHandle {
  /** Terminate the runtime; safe to call more than once. */
  dispose: () => Promise<void>;
  /** Stream events for one prompt, ending after the harness reports whole-agent idle. */
  prompt: (text: string) => AsyncGenerator<HeterogeneousAgentEvent>;
}

interface PendingRequest {
  reject: (error: Error) => void;
  resolve: (result: any) => void;
}

/** Frames a JSON-RPC line stream and resolves responses against pending requests. */
class JsonRpcStdio {
  private buffer = '';
  private nextId = 1;
  private pending = new Map<number, PendingRequest>();

  constructor(
    private child: ChildProcessWithoutNullStreams,
    private onNotification: (frame: any) => void,
  ) {
    child.stdout.on('data', (chunk: Buffer) => this.consume(chunk.toString('utf8')));
  }

  request(method: string, params?: unknown): Promise<any> {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { reject, resolve });
      this.child.stdin.write(`${JSON.stringify({ id, jsonrpc: '2.0', method, params })}\n`);
    });
  }

  /** Fail every in-flight request; the runtime will send no more responses. */
  rejectAll(error: Error): void {
    for (const { reject } of this.pending.values()) reject(error);
    this.pending.clear();
  }

  private consume(text: string): void {
    this.buffer += text;
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      let frame: any;
      try {
        frame = JSON.parse(line);
      } catch {
        // The protocol ignores malformed lines rather than tearing down the
        // connection; a stray write must not kill an in-flight turn.
        continue;
      }

      if (typeof frame.id === 'number' && frame.method === undefined) {
        const waiter = this.pending.get(frame.id);
        this.pending.delete(frame.id);
        if (!waiter) continue;
        if (frame.error) waiter.reject(new Error(frame.error.message ?? 'JSON-RPC error'));
        else waiter.resolve(frame.result);
        continue;
      }

      if (typeof frame.method === 'string') this.onNotification(frame);
    }
  }
}

/**
 * Launch a harness runtime and complete the handshake.
 *
 * @param options - runtime binary, workspace, model route, and session id.
 * @returns a handle whose `prompt` streams one turn's events.
 */
export const spawnDshSdkSession = async (
  options: DshSdkSessionOptions,
): Promise<DshSdkSessionHandle> => {
  const child = spawn(options.command, options.args, {
    cwd: options.spawnCwd ?? options.cwd,
    env: { ...process.env, ...options.env } as NodeJS.ProcessEnv,
    stdio: ['pipe', 'pipe', 'pipe'],
  }) as ChildProcessWithoutNullStreams;

  let stderr = '';
  child.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf8');
  });

  const adapter = new DshAdapter(options.sessionId);
  let queue: HeterogeneousAgentEvent[] = [];
  let wake: (() => void) | undefined;
  let exited: Error | undefined;

  const push = (events: HeterogeneousAgentEvent[]): void => {
    if (events.length === 0) return;
    queue.push(...events);
    wake?.();
  };

  const rpc = new JsonRpcStdio(child, (frame) => push(adapter.adapt(frame)));

  child.on('exit', (code, signal) => {
    // Only a clean exit may synthesize a terminal event. Flushing on a crash
    // would close the stream with `agent_runtime_end` and make a dead runtime
    // read as a completed run.
    if (code === 0 && signal === null) {
      push(adapter.flush());
      wake?.();
      return;
    }

    exited = new Error(
      `harness runtime exited (code ${code}, signal ${signal})${stderr ? `: ${stderr.trim()}` : ''}`,
    );
    rpc.rejectAll(exited);
    wake?.();
  });

  await rpc.request('initialize', {
    cwd: options.cwd,
    model: options.model,
    provider: options.provider,
    ...(options.maxTokens === undefined ? {} : { maxTokens: options.maxTokens }),
  });

  const dispose = async (): Promise<void> => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    // `shutdown` is best-effort: a runtime already tearing down never answers,
    // and the kill below is the real settlement.
    await rpc.request('shutdown').catch(() => {});
    child.kill('SIGTERM');
  };

  async function* prompt(text: string): AsyncGenerator<HeterogeneousAgentEvent> {
    const deadline = options.timeoutMs === undefined ? undefined : Date.now() + options.timeoutMs;

    void rpc
      .request('session/prompt', {
        contentBlocks: [{ text, type: 'text' }],
        sessionId: options.sessionId,
      })
      .catch((error: Error) => {
        exited ??= error;
        wake?.();
      });

    for (;;) {
      while (queue.length > 0) {
        const batch = queue;
        queue = [];
        for (const event of batch) {
          yield event;
          // The harness reports whole-agent idle only once the turn and every
          // continuation it scheduled are done, so this is the run boundary.
          if (event.type === 'agent_runtime_end') return;
        }
      }

      if (exited) throw exited;
      if (deadline !== undefined && Date.now() > deadline) {
        throw new Error(`harness run exceeded ${options.timeoutMs}ms`);
      }

      await new Promise<void>((resolve) => {
        wake = resolve;
        setTimeout(resolve, 250);
      });
      wake = undefined;
    }
  }

  return { dispose, prompt };
};
