import { useState, useEffect } from 'react';
import { X, AlertTriangle, Zap } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';

interface AIPredictionPanelProps {
  eventId: string;
  title: string;
  location: string;
  onClose: () => void;
}

interface AIResponse {
  summary: string;
  importance: string;
  prediction: string;
  confidence: number;
  scenarios: {
    bestCase: string;
    mostLikely: string;
    worstCase: string;
  };
}

export default function AIPredictionPanel({
  eventId,
  title,
  location,
  onClose,
}: AIPredictionPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiData, setAiData] = useState<AIResponse | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchFromAPI('/api/ai', {
          method: 'POST',
          body: JSON.stringify({
            query: `Analyze geopolitical implications: ${title} at ${location}`,
            context: {
              eventId,
              location,
              timestamp: new Date().toISOString(),
            },
          }),
        });

        if (response.data) {
          setAiData(response.data);
        } else {
          setError('No AI analysis available');
        }
      } catch (err) {
        console.error('Failed to fetch AI prediction:', err);
        setError('Failed to generate analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [eventId, title, location]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-slate-950/95 backdrop-blur-xl border border-cyan-400/30 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none" />

        <div className="relative z-10 sticky top-0 flex items-center justify-between p-6 border-b border-cyan-400/20 bg-slate-950/50 backdrop-blur">
          <div>
            <h2 className="text-2xl font-bold text-cyan-100">AI Analysis</h2>
            <p className="text-sm text-cyan-200/60 mt-1">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-cyan-300" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                <p className="text-cyan-200/70">Analyzing event with AI models...</p>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-white/5 rounded animate-pulse" />
                <div className="h-4 bg-white/5 rounded animate-pulse w-5/6" />
              </div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-400/30">
              <p className="text-red-300">⚠️ {error}</p>
              <p className="text-red-200/60 text-sm mt-2">
                Could not generate analysis. Try again later.
              </p>
            </div>
          ) : aiData ? (
            <>
              <div>
                <h3 className="text-lg font-semibold text-cyan-100 mb-3">Summary</h3>
                <p className="text-cyan-200/80 leading-relaxed">{aiData.summary}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-cyan-100 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Importance Level
                </h3>
                <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/30">
                  <p className="text-yellow-200 font-semibold">{aiData.importance}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-cyan-100 mb-3">Prediction</h3>
                <p className="text-cyan-200/80 leading-relaxed mb-4">{aiData.prediction}</p>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/5 rounded-full overflow-hidden h-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-cyan-400 h-full"
                      style={{ width: `${aiData.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-cyan-200">
                    {(aiData.confidence * 100).toFixed(0)}% Confidence
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-cyan-100 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  Scenarios
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-400/30">
                    <p className="text-xs text-green-200/70 uppercase tracking-wide font-semibold mb-2">
                      Best Case
                    </p>
                    <p className="text-sm text-green-100 leading-relaxed">
                      {aiData.scenarios.bestCase}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-400/30">
                    <p className="text-xs text-blue-200/70 uppercase tracking-wide font-semibold mb-2">
                      Most Likely
                    </p>
                    <p className="text-sm text-blue-100 leading-relaxed">
                      {aiData.scenarios.mostLikely}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-400/30">
                    <p className="text-xs text-red-200/70 uppercase tracking-wide font-semibold mb-2">
                      Worst Case
                    </p>
                    <p className="text-sm text-red-100 leading-relaxed">
                      {aiData.scenarios.worstCase}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-cyan-200/60">No analysis available</p>
          )}
        </div>
      </div>
    </div>
  );
}
