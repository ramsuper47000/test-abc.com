import { Suspense, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Globe from './Globe';
import { MapPin } from 'lucide-react';
import { calculateAllRiskScores } from '../utils/correlationEngine';

interface GlobalMapProps {
  events?: Array<{
    id: string;
    coordinates: { lat: number; lon: number };
    title: string;
    description: string;
    eventType: string;
    magnitude?: number;
    source: string;
    date: string;
  }>;
}

export default function GlobalMap({ events = [] }: GlobalMapProps) {
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null);

  const riskPoints = useMemo(() => {
    if (!events.length) return [];

    const correlationEvents = events.map((e) => ({
      id: e.id,
      lat: e.coordinates.lat,
      lng: e.coordinates.lon,
      type: e.source === 'USGS' ? ('earthquake' as const) : e.eventType.toLowerCase().includes('disaster') ? ('disaster' as const) : ('news' as const),
      severity: e.magnitude || (e.eventType === 'Earthquake' ? 80 : 50),
      sentiment: 30,
      timestamp: new Date(e.date),
      title: e.title,
      description: e.description,
    }));

    const riskScores = calculateAllRiskScores(correlationEvents);

    return Array.from(riskScores.values())
      .map((risk) => {
        const event = correlationEvents.find((e) => e.id === risk.eventId);
        return event
          ? {
              lat: event.lat,
              lng: event.lng,
              risk,
              data: event,
            }
          : null;
      })
      .filter((p) => p !== null)
      .slice(0, 50);
  }, [events]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden glow-hover" style={{ height: '500px' }}>
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center text-white/20">
              Initializing 3D Intelligence Grid...
            </div>
          }>
            <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
              <Stars radius={100} depth={50} count={5000} factor={4} fade speed={0.5} />
              <Globe riskPoints={riskPoints} maxNodes={50} />
              <OrbitControls
                autoRotate
                autoRotateSpeed={0.5}
                enableZoom={true}
                enablePan={true}
                enableRotate={true}
              />
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 5]} intensity={1.5} />
            </Canvas>
          </Suspense>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-4 glow-hover">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-3">Quick Search</label>
            <div className="space-y-2">
              {[
                { name: 'North America', lat: 45, lon: -100 },
                { name: 'Europe', lat: 50, lon: 10 },
                { name: 'Middle East', lat: 30, lon: 50 },
                { name: 'Asia-Pacific', lat: 20, lon: 120 }
              ].map((region) => (
                <button
                  key={region.name}
                  onClick={() => setSelectedCoords({ lat: region.lat, lon: region.lon })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all text-sm text-white/60 hover:text-white glow-hover"
                >
                  <MapPin className="w-3 h-3 inline mr-2 text-blue-400" />
                  {region.name}
                </button>
              ))}
            </div>
          </div>

          {selectedCoords && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400/70 mb-2">Selected Region</p>
              <p className="text-sm font-semibold text-white">
                {selectedCoords.lat.toFixed(2)}°, {selectedCoords.lon.toFixed(2)}°
              </p>
              <button className="w-full mt-3 px-3 py-2 bg-blue-500 hover:bg-blue-600 border border-blue-400 rounded-lg text-xs text-white font-medium transition-all">
                Analyze Region
              </button>
            </div>
          )}

          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">Legend</p>
            <div className="space-y-3 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 ring-4 ring-red-500/20 animate-pulse"></div>
                <span className="text-white/40">Critical Alert</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 ring-4 ring-yellow-500/20"></div>
                <span className="text-white/40">Active Monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 ring-4 ring-green-500/20"></div>
                <span className="text-white/40">Neutral State</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 glow-hover">
        <h3 className="text-xl font-medium text-white mb-6 tracking-tight font-poppins">Global Coverage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white/[0.03] border border-white/5 transition-all hover:bg-white/[0.05]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Monitoring Regions</p>
            <p className="text-4xl font-semibold text-gradient tracking-tighter">195</p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-blue-400/50 mt-4">Nations Tracked</p>
          </div>
          <div className="p-6 rounded-xl bg-white/[0.03] border border-white/5 transition-all hover:bg-white/[0.05]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Active Threats</p>
            <p className="text-4xl font-semibold text-red-500 tracking-tighter">12</p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-red-400/50 mt-4">Immediate Attention</p>
          </div>
          <div className="p-6 rounded-xl bg-white/[0.03] border border-white/5 transition-all hover:bg-white/[0.05]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">System Status</p>
            <p className="text-4xl font-semibold text-green-500 tracking-tighter">LIVE</p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-green-400/50 mt-4">Real-time Stream</p>
          </div>
        </div>
      </div>
    </div>
  );
}
