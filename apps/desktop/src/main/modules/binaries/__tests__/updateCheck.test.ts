import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  checkBinaryUpdate,
  checkBinaryUpdates,
  clearUpdateCache,
  CLI_UPDATE_SOURCES,
} from '../updateCheck';

// Mock global fetch before importing the module under test.
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

// Mock logger to avoid pulling in electron dependencies.
vi.mock('@/utils/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
}));

describe('CLI_UPDATE_SOURCES', () => {
  it('covers the expected CLI binaries', () => {
    expect(Object.keys(CLI_UPDATE_SOURCES).sort()).toEqual(
      ['amp', 'claude', 'codebuddy', 'codex', 'gemini', 'opencode', 'qwen'].sort(),
    );
  });
});

describe('checkBinaryUpdate', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    clearUpdateCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns updateAvailable=true when latest > current', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: '1.18.18' }),
    });

    const result = await checkBinaryUpdate({ currentVersion: '1.18.2', name: 'claude' });

    expect(result).toEqual({
      latestVersion: '1.18.18',
      updateAvailable: true,
      upgradeCommand: 'claude update',
    });
  });

  it('returns updateAvailable=false when latest === current', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: '1.18.2' }),
    });

    const result = await checkBinaryUpdate({ currentVersion: '1.18.2', name: 'claude' });

    expect(result.updateAvailable).toBe(false);
    expect(result.latestVersion).toBe('1.18.2');
  });

  it('returns updateAvailable=false when latest < current', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: '1.17.0' }),
    });

    const result = await checkBinaryUpdate({ currentVersion: '1.18.2', name: 'claude' });

    expect(result.updateAvailable).toBe(false);
  });

  it('returns updateAvailable=false for unknown binary name', async () => {
    const result = await checkBinaryUpdate({ currentVersion: '1.0.0', name: 'unknown-cli' });

    expect(result.updateAvailable).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns updateAvailable=false for invalid current version', async () => {
    const result = await checkBinaryUpdate({ currentVersion: 'not-a-version', name: 'claude' });

    expect(result.updateAvailable).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns updateAvailable=false on fetch timeout', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementationOnce(
      (_url: string, init?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );

    const promise = checkBinaryUpdate({ currentVersion: '1.0.0', name: 'codex' });
    vi.advanceTimersByTime(5000);
    const result = await promise;

    expect(result.updateAvailable).toBe(false);
  });

  it('returns updateAvailable=false on 404 response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) });

    const result = await checkBinaryUpdate({ currentVersion: '1.0.0', name: 'gemini' });

    expect(result.updateAvailable).toBe(false);
  });

  it('returns updateAvailable=false on invalid JSON version', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: 'not-valid-semver' }),
    });

    const result = await checkBinaryUpdate({ currentVersion: '1.0.0', name: 'opencode' });

    expect(result.updateAvailable).toBe(false);
  });

  it('caches successful results (cache hit)', async () => {
    // Use a specific package so cache doesn't collide with other tests.
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: '2.0.0' }),
    });

    const first = await checkBinaryUpdate({ currentVersion: '1.0.0', name: 'qwen' });
    expect(first.updateAvailable).toBe(true);

    // Second call should NOT trigger another fetch (cache hit).
    const second = await checkBinaryUpdate({ currentVersion: '1.0.0', name: 'qwen' });
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('caches failure results (cache hit for failures)', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });

    const first = await checkBinaryUpdate({ currentVersion: '1.0.0', name: 'amp' });
    expect(first.updateAvailable).toBe(false);

    // Second call should NOT trigger another fetch (failure cache hit).
    const second = await checkBinaryUpdate({ currentVersion: '1.0.0', name: 'amp' });
    expect(second.updateAvailable).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('checkBinaryUpdates (batch)', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    clearUpdateCache();
  });

  it('checks multiple binaries and returns results in order', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ version: '2.0.0' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ version: '1.0.0' }) });

    const results = await checkBinaryUpdates([
      { currentVersion: '1.0.0', name: 'claude' },
      { currentVersion: '1.0.0', name: 'codex' },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].updateAvailable).toBe(true);
    expect(results[0].upgradeCommand).toBe('claude update');
    expect(results[1].updateAvailable).toBe(false);
  });

  it('handles mixed known and unknown binaries', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: '3.0.0' }),
    });

    const results = await checkBinaryUpdates([
      { currentVersion: '1.0.0', name: 'unknown-cli' },
      { currentVersion: '2.0.0', name: 'claude' },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].updateAvailable).toBe(false);
    expect(results[1].updateAvailable).toBe(true);
  });
});
