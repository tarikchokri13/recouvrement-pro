const Anthropic = require('@anthropic-ai/sdk').default;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image, mediaType, prompt } = req.body;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_KEY });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image } },
          { type: 'text', text: prompt }
        ]
      }]
    });

    const text = response.content.map(function(i) { return i.text || ''; }).join('');
    res.status(200).json({ success: true, text: text });
  } catch (err) {
    console.error('OCR Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
