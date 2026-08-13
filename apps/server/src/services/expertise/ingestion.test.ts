// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import type { SelfIterationCompletionPayload } from '../agentSignal/services/selfIteration/completion';
import { ExpertiseIngestionService } from './ingestion';

const completion = (selfIteration: SelfIterationCompletionPayload) => ({
  agentId: 'agent-signal-reflection',
  operationId: 'op_review_1',
  selfIteration,
});

describe('ExpertiseIngestionService.ingestSelfReview', () => {
  it('ingests a topic only after its self-reflection run completes', async () => {
    const service = new ExpertiseIngestionService({} as never, 'user_1');
    const ingestCompletion = vi
      .spyOn(service, 'ingestCompletion')
      .mockResolvedValue({ ingested: 1, reason: 'matched' });

    await service.ingestSelfReview(
      completion({
        artifacts: [],
        marker: {
          agentId: 'agent_1',
          kind: 'self-reflection',
          sourceId: 'reflection_1',
          topicId: 'topic_1',
        },
        mutations: [],
        userId: 'user_1',
      }),
    );

    expect(ingestCompletion).toHaveBeenCalledWith({
      agentId: 'agent_1',
      operationId: 'op_review_1:topic_1',
      topicId: 'topic_1',
    });
  });

  it('ignores self-iteration modes that are not review windows', async () => {
    const service = new ExpertiseIngestionService({} as never, 'user_1');
    const ingestCompletion = vi.spyOn(service, 'ingestCompletion');

    const result = await service.ingestSelfReview(
      completion({
        artifacts: [],
        marker: { agentId: 'agent_1', kind: 'memory', sourceId: 'memory_1' },
        mutations: [],
        userId: 'user_1',
      }),
    );

    expect(result).toEqual({ ingested: 0, reason: 'not-review' });
    expect(ingestCompletion).not.toHaveBeenCalled();
  });
});
