import type { ProviderImportPayload } from '@lobechat/electron-client-ipc';
import { AiProviderSourceEnum } from 'model-bank/aiProvider';

import { aiModelService } from '@/services/aiModel';
import { aiProviderService } from '@/services/aiProvider';
import { useAiInfraStore } from '@/store/aiInfra';

export class BuiltinProviderImportError extends Error {}
export class ProviderOverwriteNotConfirmedError extends Error {}
export class PartialProviderImportError extends Error {}

export const applyProviderImport = async (
  { models, provider }: ProviderImportPayload,
  options: { allowOverwrite: boolean },
) => {
  const existing = await aiProviderService.getAiProviderById(provider.id);

  if (existing?.source === AiProviderSourceEnum.Builtin) {
    throw new BuiltinProviderImportError();
  }
  if (existing && !options.allowOverwrite) {
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
      fetchOnClient: provider.fetchOnClient ?? false,
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
      );
      await aiModelService.batchToggleAiModels(
        provider.id,
        models.map(({ id }) => id),
        true,
      );
    }

    const store = useAiInfraStore.getState();
    await Promise.all([store.refreshAiProviderList(), store.refreshAiProviderRuntimeState()]);
  } catch (error) {
    if (createdProvider) throw new PartialProviderImportError();
    throw error;
  }
};
