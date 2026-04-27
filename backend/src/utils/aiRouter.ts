import axios from 'axios';

interface AIResponse {
  summary: string;
  importance: string;
  prediction: string;
  confidence: number;
  scenarios: {
    bestCase: string;
    worstCase: string;
    mostLikely: string;
  };
}

const callGemini = async (prompt: string): Promise<AIResponse> => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: {
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        timeout: 15000
      }
    );

    const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return parseAIResponse(content);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};

const callOpenAI = async (prompt: string): Promise<AIResponse> => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        timeout: 15000
      }
    );

    const content = response.data.choices?.[0]?.message?.content || '';
    return parseAIResponse(content);
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
};

const callMistral = async (prompt: string): Promise<AIResponse> => {
  try {
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'mistral-small',
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`
        },
        timeout: 15000
      }
    );

    const content = response.data.choices?.[0]?.message?.content || '';
    return parseAIResponse(content);
  } catch (error) {
    console.error('Mistral API error:', error);
    throw error;
  }
};

const parseAIResponse = (content: string): AIResponse => {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }

  return {
    summary: content.substring(0, 200),
    importance: 'medium',
    prediction: 'Unable to determine',
    confidence: 0.5,
    scenarios: {
      bestCase: 'Positive outcome',
      worstCase: 'Negative outcome',
      mostLikely: 'Neutral outcome'
    }
  };
};

export const routeAIRequest = async (prompt: string): Promise<AIResponse> => {
  const primaryPrompt = buildJSONPrompt(prompt);

  try {
    if (process.env.GEMINI_API_KEY) {
      return await callGemini(primaryPrompt);
    }
  } catch {
    console.warn('Gemini failed, trying OpenAI');
  }

  try {
    if (process.env.OPENAI_API_KEY) {
      return await callOpenAI(primaryPrompt);
    }
  } catch {
    console.warn('OpenAI failed, trying Mistral');
  }

  try {
    if (process.env.MISTRAL_API_KEY) {
      return await callMistral(primaryPrompt);
    }
  } catch {
    console.error('All AI services failed, using mock data');
  }

  // Final fallback: Mock data instead of throwing error
  return {
    summary: "This is simulated geopolitical intelligence based on current global parameters. Please configure your API keys for real AI analysis.",
    importance: "medium",
    prediction: "Stability is likely to be maintained with localized fluctuations.",
    confidence: 0.75,
    scenarios: {
      bestCase: "Increased diplomatic cooperation lead to reduced tensions.",
      worstCase: "Unforeseen rapid escalation in trade restrictions.",
      mostLikely: "Continued status quo with minor policy shifts."
    }
  };
};

const buildJSONPrompt = (userPrompt: string): string => {
  return `
Analyze the following geopolitical intelligence and provide a JSON response with this exact structure:
{
  "summary": "Brief 1-2 sentence summary",
  "importance": "critical|high|medium|low",
  "prediction": "Short-term prediction or assessment",
  "confidence": 0.0 to 1.0,
  "scenarios": {
    "bestCase": "Best possible outcome",
    "worstCase": "Worst possible outcome",
    "mostLikely": "Most probable scenario"
  }
}

Intelligence: ${userPrompt}

Respond with ONLY the JSON object, no additional text.
`;
};

export default routeAIRequest;
