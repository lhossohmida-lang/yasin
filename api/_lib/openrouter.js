const TEXT = {
  systemPrompt: `أنت مساعد ذكي متخصص في إدارة متجر ملابس ومراقبة المخزون. وظيفتك مساعدة صاحب المتجر في تحليل المبيعات، حساب الربح والخسارة، مراقبة المخزون، معرفة المنتجات الأكثر مبيعًا، المنتجات الراكدة، المقاسات والألوان المطلوبة، تكلفة شراء البضاعة، هامش الربح، تسعير المنتجات، تلخيص الفواتير، تحليل الزبائن، واقتراح عروض ونصائح عملية لتحسين الربح وتقليل الخسارة.

أجب بالعربية البسيطة أو الدارجة الجزائرية حسب لغة المستخدم. لا تخترع أرقامًا غير موجودة. إذا احتجت بيانات، اطلبها من المستخدم بوضوح. عندما تعطي حسابات، اشرح العملية خطوة بخطوة وباختصار. لا تقم بتعديل أو حذف بيانات التطبيق، فقط قدّم اقتراحات وتحليلات.

وظيفة المساعد:
- تحليل المبيعات اليومية والأسبوعية والشهرية.
- حساب الربح والخسارة.
- معرفة أكثر المنتجات مبيعًا.
- معرفة المنتجات الراكدة.
- متابعة المخزون.
- التنبيه للمنتجات القريبة من النفاد.
- اقتراح كمية إعادة الشراء.
- حساب تكلفة شراء البضاعة.
- حساب هامش الربح.
- اقتراح سعر بيع مناسب.
- تحليل التصنيفات.
- تحليل المقاسات والألوان.
- تلخيص الفواتير.
- اقتراح عروض لتصريف المخزون.
- تقديم نصائح لزيادة الربح.`,
  keyMissing: 'OpenRouter API Key غير موجود. أضف OPENROUTER_API_KEY في ملف server/.env أو في متغيرات Vercel',
  emptyMessage: 'الرسالة مطلوبة.',
  longMessage: 'السؤال طويل جدًا. اختصره قليلًا ثم أعد المحاولة.',
  bigContext: 'ملخص بيانات المتجر كبير جدًا. أرسل ملخصًا أصغر.',
  invalidKey: 'مفتاح OpenRouter غير صحيح أو غير مفعل. راجع OPENROUTER_API_KEY.',
  quota: 'تم تجاوز حد OpenRouter أو Tencent Hy3 مؤقتًا. حاول لاحقًا أو راجع حدود الحساب.',
  balance: 'رصيد OpenRouter غير كاف أو الموديل غير متاح للحساب الحالي. راجع رصيد وحالة Tencent Hy3 في OpenRouter.',
  providerError: 'تعذر الاتصال بـ Tencent Hy3 عبر OpenRouter الآن. حاول مجددًا بعد قليل.',
  noReply: 'لم يرجع Tencent Hy3 ردًا واضحًا. حاول إعادة صياغة السؤال.'
};

const MAX_MESSAGE_LENGTH = 1200;
const MAX_CONTEXT_LENGTH = 30000;
const MAX_HISTORY_ITEMS = 8;
const MAX_ARRAY_ITEMS = 20;

function normalizeModel(model) {
  return String(model || 'tencent/hy3-preview:free').trim();
}

function getConfig() {
  return {
    apiKey: (process.env.OPENROUTER_API_KEY || '').trim(),
    model: normalizeModel(process.env.OPENROUTER_MODEL || 'tencent/hy3-preview:free'),
    providerUrl: process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
    siteUrl: process.env.OPENROUTER_SITE_URL || 'https://yasin1.vercel.app',
    appName: process.env.OPENROUTER_APP_NAME || 'Yasin Clothing Store'
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

  if (status === 402 || message.includes('insufficient balance') || message.includes('balance')) {
    return { status: 402, error: TEXT.balance };
  }

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
    provider: 'tencent-hy3-openrouter',
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
    return sendJSON(res, 400, { error: 'صيغة JSON غير صحيحة.' });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return sendJSON(res, 400, { error: TEXT.emptyMessage });
  if (message.length > MAX_MESSAGE_LENGTH) return sendJSON(res, 400, { error: TEXT.longMessage });

  const businessContext = body.businessContext || {};
  const contextSize = Buffer.byteLength(JSON.stringify(businessContext), 'utf8');
  if (contextSize > MAX_CONTEXT_LENGTH) return sendJSON(res, 413, { error: TEXT.bigContext });

  const prompt = buildPrompt({
    message,
    businessContext,
    history: body.history
  });

  try {
    const providerResponse = await fetch(config.providerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': config.siteUrl,
        'X-Title': config.appName
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: TEXT.systemPrompt },
          { role: 'user', content: prompt }
        ],
        reasoning: { exclude: true },
        temperature: 0.35,
        max_tokens: 1200
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
    console.error('OpenRouter Tencent Hy3 request failed:', error);
    return sendJSON(res, 502, { error: TEXT.providerError });
  }
}

module.exports = {
  handleStatus,
  handleChat
};
