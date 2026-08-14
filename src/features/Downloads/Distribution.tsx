'use client';

import { BRANDING_NAME } from '@lobechat/business-const';
import type { DesktopDownloadUrls } from '@lobechat/types';
import { Block, Flexbox, Icon, Text } from '@lobehub/ui';
import { Button } from '@lobehub/ui/base-ui';
import { createStaticStyles } from 'antd-style';
import { AppleIcon, DownloadIcon, MonitorIcon } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const styles = createStaticStyles(({ css }) => ({
  page: css`
    max-inline-size: 640px;
    margin-inline: auto;
    padding: 48px 24px;
  `,
  row: css`
    padding: 16px 20px;
  `,
}));

/** Platforms in the order they are offered, paired with how to label them. */
const PLATFORMS = [
  { icon: MonitorIcon, key: 'windows', label: 'Windows' },
  { icon: AppleIcon, key: 'macOS', label: 'macOS' },
] as const satisfies readonly { icon: unknown; key: keyof DesktopDownloadUrls; label: string }[];

interface DistributionDownloadsProps {
  urls: DesktopDownloadUrls;
}

/**
 * The download page for a deployment that serves its own installers.
 *
 * Deliberately a plain list rather than a version of the upstream page: that
 * one advertises mobile apps, messenger channels and release channels served
 * from the hosted site, so a self-hosted build showing it offers most of a
 * product it does not ship.
 *
 * Only platforms the deployment has actually configured appear — a build that
 * exists for Windows and not macOS should say so by omission rather than by
 * offering a link that 404s.
 */
const DistributionDownloads = memo<DistributionDownloadsProps>(({ urls }) => {
  const { t } = useTranslation('common');

  return (
    <Flexbox className={styles.page} gap={24}>
      <Text as={'h1'} fontSize={24} weight={600}>
        {t('getApp', { defaultValue: `Download ${BRANDING_NAME}` })}
      </Text>

      <Flexbox gap={12}>
        {PLATFORMS.filter((platform) => urls[platform.key]).map((platform) => (
          <Block className={styles.row} key={platform.key} variant={'outlined'}>
            <Flexbox horizontal align={'center'} gap={16} justify={'space-between'}>
              <Flexbox horizontal align={'center'} gap={12}>
                <Icon icon={platform.icon} size={22} />
                <Text weight={500}>{platform.label}</Text>
              </Flexbox>
              {/* A plain link rather than fetch-then-save: the file comes from
                  our own origin, and the browser's own download UI is the one
                  the user can pause, resume and find again afterwards. */}
              <a download href={urls[platform.key]} rel={'noreferrer'}>
                <Button icon={<Icon icon={DownloadIcon} size={14} />} type={'primary'}>
                  {t('download', { defaultValue: 'Download' })}
                </Button>
              </a>
            </Flexbox>
          </Block>
        ))}
      </Flexbox>
    </Flexbox>
  );
});

export default DistributionDownloads;
