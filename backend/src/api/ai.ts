import express, { Router, Request, Response } from 'express';
import { routeAIRequest } from '../utils/aiRouter.ts';
import { getFromCache, setInCache } from '../utils/cache.ts';

const router: Router = express.Router();

interface AIRequest {
  prompt: string;
  context?: string;
  useCache?: boolean;
}

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { prompt, context = '', useCache = true }: AIRequest = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a string'
      });
    }

    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
    const cacheKey = `ai_analysis_${Buffer.from(fullPrompt).toString('base64').slice(0, 50)}`;

    if (useCache) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    const analysis = await routeAIRequest(fullPrompt);
    setInCache(cacheKey, analysis);

    res.json({
      success: true,
      data: analysis,
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI analysis error:', errorMessage);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze request'
    });
  }
});

router.post('/predict', async (req: Request, res: Response) => {
  try {
    const { scenario, indicators = [] } = req.body;

    if (!scenario) {
      return res.status(400).json({
        success: false,
        error: 'Scenario is required'
      });
    }

    const prompt = `
Provide geopolitical risk prediction for the following scenario:

Scenario: ${scenario}
Key Indicators: ${Array.isArray(indicators) ? indicators.join(', ') : ''}

Analyze potential outcomes and confidence levels. Structure response as JSON with prediction, confidence (0-1), and best/worst/likely case scenarios.
`;

    const cacheKey = `ai_predict_${Buffer.from(scenario).toString('base64').slice(0, 50)}`;
    const cached = getFromCache(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    const prediction = await routeAIRequest(prompt);
    setInCache(cacheKey, prediction);

    res.json({
      success: true,
      data: prediction,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI prediction error:', errorMessage);
    res.status(500).json({
      success: false,
      error: 'Failed to generate prediction'
    });
  }
});

router.get('/models', (req: Request, res: Response) => {
  const availableModels = [];

  if (process.env.GEMINI_API_KEY) availableModels.push('gemini');
  if (process.env.OPENAI_API_KEY) availableModels.push('openai');
  if (process.env.MISTRAL_API_KEY) availableModels.push('mistral');

  res.json({
    success: true,
    availableModels,
    primaryModel: availableModels[0] || null,
    timestamp: new Date().toISOString()
  });
});

export default router;
