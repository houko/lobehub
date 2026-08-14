import { DESKTOP_APP_ENABLED } from '@lobechat/business-const';
import { Navigate } from 'react-router';

import DownloadsPage from '@/features/Downloads';
import DistributionDownloads from '@/features/Downloads/Distribution';
import { serverConfigSelectors, useServerConfigStore } from '@/store/serverConfig';

/**
 * Three cases, in order:
 *
 * - A deployment serving its own installers lists those, and only those. The
 *   upstream page advertises mobile apps and messenger channels served from the
 *   hosted site, which a self-hosted build does not ship.
 * - Otherwise the upstream page, when there is a build to download at all.
 * - Otherwise nothing: hiding the menu entries that point here still leaves the
 *   URL reachable — the same half-measure as hiding a nav item while leaving its
 *   routes mounted.
 */
const Downloads = () => {
  const urls = useServerConfigStore(serverConfigSelectors.desktopDownloads);

  if (urls?.macOS || urls?.windows) return <DistributionDownloads urls={urls} />;

  return DESKTOP_APP_ENABLED ? <DownloadsPage /> : <Navigate replace to={'/'} />;
};

export default Downloads;
