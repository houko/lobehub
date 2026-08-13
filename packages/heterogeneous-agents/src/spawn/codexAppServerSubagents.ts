import type { AgentStreamEvent } from '@lobechat/agent-gateway-client';

import type { SubagentEventContext, SubagentSpawnMetadata, UsageData } from '../types';
import { toCodexUsageData } from '../utils/codexUsage';
import { AgentStreamPipeline } from './agentStreamPipeline';
import type { CodexExecItem } from './codexAppServerProtocol';
import {
  isKnownCodexAppServerNotificationMethod,
  normalizeCodexAppServerItem,
} from './codexAppServerProtocol';

interface CodexTokenUsageBreakdown {
  cachedInputTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  reasoningOutputTokens?: number;
}

interface CodexThreadTokenUsage {
  total?: CodexTokenUsageBreakdown;
}

interface CodexTurnPlanStep {
  status?: string;
  step?: string;
}

interface CodexSubagentSpawn {
  model?: string;
  parentToolCallId: string;
  prompt?: string;
}

interface CodexSubagentState extends CodexSubagentSpawn {
  activeFileChangeItemId?: string;
  announced: boolean;
  completedItemIds: Set<string>;
  currentPipeline?: AgentStreamPipeline;
  currentTurnId?: string;
  description?: string;
  lastCumulativeUsage?: UsageData;
  latestPlanItem?: CodexExecItem;
  latestTokenUsage?: CodexThreadTokenUsage;
  threadId: string;
}

interface CodexAppServerSubagentRouterOptions {
  cwd: string;
  onDiagnostic: (key: string, message: string) => Promise<void>;
  onEvents: (events: AgentStreamEvent[]) => Promise<void>;
  operationId: string;
}

const toExecUsage = (usage: CodexTokenUsageBreakdown | undefined) =>
  usage
    ? {
        cached_input_tokens: usage.cachedInputTokens,
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        reasoning_output_tokens: usage.reasoningOutputTokens,
      }
    : undefined;

/** Routes app-server child-thread notifications into the existing subagent Thread contract. */
export class CodexAppServerSubagentRouter {
  private readonly completedSpawns = new Set<string>();
  private readonly pendingNotifications = new Map<
    string,
    Array<{ method: string; params: Record<string, unknown> }>
  >();
  private readonly activities = new Map<string, { agentPath?: string; threadId: string }>();
  private readonly spawns = new Map<string, CodexSubagentSpawn>();
  private readonly subagents = new Map<string, CodexSubagentState>();

  constructor(private readonly options: CodexAppServerSubagentRouterOptions) {}

  captureParentItem(item: CodexExecItem, eventType: 'item.completed' | 'item.started'): string[] {
    if (item.type === 'collabAgentToolCall' && item.id) {
      const spawn: CodexSubagentSpawn = {
        ...(typeof item.model === 'string' ? { model: item.model } : {}),
        parentToolCallId: item.id,
        ...(typeof item.prompt === 'string' ? { prompt: item.prompt } : {}),
      };
      this.spawns.set(item.id, spawn);
      if (eventType !== 'item.completed') return [];

      this.completedSpawns.add(item.id);
      const threadIds = new Set<string>();
      if (Array.isArray(item.receiverThreadIds)) {
        for (const threadId of item.receiverThreadIds) {
          if (typeof threadId !== 'string') continue;
          this.registerSubagent(threadId, spawn);
          threadIds.add(threadId);
        }
      }

      const activity = this.activities.get(item.id);
      if (activity) {
        this.registerSubagent(activity.threadId, spawn, activity.agentPath);
        threadIds.add(activity.threadId);
      }
      return [...threadIds];
    }

    if (
      item.type !== 'subAgentActivity' ||
      eventType !== 'item.completed' ||
      !item.id ||
      typeof item.agentThreadId !== 'string'
    ) {
      return [];
    }

    const activity = {
      ...(typeof item.agentPath === 'string' ? { agentPath: item.agentPath } : {}),
      threadId: item.agentThreadId,
    };
    this.activities.set(item.id, activity);
    if (!this.completedSpawns.has(item.id)) return [];

    const spawn = this.spawns.get(item.id) ?? { parentToolCallId: item.id };
    this.registerSubagent(item.agentThreadId, spawn, activity.agentPath);
    return [item.agentThreadId];
  }

  async flushPending(threadIds: string[]): Promise<void> {
    for (const threadId of new Set(threadIds)) {
      const subagent = this.subagents.get(threadId);
      const pending = this.pendingNotifications.get(threadId);
      if (!subagent || !pending) continue;

      this.pendingNotifications.delete(threadId);
      for (const notification of pending) {
        await this.handleNotification(subagent, notification.method, notification.params);
      }
    }
  }

  async routeNotification(
    threadId: string,
    method: string,
    params: Record<string, unknown>,
  ): Promise<void> {
    const subagent = this.subagents.get(threadId);
    if (subagent) {
      await this.handleNotification(subagent, method, params);
      return;
    }

    const pending = this.pendingNotifications.get(threadId) ?? [];
    if (pending.length < 500) {
      pending.push({ method, params });
      this.pendingNotifications.set(threadId, pending);
    }
  }

  private registerSubagent(threadId: string, spawn: CodexSubagentSpawn, agentPath?: string): void {
    const existing = this.subagents.get(threadId);
    const subagent: CodexSubagentState = existing ?? {
      ...spawn,
      announced: false,
      completedItemIds: new Set<string>(),
      threadId,
    };
    if (!existing) this.subagents.set(threadId, subagent);
    if (spawn.model) subagent.model = spawn.model;
    if (spawn.prompt) subagent.prompt = spawn.prompt;
    if (agentPath) subagent.description = agentPath.split('/').findLast(Boolean) ?? agentPath;
  }

  private async handleNotification(
    subagent: CodexSubagentState,
    method: string,
    params: Record<string, unknown>,
  ): Promise<void> {
    switch (method) {
      case 'turn/started': {
        const turn = params.turn as { id?: string } | undefined;
        subagent.currentTurnId = turn?.id;
        subagent.completedItemIds.clear();
        subagent.currentPipeline = this.createPipeline(subagent);
        await this.emitSynthetic(subagent, { turn, type: 'turn.started' });
        return;
      }
      case 'item/started':
      case 'item/completed': {
        await this.emitItem(
          subagent,
          (params.item ?? {}) as CodexExecItem,
          method === 'item/started' ? 'item.started' : 'item.completed',
        );
        return;
      }
      case 'item/agentMessage/delta': {
        await this.emitSynthetic(subagent, {
          delta: params.delta,
          item_id: params.itemId,
          type: 'item.agent_message.delta',
        });
        return;
      }
      case 'item/plan/delta': {
        await this.emitSynthetic(subagent, {
          delta: params.delta,
          item_id: params.itemId,
          type: 'item.plan.delta',
        });
        return;
      }
      case 'item/reasoning/summaryPartAdded': {
        if (typeof params.summaryIndex !== 'number' || params.summaryIndex <= 0) return;
        await this.emitSynthetic(subagent, {
          delta: '\n\n',
          item_id: params.itemId,
          type: 'item.reasoning.delta',
        });
        return;
      }
      case 'item/reasoning/summaryTextDelta': {
        await this.emitSynthetic(subagent, {
          delta: params.delta,
          item_id: params.itemId,
          type: 'item.reasoning.delta',
        });
        return;
      }
      case 'item/reasoning/textDelta': {
        await this.options.onDiagnostic(
          'raw-reasoning-omitted',
          'Codex app-server raw reasoning is omitted; readable reasoning summaries remain enabled.',
        );
        return;
      }
      case 'item/commandExecution/outputDelta': {
        await this.emitSynthetic(subagent, {
          delta: params.delta,
          item_id: params.itemId,
          type: 'item.command_execution.output_delta',
        });
        return;
      }
      case 'item/commandExecution/terminalInteraction': {
        await this.emitSynthetic(subagent, {
          item_id: params.itemId,
          process_id: params.processId,
          stdin: params.stdin,
          type: 'item.command_execution.terminal_interaction',
        });
        return;
      }
      case 'item/fileChange/patchUpdated': {
        const normalized = normalizeCodexAppServerItem({
          changes: Array.isArray(params.changes) ? params.changes : [],
          id: typeof params.itemId === 'string' ? params.itemId : undefined,
          status: 'inProgress',
          type: 'fileChange',
        });
        if (normalized.disposition === 'emit') {
          await this.emitSynthetic(subagent, { item: normalized.item, type: 'item.updated' });
        }
        return;
      }
      case 'item/fileChange/outputDelta': {
        if (typeof params.itemId !== 'string' || typeof params.delta !== 'string') return;
        await this.emitSynthetic(subagent, {
          item: {
            changes: [{ diffText: params.delta }],
            id: params.itemId,
            status: 'in_progress',
            type: 'file_change',
          },
          type: 'item.updated',
        });
        return;
      }
      case 'item/mcpToolCall/progress': {
        await this.emitSynthetic(subagent, {
          item_id: params.itemId,
          message: params.message,
          type: 'item.mcp_tool_call.progress',
        });
        return;
      }
      case 'turn/diff/updated': {
        if (!subagent.activeFileChangeItemId || typeof params.diff !== 'string') return;
        await this.emitSynthetic(subagent, {
          item: {
            changes: [{ diffText: params.diff }],
            id: subagent.activeFileChangeItemId,
            status: 'in_progress',
            type: 'file_change',
          },
          type: 'item.updated',
        });
        return;
      }
      case 'turn/plan/updated': {
        const plan = Array.isArray(params.plan) ? (params.plan as CodexTurnPlanStep[]) : [];
        const planItemId = `turn-plan-${String(params.turnId ?? subagent.currentTurnId ?? 'current')}`;
        const item: CodexExecItem = {
          id: planItemId,
          items: plan
            .filter((step) => typeof step.step === 'string' && step.step.trim())
            .map((step) => ({ completed: step.status === 'completed', text: step.step })),
          status: 'in_progress',
          type: 'todo_list',
        };
        const type = subagent.latestPlanItem?.id === planItemId ? 'item.updated' : 'item.started';
        subagent.latestPlanItem = item;
        await this.emitSynthetic(subagent, { item, type });
        return;
      }
      case 'thread/tokenUsage/updated': {
        subagent.latestTokenUsage = params.tokenUsage as CodexThreadTokenUsage;
        return;
      }
      case 'model/rerouted': {
        if (typeof params.toModel === 'string' && params.toModel) {
          subagent.model = params.toModel;
          subagent.currentPipeline ??= this.createPipeline(subagent);
          await this.emitEvents(
            subagent,
            subagent.currentPipeline.configureSession({ model: params.toModel }),
          );
        }
        await this.options.onDiagnostic(
          `subagent-model-rerouted:${subagent.threadId}:${String(params.fromModel)}:${String(params.toModel)}`,
          `Codex app-server subagent rerouted the model from ${String(params.fromModel)} to ${String(params.toModel)}.`,
        );
        return;
      }
      case 'turn/completed': {
        const turn = params.turn as {
          error?: { message?: string };
          items?: CodexExecItem[];
          status?: string;
        };
        for (const item of turn.items ?? []) {
          await this.emitItem(subagent, item, 'item.completed');
        }
        if (turn.status === 'completed' && subagent.latestPlanItem) {
          await this.emitSynthetic(subagent, {
            item: { ...subagent.latestPlanItem, status: 'completed' },
            type: 'item.completed',
          });
        }
        const cumulativeUsage = toCodexUsageData(toExecUsage(subagent.latestTokenUsage?.total));
        await this.emitSynthetic(
          subagent,
          turn.status === 'completed'
            ? {
                type: 'turn.completed',
                usage: toExecUsage(subagent.latestTokenUsage?.total),
              }
            : {
                message: turn.error?.message ?? `Codex subagent turn ${turn.status ?? 'failed'}`,
                type: 'turn.failed',
              },
        );
        if (subagent.currentPipeline) {
          await this.emitEvents(subagent, await subagent.currentPipeline.flush());
        }
        if (cumulativeUsage) subagent.lastCumulativeUsage = cumulativeUsage;
        subagent.currentPipeline = undefined;
        subagent.currentTurnId = undefined;
        subagent.latestPlanItem = undefined;
        subagent.latestTokenUsage = undefined;
        return;
      }
      case 'error': {
        const error = params.error as { message?: string } | undefined;
        if (params.willRetry === true) {
          await this.emitSynthetic(subagent, {
            message: error?.message ?? 'Codex subagent is retrying after a transient error',
            type: 'stream.retry',
          });
        } else {
          await this.options.onDiagnostic(
            `subagent-error:${subagent.threadId}:${String(error?.message)}`,
            `Codex app-server subagent error: ${error?.message ?? 'unknown error'}`,
          );
        }
        return;
      }
      default: {
        await this.options.onDiagnostic(
          `${isKnownCodexAppServerNotificationMethod(method) ? 'acknowledged' : 'unknown'}-subagent-notification:${method}`,
          isKnownCodexAppServerNotificationMethod(method)
            ? `Codex app-server subagent notification acknowledged without an exec JSON equivalent: ${method}`
            : `Unknown Codex app-server subagent notification: ${method}`,
        );
      }
    }
  }

  private async emitItem(
    subagent: CodexSubagentState,
    rawItem: CodexExecItem,
    eventType: 'item.completed' | 'item.started',
  ): Promise<void> {
    const normalized = normalizeCodexAppServerItem(rawItem);
    if (normalized.disposition !== 'emit') {
      if (normalized.disposition === 'unknown') {
        await this.options.onDiagnostic(
          `unknown-subagent-item:${normalized.itemType}`,
          `Unsupported Codex app-server subagent item type: ${normalized.itemType}`,
        );
      } else if (normalized.itemType !== 'subAgentActivity') {
        await this.options.onDiagnostic(
          `acknowledged-subagent-item:${normalized.itemType}`,
          `Codex app-server subagent item acknowledged without an exec JSON equivalent: ${normalized.itemType}`,
        );
      }
      return;
    }

    const { item } = normalized;
    if (eventType === 'item.completed' && item.id) {
      if (subagent.completedItemIds.has(item.id)) return;
      subagent.completedItemIds.add(item.id);
    }
    if (eventType === 'item.started' && item.type === 'file_change' && item.id) {
      subagent.activeFileChangeItemId = item.id;
    }
    await this.emitSynthetic(subagent, { item, type: eventType });
    if (eventType === 'item.completed' && item.id === subagent.activeFileChangeItemId) {
      subagent.activeFileChangeItemId = undefined;
    }
  }

  private createPipeline(subagent: CodexSubagentState): AgentStreamPipeline {
    return new AgentStreamPipeline({
      agentType: 'codex',
      cwd: this.options.cwd,
      initialCumulativeUsage: subagent.lastCumulativeUsage,
      initialModel: subagent.model,
      operationId: this.options.operationId,
    });
  }

  private async emitSynthetic(
    subagent: CodexSubagentState,
    payload: Record<string, unknown>,
  ): Promise<void> {
    subagent.currentPipeline ??= this.createPipeline(subagent);
    await this.emitEvents(
      subagent,
      await subagent.currentPipeline.push(`${JSON.stringify(payload)}\n`),
    );
  }

  private async emitEvents(
    subagent: CodexSubagentState,
    events: AgentStreamEvent[],
  ): Promise<void> {
    const forwarded = events.filter(
      (event) => event.type !== 'agent_runtime_end' && event.type !== 'error',
    );
    const baseContext: SubagentEventContext = {
      parentToolCallId: subagent.parentToolCallId,
      subagentMessageId: subagent.currentTurnId ?? `codex:${subagent.threadId}`,
    };
    const spawnMetadata: SubagentSpawnMetadata = {
      description: subagent.description ?? 'Codex subagent',
      ...(subagent.prompt ? { prompt: subagent.prompt } : {}),
      ...(subagent.model ? { subagentType: subagent.model } : {}),
    };

    for (const event of forwarded) {
      const canAnnounce =
        event.type === 'stream_chunk' &&
        (event.data?.chunkType === 'reasoning' ||
          event.data?.chunkType === 'text' ||
          event.data?.chunkType === 'tools_calling');
      event.data = {
        ...event.data,
        subagent:
          canAnnounce && !subagent.announced ? { ...baseContext, spawnMetadata } : baseContext,
      };
      if (canAnnounce) subagent.announced = true;
    }
    await this.options.onEvents(forwarded);
  }
}
