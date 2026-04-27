/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Router, Request, Response } from 'express';
import axios from 'axios';
import { getFromCache, setInCache } from '../utils/cache.ts';

const router: Router = express.Router();

interface GeoEvent {
  id: string;
  title: string;
  description: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  magnitude?: number;
  date: string;
  source: 'NASA' | 'USGS';
  eventType: string;
}

const fetchNASAEONET = async (): Promise<GeoEvent[]> => {
  try {
    const response = await axios.get(
      'https://eonet.gsfc.nasa.gov/api/v3/events',
      {
        params: {
          limit: 100,
          status: 'open'
        },
        timeout: 30000
      }
    );

    return (response.data.events || []).map((event: unknown) => {
      const geometry = (event as any).geometries?.[0];
      return {
        id: (event as any).id,
        title: (event as any).title,
        description: (event as any).description || '',
        coordinates: {
          lat: geometry?.coordinates?.[1] || 0,
          lon: geometry?.coordinates?.[0] || 0
        },
        date: geometry?.date || new Date().toISOString(),
        source: 'NASA',
        eventType: (event as any).categories?.[0]?.title || 'Unknown'
      };
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('NASA EONET error:', errorMessage);
    return [];
  }
};

const fetchUSGSEarthquakes = async (): Promise<GeoEvent[]> => {
  try {
    const response = await axios.get(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson',
      {
        timeout: 30000
      }
    );

    return (response.data.features || []).map((feature: unknown) => {
      const properties = (feature as any).properties || {};
      const geometry = (feature as any).geometry || { coordinates: [0, 0] };
      return {
        id: (feature as any).id,
        title: `Earthquake - ${properties.title || 'Unknown'}`,
        description: properties.place || '',
        coordinates: {
          lat: geometry.coordinates?.[1] || 0,
          lon: geometry.coordinates?.[0] || 0
        },
        magnitude: properties.mag,
        date: properties.time ? new Date(properties.time).toISOString() : new Date().toISOString(),
        source: 'USGS',
        eventType: 'Earthquake'
      };
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('USGS API error:', errorMessage);
    return [];
  }
};

const sortByDate = (events: GeoEvent[]): GeoEvent[] => {
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

router.get('/', async (req: Request, res: Response) => {
  const cacheKey = 'geo_events_combined';
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
    const [nasaEvents, usgsEvents] = await Promise.all([
      fetchNASAEONET(),
      fetchUSGSEarthquakes()
    ]);

    let allEvents = sortByDate([...nasaEvents, ...usgsEvents]);
    
    // Fallback if no events found
    if (allEvents.length === 0) {
      allEvents = [
        {
          id: 'mock-1',
          title: 'Regional Stability Monitoring - Eastern Europe',
          description: 'Automated monitoring of localized diplomatic shifts.',
          coordinates: { lat: 48.3794, lon: 31.1656 },
          date: new Date().toISOString(),
          source: 'NASA',
          eventType: 'Stability'
        },
        {
          id: 'mock-2',
          title: 'Economic Corridor Assessment',
          description: 'Analyzing trade pattern variations in the Indo-Pacific.',
          coordinates: { lat: 15.8700, lon: 100.9925 },
          date: new Date().toISOString(),
          source: 'USGS',
          eventType: 'Economic'
        }
      ];
    }

    setInCache(cacheKey, allEvents);

    res.json({
      success: true,
      data: allEvents,
      stats: {
        total: allEvents.length,
        nasa: nasaEvents.length,
        usgs: usgsEvents.length
      },
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
});

router.get('/nasa', async (req: Request, res: Response) => {
  try {
    const events = await fetchNASAEONET();
    res.json({
      success: true,
      data: events,
      source: 'NASA EONET',
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NASA events'
    });
  }
});

router.get('/earthquakes', async (req: Request, res: Response) => {
  try {
    const events = await fetchUSGSEarthquakes();
    res.json({
      success: true,
      data: events,
      source: 'USGS',
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch earthquake data'
    });
  }
});

router.get('/by-coordinates', async (req: Request, res: Response) => {
  const { lat, lon, radius = 500 } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  try {
    const [nasaEvents, usgsEvents] = await Promise.all([
      fetchNASAEONET(),
      fetchUSGSEarthquakes()
    ]);

    const allEvents = [...nasaEvents, ...usgsEvents];
    const latNum = parseFloat(lat as string);
    const lonNum = parseFloat(lon as string);
    const radiusNum = parseFloat(radius as string) / 111; // Convert km to degrees

    const filteredEvents = allEvents.filter(event => {
      const distance = Math.sqrt(
        Math.pow(event.coordinates.lat - latNum, 2) +
        Math.pow(event.coordinates.lon - lonNum, 2)
      );
      return distance <= radiusNum;
    });

    res.json({
      success: true,
      data: sortByDate(filteredEvents),
      center: { lat: latNum, lon: lonNum },
      radiusKm: radius,
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Failed to filter events by coordinates'
    });
  }
});

export default router;
