# Sinematik Sesli Anlatım (Türkçe → MP3, ElevenLabs)

Türkçe metni, derin/tok/sinematik bir erkek sesiyle MP3'e dönüştüren, mobil
tarayıcıda çalışan basit bir web uygulaması. ElevenLabs API anahtarı
**yalnızca sunucu tarafında** (ortam değişkeni olarak) saklanır; hiçbir
zaman koda, frontend'e veya tarayıcıya gönderilmez.

## Nasıl çalışıyor?

- `server.js` — küçük bir Node/Express sunucusu. `/api/tts` isteğini alır,
  `ELEVENLABS_API_KEY` ortam değişkenini kullanarak ElevenLabs'a istek atar
  ve dönen MP3'ü tarayıcıya aktarır. Anahtar tarayıcıya hiç gitmez.
- `public/` — metin kutusu, ses seçimi, hız ayarı, "Ses Üret" butonu ve
  MP3 indirme bağlantısı olan mobil uyumlu arayüz.

## Adım 1 — Ücretsiz ElevenLabs API anahtarı al

1. Telefon tarayıcından **elevenlabs.io** adresine git, ücretsiz hesap aç
   (Google/e-posta ile kayıt olunabilir). Ücretsiz plan ayda belirli bir
   karakter kredisi verir, bu da test için yeterlidir.
2. Giriş yaptıktan sonra sağ üstteki profil simgesine dokun →
   **"API Keys"** (veya "Profile + API key") bölümüne gir.
3. Yeni bir API anahtarı oluştur ve kopyala. Bu anahtarı kimseyle
   paylaşma; bir yere (not uygulaması vb.) güvenli şekilde kaydet, ileride
   hosting panelinde ortam değişkeni olarak gireceksin.

İsteğe bağlı: aynı sayfada **Voices** (Sesler) kısmından istediğin bir
erkek sesi dinleyip "Voice ID"sini not edebilirsin; uygulama varsayılan
olarak birkaç yaygın derin erkek sesini zaten sunuyor ve hesabındaki
sesleri otomatik olarak da listeler.

## Adım 2 — Uygulamayı ücretsiz olarak yayına al (telefondan, bilgisayarsız)

Telefonundan tüm kurulumu yapabilmen için **Render.com**'un ücretsiz web
servisini öneriyorum (kod zaten GitHub'da: `neoflex61-spec/depo-1` reposunun
`tts-app/` klasöründe).

1. Telefon tarayıcından **render.com** adresine git, "GitHub ile kayıt ol"
   seçeneğiyle hesap aç ve GitHub hesabını bağla.
2. Dashboard'da **"New +" → "Web Service"** seç.
3. Repoyu seç: `neoflex61-spec/depo-1` (gerekirse Render'a bu repoya erişim
   izni ver).
4. Ayarları şöyle gir:
   - **Root Directory:** `tts-app`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. **"Environment"** sekmesinden bir ortam değişkeni ekle:
   - Key: `ELEVENLABS_API_KEY`
   - Value: (Adım 1'de kopyaladığın anahtar)
   Bu değer sadece Render'ın güvenli ortam değişkeni deposunda durur, koda
   yazılmaz ve repoya hiç commit edilmez.
6. **"Create Web Service"**'e bas. İlk dağıtım birkaç dakika sürer.
7. Dağıtım bitince Render sana `https://<uygulama-adın>.onrender.com`
   gibi bir URL verir. Bu URL'yi telefonunun tarayıcısında aç.

(Alternatif: Railway.app veya Fly.io da aynı mantıkla çalışır — hepsi
Node.js Express uygulamalarını GitHub'dan direkt dağıtabilir ve ortam
değişkenlerini panelden güvenli şekilde saklar.)

## Adım 3 — Test et

1. Açılan sayfada metin kutusuna kısa bir Türkçe cümle yaz (ör. "Bu bir
   test."). Kredini korumak için ilk testlerde kısa metinler kullan.
2. "Model" olarak önce **"Hızlı / Düşük kredi (eleven_turbo_v2_5)"**'i
   seç — bu model karakter başına genelde daha az kredi harcar, ücretsiz
   krediyle test etmek için uygundur.
3. Bir ses seç, hız kaydırıcısını istersen ayarla (1.0 = normal).
4. **"Ses Üret"**'e bas. Üretim bitince sayfa içinde oynatıcı çıkar ve
   altında **"MP3 indir"** bağlantısı belirir.
5. Sorun olursa (örn. "Kredi/kota limiti asildi") ekrandaki hata mesajı
   sana ne yapman gerektiğini söyler.

## Yerelde çalıştırma (bir bilgisayarın varsa)

```bash
cd tts-app
cp .env.example .env
# .env dosyasını açıp ELEVENLABS_API_KEY değerini kendi anahtarınla doldur
npm install
npm start
# http://localhost:3000 adresini tarayıcıda aç
```

## Güvenlik notları

- `.env` dosyası `.gitignore` içinde — asla git'e commit edilmez.
- API anahtarı sadece `server.js` içinde, sunucu tarafında okunur
  (`process.env.ELEVENLABS_API_KEY`); hiçbir HTML/JS dosyasında anahtar
  yoktur.
- Anahtarı Render/Railway gibi bir panelin "Environment Variables"
  (ortam değişkenleri) kısmına gir — asla kod dosyalarına yapıştırma.
- Anahtarını kazara paylaştıysan ElevenLabs panelinden hemen iptal edip
  yeni bir anahtar oluştur.
