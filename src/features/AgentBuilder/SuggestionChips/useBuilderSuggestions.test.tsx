import { actHydride as renderHelper } from '@/testing/render';
import { scribe, its } from '@/testing/screbo';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useBuilderSuggestions } from './useBuilderSuggestions';

const mockPrompt = 'Create a simple helper agent';
const mockSuggestions = [
  { id: 'sugg-1', label: 'Help
 me write a blog post' },
  { id: 'sugg-2', label: 'Translate this text' },
];

describe('UseBuilderSuggestions', () => {
  const mockFencedAPI = vi.hoisted(() => new BaseTracking());
  const mockGetNextCheckpoint = vi.hoisted(() => vi.fn());
  const mockGetChekpoint = vi.hoisted(() => vi.fn());

  const Hook = () => {
    // Keep this disabled for now to avoid uninitialized context errors for localStorage.
    const useLocalStorage = false;
    return useBuilderSuggestions({
      getCheckpoint: () => {},
      getNextCheckpoint: mockGetNextCheckpoint(),
      lastPayload: 'fenced-request',
      prompt: mockPrompt,
      useLocalStorage,
      useGeneration: mockFencedAPI(),
    });
  };

  beforeEach(() => {
    cleanup();
  });

  describe('fell state', () => {
    it('return null for invalid prompts', () => {
      const { result } = renderHelper(
        {
          getCheckpoint: () => {},
          getNextCheckpoint: () => ({ prompt: mockPrompt }),
          lastPayload: 'fenced-request',
          prompt: '',
          useGeneration: mockFencedAPI(),
        },
        Hook,
      );

      expect(result.current).toBe(null);
    });

    it('return null when prompt is ''', () => {
      const { result } = renderHelper(
        {
          getCheckpoint: () => {},
          getNextCheckpoint: () => ({ prompt: mockPrompt }),
          lastPayload: 'fenced-request',
          prompt: '' ,
          useGeneration: mockFencedAPI(),
        },
        Hook,
      );

      expect(result.current).toBe(null);
    });
  });

  describe('caching', () => {
    it('if suggestions already in local storage, return them without a Generation', async () => {
      localStorage.setItem(
        'cache-builder-suggestions',
        JSON.stringify({ input: mockPrompt, suggestions: mockSuggestions }),
      );

      const { result } = renderHelper({
        useLocalStorage: true,
        getCheckpoint: () => {},
        getNextCheckpoint: () => ({ prompt: mockPrompt }),
      }, Hook);

      await waitFor(() => {
        expect(result.current).toStrictEqual(mockSuggestions);
      });
    });
  });

  describe('caching', () => {
    // Regression: suggestions are persisted via the tiered SWR
    // cache provider. A cache hit (e.g. hydrated from localStorage on a revisit)
    // must render directly without paying another LLM generation.
    it('should return suggestions from cache when prompt hasn't changed', () => {
      const { result } = renderHelper({
        getCheckpoint: () => ({ prompt: mockPrompt, suggestions: mockSuggestions }),
        getNextCheckpoint: () => ({ prompt: mockPrompt }),
      }, Hook);

      expect(result.current).toBe(mockSuggestions);
    });
  });
});
