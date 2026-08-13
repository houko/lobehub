import { describe, expect, it } from 'vitest';

import {
  CODEX_APP_SERVER_NOTIFICATION_METHODS,
  isKnownCodexAppServerNotificationMethod,
  normalizeCodexAppServerItem,
} from './codexAppServerProtocol';

describe('normalizeCodexAppServerItem', () => {
  it('exhaustively classifies every generated v2 ThreadItem discriminator', () => {
    const fixtures = [
      { clientId: null, content: [], id: 'user', type: 'userMessage' },
      { fragments: [], id: 'hook', type: 'hookPrompt' },
      {
        id: 'message',
        memoryCitation: null,
        phase: 'final_answer',
        text: 'done',
        type: 'agentMessage',
      },
      { id: 'plan', text: '# Plan', type: 'plan' },
      { content: ['raw'], id: 'reasoning', summary: ['Inspect', 'Decide'], type: 'reasoning' },
      {
        aggregatedOutput: 'ok',
        command: 'pwd',
        commandActions: [],
        cwd: '/workspace',
        durationMs: 4,
        exitCode: 0,
        id: 'command',
        pluginId: null,
        processId: '1',
        scriptPath: null,
        source: 'agent',
        status: 'completed',
        type: 'commandExecution',
      },
      {
        changes: [
          {
            diff: 'diff',
            kind: { move_path: 'new.ts', type: 'update' },
            path: 'old.ts',
          },
        ],
        id: 'file',
        status: 'declined',
        type: 'fileChange',
      },
      {
        appContext: { appName: 'GitHub' },
        arguments: { issue: 1 },
        durationMs: 5,
        error: null,
        id: 'mcp',
        pluginId: 'github',
        readOnlyHint: true,
        result: { content: [] },
        server: 'apps',
        status: 'completed',
        tool: 'read_issue',
        type: 'mcpToolCall',
      },
      {
        arguments: {},
        contentItems: [{ text: 'result', type: 'inputText' }],
        durationMs: 1,
        id: 'dynamic',
        namespace: null,
        status: 'completed',
        success: true,
        tool: 'custom',
        type: 'dynamicToolCall',
      },
      {
        agentsStates: {},
        id: 'collab',
        model: null,
        prompt: 'delegate',
        reasoningEffort: 'high',
        receiverThreadIds: ['child'],
        senderThreadId: 'parent',
        status: 'inProgress',
        tool: 'spawnAgent',
        type: 'collabAgentToolCall',
      },
      {
        agentPath: 'agent/path',
        agentThreadId: 'child',
        id: 'activity',
        kind: 'started',
        type: 'subAgentActivity',
      },
      { action: null, id: 'search', query: 'Codex', results: [], type: 'webSearch' },
      { id: 'image-view', path: '/tmp/image.png', type: 'imageView' },
      { durationMs: 1000, id: 'sleep', type: 'sleep' },
      {
        failure: null,
        id: 'image-generation',
        result: 'data:image/png;base64,abc',
        revisedPrompt: 'draw',
        status: 'completed',
        type: 'imageGeneration',
      },
      { id: 'review-enter', review: 'review', type: 'enteredReviewMode' },
      { id: 'review-exit', review: 'review', type: 'exitedReviewMode' },
      { id: 'compact', type: 'contextCompaction' },
    ];

    const results = fixtures.map((fixture) => normalizeCodexAppServerItem(fixture));

    expect(results.map(({ disposition }) => disposition)).toEqual([
      'acknowledged',
      'acknowledged',
      ...Array.from({ length: 8 }, () => 'emit'),
      'acknowledged',
      ...Array.from({ length: 7 }, () => 'emit'),
    ]);
    expect(results[4]).toMatchObject({
      disposition: 'emit',
      item: { text: 'Inspect\n\nDecide', type: 'reasoning' },
    });
    expect(results[3]).toEqual({
      disposition: 'emit',
      item: { id: 'plan', text: '# Plan', type: 'plan' },
    });
    expect(results[6]).toMatchObject({
      disposition: 'emit',
      item: { changes: [{ kind: 'rename' }], status: 'cancelled', type: 'file_change' },
    });
    expect(results[9]).toMatchObject({
      disposition: 'emit',
      item: { tool: 'spawn_agent', type: 'collab_tool_call' },
    });
  });

  it('returns an explicit unknown result for a future item discriminator', () => {
    expect(normalizeCodexAppServerItem({ id: 'new', type: 'futureItem' })).toEqual({
      disposition: 'unknown',
      itemType: 'futureItem',
    });
  });

  it('tracks the current generated notification discriminator snapshot', () => {
    expect(CODEX_APP_SERVER_NOTIFICATION_METHODS).toHaveLength(72);
    expect(isKnownCodexAppServerNotificationMethod('item/reasoning/summaryTextDelta')).toBe(true);
    expect(isKnownCodexAppServerNotificationMethod('future/notification')).toBe(false);
  });
});
