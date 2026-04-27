import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Zap, TrendingUp, Flame } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';
import {
  calculateAllRiskScores,
  EventData as CorrelationEventData,
} from '../utils/correlationEngine';

interface Event {
  id: string;
  title: string;
  description: string;
  coordinates: { lat: number; lon: number };
  date: string;
  source: string;
  eventType: string;
  magnitude?: number;
}

interface NewsArticle {
  url: string;
  title: string;
  pubDate: string;
  sourceName: string;
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eventsData, newsData] = await Promise.all([
          fetchFromAPI('/api/events'),
          fetchFromAPI('/api/news'),
        ]);

        setEvents(eventsData.data || []);
        setNews(newsData.data || []);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 300000);
    return () => clearInterval(interval);
  }, []);

  const correlationEvents = useMemo<CorrelationEventData[]>(() => {
    return events.map((e) => ({
      id: e.id,
      lat: e.coordinates.lat,
      lng: e.coordinates.lon,
      type: e.source === 'USGS' ? 'earthquake' : e.eventType.toLowerCase().includes('disaster') ? 'disaster' : 'news',
      severity: e.magnitude || (e.eventType === 'Earthquake' ? 80 : 50),
      sentiment: 30,
      timestamp: new Date(e.date),
      title: e.title,
      description: e.description,
    }));
  }, [events]);

  const riskScores = useMemo(() => {
    return calculateAllRiskScores(correlationEvents);
  }, [correlationEvents]);

  const criticalEvents = events
    .filter((e) => {
      const risk = riskScores.get(e.id);
      return risk && risk.score >= 60;
    })
    .sort((a, b) => {
      const riskA = riskScores.get(a.id)?.score || 0;
      const riskB = riskScores.get(b.id)?.score || 0;
      return riskB - riskA;
    });

  const recentNews = news.slice(0, 5);
  const avgRiskScore = useMemo(() => {
    const scores = Array.from(riskScores.values()).map((r) => r.score);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [riskScores]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={AlertTriangle}
          label="Critical Events"
          value={criticalEvents.length}
          colorClass="text-red-500"
        />
        <StatCard
          icon={Zap}
          label="Active Conflicts"
          value={events.length}
          colorClass="text-yellow-500"
        />
        <StatCard
          icon={TrendingUp}
          label="News Reports"
          value={news.length}
          colorClass="text-blue-500"
        />
        <StatCard
          icon={Flame}
          label="Avg Risk Score"
          value={avgRiskScore}
          colorClass="text-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col h-[600px] glow-hover">
          <div className="flex items-center gap-3 mb-8">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-medium text-white tracking-tight">Recent Events</h2>
          </div>
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <p className="text-white/40">Fetching global events...</p>
            ) : events.length > 0 ? (
              events.slice(0, 15).map((event) => {
                const risk = riskScores.get(event.id);
                return (
                  <div
                    key={event.id}
                    className="p-5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3 gap-4">
                      <h3 className="font-medium text-white/90 text-sm leading-snug group-hover:text-white transition-colors">
                        {event.title}
                      </h3>
                      {risk && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                            risk.score >= 75
                              ? 'bg-red-500/20 text-red-400'
                              : risk.score >= 60
                                ? 'bg-orange-500/20 text-orange-400'
                                : risk.score >= 40
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          Risk {risk.score}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-white/40 uppercase tracking-widest font-semibold">{event.eventType}</span>
                      {event.magnitude && (
                        <span className="text-yellow-500 font-bold">M{event.magnitude}</span>
                      )}
                      <span className="text-white/20 ml-auto">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-white/30 italic">No events recorded in this cycle</p>
            )}
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col h-[600px] glow-hover">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-medium text-white tracking-tight">Geopolitical News</h2>
          </div>
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <p className="text-white/40">Scanning news feeds...</p>
            ) : recentNews.length > 0 ? (
              recentNews.map((article, index) => (
                <a
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all block group"
                >
                  <h3 className="font-medium text-white/80 text-sm line-clamp-2 mb-4 group-hover:text-white leading-relaxed">
                    {article.title}
                  </h3>
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                    <span className="text-blue-400">{article.sourceName}</span>
                    <span className="text-white/20">
                      {new Date(article.pubDate).toLocaleDateString()}
                    </span>
                  </div>
                </a>
              ))
            ) : (
              <p className="text-white/30 italic">No news reports at this time</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  colorClass: string;
}

function StatCard({ icon: Icon, label, value, colorClass }: StatCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all relative overflow-hidden group glow-hover">
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${colorClass}`}>
        <Icon className="w-16 h-16" />
      </div>
      <div className="relative z-10 flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{label}</p>
        <p className={`text-4xl font-semibold tracking-tighter tabular-nums ${colorClass.replace('text-', 'text-')}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
