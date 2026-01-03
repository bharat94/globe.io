/**
 * Bilinear Interpolation Utilities
 * For generating fine-resolution data from coarser grids
 */

/**
 * Find the four nearest points in a grid for bilinear interpolation
 * @param {number} lat - Target latitude
 * @param {number} lng - Target longitude
 * @param {number} resolution - Grid resolution in degrees
 * @returns {Object} Corner coordinates {sw, se, nw, ne}
 */
function getGridCorners(lat, lng, resolution) {
  const latLow = Math.floor(lat / resolution) * resolution;
  const latHigh = latLow + resolution;
  const lngLow = Math.floor(lng / resolution) * resolution;
  const lngHigh = lngLow + resolution;

  return {
    sw: { lat: latLow, lng: lngLow },
    se: { lat: latLow, lng: lngHigh },
    nw: { lat: latHigh, lng: lngLow },
    ne: { lat: latHigh, lng: lngHigh }
  };
}

/**
 * Perform bilinear interpolation
 * @param {number} lat - Target latitude
 * @param {number} lng - Target longitude
 * @param {Object} corners - Corner coordinates from getGridCorners
 * @param {Object} values - Values at corners {sw, se, nw, ne}
 * @returns {number} Interpolated value
 */
function bilinearInterpolate(lat, lng, corners, values) {
  // Handle edge case where all values are the same
  if (values.sw === values.se && values.se === values.nw && values.nw === values.ne) {
    return values.sw;
  }

  // Calculate interpolation weights
  const latRange = corners.nw.lat - corners.sw.lat;
  const lngRange = corners.se.lng - corners.sw.lng;

  // Avoid division by zero
  if (latRange === 0 || lngRange === 0) {
    return (values.sw + values.se + values.nw + values.ne) / 4;
  }

  const latWeight = (lat - corners.sw.lat) / latRange;
  const lngWeight = (lng - corners.sw.lng) / lngRange;

  // Bilinear interpolation formula
  const southValue = values.sw * (1 - lngWeight) + values.se * lngWeight;
  const northValue = values.nw * (1 - lngWeight) + values.ne * lngWeight;
  const result = southValue * (1 - latWeight) + northValue * latWeight;

  return Math.round(result * 10) / 10; // Round to 1 decimal
}

/**
 * Interpolate temperature data from a coarser grid
 * @param {Array} targetPoints - Array of {lat, lng} to interpolate
 * @param {Map} sourceData - Map of "lat,lng" -> data from coarser grid
 * @param {number} sourceResolution - Resolution of source data
 * @returns {Array} Interpolated data points
 */
function interpolateTemperatureGrid(targetPoints, sourceData, sourceResolution) {
  const results = [];
  let interpolatedCount = 0;
  let skippedCount = 0;

  for (const point of targetPoints) {
    const corners = getGridCorners(point.lat, point.lng, sourceResolution);

    // Get values at corners
    const swKey = `${corners.sw.lat},${corners.sw.lng}`;
    const seKey = `${corners.se.lat},${corners.se.lng}`;
    const nwKey = `${corners.nw.lat},${corners.nw.lng}`;
    const neKey = `${corners.ne.lat},${corners.ne.lng}`;

    const swData = sourceData.get(swKey);
    const seData = sourceData.get(seKey);
    const nwData = sourceData.get(nwKey);
    const neData = sourceData.get(neKey);

    // Need at least 3 corners for reasonable interpolation
    const availableCorners = [swData, seData, nwData, neData].filter(Boolean);
    if (availableCorners.length < 3) {
      skippedCount++;
      continue;
    }

    // Use average for missing corners
    const avgTemp = availableCorners.reduce((sum, d) => sum + d.temperature.avg, 0) / availableCorners.length;
    const avgMin = availableCorners.reduce((sum, d) => sum + d.temperature.min, 0) / availableCorners.length;
    const avgMax = availableCorners.reduce((sum, d) => sum + d.temperature.max, 0) / availableCorners.length;

    const tempValues = {
      sw: swData?.temperature.avg ?? avgTemp,
      se: seData?.temperature.avg ?? avgTemp,
      nw: nwData?.temperature.avg ?? avgTemp,
      ne: neData?.temperature.avg ?? avgTemp
    };

    const minValues = {
      sw: swData?.temperature.min ?? avgMin,
      se: seData?.temperature.min ?? avgMin,
      nw: nwData?.temperature.min ?? avgMin,
      ne: neData?.temperature.min ?? avgMin
    };

    const maxValues = {
      sw: swData?.temperature.max ?? avgMax,
      se: seData?.temperature.max ?? avgMax,
      nw: nwData?.temperature.max ?? avgMax,
      ne: neData?.temperature.max ?? avgMax
    };

    const interpolatedAvg = bilinearInterpolate(point.lat, point.lng, corners, tempValues);
    const interpolatedMin = bilinearInterpolate(point.lat, point.lng, corners, minValues);
    const interpolatedMax = bilinearInterpolate(point.lat, point.lng, corners, maxValues);

    results.push({
      lat: point.lat,
      lng: point.lng,
      temperature: {
        avg: interpolatedAvg,
        min: interpolatedMin,
        max: interpolatedMax
      },
      source: 'interpolated',
      sourceResolution
    });

    interpolatedCount++;
  }

  if (interpolatedCount > 0 || skippedCount > 0) {
    console.log(`Interpolation: ${interpolatedCount} points from ${sourceResolution}° grid, ${skippedCount} skipped`);
  }

  return results;
}

/**
 * Get the next coarser resolution
 * @param {number} resolution - Current resolution
 * @returns {number|null} Coarser resolution or null if none
 */
function getCoarserResolution(resolution) {
  const resolutions = [0.5, 1, 2, 2.5, 5, 10];
  const idx = resolutions.indexOf(resolution);
  if (idx === -1 || idx === resolutions.length - 1) return null;
  return resolutions[idx + 1];
}

module.exports = {
  getGridCorners,
  bilinearInterpolate,
  interpolateTemperatureGrid,
  getCoarserResolution
};
