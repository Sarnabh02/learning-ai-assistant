import { NextResponse } from 'next/server';

const PYTHON_API = process.env.PYTHON_API_URL ?? 'http://localhost:8000';

// Mock models for testing
const MOCK_MODELS = {
  models: [
    {
      id: 'claude-3-5-sonnet-20241022',
      provider: 'Anthropic',
      display_name: 'Claude 3.5 Sonnet',
      max_tokens: 8000,
    },
    {
      id: 'gpt-4o',
      provider: 'OpenAI',
      display_name: 'GPT-4 Omni',
      max_tokens: 8000,
    },
    {
      id: 'llama-2-70b',
      provider: 'Meta',
      display_name: 'Llama 2 70B',
      max_tokens: 4096,
    },
  ],
};

export async function GET() {
  // Use mock data if enabled
  if (process.env.USE_MOCK_DATA === 'true') {
    return NextResponse.json(MOCK_MODELS);
  }

  // Otherwise, proxy to Python backend
  try {
    const response = await fetch(`${PYTHON_API}/models`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Failed to fetch models from backend:', err);
    // Fallback to mock models if backend is unavailable
    return NextResponse.json(MOCK_MODELS);
  }
}
