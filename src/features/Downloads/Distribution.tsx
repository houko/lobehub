'use client';

import { BRANDING_NAME, DESKTOP_DOWNLOADS } from '@lobechat/business-const';
import { Block, Flexbox, Icon, Text } from '@lobehub/ui';
import { Button } from '@lobehub/ui/base-ui';
import { createStaticStyles } from 'antd-style';
import { DownloadIcon, MonitorDownIcon } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const styles = createStaticStyles(({ css }) => ({
  page: css`
    max-inline-size: 720px;
    margin-inline: auto;
    padding: 48px 24px;
  `,
  row: css`
    padding: 16px 20px;
  `,
}));

/**
 * The download page for a distribution that publishes its own builds.
 *
 * Deliberately a plain list rather than a version of the upstream page: that
 * one advertises mobile apps, messenger channels and release channels served
 * from the hosted site, so a self-hosted build showing it offers most of a
 * product it does not ship.
 *
 * The entries carry their own display strings — a distribution names its own
 * builds, and there is no locale key to look those up under. Their URLs should
 * be stable paths, so a new release is an upload rather than a deploy.
 */
const DistributionDownloads = memo(() => {
  const { t } = useTranslation('common');

  return (
    <Flexbox className={styles.page} gap={24}>
      <Flexbox gap={8}>
        <Text as={'h1'} fontSize={24} weight={600}>
          {t('userPanel.getApp', { defaultValue: `Download ${BRANDING_NAME}` })}
        </Text>
      </Flexbox>

      <Flexbox gap={12}>
        {DESKTOP_DOWNLOADS.map((build) => (
          <Block className={styles.row} key={build.url} variant={'outlined'}>
            <Flexbox horizontal align={'center'} gap={16} justify={'space-between'}>
              <Flexbox horizontal align={'center'} gap={12}>
                <Icon icon={MonitorDownIcon} size={22} />
                <Flexbox gap={2}>
                  <Text weight={500}>{build.name}</Text>
                  {build.hint && (
                    <Text fontSize={12} type={'secondary'}>
                      {build.hint}
                    </Text>
                  )}
                </Flexbox>
              </Flexbox>
              {/* A plain link, not fetch-then-save: the file is served from our
                  own origin and the browser's own download UI is the one the
                  user can pause, resume and find again. */}
              <a download href={build.url} rel={'noreferrer'}>
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
