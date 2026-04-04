module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only' });

  try {
    var image = req.body.image;
    var mediaType = req.body.mediaType;
    var prompt = req.body.prompt;

    if (!image || !prompt) {
      return res.status(400).json({ success: false, error: 'Image et prompt requis' });
    }

    var apiKey = process.env.ANTHROPIC_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'Cle API non configuree' });
    }

    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    var data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ success: false, error: (data.error && data.error.message) || 'Erreur API' });
    }

    var text = '';
    for (var i = 0; i < data.content.length; i++) {
      text += data.content[i].text || '';
    }
    return res.status(200).json({ success: true, text: text });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Erreur' });
  }
};