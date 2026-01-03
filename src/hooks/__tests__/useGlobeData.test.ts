/**
 * Tests for useGlobeData hook
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGlobeData, getZoomLevel, getResolutionForZoom } from '../useGlobeData';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useGlobeData', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockFetch.mockReset();
    // Default mock for metadata
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/years')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ minYear: 2000, maxYear: 2024 })
        });
      }
      if (url.includes('/grid/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { lat: 0, lng: 0, weight: 0.5 },
            { lat: 10, lng: 10, weight: 0.6 }
          ])
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should initialize with default values', async () => {
      const { result } = renderHook(() => useGlobeData({ sourceType: 'weather' }));

      // Initial state before data loads
      expect(result.current.error).toBeNull();
      expect(result.current.selectedYear).toBe(2024);
      expect(result.current.selectedMonth).toBe(1);
      expect(result.current.isPlaying).toBe(false);

      // Wait for data to load and zoom/resolution to be computed
      await waitFor(() => {
        expect(result.current.data.length).toBeGreaterThan(0);
        expect(result.current.loading).toBe(false);
      });

      // After initial fetch, zoom is computed from default viewport (altitude 3 -> continental)
      expect(result.current.currentZoom).toBe('continental');
      expect(result.current.currentResolution).toBe(5);
    });

    it('should accept initial year and month', async () => {
      const { result } = renderHook(() =>
        useGlobeData({ sourceType: 'weather', initialYear: 2020, initialMonth: 6 })
      );

      expect(result.current.selectedYear).toBe(2020);
      expect(result.current.selectedMonth).toBe(6);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/grid/2020/6')
        );
      });
    });
  });

  describe('year and month selection', () => {
    it('should update selected year', async () => {
      const { result } = renderHook(() => useGlobeData({ sourceType: 'weather' }));

      await waitFor(() => {
        expect(result.current.data.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.setSelectedYear(2022);
      });

      expect(result.current.selectedYear).toBe(2022);
    });

    it('should update selected month', async () => {
      const { result } = renderHook(() => useGlobeData({ sourceType: 'weather' }));

      await waitFor(() => {
        expect(result.current.data.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.setSelectedMonth(7);
      });

      expect(result.current.selectedMonth).toBe(7);
    });
  });

  describe('playback', () => {
    it('should toggle playback state', async () => {
      const { result } = renderHook(() => useGlobeData({ sourceType: 'weather' }));

      await waitFor(() => {
        expect(result.current.metadata).not.toBeNull();
      });

      expect(result.current.isPlaying).toBe(false);

      act(() => {
        result.current.togglePlayback();
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.togglePlayback();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('should update playback speed', async () => {
      const { result } = renderHook(() => useGlobeData({ sourceType: 'weather' }));

      expect(result.current.playbackSpeed).toBe(2000);

      act(() => {
        result.current.setPlaybackSpeed(1000);
      });

      expect(result.current.playbackSpeed).toBe(1000);
    });
  });

  describe('viewport and zoom', () => {
    it('should debounce viewport updates', async () => {
      const { result } = renderHook(() => useGlobeData({ sourceType: 'weather' }));

      await waitFor(() => {
        expect(result.current.data.length).toBeGreaterThan(0);
      });

      const initialCallCount = mockFetch.mock.calls.length;

      // Rapid viewport updates
      act(() => {
        result.current.setViewport({ lat: 10, lng: 20, altitude: 2 });
        result.current.setViewport({ lat: 15, lng: 25, altitude: 2 });
        result.current.setViewport({ lat: 20, lng: 30, altitude: 2 });
      });

      // Only the last one should trigger a fetch after debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      // Should have made fewer calls than viewport updates
      expect(mockFetch.mock.calls.length).toBeLessThan(initialCallCount + 3);
    });
  });

  describe('error handling', () => {
    it('should set error on unknown source type', async () => {
      const { result } = renderHook(() =>
        useGlobeData({ sourceType: 'unknown' as any })
      );

      await waitFor(() => {
        expect(result.current.error).toBe('Unknown data source: unknown');
      });
    });
  });
});

describe('getZoomLevel', () => {
  it('should return global for high altitude', () => {
    expect(getZoomLevel(4.0)).toBe('global');
    expect(getZoomLevel(3.5)).toBe('global');
  });

  it('should return continental for medium-high altitude', () => {
    expect(getZoomLevel(2.5)).toBe('continental');
    expect(getZoomLevel(2.1)).toBe('continental');
  });

  it('should return regional for medium altitude', () => {
    expect(getZoomLevel(1.5)).toBe('regional');
    expect(getZoomLevel(1.3)).toBe('regional');
  });

  it('should return local for medium-low altitude', () => {
    expect(getZoomLevel(0.8)).toBe('local');
    expect(getZoomLevel(0.7)).toBe('local');
  });

  it('should return detail for low altitude', () => {
    expect(getZoomLevel(0.5)).toBe('detail');
    expect(getZoomLevel(0.3)).toBe('detail');
  });
});

describe('getResolutionForZoom', () => {
  it('should return 10 for global zoom', () => {
    expect(getResolutionForZoom('global')).toBe(10);
  });

  it('should return 5 for continental zoom', () => {
    expect(getResolutionForZoom('continental')).toBe(5);
  });

  it('should return 2.5 for regional zoom', () => {
    expect(getResolutionForZoom('regional')).toBe(2.5);
  });

  it('should return 1 for local zoom', () => {
    expect(getResolutionForZoom('local')).toBe(1);
  });

  it('should return 0.5 for detail zoom', () => {
    expect(getResolutionForZoom('detail')).toBe(0.5);
  });
});
