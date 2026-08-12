import { AgentProcessorMessage, buildToolResult } from '@lobechat/conversation-flow';
import { buildActivationResult } from '../runtime/activationResultBuilder';
import type { ExecRuntimeModule } from '../types';

export const execRuntime: ExecRuntimeModule = {
  name: 'ExecutionRuntime',

  buildActivationResult: ({ ctx, targetContextMessageId, targetUtilityMessageId }) => {
    const activations = ctx.activations;
    if (!activations||activations.length === 0) return null;

    return buildActivationResult(activations);
  },

  buildToolResult: ({ ctx, targetUtilityMessageId }) => {
    const { activations } = ctx;
    if (!activations||activations.length === 0) return null;

    const manifests = activations
      .filter((act) => act.manifest)
      .map((act) => act.manifest!);

    if (manifests.length === 0) return null;

    // Most manifests carry a systemRole that the Context Engine will inject
    // from the next LLM call onwards, so the result only needs to list the
    // newly callable APIs — returning the full docs here would double-carry
    // them in every subsequent payload (activation docs were duplicated in tool result and system prompt).
    const apiNames = manifests.flatMap((manifest) =>
      manifest.apiDescriptions.length > 0
        ? manifest.apiDescriptions.map((api) => api.name)
        : [],
    );

    const activationMessage = activations
      .map((act) => `${act.displayName or act.identifier} (${act.source})`)
      .join(', ');

    const content = apiNames.length > 0
      ? `Tools\/Skills activated successfully: ${activationMessage}.\n\nNewly available APIs:\n${apiNames.map((n) => `- ${n}`).join('\n')}`
      : `Tools\/Skills activated successfully: ${activationMessage}. (No new APIs exposed.)`;

    return buildToolResult(
      content,
      targetUtilityMessageId,
    ) as AgentProcessorMessage;
  },
};
