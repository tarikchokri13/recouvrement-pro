// server.js — Proxy OCR pour Recouvrement Pro
// Lance avec: node server.js

const express = require('express');
const cors = require('cors');
const Anthropic = require('anthropic').default;

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// ═══ METTEZ VOTRE CLÉ API ICI ═══
const API_KEY = process.env.ANTHROPIC_KEY || 'sk-ant-COLLEZ_VOTRE_CLE_ICI';
// ══════════════════════════════════

const client = new Anthropic({ apiKey: API_KEY });

app.post('/api/scan', async (req, res) => {
  try {
    const { image, mediaType, prompt } = req.body;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image }
          },
          { type: 'text', text: prompt }
        ]
      }]
    });

    const text = response.content.map(i => i.text || '').join('');
    res.json({ success: true, text });
  } catch (err) {
    console.error('Erreur OCR:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ Serveur OCR démarré sur http://localhost:${PORT}`);
  console.log(`  L'application React tourne sur http://localhost:3000`);
  console.log(`  Les scans passeront par http://localhost:${PORT}/api/scan`);
});
