/**
 * Tests for DataSourceFactory
 */
const DataSourceFactory = require('../DataSourceFactory');
const WeatherSourceAdapter = require('../sources/weather/WeatherSourceAdapter');

describe('DataSourceFactory', () => {
  describe('create', () => {
    it('should create weather source', () => {
      const source = DataSourceFactory.create('weather');
      expect(source).toBeInstanceOf(WeatherSourceAdapter);
      expect(source.sourceId).toBe('weather-adapter');
      expect(source.dataType).toBe('weather');
    });

    it('should throw for unknown source type', () => {
      expect(() => DataSourceFactory.create('unknown')).toThrow('Unknown data source type: unknown');
    });

    it('should pass options to source constructor', () => {
      const source = DataSourceFactory.create('weather', { preferStatic: false });
      expect(source.preferStatic).toBe(false);
    });
  });

  describe('register', () => {
    it('should allow registering new source types', () => {
      class MockSource {
        get sourceId() { return 'mock'; }
        get dataType() { return 'mock'; }
      }

      DataSourceFactory.register('mock', MockSource);
      const source = DataSourceFactory.create('mock');
      expect(source.sourceId).toBe('mock');

      // Clean up
      delete DataSourceFactory.sources['mock'];
    });
  });

  describe('getAvailableTypes', () => {
    it('should return array of available types', () => {
      const types = DataSourceFactory.getAvailableTypes();
      expect(types).toContain('weather');
      expect(Array.isArray(types)).toBe(true);
    });
  });

  describe('isSupported', () => {
    it('should return true for weather', () => {
      expect(DataSourceFactory.isSupported('weather')).toBe(true);
    });

    it('should return false for unsupported type', () => {
      expect(DataSourceFactory.isSupported('unknown')).toBe(false);
    });
  });
});
