import React from 'react';
import { X, Play, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface ScenarioGeneratorProps {
  onClose: () => void;
}

const ScenarioGenerator: React.FC<ScenarioGeneratorProps> = ({ onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-slate-900 border border-cyan-500/30 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-slate-900 to-cyan-900/20">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">AI Strategic Scenario Generator</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <p className="text-cyan-200/60 leading-relaxed text-sm">
            Model upcoming geopolitical shifts and natural disasters using synthetic data arrays and predictive neural nets.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all text-left group">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Conflict Escalation</h3>
              <p className="text-xs text-slate-500">Model rapid military deployment impacts</p>
            </button>

            <button className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all text-left group">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Supply Chain Shock</h3>
              <p className="text-xs text-slate-500">Analyze trade route blockades</p>
            </button>
          </div>
        </div>

        <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
          <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-cyan-600/20">
            Generate Analysis
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ScenarioGenerator;
