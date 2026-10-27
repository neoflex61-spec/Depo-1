# ŞEHİTLERİMİZ

Türkiye'deki şehitlerin **doğrulanmış** kayıtlarını listeleyen, sade ve
saygı amaçlı bağımsız bir web sitesi. Tamamen statik HTML/CSS/JS ile
yazılmıştır (framework yok, build adımı yok) — açılışı hızlıdır ve
herhangi bir statik dosya sunucusunda (GitHub Pages dahil) çalışır.

> Bu site T.C. Millî Savunma Bakanlığı'nın resmî bir servisi değildir.
> Resmî ve birincil kaynak için **MSB Şehit Bilgi Kapısı**'nı (e-Devlet
> üzerinden erişilebilir) esas alınız.

## Özellikler

- 📱 Mobil uyumlu, tek sayfa, hızlı (harici kütüphane/CDN bağımlılığı yok).
- 🎨 Sade, ciddi tasarım: siyah, beyaz, koyu kırmızı.
- 🔢 Ana sayfada toplam **doğrulanmış** kayıt sayısı.
- 🗺️ Türkiye'nin 81 ili ve il bazında kayıt sayıları.
- 🔎 İsim arama (Türkçe karakter/nokta duyarsız) + il filtresi.
- 📋 Her kayıtta yalnızca **Ad Soyad, Şehadet Tarihi, Memleket** gösterilir.
- ⚠️ Veri bağlanmadan önce sayılar **asla** sıfır/uydurma gösterilmez;
  açık bir "Veri Bekleniyor" durumu gösterilir.
- 🗓️ Veri kaynağı ve son güncelleme tarihi sayfanın altında açıkça belirtilir.
- 🏷️ Tarihsel dönem kayıtları ile güncel dönem kayıtlarının karışmaması
  için her kayıt grubunda isteğe bağlı bir "dönem" etiketi taşınabilir.

## Dosya yapısı

```
sehitlerimiz/
├── index.html                  Ana sayfa
├── css/style.css                Tasarım
├── js/app.js                    Uygulama mantığı (veri çekme, arama, filtre, render)
├── js/config.js                 Apps Script API adresi buraya girilir (opsiyonel)
├── data/iller.json              Türkiye'nin 81 ili (sabit referans veri)
├── data/sehitler.json           Site tarafından okunan veri dosyası
│                                 (başlangıçta "veri_bekleniyor" durumunda, boş)
├── data/sehitler.ornek_sablon.csv  CSV içe aktarma şablonu (sadece başlık satırı)
├── tools/csv_to_json.py         CSV → data/sehitler.json dönüştürme/doğrulama aracı
└── apps-script/                 Google Sheets canlı entegrasyonu
    ├── Code.gs                   Salt-okunur doGet uç noktası
    ├── appsscript.json           Dar OAuth kapsamı (spreadsheets.currentonly)
    └── README.md                 Kurulum + yetkilendirme daraltma rehberi
```

## Veri modeli

`data/sehitler.json`:

```json
{
  "meta": {
    "durum": "veri_bekleniyor",   // veya "yayinda"
    "kaynak": null,                 // örn. "MSB Şehit Bilgi Kapısı'ndan elle doğrulanmış içe aktarım"
    "kapsam": null,                 // örn. "Güncel Dönem" — tarihsel/güncel karışmasını önlemek için
    "sonGuncelleme": null,          // ISO tarih
    "toplamKayit": 0
  },
  "kayitlar": [
    { "adSoyad": "...", "sehadetTarihi": "GG.AA.YYYY", "memleket": "İl Adı", "donem": "..." }
  ]
}
```

`durum: "veri_bekleniyor"` veya `kayitlar` boşken, site toplam sayıyı,
il sayaçlarını ve listeyi **göstermez**; bunun yerine açık bir uyarı
banner'ı gösterir. Bu davranış `js/app.js` içindeki `veriGeldiMi()`
fonksiyonuyla garanti altına alınır.

## Veriyi bağlama — iki yöntem

> **Otomatik MSB aktarımı yoktur.** MSB Şehit Bilgi Kapısı şu an kamuya
> açık bir veri/API servisi sunmamaktadır. Aşağıdaki iki yöntemin ikisi
> de **elle doğrulama** esasına dayanır — hiçbir script, MSB'nin
> sitesinden otomatik olarak veri kazımaz veya çekmez. Siz (veya
> güvendiğiniz biri) her kaydı MSB Şehit Bilgi Kapısı'ndan (ya da başka
> güvenilir bir kaynaktan) kontrol edip Sheets'e/CSV'ye girersiniz;
> entegrasyonun işi yalnızca bu elle girilen veriyi siteye taşımaktır.

### 1) Google Sheets + Apps Script (canlı, önerilen)

`apps-script/README.md` dosyasındaki adım adım rehberi izleyin. Özet:
Google Sheets'e doğrulanmış kayıtları girersiniz (sütunlar: **Ad Soyad,
Şehadet Tarihi, Memleket** — zorunlu; Dönem, Doğrulama Durumu —
isteğe bağlı), Apps Script bunu salt-okunur bir JSON uç noktası olarak
yayınlar, `js/config.js` içindeki `apiUrl` alanına bu adresi
yapıştırırsınız. **Hiçbir hesap şifresi veya gizli anahtar koda
girmez** ve uç nokta yazmaya tamamen kapalıdır.

### 2) CSV/Excel içe aktarma (bağlantısız, basit)

Google Sheets kurmak istemeyenler için:

1. Excel/Google Sheets dosyanızı **CSV (UTF-8)** olarak dışa aktarın;
   başlıklar: **Ad Soyad, Şehadet Tarihi, Memleket** (zorunlu) ve
   isteğe bağlı olarak **Dönem, Doğrulama Durumu**
   (bkz. `data/sehitler.ornek_sablon.csv`). Başlıklarda büyük/küçük
   harf, Türkçe karakter veya boşluk/alt çizgi farkı sorun değildir —
   araç bunları otomatik tanır.
2. **Memleket** sütununa yalnızca `data/iller.json` içindeki 81 il
   adından birini, birebir aynı yazımla girin.
3. **Şehadet Tarihi** için `GG.AA.YYYY`, `GG/AA/YYYY` veya `YYYY-AA-GG`
   biçimlerinden birini kullanın.
4. **Doğrulama Durumu** sütununu eklerseniz, yalnızca kaynağını
   doğruladığınız satırlar için `Doğrulandı` veya `Evet` yazın; bu
   sütunu hiç eklemezseniz CSV'deki tüm dolu satırlar zaten elle
   doğruladığınız varsayılarak içe aktarılır.
5. Dönüştürün:

   ```bash
   cd sehitlerimiz/tools
   python3 csv_to_json.py girdi.csv \
     --kaynak "MSB Şehit Bilgi Kapısı'ndan elle doğrulanmış içe aktarım" \
     --kapsam "Güncel Dönem"
   ```

   Araç, geçersiz il adlarını, tanınmayan tarih biçimlerini, boş
   zorunlu alanları (Ad Soyad/Şehadet Tarihi/Memleket) ve
   doğrulanmamış satırları **otomatik olarak atlar** ve hangi satırın
   neden atlandığını ekrana yazar — bu yüzden `data/sehitler.json`
   dosyasına yalnızca doğrulanmış, tutarlı kayıtlar girer.
6. `git diff data/sehitler.json` ile değişikliği gözden geçirip commit edin.

Araç bu ortamda kapsamlı test edilmiştir: Türkçe karakterli isim/il
değerleri (ör. "Şükrü Yıldız", "Şanlıurfa"), üç tarih biçimi, boş/eksik
alanlar, geçersiz il adları, doğrulanmamış satırlar ve "Doğrulama
Durumu" sütunu hiç olmayan CSV'ler — hepsi beklenen şekilde işlendi.

## Yerelde çalıştırma / test etme

Hiçbir bağımlılık veya build adımı yoktur; herhangi bir statik dosya
sunucusu yeterlidir:

```bash
cd sehitlerimiz
python3 -m http.server 8080
# tarayıcıda: http://localhost:8080/
```

## Android telefondan yayınlama (adım adım)

En kolay ve ücretsiz yol **GitHub Pages**'tir; tamamen Android telefon
üzerinden, bilgisayar gerekmeden yapılabilir.

1. **GitHub uygulamasını** (veya tarayıcıdan github.com) telefonunuzda açın,
   bu depoda oturum açın.
2. Bu `claude/sehitlerimiz-website-9tjh0v` dalındaki değişikliklerin
   `main` (veya deponuzun varsayılan) dalına alınması gerekir:
   - GitHub uygulamasından/tarayıcıdan bu dal için bir **Pull Request**
     açın ve **Merge** edin. (Bunu istediğinizde ben de bu oturumdan
     sizin için bir PR açabilirim — yalnızca söylemeniz yeterli.)
3. Depo ayarlarına gidin: **Settings → Pages**.
4. **Source** olarak **Deploy from a branch** seçin.
5. **Branch**: `main`, **Folder**: `/sehitlerimiz` (eğer klasör seçeneği
   yoksa, kök dizini (`/`) seçip adres sonuna `/sehitlerimiz/` ekleyerek
   açabilirsiniz; ya da aşağıdaki "kök dizine taşıma" notuna bakın).
6. **Save**'e basın. Birkaç dakika içinde siteniz
   `https://<kullanici-adiniz>.github.io/<depo-adi>/sehitlerimiz/`
   adresinde (veya Pages'in size verdiği adreste) yayında olacaktır.
7. Telefonunuzun tarayıcısından bu adresi açıp test edin; ana ekrana
   eklemek isterseniz tarayıcı menüsünden **"Ana ekrana ekle"** seçeneğini
   kullanabilirsiniz (site mobil uyumlu olduğu için bir uygulama gibi açılır).

> **Not — GitHub Pages klasör seçimi desteklemiyorsa:** Bazı hesap
> türlerinde Pages yalnızca kök dizini (`/`) veya `/docs` klasörünü
> destekler. Bu durumda `sehitlerimiz/` klasörünün içeriğini deponun
> köküne (veya bir `docs/` klasörüne) taşımanız gerekir. Bunu da bu
> oturumdan benden isteyebilirsiniz — tek komutla yapılabilir, mevcut
> `kalp-ve-karanlik/` ve `scenes/` projelerine dokunulmadan.

Veriyi daha sonra güncellemek için: CSV dönüştürme aracını tekrar
çalıştırıp `data/sehitler.json`'u commit+push edin (Apps Script
yöntemini kullanıyorsanız hiçbir şey yapmanıza gerek yok, veri
otomatik güncel okunur).

## Güvenlik notları

- İstemci tarafı kodda (bu klasördeki hiçbir `.js`/`.html` dosyasında)
  Google hesap bilgisi, şifre veya gizli API anahtarı **bulunmaz**.
- `js/config.js` içine konan Apps Script URL'si bir sır değildir —
  salt okunur, herkese açık bir JSON uç noktasıdır ve yazmaya kapalıdır
  (bkz. `apps-script/README.md` → "Güvenlik modeli").
- Veri girişi/düzenleme her zaman ya Google Sheets'in kendi arayüzünde
  (sahibinin hesabıyla) ya da bu depodaki CSV dönüştürme aracıyla
  (elle, satır satır doğrulama ile) yapılır — hiçbir zaman sitenin
  kendisi üzerinden.
- `apps-script/appsscript.json`, Apps Script'in Google'dan istediği
  yetkiyi `spreadsheets.currentonly` ile **yalnızca scriptin bağlı
  olduğu tek tabloya** daraltır; `Code.gs` zaten Drive'a dokunmuyor ve
  hiçbir yere yazmıyor, bu yüzden pratikte yalnızca o tek tablonun
  okunmasına izin verilmiş olur (bkz. `apps-script/README.md` →
  "Yetkilendirme kapsamını daraltma").

## Kapsam ve veri bütünlüğü ilkeleri

- Sitede yalnızca **doğrulanmış** kayıtlar gösterilir: "Doğrulama
  Durumu" sütunu eklenmişse yalnızca `Doğrulandı`/`Evet` satırları,
  eklenmemişse tablodaki tüm satırlar (zaten elle doğrulanmış kabul
  edilerek) dışa aktarılır — taslak/şüpheli satırlar (sütun varsa) hem
  Apps Script hem CSV aracı tarafından otomatik olarak filtrelenir.
- Gerçek veri bağlanana kadar site hiçbir sayıyı "0" veya gerçekmiş gibi
  göstermez; açık bir "Veri Bekleniyor" durumu sunar.
- Tarihsel dönem kayıtları (örn. 1853–1928 dönemi, Kıbrıs Barış Harekâtı)
  ile güncel döneme ait kayıtlar aynı listede karıştırılmamalıdır; farklı
  dönemlere ait verileri içe aktarırken `--kapsam` parametresiyle (veya
  Sheets'teki/CSV'deki `Dönem` sütunuyla) etiketleyin ve mümkünse ayrı
  içe aktarımlar olarak yönetin.
- Birincil ve resmî kaynak her zaman **MSB Şehit Bilgi Kapısı**'dır; bu
  site onun yerine geçmez, yalnızca elle doğrulanmış bir alt kümesini
  sade bir arayüzde sunar.
