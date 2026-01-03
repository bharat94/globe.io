export type ViewType = 'explorer' | 'weather' | 'population' | 'flights' | 'pollution';

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
    id: 'flights',
    name: 'Flights',
    icon: '✈️',
    description: 'Track flights around the world',
    enabled: false // Will be enabled when implemented
  },
  {
    id: 'pollution',
    name: 'Pollution',
    icon: '🏭',
    description: 'Monitor air quality globally',
    enabled: false // Will be enabled when implemented
  }
];
