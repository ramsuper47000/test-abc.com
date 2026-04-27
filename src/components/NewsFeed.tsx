import { useState, useEffect } from 'react';
import { TrendingUp, ExternalLink, Calendar, Search } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';

interface NewsArticle {
  url: string;
  title: string;
  pubDate: string;
  sourceName: string;
}

export default function NewsFeed() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadNews = async () => {
      try {
        const response = await fetchFromAPI('/api/news');
        setNews(response.data || []);
      } catch (error) {
        console.error('Failed to load news:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  const filteredNews = news.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.sourceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-semibold text-gradient flex items-center gap-4 tracking-tighter">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            Global News Feed
          </h2>
          <p className="text-white/40 mt-2 font-medium">Real-time geopolitical monitoring and analysis</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white/50 transition-colors" />
          <input
            type="text"
            placeholder="Search Intelligence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 w-full md:w-80 transition-all placeholder:text-white/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ))
        ) : filteredNews.length > 0 ? (
          filteredNews.map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/[0.08] transition-all flex flex-col justify-between glow-hover"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="px-3 py-1 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-[0.15em] border border-blue-500/20">
                    {article.sourceName}
                  </span>
                  <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-blue-400 transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
                <h3 className="text-xl font-medium text-white/80 group-hover:text-white transition-colors line-clamp-3 mb-6 font-poppins leading-relaxed">
                  {article.title}
                </h3>
              </div>
              
              <div className="flex items-center gap-3 text-[10px] text-white/30 uppercase tracking-widest font-bold border-t border-white/5 pt-6">
                <Calendar className="w-3 h-3 opacity-50" />
                {new Date(article.pubDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </a>
          ))
        ) : (
          <div className="col-span-full py-32 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/30 font-medium font-poppins">No intelligence found matching your search parameters</p>
          </div>
        )}
      </div>
    </div>
  );
}
