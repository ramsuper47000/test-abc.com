const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchFromAPI(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

export async function postToAPI(endpoint: string, data: unknown, options: RequestInit = {}) {
  return fetchFromAPI(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}
