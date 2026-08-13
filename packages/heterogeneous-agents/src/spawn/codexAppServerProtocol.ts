/**
 * Runtime subset of Codex's generated app-server v2 `ThreadItem` union.
 *
 * Keep the discriminators and wire field names aligned with
 * `codex-rs/app-server-protocol/schema/typescript/v2/ThreadItem.ts`. The
 * app-server process is an external boundary, so callers still validate the
 * discriminator at runtime before entering the exhaustive known-item switch.
 */

interface CodexAppServerBaseItem {
  [key: string]: unknown;
  id: string;
}

interface CodexAppServerUserMessageItem extends CodexAppServerBaseItem {
  clientId: string | null;
  content: CodexAppServerUserInput[];
  type: 'userMessage';
}

interface CodexAppServerHookPromptItem extends CodexAppServerBaseItem {
  fragments: Array<{ hookRunId: string; text: string }>;
  type: 'hookPrompt';
}

interface CodexAppServerAgentMessageItem extends CodexAppServerBaseItem {
  memoryCitation: unknown | null;
  phase: 'commentary' | 'final_answer' | null;
  text: string;
  type: 'agentMessage';
}

interface CodexAppServerPlanItem extends CodexAppServerBaseItem {
  text: string;
  type: 'plan';
}

interface CodexAppServerReasoningItem extends CodexAppServerBaseItem {
  content: string[];
  summary: string[];
  type: 'reasoning';
}

interface CodexAppServerCommandExecutionItem extends CodexAppServerBaseItem {
  aggregatedOutput: string | null;
  command: string;
  commandActions: unknown[];
  cwd: string;
  durationMs: number | null;
  exitCode: number | null;
  pluginId: string | null;
  processId: string | null;
  scriptPath: string | null;
  source: string;
  status: 'completed' | 'declined' | 'failed' | 'inProgress';
  type: 'commandExecution';
}

interface CodexAppServerFileChangeItem extends CodexAppServerBaseItem {
  changes: Array<{
    diff: string;
    kind: string | { move_path?: string | null; movePath?: string | null; type?: string };
    path: string;
  }>;
  status: 'completed' | 'declined' | 'failed' | 'inProgress';
  type: 'fileChange';
}

interface CodexAppServerMcpToolCallItem extends CodexAppServerBaseItem {
  appContext: unknown | null;
  arguments: unknown;
  durationMs: number | null;
  error: unknown | null;
  mcpAppResourceUri?: string;
  pluginId: string | null;
  readOnlyHint: boolean | null;
  result: unknown | null;
  server: string;
  status: string;
  tool: string;
  type: 'mcpToolCall';
}

interface CodexAppServerDynamicToolCallItem extends CodexAppServerBaseItem {
  arguments: unknown;
  contentItems: unknown[] | null;
  durationMs: number | null;
  namespace: string | null;
  status: string;
  success: boolean | null;
  tool: string;
  type: 'dynamicToolCall';
}

interface CodexAppServerCollabAgentToolCallItem extends CodexAppServerBaseItem {
  agentsStates: Record<string, unknown>;
  model: string | null;
  prompt: string | null;
  reasoningEffort: string | null;
  receiverThreadIds: string[];
  senderThreadId: string;
  status: string;
  tool: string;
  type: 'collabAgentToolCall';
}

interface CodexAppServerSubAgentActivityItem extends CodexAppServerBaseItem {
  agentPath: string;
  agentThreadId: string;
  kind: 'interacted' | 'interrupted' | 'started';
  type: 'subAgentActivity';
}

interface CodexAppServerWebSearchItem extends CodexAppServerBaseItem {
  action: unknown | null;
  query: string;
  results: unknown[] | null;
  type: 'webSearch';
}

interface CodexAppServerImageViewItem extends CodexAppServerBaseItem {
  path: string;
  type: 'imageView';
}

interface CodexAppServerSleepItem extends CodexAppServerBaseItem {
  durationMs: number;
  type: 'sleep';
}

interface CodexAppServerImageGenerationItem extends CodexAppServerBaseItem {
  failure: unknown | null;
  result: string;
  revisedPrompt: string | null;
  savedPath?: string;
  status: string;
  transparentBackground?: boolean;
  type: 'imageGeneration';
}

interface CodexAppServerEnteredReviewModeItem extends CodexAppServerBaseItem {
  review: string;
  type: 'enteredReviewMode';
}

interface CodexAppServerExitedReviewModeItem extends CodexAppServerBaseItem {
  review: string;
  type: 'exitedReviewMode';
}

interface CodexAppServerContextCompactionItem extends CodexAppServerBaseItem {
  type: 'contextCompaction';
}

export type CodexAppServerThreadItem =
  | CodexAppServerAgentMessageItem
  | CodexAppServerCollabAgentToolCallItem
  | CodexAppServerCommandExecutionItem
  | CodexAppServerContextCompactionItem
  | CodexAppServerDynamicToolCallItem
  | CodexAppServerEnteredReviewModeItem
  | CodexAppServerExitedReviewModeItem
  | CodexAppServerFileChangeItem
  | CodexAppServerHookPromptItem
  | CodexAppServerImageGenerationItem
  | CodexAppServerImageViewItem
  | CodexAppServerMcpToolCallItem
  | CodexAppServerPlanItem
  | CodexAppServerReasoningItem
  | CodexAppServerSleepItem
  | CodexAppServerSubAgentActivityItem
  | CodexAppServerUserMessageItem
  | CodexAppServerWebSearchItem;

interface CodexAppServerTextInput {
  text: string;
  text_elements: unknown[];
  type: 'text';
}

interface CodexAppServerImageInput {
  detail?: 'auto' | 'high' | 'low';
  type: 'image';
  url: string;
}

interface CodexAppServerLocalImageInput {
  detail?: 'auto' | 'high' | 'low';
  path: string;
  type: 'localImage';
}

interface CodexAppServerAudioInput {
  type: 'audio';
  url: string;
}

interface CodexAppServerLocalAudioInput {
  path: string;
  type: 'localAudio';
}

interface CodexAppServerNamedPathInput {
  name: string;
  path: string;
  type: 'mention' | 'skill';
}

export type CodexAppServerUserInput =
  | CodexAppServerAudioInput
  | CodexAppServerImageInput
  | CodexAppServerLocalAudioInput
  | CodexAppServerLocalImageInput
  | CodexAppServerNamedPathInput
  | CodexAppServerTextInput;

export interface CodexExecItem {
  [key: string]: unknown;
  id?: string;
  status?: string;
  type?: string;
}

export type NormalizedCodexAppServerItem =
  | {
      disposition: 'acknowledged';
      itemType: 'hookPrompt' | 'subAgentActivity' | 'userMessage';
    }
  | { disposition: 'emit'; item: CodexExecItem }
  | { disposition: 'unknown'; itemType: string };

/** Current generated app-server `ServerNotification` method snapshot. */
export const CODEX_APP_SERVER_NOTIFICATION_METHODS = [
  'account/login/completed',
  'account/rateLimits/updated',
  'account/updated',
  'app/list/updated',
  'command/exec/outputDelta',
  'configWarning',
  'deprecationNotice',
  'error',
  'externalAgentConfig/import/completed',
  'externalAgentConfig/import/progress',
  'fs/changed',
  'fuzzyFileSearch/sessionCompleted',
  'fuzzyFileSearch/sessionUpdated',
  'guardianWarning',
  'hook/completed',
  'hook/started',
  'item/agentMessage/delta',
  'item/autoApprovalReview/completed',
  'item/autoApprovalReview/started',
  'item/commandExecution/outputDelta',
  'item/commandExecution/terminalInteraction',
  'item/completed',
  'item/fileChange/outputDelta',
  'item/fileChange/patchUpdated',
  'item/mcpToolCall/progress',
  'item/plan/delta',
  'item/reasoning/summaryPartAdded',
  'item/reasoning/summaryTextDelta',
  'item/reasoning/textDelta',
  'item/started',
  'mcpServer/oauthLogin/completed',
  'mcpServer/startupStatus/updated',
  'model/rerouted',
  'model/safetyBuffering/updated',
  'model/verification',
  'process/exited',
  'process/outputDelta',
  'rawResponse/completed',
  'rawResponseItem/completed',
  'remoteControl/status/changed',
  'serverRequest/resolved',
  'skills/changed',
  'thread/archived',
  'thread/closed',
  'thread/compacted',
  'thread/deleted',
  'thread/environment/connected',
  'thread/environment/disconnected',
  'thread/goal/cleared',
  'thread/goal/updated',
  'thread/name/updated',
  'thread/realtime/closed',
  'thread/realtime/error',
  'thread/realtime/itemAdded',
  'thread/realtime/outputAudio/delta',
  'thread/realtime/sdp',
  'thread/realtime/started',
  'thread/realtime/transcript/delta',
  'thread/realtime/transcript/done',
  'thread/settings/updated',
  'thread/started',
  'thread/status/changed',
  'thread/tokenUsage/updated',
  'thread/unarchived',
  'turn/completed',
  'turn/diff/updated',
  'turn/moderationMetadata',
  'turn/plan/updated',
  'turn/started',
  'warning',
  'windows/worldWritableWarning',
  'windowsSandbox/setupCompleted',
] as const;

export type CodexAppServerNotificationMethod =
  (typeof CODEX_APP_SERVER_NOTIFICATION_METHODS)[number];

const KNOWN_NOTIFICATION_METHODS = new Set<string>(CODEX_APP_SERVER_NOTIFICATION_METHODS);

export const isKnownCodexAppServerNotificationMethod = (
  method: string,
): method is CodexAppServerNotificationMethod => KNOWN_NOTIFICATION_METHODS.has(method);

const KNOWN_ITEM_TYPES = new Set<CodexAppServerThreadItem['type']>([
  'agentMessage',
  'collabAgentToolCall',
  'commandExecution',
  'contextCompaction',
  'dynamicToolCall',
  'enteredReviewMode',
  'exitedReviewMode',
  'fileChange',
  'hookPrompt',
  'imageGeneration',
  'imageView',
  'mcpToolCall',
  'plan',
  'reasoning',
  'sleep',
  'subAgentActivity',
  'userMessage',
  'webSearch',
]);

const isKnownThreadItem = (item: CodexExecItem): item is CodexAppServerThreadItem =>
  typeof item.type === 'string' &&
  KNOWN_ITEM_TYPES.has(item.type as CodexAppServerThreadItem['type']);

const normalizeStatus = (status: unknown): string | undefined => {
  if (status === 'inProgress') return 'in_progress';
  if (status === 'declined') return 'cancelled';
  return typeof status === 'string' ? status : undefined;
};

const normalizeCollabToolName = (tool: string): string => {
  switch (tool) {
    case 'closeAgent': {
      return 'close_agent';
    }
    case 'resumeAgent': {
      return 'resume_agent';
    }
    case 'sendInput': {
      return 'send_input';
    }
    case 'spawnAgent': {
      return 'spawn_agent';
    }
    default: {
      return tool;
    }
  }
};

const normalizeGenericItem = (item: CodexAppServerThreadItem, type: string): CodexExecItem => ({
  ...item,
  status: normalizeStatus('status' in item ? item.status : undefined),
  type,
});

const normalizeKnownItem = (item: CodexAppServerThreadItem): NormalizedCodexAppServerItem => {
  switch (item.type) {
    case 'userMessage':
    case 'hookPrompt':
    case 'subAgentActivity': {
      return { disposition: 'acknowledged', itemType: item.type };
    }
    case 'agentMessage': {
      return {
        disposition: 'emit',
        item: {
          ...item,
          memory_citation: item.memoryCitation,
          type: 'agent_message',
        },
      };
    }
    case 'plan': {
      return {
        disposition: 'emit',
        item,
      };
    }
    case 'reasoning': {
      return {
        disposition: 'emit',
        item: {
          ...item,
          text: item.summary.filter(Boolean).join('\n\n'),
          type: 'reasoning',
        },
      };
    }
    case 'commandExecution': {
      return {
        disposition: 'emit',
        item: {
          ...item,
          aggregated_output: item.aggregatedOutput,
          command_actions: item.commandActions,
          duration_ms: item.durationMs,
          exit_code: item.exitCode,
          plugin_id: item.pluginId,
          process_id: item.processId,
          script_path: item.scriptPath,
          status: normalizeStatus(item.status),
          type: 'command_execution',
        },
      };
    }
    case 'fileChange': {
      return {
        disposition: 'emit',
        item: {
          ...item,
          changes: item.changes.map((change) => {
            const kind = change.kind;
            const kindValue = typeof kind === 'object' ? kind : undefined;
            return {
              ...change,
              diffText: change.diff,
              kind:
                kindValue?.move_path || kindValue?.movePath ? 'rename' : (kindValue?.type ?? kind),
            };
          }),
          status: normalizeStatus(item.status),
          type: 'file_change',
        },
      };
    }
    case 'mcpToolCall': {
      return {
        disposition: 'emit',
        item: {
          ...item,
          app_context: item.appContext,
          duration_ms: item.durationMs,
          mcp_app_resource_uri: item.mcpAppResourceUri,
          plugin_id: item.pluginId,
          read_only_hint: item.readOnlyHint,
          status: normalizeStatus(item.status),
          type: 'mcp_tool_call',
        },
      };
    }
    case 'dynamicToolCall': {
      return {
        disposition: 'emit',
        item: {
          ...item,
          content_items: item.contentItems,
          duration_ms: item.durationMs,
          status: normalizeStatus(item.status),
          type: 'dynamic_tool_call',
        },
      };
    }
    case 'collabAgentToolCall': {
      return {
        disposition: 'emit',
        item: {
          ...item,
          agents_states: item.agentsStates,
          reasoning_effort: item.reasoningEffort,
          receiver_thread_ids: item.receiverThreadIds,
          sender_thread_id: item.senderThreadId,
          status: normalizeStatus(item.status),
          tool: normalizeCollabToolName(item.tool),
          type: 'collab_tool_call',
        },
      };
    }
    case 'webSearch': {
      return { disposition: 'emit', item: normalizeGenericItem(item, 'web_search') };
    }
    case 'imageView': {
      return { disposition: 'emit', item: normalizeGenericItem(item, 'image_view') };
    }
    case 'sleep': {
      return {
        disposition: 'emit',
        item: { ...normalizeGenericItem(item, 'sleep'), duration_ms: item.durationMs },
      };
    }
    case 'imageGeneration': {
      return {
        disposition: 'emit',
        item: {
          ...normalizeGenericItem(item, 'image_generation'),
          revised_prompt: item.revisedPrompt,
          saved_path: item.savedPath,
          transparent_background: item.transparentBackground,
        },
      };
    }
    case 'enteredReviewMode': {
      return { disposition: 'emit', item: normalizeGenericItem(item, 'entered_review_mode') };
    }
    case 'exitedReviewMode': {
      return { disposition: 'emit', item: normalizeGenericItem(item, 'exited_review_mode') };
    }
    case 'contextCompaction': {
      return { disposition: 'emit', item: normalizeGenericItem(item, 'context_compaction') };
    }
    default: {
      const exhaustive: never = item;
      return exhaustive;
    }
  }
};

export const normalizeCodexAppServerItem = (
  rawItem: CodexExecItem,
): NormalizedCodexAppServerItem => {
  if (!isKnownThreadItem(rawItem)) {
    return {
      disposition: 'unknown',
      itemType: typeof rawItem.type === 'string' ? rawItem.type : 'missing',
    };
  }

  return normalizeKnownItem(rawItem);
};
