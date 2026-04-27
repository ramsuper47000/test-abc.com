import { useState, useEffect } from 'react';
import Sidebar, { ViewType } from './components/Sidebar';
import NewsFeed from './components/NewsFeed';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import GlobalMap from './components/GlobalMap';
import ScenarioGenerator from './components/ScenarioGenerator';
import { fetchFromAPI } from './utils/api';

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

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [showScenario, setShowScenario] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetchFromAPI('/api/events');
        setEvents(response.data || []);
      } catch (error) {
        console.error('Failed to load events:', error);
      }
    };

    loadEvents();
    const interval = setInterval(loadEvents, 300000);
    return () => clearInterval(interval);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'map':
        return <GlobalMap events={events} />;
      case 'news':
        return <NewsFeed />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout 
      sidebar={
        <Sidebar 
          currentView={currentView} 
          onViewChange={setCurrentView} 
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
      }
    >
      <div className="space-y-8">
        <main className="relative">
          {renderView()}
        </main>

        {showScenario && <ScenarioGenerator onClose={() => setShowScenario(false)} />}

        <footer className="mt-12 pt-8 border-t border-white/5 text-center text-sm text-cyan-200/30 pb-4">
          <p>Geopolitical Intelligence Dashboard v1.2 • AI-Powered Global Stability Monitoring</p>
        </footer>
      </div>
    </Layout>
  );
}

export default App;
