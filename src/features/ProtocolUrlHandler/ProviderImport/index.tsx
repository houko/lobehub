'use client';

import type { ProviderImportPreview } from '@lobechat/electron-client-ipc';
import { Flexbox, Icon } from '@lobehub/ui';
import { createModal } from '@lobehub/ui/base-ui';
import { t } from 'i18next';
import { PlugZap } from 'lucide-react';

import { aiProviderService } from '@/services/aiProvider';
import { ensureElectronIpc } from '@/utils/electron/ipc';

import ProviderImportContent from './Content';
import type { ExistingProviderPreview } from './types';

export const createProviderImportModal = async (preview: ProviderImportPreview) => {
  const existing = await aiProviderService.getAiProviderById(preview.provider.id);
  const existingProvider: ExistingProviderPreview | undefined = existing
    ? { id: existing.id, name: existing.name, source: existing.source }
    : undefined;

  return createModal({
    content: <ProviderImportContent existingProvider={existingProvider} preview={preview} />,
    footer: null,
    maskClosable: false,
    onOpenChangeComplete: (open) => {
      if (!open) void ensureElectronIpc().providerImport.cancel(preview.requestId);
    },
    styles: { content: { paddingBlock: 16, paddingInline: 24 } },
    title: (
      <Flexbox horizontal align={'center'} gap={8}>
        <Icon icon={PlugZap} />
        {t('providerImport.title', { ns: 'modelProvider' })}
      </Flexbox>
    ),
    width: 'min(90vw, 600px)',
  });
};
