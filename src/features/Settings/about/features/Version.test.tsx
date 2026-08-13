import type { UpdaterState } from '@lobechat/electron-client-ipc';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Version from './Version';

const flags = { enableCheckUpdates: true, showChangelog: true };
const electron = { ipc: {} as unknown, updaterState: { stage: 'idle' } as UpdaterState };

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({ changelog: 'Changelog', checkForUpdates: 'Check for updates' })[key] || key,
  }),
}));

vi.mock('@lobechat/electron-client-ipc', () => ({
  getElectronIpc: () => electron.ipc,
  useWatchBroadcast: vi.fn(),
}));

vi.mock('@/services/electron/autoUpdate', () => ({
  autoUpdateService: {
    checkUpdate: vi.fn(),
    getBuildChannel: () => Promise.resolve('stable'),
    getUpdaterState: () => Promise.resolve(electron.updaterState),
    installNow: vi.fn(),
  },
}));

vi.mock('@/components/Branding', () => ({ ProductLogo: () => <div /> }));
vi.mock('@/features/User/UserPanel/useNewVersion', () => ({ useNewVersion: () => false }));

vi.mock('@/store/global', () => ({
  useGlobalStore: (selector: (s: unknown) => unknown) =>
    selector({
      latestVersion: undefined,
      serverVersion: undefined,
      useCheckLatestVersion: () => ({ error: undefined, isValidating: false, mutate: vi.fn() }),
      useCheckServerVersion: () => undefined,
    }),
}));

vi.mock('@/store/serverConfig', () => ({
  featureFlagsSelectors: (s: unknown) => s,
  useServerConfigStore: (selector: (s: unknown) => unknown) =>
    selector({ ...flags, canAccessDevDock: false }),
}));

beforeEach(() => {
  flags.enableCheckUpdates = true;
  flags.showChangelog = true;
  electron.ipc = {};
  electron.updaterState = { stage: 'idle' };
});

afterEach(() => {
  cleanup();
});

describe('About > Version', () => {
  it('hides the changelog link when the deployment turns the flag off', async () => {
    flags.showChangelog = false;

    render(<Version />);

    // CHANGELOG_URL points at the hosted site, so a rebranded or self-hosted
    // deployment was linking out to another product's release notes.
    expect(screen.queryByText('Changelog')).not.toBeInTheDocument();
  });

  it('keeps the changelog link when the flag is on', () => {
    render(<Version />);

    expect(screen.getByText('Changelog')).toBeInTheDocument();
  });

  it('offers no update button when the build ships no update feed', async () => {
    electron.updaterState = { stage: 'disabled' };

    render(<Version />);
    // The state arrives over IPC, so let the effect resolve.
    await vi.waitFor(() => expect(screen.queryByText('Check for updates')).not.toBeInTheDocument());
  });

  it('offers the update button on a build that has one', async () => {
    render(<Version />);

    await vi.waitFor(() => expect(screen.getByText('Check for updates')).toBeInTheDocument());
  });
});
