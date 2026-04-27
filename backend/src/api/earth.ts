import express, { Router, Request, Response } from 'express';
import axios from 'axios';
import { getFromCache, setInCache } from '../utils/cache.ts';

const router: Router = express.Router();

interface SatelliteImage {
  url: string;
  date: string;
  source: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  timestamp: string;
}

const fetchNASASatelliteImagery = async (lat: number, lon: number): Promise<SatelliteImage[]> => {
  try {
    const params = {
      lon,
      lat,
      begin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      api_key: process.env.NASA_API_KEY
    };

    const response = await axios.get(
      'https://api.nasa.gov/planetary/earth/imagery',
      { params, timeout: 10000 }
    );

    return [{
      url: response.data.url,
      date: response.data.acquisition_date,
      source: 'NASA LANDSAT',
      coordinates: { lat, lon }
    }];
  } catch (error: any) {
    console.error('NASA satellite imagery error:', error.message || 'Unknown error');
    return [];
  }
};

const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData | null> => {
  try {
    const response = await axios.get(
      'https://api.open-meteo.com/v1/forecast',
      {
        params: {
          latitude: lat,
          longitude: lon,
          current: 'temperature_2m,weather_code,relative_humidity_2m,weather_code,precipitation,wind_speed_10m'
        },
        timeout: 10000
      }
    );

    const current = response.data.current || {};

    return {
      temperature: current.temperature_2m || 0,
      condition: getWeatherCondition(current.weather_code || 0),
      humidity: current.relative_humidity_2m || 0,
      windSpeed: current.wind_speed_10m || 0,
      precipitation: current.precipitation || 0,
      timestamp: current.time || new Date().toISOString()
    };
  } catch (error: any) {
    console.error('Weather data error:', error.message || 'Unknown error');
    return null;
  }
};

const getWeatherCondition = (code: number): string => {
  const conditions: { [key: number]: string } = {
    0: 'Clear',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Foggy with rime',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return conditions[code] || 'Unknown';
};

router.get('/satellite', async (req: Request, res: Response) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: 'Latitude and longitude required'
    });
  }

  const latNum = parseFloat(lat as string);
  const lonNum = parseFloat(lon as string);

  if (isNaN(latNum) || isNaN(lonNum)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid coordinates'
    });
  }

  const cacheKey = `satellite_${latNum}_${lonNum}`;
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
    const imagery = await fetchNASASatelliteImagery(latNum, lonNum);
    setInCache(cacheKey, imagery);

    res.json({
      success: true,
      data: imagery,
      coordinates: { lat: latNum, lon: lonNum },
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch satellite imagery'
    });
  }
});

router.get('/weather', async (req: Request, res: Response) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: 'Latitude and longitude required'
    });
  }

  const latNum = parseFloat(lat as string);
  const lonNum = parseFloat(lon as string);

  if (isNaN(latNum) || isNaN(lonNum)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid coordinates'
    });
  }

  const cacheKey = `weather_${latNum}_${lonNum}`;
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
    const weather = await fetchWeatherData(latNum, lonNum);

    if (!weather) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch weather data'
      });
    }

    setInCache(cacheKey, weather);

    res.json({
      success: true,
      data: weather,
      coordinates: { lat: latNum, lon: lonNum },
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather'
    });
  }
});

router.get('/combined', async (req: Request, res: Response) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: 'Latitude and longitude required'
    });
  }

  const latNum = parseFloat(lat as string);
  const lonNum = parseFloat(lon as string);

  if (isNaN(latNum) || isNaN(lonNum)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid coordinates'
    });
  }

  const cacheKey = `earth_combined_${latNum}_${lonNum}`;
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
    const [imagery, weather] = await Promise.all([
      fetchNASASatelliteImagery(latNum, lonNum),
      fetchWeatherData(latNum, lonNum)
    ]);

    const combined = {
      satellite: imagery,
      weather,
      coordinates: { lat: latNum, lon: lonNum }
    };

    setInCache(cacheKey, combined);

    res.json({
      success: true,
      data: combined,
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch earth observation data'
    });
  }
});

export default router;
