import type { ProviderImportPayload } from '@lobechat/electron-client-ipc';
import { AiProviderSourceEnum } from 'model-bank/aiProvider';

import { mutate } from '@/libs/swr';
import { aiModelKeys } from '@/libs/swr/keys';
import { aiModelService } from '@/services/aiModel';
import { aiProviderService } from '@/services/aiProvider';
import { useAiInfraStore } from '@/store/aiInfra';
import { AiProviderSwrKey } from '@/store/aiInfra/slices/aiProvider/action';

export class BuiltinProviderImportError extends Error {}
export class ProviderOverwriteNotConfirmedError extends Error {}
export class PartialProviderImportError extends Error {
  constructor(readonly providerIdentity?: string) {
    super();
  }
}

const isLoopbackEndpoint = (baseURL: string) => {
  const hostname = new URL(baseURL).hostname;
  return hostname === '127.0.0.1' || hostname === '[::1]';
};

export const applyProviderImport = async (
  { models, provider }: ProviderImportPayload,
  options: { expectedProviderIdentity?: string },
) => {
  const existing = await aiProviderService.getAiProviderById(provider.id);

  if (existing?.source === AiProviderSourceEnum.Builtin) {
    throw new BuiltinProviderImportError();
  }
  if (
    existing &&
    (!options.expectedProviderIdentity || existing.identity !== options.expectedProviderIdentity)
  ) {
    throw new ProviderOverwriteNotConfirmedError();
  }

  const existingSettings = existing?.settings;
  const settings = {
    ...existingSettings,
    searchMode: existingSettings?.searchMode === 'tool' ? undefined : existingSettings?.searchMode,
    sdkType: 'openai' as const,
    supportResponsesApi: true,
  };

  let createdProvider = false;

  try {
    if (existing) {
      await aiProviderService.updateAiProvider(provider.id, {
        description: provider.description,
        logo: provider.logo,
        name: provider.name,
        settings,
      });
    } else {
      await aiProviderService.createAiProvider({
        description: provider.description,
        id: provider.id,
        keyVaults: { apiKey: provider.apiKey, baseURL: provider.baseURL },
        logo: provider.logo,
        name: provider.name,
        settings,
        source: AiProviderSourceEnum.Custom,
      });
      createdProvider = true;
    }

    await aiProviderService.updateAiProviderConfig(provider.id, {
      checkModel: provider.checkModel,
      config: { enableResponseApi: provider.enableResponsesApi ?? false },
      fetchOnClient: isLoopbackEndpoint(provider.baseURL) || (provider.fetchOnClient ?? false),
      keyVaults: { apiKey: provider.apiKey, baseURL: provider.baseURL },
    });
    await aiProviderService.toggleProviderEnabled(provider.id, true);

    if (models.length > 0) {
      await aiModelService.batchUpdateAiModels(
        provider.id,
        models.map((model) => ({
          ...model,
          enabled: true,
          source: 'remote',
          type: 'chat',
        })),
        { forceType: 'chat' },
      );
      await aiModelService.batchToggleAiModels(
        provider.id,
        models.map(({ id }) => id),
        true,
      );
    }

    const store = useAiInfraStore.getState();
    await Promise.all([
      mutate([AiProviderSwrKey.fetchAiProviderItem, provider.id]),
      mutate(aiModelKeys.list(provider.id)),
      store.refreshAiProviderList(),
      store.refreshAiProviderRuntimeState(),
    ]);
  } catch (error) {
    if (createdProvider) {
      const partialProvider = await aiProviderService
        .getAiProviderById(provider.id)
        .catch(() => undefined);
      throw new PartialProviderImportError(partialProvider?.identity);
    }
    if (existing) throw new PartialProviderImportError(existing.identity);
    throw error;
  }
};
