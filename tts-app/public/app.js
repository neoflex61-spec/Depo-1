const textEl = document.getElementById('text');
const charcountEl = document.getElementById('charcount');
const voiceEl = document.getElementById('voice');
const modelEl = document.getElementById('model');
const speedEl = document.getElementById('speed');
const speedValEl = document.getElementById('speedVal');
const stabilityEl = document.getElementById('stability');
const stabilityValEl = document.getElementById('stabilityVal');
const similarityEl = document.getElementById('similarity');
const similarityValEl = document.getElementById('similarityVal');
const generateBtn = document.getElementById('generate');
const statusEl = document.getElementById('status');
const playerEl = document.getElementById('player');
const audioEl = document.getElementById('audio');
const downloadEl = document.getElementById('download');

let currentObjectUrl = null;

function setStatus(message, kind) {
  statusEl.textContent = message || '';
  statusEl.className = 'status' + (kind ? ' ' + kind : '');
}

textEl.addEventListener('input', () => {
  charcountEl.textContent = String(textEl.value.length);
});

speedEl.addEventListener('input', () => {
  speedValEl.textContent = Number(speedEl.value).toFixed(2);
});

stabilityEl.addEventListener('input', () => {
  stabilityValEl.textContent = Number(stabilityEl.value).toFixed(2);
});

similarityEl.addEventListener('input', () => {
  similarityValEl.textContent = Number(similarityEl.value).toFixed(2);
});

async function loadVoices() {
  try {
    const res = await fetch('/api/voices');
    const data = await res.json();
    voiceEl.innerHTML = '';
    (data.voices || []).forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.voice_id;
      opt.textContent = v.description ? `${v.name} — ${v.description}` : v.name;
      voiceEl.appendChild(opt);
    });
    if (data.source === 'fallback' && data.reason === 'no_api_key') {
      setStatus('Sunucuda API anahtarı ayarlanmamış; önce ELEVENLABS_API_KEY ortam değişkenini tanımlayın.', 'error');
    }
  } catch (err) {
    setStatus('Ses listesi yüklenemedi. Sayfayı yenileyin.', 'error');
  }
}

generateBtn.addEventListener('click', async () => {
  const text = textEl.value.trim();
  if (!text) {
    setStatus('Lütfen seslendirilecek bir metin yazın.', 'error');
    return;
  }

  generateBtn.disabled = true;
  setStatus('Ses üretiliyor, lütfen bekleyin...', '');
  playerEl.classList.add('hidden');

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceId: voiceEl.value,
        model: modelEl.value,
        speed: Number(speedEl.value),
        stability: Number(stabilityEl.value),
        similarityBoost: Number(similarityEl.value),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus(data.error || `Hata: ${res.status}`, 'error');
      return;
    }

    const blob = await res.blob();
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = URL.createObjectURL(blob);

    audioEl.src = currentObjectUrl;
    downloadEl.href = currentObjectUrl;
    playerEl.classList.remove('hidden');
    setStatus('Ses üretildi.', 'ok');
  } catch (err) {
    setStatus('Ses üretilirken bir hata oluştu. Bağlantınızı kontrol edin.', 'error');
  } finally {
    generateBtn.disabled = false;
  }
});

loadVoices();
