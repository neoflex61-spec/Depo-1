require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io';

// Derin / tok erkek ses karakterine uygun, ElevenLabs'in genel kitaplığında
// yaygin olarak bulunan hazir (premade) sesler. Hesapta bu ID'ler yoksa ya da
// kaldirilmissa, /api/voices canli listeyi ElevenLabs'tan ceker; bu liste
// sadece istek atilamadiginda yedek olarak kullanilir.
const FALLBACK_MALE_VOICES = [
  { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (derin, anlatim)' },
  { voice_id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (tok, otoriter)' },
  { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh (derin, genc)' },
  { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (sicak, sinematik)' },
];

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, apiKeyConfigured: Boolean(ELEVENLABS_API_KEY) });
});

// Hesaptaki kullanilabilir sesleri listeler; erkek olarak etiketlenmis
// sesleri one cikarir. API anahtari yoksa veya istek basarisiz olursa
// yedek listeye duser.
app.get('/api/voices', async (req, res) => {
  if (!ELEVENLABS_API_KEY) {
    return res.json({ voices: FALLBACK_MALE_VOICES, source: 'fallback', reason: 'no_api_key' });
  }

  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/voices`, {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('ElevenLabs /v1/voices hata:', response.status, detail);
      return res.json({ voices: FALLBACK_MALE_VOICES, source: 'fallback', reason: 'upstream_error' });
    }

    const data = await response.json();
    const all = Array.isArray(data.voices) ? data.voices : [];

    const male = all.filter((v) => (v.labels?.gender || '').toLowerCase() === 'male');
    const list = (male.length ? male : all).map((v) => ({
      voice_id: v.voice_id,
      name: v.name,
      description: v.labels?.description || v.labels?.accent || '',
    }));

    res.json({ voices: list.length ? list : FALLBACK_MALE_VOICES, source: list.length ? 'account' : 'fallback' });
  } catch (err) {
    console.error('Ses listesi alinirken hata:', err);
    res.json({ voices: FALLBACK_MALE_VOICES, source: 'fallback', reason: 'exception' });
  }
});

app.post('/api/tts', async (req, res) => {
  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({
      error: 'Sunucuda ELEVENLABS_API_KEY ayarlanmamis. Lutfen ortam degiskenini (environment variable) ayarlayin.',
    });
  }

  const { text, voiceId, speed, stability, similarityBoost, model } = req.body || {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Metin bos olamaz.' });
  }
  if (text.length > 5000) {
    return res.status(400).json({ error: 'Metin cok uzun (maksimum 5000 karakter). Lutfen daha kisa bir metin deneyin.' });
  }
  if (!voiceId || typeof voiceId !== 'string') {
    return res.status(400).json({ error: 'Bir ses secmelisiniz.' });
  }

  const clamp = (val, min, max, fallback) => {
    const n = Number(val);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  };

  const voiceSettings = {
    stability: clamp(stability, 0, 1, 0.5),
    similarity_boost: clamp(similarityBoost, 0, 1, 0.75),
    speed: clamp(speed, 0.7, 1.2, 1.0),
    use_speaker_boost: true,
  };

  const modelId = model === 'turbo' ? 'eleven_turbo_v2_5' : 'eleven_multilingual_v2';

  try {
    const upstream = await fetch(
      `${ELEVENLABS_BASE_URL}/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: voiceSettings,
        }),
      }
    );

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error('ElevenLabs TTS hata:', upstream.status, detail);
      let message = `ElevenLabs API hatasi (${upstream.status}).`;
      try {
        const parsed = JSON.parse(detail);
        if (parsed?.detail?.message) message = parsed.detail.message;
        else if (parsed?.detail?.status === 'quota_exceeded') message = 'Kredi/kota limiti asildi. ElevenLabs hesabinizdaki kalan karakter kredisini kontrol edin.';
      } catch (_) {
        // detail JSON degilse orijinal mesaj kullanilir
      }
      return res.status(upstream.status).json({ error: message });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="ses.mp3"');

    const arrayBuffer = await upstream.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('TTS istegi sirasinda hata:', err);
    res.status(500).json({ error: 'Ses uretilirken sunucu tarafinda bir hata olustu.' });
  }
});

app.listen(PORT, () => {
  console.log(`TTS uygulamasi http://localhost:${PORT} adresinde calisiyor`);
  if (!ELEVENLABS_API_KEY) {
    console.warn('UYARI: ELEVENLABS_API_KEY tanimli degil. .env dosyasini kontrol edin.');
  }
});
