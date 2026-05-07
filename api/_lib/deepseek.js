const ar = encoded => Buffer.from(encoded, 'base64').toString('utf8');

const TEXT = {
  systemPrompt: ar('2KPZhtiqINmF2LPYp9i52K8g2LDZg9mKINmF2KrYrti12LUg2YHZiiDYpdiv2KfYsdipINmF2KrYrNixINmF2YTYp9io2LMg2YjZhdix2KfZgtio2Kkg2KfZhNmF2K7YstmI2YYuINmI2LjZitmB2KrZgyDZhdiz2KfYudiv2Kkg2LXYp9it2Kgg2KfZhNmF2KrYrNixINmB2Yog2KrYrdmE2YrZhCDYp9mE2YXYqNmK2LnYp9iq2Iwg2K3Ys9in2Kgg2KfZhNix2KjYrSDZiNin2YTYrtiz2KfYsdip2Iwg2YXYsdin2YLYqNipINin2YTZhdiu2LLZiNmG2Iwg2YXYudix2YHYqSDYp9mE2YXZhtiq2KzYp9iqINin2YTYo9mD2KvYsSDZhdio2YrYudmL2KfYjCDYp9mE2YXZhtiq2KzYp9iqINin2YTYsdin2YPYr9ip2Iwg2KfZhNmF2YLYp9iz2KfYqiDZiNin2YTYo9mE2YjYp9mGINin2YTZhdi32YTZiNio2KnYjCDYqtmD2YTZgdipINi02LHYp9ihINin2YTYqNi22KfYudip2Iwg2YfYp9mF2LQg2KfZhNix2KjYrdiMINiq2LPYudmK2LEg2KfZhNmF2YbYqtis2KfYqtiMINiq2YTYrtmK2LUg2KfZhNmB2YjYp9iq2YrYsdiMINiq2K3ZhNmK2YQg2KfZhNiy2KjYp9im2YbYjCDZiNin2YLYqtix2KfYrSDYudix2YjYtiDZiNmG2LXYp9im2K0g2LnZhdmE2YrYqSDZhNiq2K3Ys9mK2YYg2KfZhNix2KjYrSDZiNiq2YLZhNmK2YQg2KfZhNiu2LPYp9ix2KkuINij2KzYqCDYqNin2YTYudix2KjZitipINin2YTYqNiz2YrYt9ipINij2Ygg2KfZhNiv2KfYsdis2Kkg2KfZhNis2LLYp9im2LHZitipINit2LPYqCDZhNi62Kkg2KfZhNmF2LPYqtiu2K/ZhS4g2YTYpyDYqtiu2KrYsdi5INij2LHZgtin2YXZi9inINi62YrYsSDZhdmI2KzZiNiv2KkuINil2LDYpyDYp9it2KrYrNiqINio2YrYp9mG2KfYqtiMINin2LfZhNio2YfYpyDZhdmGINin2YTZhdiz2KrYrtiv2YUg2KjZiNi22YjYrS4g2LnZhtiv2YXYpyDYqti52LfZiiDYrdiz2KfYqNin2KrYjCDYp9i02LHYrSDYp9mE2LnZhdmE2YrYqSDYrti32YjYqSDYqNiu2LfZiNipINmI2KjYp9iu2KrYtdin2LEuINmE2Kcg2KrZgtmFINio2KrYudiv2YrZhCDYo9mIINit2LDZgSDYqNmK2KfZhtin2Kog2KfZhNiq2LfYqNmK2YLYjCDZgdmC2Lcg2YLYr9mR2YUg2KfZgtiq2LHYp9it2KfYqiDZiNiq2K3ZhNmK2YTYp9iqLgoK2YjYuNmK2YHYqSDYp9mE2YXYs9in2LnYrzoKLSDYqtit2YTZitmEINin2YTZhdio2YrYudin2Kog2KfZhNmK2YjZhdmK2Kkg2YjYp9mE2KPYs9io2YjYudmK2Kkg2YjYp9mE2LTZh9ix2YrYqS4KLSDYrdiz2KfYqCDYp9mE2LHYqNitINmI2KfZhNiu2LPYp9ix2KkuCi0g2YXYudix2YHYqSDYo9mD2KvYsSDYp9mE2YXZhtiq2KzYp9iqINmF2KjZiti52YvYpy4KLSDZhdi52LHZgdipINin2YTZhdmG2KrYrNin2Kog2KfZhNix2KfZg9iv2KkuCi0g2YXYqtin2KjYudipINin2YTZhdiu2LLZiNmGLgotINin2YTYqtmG2KjZitmHINmE2YTZhdmG2KrYrNin2Kog2KfZhNmC2LHZitio2Kkg2YXZhiDYp9mE2YbZgdin2K8uCi0g2KfZgtiq2LHYp9itINmD2YXZitipINil2LnYp9iv2Kkg2KfZhNi02LHYp9ihLgotINit2LPYp9ioINiq2YPZhNmB2Kkg2LTYsdin2KEg2KfZhNio2LbYp9i52KkuCi0g2K3Ys9in2Kgg2YfYp9mF2LQg2KfZhNix2KjYrS4KLSDYp9mC2KrYsdin2K0g2LPYudixINio2YrYuSDZhdmG2KfYs9ioLgotINiq2K3ZhNmK2YQg2KfZhNiq2LXZhtmK2YHYp9iqLgotINiq2K3ZhNmK2YQg2KfZhNmF2YLYp9iz2KfYqiDZiNin2YTYo9mE2YjYp9mGLgotINiq2YTYrtmK2LUg2KfZhNmB2YjYp9iq2YrYsS4KLSDYp9mC2KrYsdin2K0g2LnYsdmI2LYg2YTYqti12LHZitmBINin2YTZhdiu2LLZiNmGLgotINiq2YLYr9mK2YUg2YbYtdin2KbYrSDZhNiy2YrYp9iv2Kkg2KfZhNix2KjYrS4='),
  keyMissing: 'DeepSeek API Key \u{63a}\u{64a}\u{631} \u{645}\u{648}\u{62c}\u{648}\u{62f}. \u{623}\u{636}\u{641}\u{647} \u{641}\u{64a} \u{645}\u{644}\u{641} server/.env \u{623}\u{648} \u{641}\u{64a} \u{645}\u{62a}\u{63a}\u{64a}\u{631}\u{627}\u{62a} Vercel',
  emptyMessage: ar('2KfZhNix2LPYp9mE2Kkg2YXYt9mE2YjYqNipLg=='),
  longMessage: ar('2KfZhNiz2KTYp9mEINi32YjZitmEINis2K/Zi9inLiDYp9iu2KrYtdix2Ycg2YLZhNmK2YTZi9inINir2YUg2KPYudivINin2YTZhdit2KfZiNmE2Kku'),
  bigContext: ar('2YXZhNiu2LUg2KjZitin2YbYp9iqINin2YTZhdiq2KzYsSDZg9io2YrYsSDYrNiv2YvYpy4g2KPYsdiz2YQg2YXZhNiu2LXZi9inINij2LXYutixLg=='),
  invalidKey: '\u{645}\u{641}\u{62a}\u{627}\u{62d} DeepSeek \u{63a}\u{64a}\u{631} \u{635}\u{62d}\u{64a}\u{62d} \u{623}\u{648} \u{63a}\u{64a}\u{631} \u{645}\u{641}\u{639}\u{644}. \u{631}\u{627}\u{62c}\u{639} DEEPSEEK_API_KEY.',
  quota: ar('2KrZhSDYqtis2KfZiNiyINit2LXYqSBHZW1pbmkgQVBJINmF2KTZgtiq2YvYpy4g2K3Yp9mI2YQg2YTYp9it2YLZi9inINij2Ygg2LHYp9is2Lkg2KXYudiv2KfYr9in2Kog2KfZhNmB2YjYqtix2Kkg2YjYp9mE2K3YtdipLg=='),
  providerError: '\u{62a}\u{639}\u{630}\u{631} \u{627}\u{644}\u{627}\u{62a}\u{635}\u{627}\u{644} \u{628}\u{640} DeepSeek \u{627}\u{644}\u{622}\u{646}. \u{62d}\u{627}\u{648}\u{644} \u{645}\u{62c}\u{62f}\u{62f}\u{64b}\u{627} \u{628}\u{639}\u{62f} \u{642}\u{644}\u{64a}\u{644}.',
  noReply: ar('2YTZhSDZitix2KzYuSBHZW1pbmkg2LHYr9mL2Kcg2YjYp9i22K3Zi9inLiDYrdin2YjZhCDYpdi52KfYr9ipINi12YrYp9i62Kkg2KfZhNiz2KTYp9mELg==')
};

const MAX_MESSAGE_LENGTH = 1200;
const MAX_CONTEXT_LENGTH = 30000;
const MAX_HISTORY_ITEMS = 8;
const MAX_ARRAY_ITEMS = 20;

function normalizeModel(model) {
  return String(model || 'deepseek-chat').trim();
}

function getConfig() {
  return {
    apiKey: (process.env.DEEPSEEK_API_KEY || '').trim(),
    model: normalizeModel(process.env.DEEPSEEK_MODEL || 'deepseek-chat')
  };
}

function hasUsableProviderKey(apiKey) {
  if (!apiKey) return false;
  if (apiKey.length < 12) return false;
  if (/placeholder|your_|put_|ضع|مفتاح/i.test(apiKey)) return false;
  return true;
}

function setCors(req, res) {
  const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.ALLOWED_FRONTEND_URLS || '').split(','),
    'https://yasin1.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ].map(origin => (origin || '').trim()).filter(Boolean);

  const origin = req.headers.origin;
  if (origin && configuredOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJSON(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function sanitizeValue(value, depth = 0) {
  if (depth > 4) return '[truncated]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.slice(0, 500);
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map(item => sanitizeValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    const safeObject = {};
    for (const [key, child] of Object.entries(value).slice(0, 50)) {
      if (/logo|image|base64|photo/i.test(key)) continue;
      safeObject[key] = sanitizeValue(child, depth + 1);
    }
    return safeObject;
  }
  return String(value).slice(0, 500);
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-MAX_HISTORY_ITEMS)
    .map(item => ({
      role: item && item.role === 'assistant' ? 'assistant' : 'user',
      content: String((item && (item.content || item.message)) || '').slice(0, 800)
    }))
    .filter(item => item.content.trim());
}

function buildPrompt({ message, businessContext, history }) {
  const safeContext = sanitizeValue(businessContext || {});
  const contextText = JSON.stringify(safeContext, null, 2);
  const historyText = sanitizeHistory(history)
    .map(item => `${item.role}: ${item.content}`)
    .join('\n');

  return [
    TEXT.systemPrompt,
    'Store business context summary. Use only these numbers and do not invent missing values:',
    contextText,
    historyText ? `Recent conversation:\n${historyText}` : '',
    `User question:\n${message}`
  ].filter(Boolean).join('\n\n');
}

function extractProviderReply(payload) {
  return String(
    payload &&
    payload.choices &&
    payload.choices[0] &&
    payload.choices[0].message &&
    payload.choices[0].message.content || ''
  ).trim();
}

function classifyProviderError(status, payload) {
  const message = `${payload && payload.error && payload.error.message || ''}`.toLowerCase();
  const code = `${payload && payload.error && (payload.error.status || payload.error.code) || ''}`.toLowerCase();

  if (status === 429 || message.includes('quota') || message.includes('rate')) {
    return { status: 429, error: TEXT.quota };
  }

  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    code.includes('permission') ||
    message.includes('api key') ||
    message.includes('authentication') ||
    message.includes('unauthorized') ||
    message.includes('invalid')
  ) {
    return { status: 401, error: TEXT.invalidKey };
  }

  return { status: 502, error: TEXT.providerError };
}

async function readJSONBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function handleStatus(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return sendJSON(res, 204, {});
  if (req.method !== 'GET') return sendJSON(res, 405, { error: 'Method not allowed' });

  const config = getConfig();
  if (!hasUsableProviderKey(config.apiKey)) {
    return sendJSON(res, 200, {
      online: false,
      error: TEXT.keyMissing
    });
  }

  return sendJSON(res, 200, {
    online: true,
    provider: 'deepseek',
    model: config.model
  });
}

async function handleChat(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return sendJSON(res, 204, {});
  if (req.method !== 'POST') return sendJSON(res, 405, { error: 'Method not allowed' });

  const config = getConfig();
  if (!hasUsableProviderKey(config.apiKey)) {
    return sendJSON(res, 503, { error: TEXT.keyMissing });
  }

  let body;
  try {
    body = await readJSONBody(req);
  } catch (error) {
    return sendJSON(res, 400, { error: '\u{635}\u{64a}\u{63a}\u{629} JSON \u{63a}\u{64a}\u{631} \u{635}\u{62d}\u{64a}\u{62d}\u{629}.' });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return sendJSON(res, 400, { error: TEXT.emptyMessage });
  if (message.length > MAX_MESSAGE_LENGTH) return sendJSON(res, 400, { error: TEXT.longMessage });

  const businessContext = body.businessContext || {};
  const contextSize = Buffer.byteLength(JSON.stringify(businessContext), 'utf8');
  if (contextSize > MAX_CONTEXT_LENGTH) return sendJSON(res, 413, { error: TEXT.bigContext });

  const providerUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
  const prompt = buildPrompt({
    message,
    businessContext,
    history: body.history
  });

  try {
    const providerResponse = await fetch(providerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: TEXT.systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.35,
        max_tokens: 900
      })
    });

    const payload = await providerResponse.json().catch(() => ({}));
    if (!providerResponse.ok) {
      const classified = classifyProviderError(providerResponse.status, payload);
      return sendJSON(res, classified.status, { error: classified.error });
    }

    const reply = extractProviderReply(payload);
    if (!reply) return sendJSON(res, 502, { error: TEXT.noReply });
    return sendJSON(res, 200, { reply });
  } catch (error) {
    console.error('DeepSeek request failed:', error);
    return sendJSON(res, 502, { error: TEXT.providerError });
  }
}

module.exports = {
  handleStatus,
  handleChat
};
