const fs = require('fs').promises;
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'tutorials.json');

module.exports = async (req, res) => {
  try {
    const raw = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(raw);
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost');
      const topicId = url.searchParams.get('topicId');
      if (topicId) {
        const detail = data.details[topicId];
        if (!detail) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Topic not found' }));
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(detail));
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return;
    }
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to read tutorial data', details: error.message }));
  }
};