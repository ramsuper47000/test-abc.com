/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Router, Request, Response } from 'express';
import axios from 'axios';
import { getFromCache, setInCache } from '../utils/cache.ts';

const router: Router = express.Router();

interface GDELTArticle {
  url: string;
  title: string;
  pubDate: string;
  sourceName: string;
  topics?: string[];
}

const fetchGDELTNews = async (): Promise<GDELTArticle[]> => {
  const cacheKey = 'gdelt_news';
  const cached = getFromCache(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(
      'https://api.gdeltproject.org/api/v2/doc/doc',
      {
        params: {
          query: 'geopolitical conflict',
          mode: 'artlist',
          maxrecords: 50,
          sort: 'date',
          format: 'json'
        },
        timeout: 30000
      }
    );

    const articles: GDELTArticle[] = (response.data.articles || []).map((article: unknown) => ({
      url: (article as any).url || '#',
      title: (article as any).title || 'Untitled Report',
      pubDate: (article as any).se_date || (article as any).date || new Date().toISOString(),
      sourceName: (article as any).sourcecountry || 'Global Source',
      topics: (article as any).themes?.split(',').slice(0, 3) || []
    }));

    setInCache(cacheKey, articles);
    return articles;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('GDELT API error:', errorMessage);
    if (axios.isAxiosError(err)) {
      console.error('Status:', err.response?.status);
      console.error('Timeout:', err.code === 'ECONNABORTED');
    }
    return [];
  }
};

router.get('/', async (req: Request, res: Response) => {
  try {
    let articles = await fetchGDELTNews();
    
    if (!articles || articles.length === 0) {
      articles = [
        {
          url: '#',
          title: 'Global Trade Policy Update: Navigating New Regulations',
          pubDate: new Date().toISOString(),
          sourceName: 'International News'
        },
        {
          url: '#',
          title: 'Renewable Energy Initiatives Expand in Emerging Markets',
          pubDate: new Date().toISOString(),
          sourceName: 'Tech Observer'
        }
      ];
    }

    res.json({
      success: true,
      data: articles,
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news'
    });
  }
});

router.get('/search', async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  const cacheKey = `gdelt_news_${query}`;
  const cached = getFromCache(cacheKey);

  if (cached) {
    return res.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString()
    });
  }

  try {
    const response = await axios.get(
      'https://api.gdeltproject.org/api/v2/doc/doc',
      {
        params: {
          query,
          mode: 'artlist',
          maxrecords: 75,
          sort: 'date',
          format: 'json'
        },
        timeout: 30000
      }
    );

    const articles = (response.data.articles || []).map((article: unknown) => ({
      url: (article as any).url || '#',
      title: (article as any).title || 'Untitled Report',
      pubDate: (article as any).se_date || (article as any).date || new Date().toISOString(),
      sourceName: (article as any).sourcecountry || 'Global Source'
    }));

    setInCache(cacheKey, articles);

    res.json({
      success: true,
      data: articles,
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Failed to search news'
    });
  }
});

export default router;
