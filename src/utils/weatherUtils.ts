// Temperature normalization and color scale utilities

// Normalize temperature to 0-1 range
// Range: -40°C (0) to +45°C (1)
export const normalizeTemperature = (temp: number): number => {
  const min = -40;
  const max = 45;
  return Math.max(0, Math.min(1, (temp - min) / (max - min)));
};

// Temperature color scale (blue to red)
// Returns color for a normalized temperature value (0-1)
export const temperatureToColor = (normalized: number): string => {
  const colors = [
    '#313695',  // 0.0  - Deep blue (-40°C)
    '#4575b4',  // 0.1  - Blue (-30°C)
    '#74add1',  // 0.2  - Light blue (-20°C)
    '#abd9e9',  // 0.3  - Cyan (-10°C)
    '#e0f3f8',  // 0.4  - Light cyan (0°C)
    '#ffffbf',  // 0.5  - Yellow (10°C)
    '#fee090',  // 0.6  - Light orange (18°C)
    '#fdae61',  // 0.7  - Orange (26°C)
    '#f46d43',  // 0.8  - Red-orange (34°C)
    '#d73027',  // 0.9  - Red (40°C)
    '#a50026'   // 1.0  - Deep red (45°C+)
  ];

  const index = Math.floor(normalized * (colors.length - 1));
  return colors[Math.min(index, colors.length - 1)];
};

// Get color for a raw temperature value
export const getTemperatureColor = (temp: number): string => {
  return temperatureToColor(normalizeTemperature(temp));
};

// Format temperature for display
export const formatTemperature = (temp: number, unit: 'C' | 'F' = 'C'): string => {
  if (unit === 'F') {
    const fahrenheit = (temp * 9/5) + 32;
    return `${Math.round(fahrenheit)}°F`;
  }
  return `${Math.round(temp)}°C`;
};

// Month names for display
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Get month name from number (1-12)
export const getMonthName = (month: number, short = false): string => {
  const names = short ? MONTH_NAMES_SHORT : MONTH_NAMES;
  return names[month - 1] || '';
};

// Color scale gradient for legend (CSS gradient string)
export const temperatureGradient = `linear-gradient(to right,
  #313695, #4575b4, #74add1, #abd9e9, #e0f3f8,
  #ffffbf, #fee090, #fdae61, #f46d43, #d73027, #a50026
)`;

// Temperature scale ticks for legend
export const temperatureScaleTicks = [
  { value: -40, label: '-40°C' },
  { value: -20, label: '-20°C' },
  { value: 0, label: '0°C' },
  { value: 20, label: '20°C' },
  { value: 45, label: '45°C' }
];
