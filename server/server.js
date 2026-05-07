require('dotenv').config();

const express = require('express');
const { handleChat, handleStatus } = require('../api/_lib/openrouter');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '80kb' }));

app.get('/api/ai/status', handleStatus);
app.post('/api/ai/chat', handleChat);

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({
      error: '\u{645}\u{644}\u{62e}\u{635} \u{628}\u{64a}\u{627}\u{646}\u{627}\u{62a} \u{627}\u{644}\u{645}\u{62a}\u{62c}\u{631} \u{643}\u{628}\u{64a}\u{631} \u{62c}\u{62f}\u{64b}\u{627}. \u{623}\u{631}\u{633}\u{644} \u{645}\u{644}\u{62e}\u{635}\u{64b}\u{627} \u{623}\u{635}\u{63a}\u{631}.'
    });
  }

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: '\u{635}\u{64a}\u{63a}\u{629} JSON \u{63a}\u{64a}\u{631} \u{635}\u{62d}\u{64a}\u{62d}\u{629}.'
    });
  }

  return next(err);
});

app.listen(PORT, () => {
  console.log(`Tencent Hy3/OpenRouter AI backend running on http://localhost:${PORT}`);
});
