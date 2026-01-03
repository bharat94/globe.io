export type ViewType = 'explorer' | 'weather' | 'population' | 'earthquakes' | 'satellites' | 'pollution';

export interface ViewConfig {
  id: ViewType;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
}

export const VIEWS: ViewConfig[] = [
  {
    id: 'explorer',
    name: 'Explorer',
    icon: '🌍',
    description: 'Explore cities and their information',
    enabled: true
  },
  {
    id: 'weather',
    name: 'Weather',
    icon: '🌤️',
    description: 'View global weather patterns',
    enabled: true
  },
  {
    id: 'population',
    name: 'Population',
    icon: '👥',
    description: 'Track population changes over time',
    enabled: true
  },
  {
    id: 'earthquakes',
    name: 'Earthquakes',
    icon: '🌋',
    description: 'Visualize seismic activity worldwide',
    enabled: false // Coming soon - USGS earthquake data
  },
  {
    id: 'satellites',
    name: 'Satellites',
    icon: '🛰️',
    description: 'Track satellites orbiting Earth',
    enabled: false // Coming soon - orbital visualization
  },
  {
    id: 'pollution',
    name: 'Pollution',
    icon: '🏭',
    description: 'Monitor air quality globally',
    enabled: false // Coming soon - air quality index
  }
];
