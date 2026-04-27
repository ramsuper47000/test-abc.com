import { LayoutDashboard, Globe, Newspaper, Settings, Info, Menu, X, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ViewType = 'dashboard' | 'map' | 'news';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const navItems = [
  { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'map' as ViewType, label: 'Global Map', icon: Globe },
  { id: 'news' as ViewType, label: 'Geo News', icon: Newspaper },
];

export default function Sidebar({ currentView, onViewChange, isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-cyan-400 lg:hidden"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 280 : 80 }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="fixed left-0 top-0 h-screen bg-black/60 backdrop-blur-xl border-r border-gray-800/50 z-40 overflow-hidden hidden lg:flex flex-col transition-colors hover:bg-black/80"
      >
        <div className="p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 shrink-0">
              <Compass className="w-6 h-6 text-blue-400" />
            </div>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="whitespace-nowrap"
                >
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    GeoIntel
                  </h1>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all relative group glow-hover ${
                currentView === item.id
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-white/40 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <item.icon className={`w-6 h-6 shrink-0 ${currentView === item.id ? 'text-blue-400' : 'group-hover:text-white'}`} />
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {currentView === item.id && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-blue-400 rounded-r-full"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800/50 space-y-2">
          <button className="w-full flex items-center gap-4 p-3 rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-all glow-hover">
            <Settings className="w-6 h-6 shrink-0" />
            {isOpen && <span className="font-medium">Settings</span>}
          </button>
          <button className="w-full flex items-center gap-4 p-3 rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-all glow-hover">
            <Info className="w-6 h-6 shrink-0" />
            {isOpen && <span className="font-medium">Help Center</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 bg-slate-950/95 backdrop-blur-2xl border-r border-white/10 z-50 lg:hidden flex flex-col"
          >
            <div className="p-6 mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gradient-to-br from-blue-400/30 to-cyan-400/20 rounded-lg border border-blue-300/20">
                  <Compass className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">GeoIntel</h1>
                  <p className="text-[10px] text-cyan-300/50 uppercase tracking-widest leading-none">Global Monitor</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-cyan-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 px-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                    currentView === item.id
                      ? 'bg-blue-500/20 text-cyan-100 border border-blue-400/30'
                      : 'text-cyan-300/50 border border-transparent'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
