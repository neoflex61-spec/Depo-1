# Google Sheets + Apps Script Entegrasyonu

Bu klasör, ŞEHİTLERİMİZ sitesinin verisini bir Google E-Tablosundan canlı
olarak okumasını sağlayan **isteğe bağlı** entegrasyonu içerir. Bu yöntemi
kullanmak istemiyorsanız `../tools/csv_to_json.py` ile CSV içe aktarma
yöntemini kullanabilirsiniz (bkz. ana `../README.md`).

> **Önemli — otomatik veri çekme YOKTUR.** Bu entegrasyon, MSB Şehit
> Bilgi Kapısı'ndan (veya başka bir kaynaktan) veriyi **otomatik olarak
> çekmez**; böyle bir kamuya açık API şu an mevcut değildir. Google
> E-Tablosuna girilecek her satırı, kaynağını kendiniz doğrulayarak elle
> girmeniz gerekir. Apps Script'in tek işi, sizin elle girdiğiniz
> tabloyu sitenin okuyabileceği bir JSON biçiminde yayınlamaktır.

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
- "Doğrulama Durumu" sütununu eklerseniz, yalnızca **"Doğrulandı"**
  (veya "Evet") yazan satırlar dışa aktarılır; bu sütunu eklemezseniz,
  tablodaki tüm dolu satırlar zaten elle doğruladığınız varsayılarak
  aktarılır (bkz. aşağıdaki 3. adım).

## Kurulum adımları

1. Yeni bir Google E-Tablosu oluşturun (veya mevcut birini kullanın).
2. İlk sayfanın adını **`Şehitler`** yapın (aksansız `Sehitler` de kabul
   edilir, script her ikisini de tanır).
3. İlk satıra şu başlıkları yazın (sıraları önemli değildir):

   | Ad Soyad | Şehadet Tarihi | Memleket | Dönem | Doğrulama Durumu |
   |---|---|---|---|---|

   İlk üç sütun **zorunludur**. Son iki sütun **isteğe bağlıdır**:

   - **Ad Soyad / Şehadet Tarihi / Memleket** — her satırda dolu
     olmalıdır; herhangi biri boşsa o satır otomatik olarak atlanır.
   - **Memleket** sütununa yalnızca `../data/iller.json` içindeki 81 il
     adından birini **birebir aynı yazımla** yazın; eşleşmeyen bir il adı
     o satırı siteden tamamen gizler (yazım hatalarının sessizce il
     sayaçlarını bozmasını önlemek için kasıtlı bir davranıştır).
   - **Şehadet Tarihi** `GG.AA.YYYY`, `GG/AA/YYYY` veya `YYYY-AA-GG`
     biçiminde olabilir (ya da hücreyi Sheets'te tarih biçiminde
     bırakabilirsiniz) — script otomatik olarak `GG.AA.YYYY`'ye çevirir.
   - **Dönem** isteğe bağlıdır; tarihsel/güncel kayıt gruplarını ayırt
     etmek için kullanılır (örn. "Güncel Dönem").
   - **Doğrulama Durumu** isteğe bağlıdır. Eklerseniz, yalnızca kaynağını
     doğruladığınız kayıtlar için tam olarak `Doğrulandı` (veya `Evet`)
     yazın; diğer her değer (boş, "Taslak", "Kontrol Ediliyor" vb.) o
     satırı siteden gizler. **Bu sütunu hiç eklemezseniz, tablodaki tüm
     dolu satırlar doğrudan siteye yansır** — bu yüzden sütunu eklemediyseniz
     tabloya yalnızca zaten doğruladığınız kayıtları girin.

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

Tabloya yeni bir satır eklemek veya "Doğrulama Durumu"nu "Doğrulandı"
yapmak, siteye **anında** (sayfa yenilendiğinde) yansır — hiçbir kod
değişikliği veya yeniden dağıtım gerekmez.

## Sorun giderme

- Site veri çekemiyorsa (konsolda hata görürseniz), tarayıcı önce
  `apiUrl`'i deneyip başarısız olursa otomatik olarak `../data/sehitler.json`
  yerel dosyasına döner — bu yüzden site asla tamamen bozulmaz.
- "Yetkisiz" hatası alıyorsanız 6. adımdaki erişim ayarının **Herkes**
  olduğunu doğrulayın.
- Apps Script uç noktasını tarayıcıda doğrudan açıp JSON çıktısını
  inceleyebilirsiniz; `hata` alanı doluysa (örn. "'Şehitler' adlı bir
  sayfa bulunamadı" veya "Zorunlu sütun(lar) bulunamadı: ...") mesaj
  neyin eksik olduğunu doğrudan söyler.
- Bir satır beklediğiniz halde listede görünmüyorsa en sık nedenler:
  Memleket sütunundaki il adının `data/iller.json`'daki yazımla birebir
  eşleşmemesi, Şehadet Tarihi'nin tanınan üç biçimden birinde olmaması
  veya (sütun eklediyseniz) Doğrulama Durumu'nun tam olarak "Doğrulandı"
  yazmaması.
