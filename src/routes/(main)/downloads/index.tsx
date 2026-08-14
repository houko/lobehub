import { DESKTOP_APP_ENABLED, DESKTOP_DOWNLOADS } from '@lobechat/business-const';
import { Navigate } from 'react-router';

import DownloadsPage from '@/features/Downloads';
import DistributionDownloads from '@/features/Downloads/Distribution';

/**
 * Three cases, in order:
 *
 * - A distribution that publishes its own builds lists those, and only those.
 *   The upstream page advertises mobile apps and messenger channels served from
 *   the hosted site, which a self-hosted build does not ship.
 * - Otherwise the upstream page, when there is a build to download at all.
 * - Otherwise nothing: hiding the menu entries that point here still leaves the
 *   URL reachable — the same half-measure as hiding a nav item while leaving its
 *   routes mounted.
 */
const Downloads = () => {
  if (DESKTOP_DOWNLOADS.length > 0) return <DistributionDownloads />;

  return DESKTOP_APP_ENABLED ? <DownloadsPage /> : <Navigate replace to={'/'} />;
};

export default Downloads;
