const AI_API_BASE_URL = (() => {
  if (typeof window === 'undefined') return 'http://localhost:5000/api/ai';

  const isDevFrontend = ['3000', '5173'].includes(window.location.port);
  if (window.location.protocol.startsWith('http') && isDevFrontend) {
    return '/api/ai';
  }

  return 'http://localhost:5000/api/ai';
})();

async function parseJSON(response) {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
}

export async function checkAIStatus() {
  const response = await fetch(`${AI_API_BASE_URL}/status`);
  const data = await parseJSON(response);

  if (!response.ok) {
    throw new Error(data.error || 'AI status check failed');
  }

  return data;
}

export async function sendAIMessage(message, businessContext, history = []) {
  const response = await fetch(`${AI_API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, businessContext, history })
  });
  const data = await parseJSON(response);

  if (!response.ok) {
    throw new Error(data.error || 'AI chat request failed');
  }

  return data;
}
