import type { BinaryUpdateInfo, CheckBinaryUpdateParams } from '@lobechat/electron-client-ipc';
import semver from 'semver';

import { createLogger } from '@/utils/logger';

const logger = createLogger('modules:binaries:updateCheck');

/**
 * npm registry sources and upgrade commands for CLI binaries.
 *
 * Keyed by the binary *name* (the command users type), not the agent type.
 * Only CLIs with a trustworthy npm distribution are listed; CLIs installed via
 * native installers or PyPI are excluded.
 */
export const CLI_UPDATE_SOURCES: Record<string, { npmPackage: string; upgradeCommand: string }> = {
  amp: { npmPackage: '@sourcegraph/amp', upgradeCommand: 'npm i -g @sourcegraph/amp@latest' },
  claude: {
    npmPackage: '@anthropic-ai/claude-code',
    upgradeCommand: 'claude update',
  },
  codebuddy: {
    npmPackage: '@tencent-ai/codebuddy-code',
    upgradeCommand: 'npm i -g @tencent-ai/codebuddy-code@latest',
  },
  codex: { npmPackage: '@openai/codex', upgradeCommand: 'npm i -g @openai/codex@latest' },
  gemini: {
    npmPackage: '@google/gemini-cli',
    upgradeCommand: 'npm i -g @google/gemini-cli@latest',
  },
  opencode: { npmPackage: 'opencode-ai', upgradeCommand: 'opencode upgrade' },
  qwen: {
    npmPackage: '@qwen-code/qwen-code',
    upgradeCommand: 'npm i -g @qwen-code/qwen-code@latest',
  },
};

const NPM_REGISTRY = 'https://registry.npmjs.org';
const FETCH_TIMEOUT_MS = 4_000;
const SUCCESS_CACHE_TTL_MS = 6 * 60 * 60 * 1_000; // 6 hours
const FAILURE_CACHE_TTL_MS = 10 * 60 * 1_000; // 10 minutes

interface CacheEntry {
  checkedAt: number;
  info: BinaryUpdateInfo;
  success: boolean;
}

const cache = new Map<string, CacheEntry>();

/**
 * Fetch the latest version string for an npm package.
 * Returns `undefined` on any failure (timeout, non-200, invalid JSON, …).
 */
async function fetchLatestVersion(npmPackage: string): Promise<string | undefined> {
  const url = `${NPM_REGISTRY}/${npmPackage}/latest`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return undefined;
    const data = (await response.json()) as { version?: string };
    return data.version;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check whether a CLI binary has a newer version available on npm.
 *
 * - No background timer; fires on-demand only when a UI surface mounts.
 * - In-memory cache de-duplicates: success TTL 6 h, failure TTL 10 min.
 * - Any failure silently returns `{ updateAvailable: false }`, never throws.
 */
export async function checkBinaryUpdate(
  params: CheckBinaryUpdateParams,
): Promise<BinaryUpdateInfo> {
  const { name, currentVersion } = params;
  const source = CLI_UPDATE_SOURCES[name];

  if (!source) return { updateAvailable: false };

  const cached = cache.get(source.npmPackage);
  if (cached) {
    const ttl = cached.success ? SUCCESS_CACHE_TTL_MS : FAILURE_CACHE_TTL_MS;
    if (Date.now() - cached.checkedAt < ttl) return cached.info;
  }

  if (!semver.valid(currentVersion)) {
    logger.debug(`Invalid current version for "${name}": ${currentVersion}`);
    return { updateAvailable: false };
  }

  const latestVersion = await fetchLatestVersion(source.npmPackage);

  if (!latestVersion || !semver.valid(latestVersion)) {
    const info: BinaryUpdateInfo = { updateAvailable: false };
    cache.set(source.npmPackage, { checkedAt: Date.now(), info, success: false });
    return info;
  }

  const updateAvailable = semver.gt(latestVersion, currentVersion);
  const info: BinaryUpdateInfo = updateAvailable
    ? { latestVersion, updateAvailable: true, upgradeCommand: source.upgradeCommand }
    : { latestVersion, updateAvailable: false };

  cache.set(source.npmPackage, { checkedAt: Date.now(), info, success: true });
  return info;
}

/**
 * Clear the update-check cache. Mainly useful for testing.
 */
export function clearUpdateCache(): void {
  cache.clear();
}

/**
 * Batch-check updates for multiple binaries.
 * Each check runs independently; one failure does not affect others.
 */
export async function checkBinaryUpdates(
  params: CheckBinaryUpdateParams[],
): Promise<BinaryUpdateInfo[]> {
  return Promise.all(params.map((param) => checkBinaryUpdate(param)));
}
