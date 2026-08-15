'use client';

import type { ProviderImportPreview, ProviderImportRequest } from '@lobechat/electron-client-ipc';
import { useWatchBroadcast } from '@lobechat/electron-client-ipc';
import { toast } from '@lobehub/ui/base-ui';
import { t } from 'i18next';
import { useCallback, useEffect, useState } from 'react';

import { type McpInstallRequest } from '@/features/ProtocolUrlHandler/InstallPlugin/types';
import { useSingleton } from '@/hooks/useSingleton';
import { ensureElectronIpc } from '@/utils/electron/ipc';

import PluginInstallConfirmModal from './InstallPlugin';
import { createProviderImportModal } from './ProviderImport';

const providerImportErrorKeys = {
  callback_failed: 'providerImport.error.callback_failed',
  invalid_callback: 'providerImport.error.invalid_callback',
  invalid_payload: 'providerImport.error.invalid_payload',
} as const;

const ProtocolUrlHandler = () => {
  const [installRequest, setInstallRequest] = useState<McpInstallRequest | null>(null);
  const handledProviderImportIds = useSingleton(() => new Set<string>());

  const handleMcpInstallRequest = useCallback(
    (data: { marketId?: string; pluginId: string; schema: any }) => {
      // Pass raw data to child component for processing
      setInstallRequest(data as McpInstallRequest);
    },
    [],
  );

  const handleComplete = useCallback(() => {
    setInstallRequest(null);
  }, []);

  const showProviderImport = useCallback(
    (preview: ProviderImportPreview) => {
      if (handledProviderImportIds.has(preview.requestId)) return;
      handledProviderImportIds.add(preview.requestId);

      void createProviderImportModal(preview).catch((error) => {
        console.error('Failed to prepare provider import', error);
        void ensureElectronIpc().providerImport.cancel(preview.requestId);
        toast.error(t('providerImport.error.apply', { ns: 'modelProvider' }));
      });
    },
    [handledProviderImportIds],
  );

  const handleProviderImportRequest = useCallback(
    (request: ProviderImportRequest) => {
      if (request.status === 'error') {
        toast.error(t(providerImportErrorKeys[request.errorCode], { ns: 'modelProvider' }));
        return;
      }

      showProviderImport(request.preview);
    },
    [showProviderImport],
  );

  useWatchBroadcast('mcpInstallRequest', handleMcpInstallRequest);
  useWatchBroadcast('providerImportRequest', handleProviderImportRequest);

  useEffect(() => {
    let active = true;

    void ensureElectronIpc()
      .providerImport.listPending()
      .then((previews: ProviderImportPreview[]) => {
        if (active) previews.forEach(showProviderImport);
      })
      .catch((error: unknown) => {
        console.error('Failed to list pending provider imports', error);
      });

    return () => {
      active = false;
    };
  }, [showProviderImport]);

  return <PluginInstallConfirmModal installRequest={installRequest} onComplete={handleComplete} />;
};

export default ProtocolUrlHandler;
