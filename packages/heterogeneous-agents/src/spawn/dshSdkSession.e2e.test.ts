import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { HeterogeneousAgentEvent } from '../types';
import { spawnDshSdkSession } from './dshSdkSession';

/**
 * End-to-end against a REAL DeepSeek Harness runtime — real model calls, real
 * tool execution, real subagent delegation.
 *
 * Self-skips unless both are present:
 * - `DEEPSEEK_API_KEY`
 * - `DSH_REPO` pointing at a `deepseek-harness` checkout with `node_modules`
 *   installed (the runtime is launched from source through tsx)
 *
 * These cases exist because the replay fixtures cannot cover them: the recorded
 * snapshots normalize every session id to one value, so parent/child routing is
 * only ever exercised for real here, and the workspace-isolation case asserts
 * against the actual filesystem.
 */

const HARNESS =
  process.env.DSH_REPO ?? path.join(process.env.HOME ?? '', 'CodeProjects/deepseek-harness');
const CONFIG = path.join(HARNESS, 'examples/jsonrpc-agent/cordis.yml');

const runnable =
  Boolean(process.env.DEEPSEEK_API_KEY) &&
  existsSync(CONFIG) &&
  existsSync(path.join(HARNESS, 'node_modules/.bin/tsx'));

const start = async (workspace: string, config = CONFIG) =>
  spawnDshSdkSession({
    args: [
      '--import',
      'tsx',
      path.join(HARNESS, 'packages/examples/jsonrpc-demo/src/bin.ts'),
      config,
    ],
    command: process.execPath,
    cwd: workspace,
    env: {
      DSH_CWD: workspace,
      DSH_SESSION_ROOT: path.join(workspace, '.sessions'),
      DSH_SYSTEM_PROMPT: 'You are a terse coding agent. Use tools when asked to.',
    },
    maxTokens: 2048,
    model: 'deepseek-chat',
    provider: 'deepseek-official',
    sessionId: 'lobehub-e2e',
    // Node resolves `--import` loader specifiers against the process cwd, so a
    // source launch runs from the harness checkout while the agent works in the
    // temp workspace.
    spawnCwd: HARNESS,
    timeoutMs: 240_000,
  });

const collect = async (
  handle: Awaited<ReturnType<typeof start>>,
  prompt: string,
): Promise<HeterogeneousAgentEvent[]> => {
  const events: HeterogeneousAgentEvent[] = [];
  try {
    for await (const event of handle.prompt(prompt)) events.push(event);
  } finally {
    await handle.dispose();
  }
  return events;
};

const textOf = (events: HeterogeneousAgentEvent[], subagent = false): string =>
  events
    .filter((e) => e.type === 'stream_chunk' && (e.data as any).chunkType === 'text')
    .filter((e) => Boolean((e.data as any).subagent) === subagent)
    .map((e) => (e.data as any).content)
    .join('');

describe.runIf(runnable)('spawnDshSdkSession — live harness', () => {
  it('streams a text turn token by token with a usable route and usage', async () => {
    const events = await collect(
      await start(mkdtempSync(path.join(tmpdir(), 'dsh-e2e-'))),
      'Reply with exactly: LIVE OK',
    );

    expect(textOf(events).trim()).toContain('LIVE OK');
    expect(events.at(-1)?.type).toBe('agent_runtime_end');
    expect(events.filter((e) => e.type === 'error')).toHaveLength(0);

    const first = events.find((e) => e.type === 'stream_start');
    expect(first?.data).toMatchObject({ model: 'deepseek-chat', provider: 'deepseek-harness' });

    // Real streaming, not one committed blob.
    expect(events.filter((e) => e.type === 'stream_chunk').length).toBeGreaterThan(2);

    const complete = events.find((e) => e.type === 'step_complete');
    expect((complete?.data as any).usage.totalInputTokens).toBeGreaterThan(0);
  }, 240_000);

  it('pairs every tool call and writes into the workspace, not the launch directory', async () => {
    const workspace = mkdtempSync(path.join(tmpdir(), 'dsh-e2e-'));
    const events = await collect(
      await start(workspace),
      'Use the bash tool to run: echo live-proof-4417 . Then write the file note.txt containing the word DONE. Then reply with the echo output.',
    );

    const starts = events.filter((e) => e.type === 'tool_start');
    expect(starts.length).toBeGreaterThanOrEqual(2);
    expect(events.filter((e) => e.type === 'tool_end')).toHaveLength(starts.length);
    expect(events.filter((e) => e.type === 'tool_result')).toHaveLength(starts.length);
    expect(events.filter((e) => e.type === 'error')).toHaveLength(0);

    const bash = events.find(
      (e) =>
        e.type === 'tool_result' && String((e.data as any).content).includes('live-proof-4417'),
    );
    expect(bash).toBeDefined();

    // `cwd` is the agent workspace: conflating it with the launch directory
    // wrote the agent's files into the harness checkout.
    expect(readFileSync(path.join(workspace, 'note.txt'), 'utf8')).toContain('DONE');
    expect(existsSync(path.join(HARNESS, 'note.txt'))).toBe(false);
  }, 240_000);

  it('stamps a delegated child session onto its spawning tool call', async () => {
    const events = await collect(
      await start(mkdtempSync(path.join(tmpdir(), 'dsh-e2e-'))),
      'Use the subagent tool exactly once, with description "echo probe" and a prompt asking it to reply with exactly: child answer 42. Then report what the subagent said.',
    );

    const spawnCall = events.find(
      (e) => e.type === 'tool_start' && (e.data as any).toolCalling.identifier === 'subagent',
    );
    expect(spawnCall).toBeDefined();

    const stamped = events.filter((e) => (e.data as any).subagent);
    expect(stamped.length).toBeGreaterThan(0);
    expect((stamped[0].data as any).subagent.parentToolCallId).toBe(
      (spawnCall!.data as any).toolCalling.id,
    );

    // Rides the first EMITTED child event — a child opens with lifecycle frames
    // that map to no event and must not consume it.
    const withSpawn = stamped.filter((e) => (e.data as any).subagent.spawnMetadata);
    expect(withSpawn).toHaveLength(1);
    expect(withSpawn[0]).toBe(stamped[0]);

    // The child's answer belongs to the child, not the parent's message.
    expect(textOf(events, true)).toContain('child answer 42');
    expect(textOf(events, false)).not.toBe('');
  }, 240_000);

  it('forwards a model-generated session title when a title provider is composed', async () => {
    // The stock composition registers no title provider, so it can only produce
    // the deterministic fallback, which the adapter suppresses on purpose.
    const workspace = mkdtempSync(path.join(tmpdir(), 'dsh-e2e-'));
    const config = path.join(workspace, 'title.cordis.yml');
    writeFileSync(
      config,
      readFileSync(CONFIG, 'utf8').replace(
        '- id: sessions',
        [
          '- id: session-title-provider',
          "  name: '@deepseek-ai/dsh-session-title-first-message-llm'",
          '  config:',
          '    targetWords: 6',
          '    targetCjkCharacters: 12',
          '    maxInputBytes: 4096',
          '    maxOutputTokens: 64',
          '    timeoutMs: 30000',
          '',
          '- id: sessions',
        ].join('\n'),
      ),
    );

    const events = await collect(
      await start(workspace, config),
      'Explain in one sentence what a monorepo is.',
    );

    const title = events.find((e) => e.type === 'session_title');
    expect(title?.data).toMatchObject({ origin: 'model' });
    expect(String((title?.data as any).title).length).toBeGreaterThan(0);
    // The harness titles mid-run, before the answer finishes.
    expect(events.indexOf(title!)).toBeLessThan(events.length - 1);
  }, 240_000);
});

describe.skipIf(runnable)('spawnDshSdkSession — live harness (not runnable here)', () => {
  it('names what the live suite needs, so a skip does not read as coverage', () => {
    expect({
      apiKey: Boolean(process.env.DEEPSEEK_API_KEY),
      harnessConfig: existsSync(CONFIG),
      harnessDeps: existsSync(path.join(HARNESS, 'node_modules/.bin/tsx')),
    }).not.toEqual({ apiKey: true, harnessConfig: true, harnessDeps: true });
  });
});
