export interface EventData {
  id: string;
  lat: number;
  lng: number;
  type: string;
  severity: number;
  sentiment: number;
  timestamp: Date;
  title: string;
  description: string;
}

export interface RiskScore {
  id: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
  intensity: number;
  eventId: string;
}

export const calculateAllRiskScores = (events: EventData[]): Map<string, RiskScore> => {
  const scores = new Map<string, RiskScore>();
  
  events.forEach(e => {
    scores.set(e.id, {
      id: e.id,
      score: Math.min(100, Math.max(0, e.severity + (Math.random() * 20 - 10))),
      trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable',
      factors: ['Seismic Activity', 'Proximity to Infrastructure'],
      intensity: (e.severity / 100),
      eventId: e.id
    });
  });
  
  return scores;
};
