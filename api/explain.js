const fs = require('fs').promises;
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'tutorials.json');
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const body = req.body || {};
    const topicId = body.topicId;
    const language = body.language || 'Programming';
    let code = body.code;
    let promptText;

    const raw = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(raw);

    if (topicId) {
      const detail = data.details[topicId];
      if (detail && detail.example) {
        code = detail.example;
      }
    }

    if (!code) {
      const topicSource = topicId ? Object.values(data.languages).flatMap(lang => lang.topics).find(topic => topic.id === topicId) : null;
      const topicName = topicSource ? topicSource.title : topicId || 'this topic';
      promptText = `You are a beginner-friendly programming tutor. Explain the following topic clearly and simply for a learner: ${topicName} in ${language}. Include why it matters and one important thing to watch out for.`;
    } else {
      promptText = `You are a beginner-friendly programming tutor. Explain the following code snippet clearly for a learner. Describe what it does, what each major part means, and one common mistake to avoid.\n\nCode:\n${code}`;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Gemini API key is not configured.' }));
      return;
    }

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: { text: promptText },
        temperature: 0.2,
        maxOutputTokens: 500
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      res.statusCode = response.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Gemini request failed', details: errorBody }));
      return;
    }

    const result = await response.json();
    const explanation = result?.candidates?.[0]?.output || result?.output || result?.text || '';

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ explanation: explanation.trim(), topicId }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to generate explanation', details: error.message }));
  }
};