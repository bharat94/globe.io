/**
 * Tests for WeatherSourceAdapter
 */
const WeatherSourceAdapter = require('../sources/weather/WeatherSourceAdapter');

describe('WeatherSourceAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new WeatherSourceAdapter();
  });

  describe('constructor', () => {
    it('should create with default options', () => {
      expect(adapter.preferStatic).toBe(true);
      expect(adapter.staticSource).toBeDefined();
      expect(adapter.dynamicSource).toBeDefined();
    });

    it('should respect preferStatic option', () => {
      const dynamicPreferred = new WeatherSourceAdapter({ preferStatic: false });
      expect(dynamicPreferred.preferStatic).toBe(false);
    });
  });

  describe('sourceId', () => {
    it('should return weather-adapter', () => {
      expect(adapter.sourceId).toBe('weather-adapter');
    });
  });

  describe('dataType', () => {
    it('should return weather', () => {
      expect(adapter.dataType).toBe('weather');
    });
  });

  describe('supportedResolutions', () => {
    it('should include static resolutions', () => {
      const resolutions = adapter.supportedResolutions;
      expect(resolutions).toContain(10);
      expect(resolutions).toContain(5);
      expect(resolutions).toContain(2.5);
    });

    it('should include dynamic resolutions', () => {
      const resolutions = adapter.supportedResolutions;
      expect(resolutions).toContain(2);
      expect(resolutions).toContain(1);
      expect(resolutions).toContain(0.5);
    });

    it('should be sorted descending', () => {
      const resolutions = adapter.supportedResolutions;
      for (let i = 0; i < resolutions.length - 1; i++) {
        expect(resolutions[i]).toBeGreaterThan(resolutions[i + 1]);
      }
    });
  });

  describe('supportsResolution', () => {
    it('should return true for 10 degrees', () => {
      expect(adapter.supportsResolution(10)).toBe(true);
    });

    it('should return true for 0.5 degrees', () => {
      expect(adapter.supportsResolution(0.5)).toBe(true);
    });

    it('should return false for unsupported resolution', () => {
      expect(adapter.supportsResolution(3)).toBe(false);
    });
  });

  describe('normalizeValue', () => {
    it('should normalize -40 to 0', () => {
      expect(adapter.normalizeValue(-40)).toBe(0);
    });

    it('should normalize 45 to 1', () => {
      expect(adapter.normalizeValue(45)).toBe(1);
    });

    it('should normalize 0 to approximately 0.47', () => {
      const normalized = adapter.normalizeValue(0);
      expect(normalized).toBeCloseTo(0.47, 1);
    });
  });
});
