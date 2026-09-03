import type { ProviderImportPayload } from '@lobechat/electron-client-ipc';
import { AiProviderSourceEnum } from 'model-bank/aiProvider';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { aiModelKeys } from '@/libs/swr/keys';
import { aiModelService } from '@/services/aiModel';
import { aiProviderService } from '@/services/aiProvider';
import { useAiInfraStore } from '@/store/aiInfra';
import { AiProviderSwrKey } from '@/store/aiInfra/slices/aiProvider/action';

import {
  applyProviderImport,
  BuiltinProviderImportError,
  PartialProviderImportError,
  ProviderOverwriteNotConfirmedError,
} from './applyProviderImport';

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock('@/libs/swr', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  mutate: mocks.mutate,
}));

const payload: ProviderImportPayload = {
  models: [{ contextWindowTokens: 128_000, displayName: 'Example Model', id: 'example/model' }],
  provider: {
    apiKey: 'secret-key',
    baseURL: 'https://api.example.com/v1',
    checkModel: 'example/model',
    id: 'example-provider',
    name: 'Example Provider',
  },
  version: 1,
};

const emptyQueryResult = {
  command: '',
  fields: [],
  oid: 0,
  rowCount: 0,
  rows: [],
};

describe('applyProviderImport', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.mutate.mockReset().mockResolvedValue(undefined);
    vi.spyOn(aiProviderService, 'getAiProviderById').mockResolvedValue(undefined);
    vi.spyOn(aiProviderService, 'createAiProvider').mockResolvedValue('example-provider');
    vi.spyOn(aiProviderService, 'updateAiProvider').mockResolvedValue(emptyQueryResult);
    vi.spyOn(aiProviderService, 'updateAiProviderConfig').mockResolvedValue(emptyQueryResult);
    vi.spyOn(aiProviderService, 'toggleProviderEnabled').mockResolvedValue(emptyQueryResult);
    vi.spyOn(aiModelService, 'batchUpdateAiModels').mockResolvedValue([]);
    vi.spyOn(aiModelService, 'batchToggleAiModels').mockResolvedValue(undefined);
    vi.spyOn(useAiInfraStore.getState(), 'refreshAiProviderList').mockResolvedValue(undefined);
    vi.spyOn(useAiInfraStore.getState(), 'refreshAiProviderRuntimeState').mockResolvedValue(
      undefined,
    );
  });

  it('creates, enables, and populates a new provider', async () => {
    await applyProviderImport(payload, { allowOverwrite: false });

    expect(aiProviderService.createAiProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'example-provider',
        keyVaults: { apiKey: 'secret-key', baseURL: 'https://api.example.com/v1' },
        settings: { sdkType: 'openai', supportResponsesApi: true },
        source: AiProviderSourceEnum.Custom,
      }),
    );
    expect(aiProviderService.updateAiProviderConfig).toHaveBeenCalledWith('example-provider', {
      checkModel: 'example/model',
      config: { enableResponseApi: false },
      fetchOnClient: false,
      keyVaults: { apiKey: 'secret-key', baseURL: 'https://api.example.com/v1' },
    });
    expect(aiProviderService.toggleProviderEnabled).toHaveBeenCalledWith('example-provider', true);
    expect(aiModelService.batchUpdateAiModels).toHaveBeenCalledWith('example-provider', [
      {
        contextWindowTokens: 128_000,
        displayName: 'Example Model',
        enabled: true,
        id: 'example/model',
        source: 'remote',
        type: 'chat',
      },
    ]);
    expect(aiModelService.batchToggleAiModels).toHaveBeenCalledWith(
      'example-provider',
      ['example/model'],
      true,
    );
  });

  it('updates an existing custom provider while preserving unrelated settings', async () => {
    vi.mocked(aiProviderService.getAiProviderById).mockResolvedValue({
      enabled: true,
      id: 'example-provider',
      name: 'Old Name',
      settings: { defaultShowBrowserRequest: true, sdkType: 'router' },
      source: AiProviderSourceEnum.Custom,
    });

    await applyProviderImport(
      {
        ...payload,
        provider: { ...payload.provider, enableResponsesApi: true, fetchOnClient: true },
      },
      { allowOverwrite: true },
    );

    expect(aiProviderService.createAiProvider).not.toHaveBeenCalled();
    expect(aiProviderService.updateAiProvider).toHaveBeenCalledWith(
      'example-provider',
      expect.objectContaining({
        name: 'Example Provider',
        settings: {
          defaultShowBrowserRequest: true,
          sdkType: 'openai',
          supportResponsesApi: true,
        },
      }),
    );
    expect(aiProviderService.updateAiProviderConfig).toHaveBeenCalledWith(
      'example-provider',
      expect.objectContaining({
        config: { enableResponseApi: true },
        fetchOnClient: true,
      }),
    );
  });

  it('revalidates the imported provider detail and model list caches', async () => {
    await applyProviderImport(payload, { allowOverwrite: false });

    expect(mocks.mutate).toHaveBeenCalledWith([
      AiProviderSwrKey.fetchAiProviderItem,
      'example-provider',
    ]);
    expect(mocks.mutate).toHaveBeenCalledWith(aiModelKeys.list('example-provider'));
  });

  it('refuses to replace a built-in provider', async () => {
    vi.mocked(aiProviderService.getAiProviderById).mockResolvedValue({
      enabled: true,
      id: 'openai',
      name: 'OpenAI',
      settings: { sdkType: 'openai' },
      source: AiProviderSourceEnum.Builtin,
    });

    await expect(
      applyProviderImport(
        { ...payload, provider: { ...payload.provider, id: 'openai' } },
        { allowOverwrite: true },
      ),
    ).rejects.toBeInstanceOf(BuiltinProviderImportError);
    expect(aiProviderService.updateAiProvider).not.toHaveBeenCalled();
    expect(aiProviderService.updateAiProviderConfig).not.toHaveBeenCalled();
    expect(aiModelService.batchUpdateAiModels).not.toHaveBeenCalled();
  });

  it('does not overwrite a provider that appeared after the preview', async () => {
    vi.mocked(aiProviderService.getAiProviderById).mockResolvedValue({
      enabled: true,
      id: 'example-provider',
      name: 'Existing Provider',
      settings: { sdkType: 'openai' },
      source: AiProviderSourceEnum.Custom,
    });

    await expect(applyProviderImport(payload, { allowOverwrite: false })).rejects.toBeInstanceOf(
      ProviderOverwriteNotConfirmedError,
    );
    expect(aiProviderService.updateAiProvider).not.toHaveBeenCalled();
    expect(aiProviderService.updateAiProviderConfig).not.toHaveBeenCalled();
  });

  it('marks a newly created partial import as safe to retry idempotently', async () => {
    vi.mocked(aiProviderService.updateAiProviderConfig).mockRejectedValueOnce(
      new Error('temporary database failure'),
    );

    await expect(applyProviderImport(payload, { allowOverwrite: false })).rejects.toBeInstanceOf(
      PartialProviderImportError,
    );

    vi.mocked(aiProviderService.getAiProviderById).mockResolvedValue({
      enabled: false,
      id: 'example-provider',
      name: 'Example Provider',
      settings: { sdkType: 'openai' },
      source: AiProviderSourceEnum.Custom,
    });

    await expect(applyProviderImport(payload, { allowOverwrite: true })).resolves.toBeUndefined();
    expect(aiProviderService.updateAiProviderConfig).toHaveBeenCalledTimes(2);
    expect(aiModelService.batchUpdateAiModels).toHaveBeenCalledTimes(1);
  });
});
