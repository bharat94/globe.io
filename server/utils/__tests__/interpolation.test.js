/**
 * Tests for interpolation utilities
 */
const {
  getGridCorners,
  bilinearInterpolate,
  interpolateTemperatureGrid,
  getCoarserResolution
} = require('../interpolation');

describe('interpolation utilities', () => {
  describe('getGridCorners', () => {
    it('should find corners for point within grid', () => {
      const corners = getGridCorners(15, 25, 10);
      expect(corners.sw).toEqual({ lat: 10, lng: 20 });
      expect(corners.se).toEqual({ lat: 10, lng: 30 });
      expect(corners.nw).toEqual({ lat: 20, lng: 20 });
      expect(corners.ne).toEqual({ lat: 20, lng: 30 });
    });

    it('should handle negative coordinates', () => {
      const corners = getGridCorners(-15, -25, 10);
      expect(corners.sw).toEqual({ lat: -20, lng: -30 });
      expect(corners.se).toEqual({ lat: -20, lng: -20 });
      expect(corners.nw).toEqual({ lat: -10, lng: -30 });
      expect(corners.ne).toEqual({ lat: -10, lng: -20 });
    });

    it('should handle point on grid line', () => {
      const corners = getGridCorners(20, 30, 10);
      expect(corners.sw).toEqual({ lat: 20, lng: 30 });
      expect(corners.ne).toEqual({ lat: 30, lng: 40 });
    });
  });

  describe('bilinearInterpolate', () => {
    const corners = {
      sw: { lat: 0, lng: 0 },
      se: { lat: 0, lng: 10 },
      nw: { lat: 10, lng: 0 },
      ne: { lat: 10, lng: 10 }
    };

    it('should return corner value when at corner', () => {
      const values = { sw: 10, se: 20, nw: 30, ne: 40 };
      expect(bilinearInterpolate(0, 0, corners, values)).toBe(10);
    });

    it('should interpolate center correctly', () => {
      const values = { sw: 0, se: 0, nw: 0, ne: 40 };
      // Center should be average = 10
      const result = bilinearInterpolate(5, 5, corners, values);
      expect(result).toBe(10);
    });

    it('should handle uniform values', () => {
      const values = { sw: 25, se: 25, nw: 25, ne: 25 };
      expect(bilinearInterpolate(5, 5, corners, values)).toBe(25);
    });

    it('should interpolate edge correctly', () => {
      const values = { sw: 0, se: 20, nw: 0, ne: 20 };
      // Midpoint of south edge
      const result = bilinearInterpolate(0, 5, corners, values);
      expect(result).toBe(10);
    });
  });

  describe('interpolateTemperatureGrid', () => {
    it('should interpolate points from source data', () => {
      const sourceData = new Map([
        ['0,0', { lat: 0, lng: 0, temperature: { avg: 10, min: 5, max: 15 } }],
        ['0,10', { lat: 0, lng: 10, temperature: { avg: 20, min: 15, max: 25 } }],
        ['10,0', { lat: 10, lng: 0, temperature: { avg: 30, min: 25, max: 35 } }],
        ['10,10', { lat: 10, lng: 10, temperature: { avg: 40, min: 35, max: 45 } }]
      ]);

      const targetPoints = [{ lat: 5, lng: 5 }];
      const result = interpolateTemperatureGrid(targetPoints, sourceData, 10);

      expect(result.length).toBe(1);
      expect(result[0].lat).toBe(5);
      expect(result[0].lng).toBe(5);
      // Center average should be (10+20+30+40)/4 = 25
      expect(result[0].temperature.avg).toBe(25);
      expect(result[0].source).toBe('interpolated');
    });

    it('should skip points with insufficient corners', () => {
      const sourceData = new Map([
        ['0,0', { lat: 0, lng: 0, temperature: { avg: 10, min: 5, max: 15 } }]
        // Only 1 corner - not enough
      ]);

      const targetPoints = [{ lat: 5, lng: 5 }];
      const result = interpolateTemperatureGrid(targetPoints, sourceData, 10);

      expect(result.length).toBe(0);
    });

    it('should handle 3 corners with averaging', () => {
      const sourceData = new Map([
        ['0,0', { lat: 0, lng: 0, temperature: { avg: 10, min: 5, max: 15 } }],
        ['0,10', { lat: 0, lng: 10, temperature: { avg: 20, min: 15, max: 25 } }],
        ['10,0', { lat: 10, lng: 0, temperature: { avg: 30, min: 25, max: 35 } }]
        // Missing ne corner
      ]);

      const targetPoints = [{ lat: 5, lng: 5 }];
      const result = interpolateTemperatureGrid(targetPoints, sourceData, 10);

      expect(result.length).toBe(1);
      expect(result[0].temperature.avg).toBeDefined();
    });
  });

  describe('getCoarserResolution', () => {
    it('should return next coarser resolution', () => {
      expect(getCoarserResolution(0.5)).toBe(1);
      expect(getCoarserResolution(1)).toBe(2);
      expect(getCoarserResolution(2)).toBe(2.5);
      expect(getCoarserResolution(2.5)).toBe(5);
      expect(getCoarserResolution(5)).toBe(10);
    });

    it('should return null for coarsest resolution', () => {
      expect(getCoarserResolution(10)).toBeNull();
    });

    it('should return null for unknown resolution', () => {
      expect(getCoarserResolution(3)).toBeNull();
    });
  });
});
