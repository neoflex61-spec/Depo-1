# Google Sheets + Apps Script Entegrasyonu

Bu klasör, ŞEHİTLERİMİZ sitesinin verisini bir Google E-Tablosundan canlı
olarak okumasını sağlayan **isteğe bağlı** entegrasyonu içerir. Bu yöntemi
kullanmak istemiyorsanız `../tools/csv_to_json.py` ile CSV içe aktarma
yöntemini kullanabilirsiniz (bkz. ana `../README.md`).

## Güvenlik modeli (önemli)

- Bu entegrasyonda **hiçbir şifre, API anahtarı veya hesap bilgisi** site
  koduna veya Git deposuna girmez.
- Apps Script "Web Uygulaması" olarak yayınlandığında ürettiği adres
  (`.../exec` ile biten URL) bir **salt okunur, herkese açık JSON uç
  noktasıdır** — sır değildir, sızdırılabilecek bir "anahtar" değildir.
- Bu uç nokta üzerinden **veri yazma/ekleme/silme mümkün değildir** —
  `Code.gs` sadece `doGet` tanımlar, `doPost` yoktur. Veri girişi/düzenleme
  her zaman Google Sheets'in kendi arayüzünde, tablo sahibinin Google
  hesabıyla giriş yapmasıyla yapılır.
- Yalnızca "Dogrulama Durumu" sütununda **"Doğrulandı"** yazan satırlar
  dışa aktarılır; taslak/şüpheli satırlar siteye hiçbir zaman ulaşmaz.

## Kurulum adımları

1. Yeni bir Google E-Tablosu oluşturun (veya mevcut birini kullanın).
2. İlk sayfanın adını **`Sehitler`** yapın.
3. İlk satıra şu başlıkları aynı sırayla yazın:

   | Ad Soyad | Sehadet Tarihi | Memleket | Donem | Dogrulama Durumu |
   |---|---|---|---|---|

   - **Memleket** sütununa yalnızca `../data/iller.json` içindeki 81 il
     adından birini yazın (yazım hatası olursa site o satırı normal
     gösterir ama il sayaçlarında eşleşmeyebilir).
   - **Donem** sütunu isteğe bağlıdır; tarihsel/güncel kayıt gruplarını
     ayırt etmek için kullanılır (örn. "Güncel Dönem").
   - **Dogrulama Durumu** sütununa yalnızca kaynağını doğruladığınız
     kayıtlar için tam olarak `Doğrulandı` yazın; diğer her değer
     (boş, "Taslak", "Kontrol Ediliyor" vb.) o satırı siteden gizler.

4. Üstteki menüden **Uzantılar → Apps Script** açın.
5. Açılan projede `Code.gs` dosyasının içeriğini bu klasördeki
   `Code.gs` dosyasıyla değiştirin.
6. **Dağıt → Yeni Dağıtım** deyin:
   - Tür: **Web Uygulaması**
   - Yürütülecek kullanıcı hesabı: **Ben (siz)**
   - Erişim yetkisi olanlar: **Herkes**
7. "Dağıt" butonuna basın, Google'ın izin ekranını onaylayın (bu, sadece
   kendi tablonuzu okuma izni verir; hesap bilgilerinizi hiçbir yere
   göndermez).
8. Üretilen `https://script.google.com/macros/s/.../exec` adresini
   kopyalayın.
9. Bu adresi sitenin `../js/config.js` dosyasındaki `apiUrl` alanına
   yapıştırın:

   ```js
   window.SEHITLERIMIZ_CONFIG = {
     apiUrl: "https://script.google.com/macros/s/XXXXXXXXXXXX/exec"
   };
   ```

10. Siteyi yeniden yayınlayın (statik dosyaları değiştirdiğiniz için
    sunucu yeniden başlatma gerekmez, sadece dosyayı güncelleyip
    yayına alın).

## Veriyi güncelleme

Tabloya yeni bir satır eklemek veya "Dogrulama Durumu"nu "Doğrulandı"
yapmak, siteye **anında** (sayfa yenilendiğinde) yansır — hiçbir kod
değişikliği veya yeniden dağıtım gerekmez.

## Sorun giderme

- Site veri çekemiyorsa (konsolda hata görürseniz), tarayıcı önce
  `apiUrl`'i deneyip başarısız olursa otomatik olarak `../data/sehitler.json`
  yerel dosyasına döner — bu yüzden site asla tamamen bozulmaz.
- "Yetkisiz" hatası alıyorsanız 6. adımdaki erişim ayarının **Herkes**
  olduğunu doğrulayın.
