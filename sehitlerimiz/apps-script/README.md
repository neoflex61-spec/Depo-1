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
- `appsscript.json` manifest dosyası, yetkilendirme kapsamını açıkça
  `spreadsheets.readonly` olarak sınırlar — yazma/silme/paylaşım
  yeteneğini tamamen kaldırır. "Yalnızca bu tabloya dokunma" garantisi
  OAuth kapsamından değil, `Code.gs`'in kendi mantığından gelir: dosya
  hiçbir zaman `openById()` veya `DriveApp` çağırmaz, yalnızca
  `getActiveSpreadsheet()` (bağlı dosya) kullanır (bkz. aşağıdaki
  "Yetkilendirme kapsamı: neden readonly, neden currentonly değil").

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
6. **(Önerilir) Manifesti uygulayın** — bkz. aşağıdaki "Yetkilendirme
   kapsamı: neden readonly, neden currentonly değil" bölümü. Bunu
   atlarsanız Google'ın izin ekranı "tüm Google E-Tablolar
   dosyalarınızı görüntüleme, düzenleme, oluşturma ve silme" gibi
   gereğinden geniş bir izin ister.
7. **Dağıt → Yeni Dağıtım** deyin:
   - Tür: **Web Uygulaması**
   - Yürütülecek kullanıcı hesabı: **Ben (siz)**
   - Erişim yetkisi olanlar: **Herkes**
8. "Dağıt" butonuna basın, Google'ın izin ekranını onaylayın. 6. adımı
   uyguladıysanız ekranda **yalnızca "Tüm Google E-Tablolar
   elektronik tablolarınızı görüntüleme"** yazar — "değiştirme",
   "oluşturma", "silme" veya "paylaşma" ifadeleri görünmez. Hesap
   bilgileriniz hiçbir yere gönderilmez.
9. Üretilen `https://script.google.com/macros/s/.../exec` adresini
   kopyalayın.
10. Bu adresi sitenin `../js/config.js` dosyasındaki `apiUrl` alanına
    yapıştırın:

    ```js
    window.SEHITLERIMIZ_CONFIG = {
      apiUrl: "https://script.google.com/macros/s/XXXXXXXXXXXX/exec"
    };
    ```

11. Siteyi yeniden yayınlayın (statik dosyaları değiştirdiğiniz için
    sunucu yeniden başlatma gerekmez, sadece dosyayı güncelleyip
    yayına alın).

## Yetkilendirme kapsamı: neden readonly, neden currentonly değil

**Sorun:** Apps Script, kodunuzda hangi Google servislerinin
kullanıldığını otomatik tespit edip buna göre bir yetki (OAuth scope)
istiyor. `Code.gs` yalnızca `SpreadsheetApp.getActiveSpreadsheet()`
çağırıyor — başka hiçbir tabloyu açmıyor, Drive'a dokunmuyor, hiçbir
şey yazmıyor — ama açık bir manifest olmadan Apps Script otomatik
olarak en geniş `https://www.googleapis.com/auth/spreadsheets` kapsamını
ister. Google'ın izin ekranında bu, tam olarak **"Tüm Google Sheets
elektronik tablolarınızı görüntüleme, değiştirme ve paylaşma"**
şeklinde görünür.

**İlk denediğimiz `spreadsheets.currentonly` neden işe yaramadı:**
Bu kapsam ailesi (ve onu üreten `@OnlyCurrentDoc` ek açıklaması)
yalnızca bir belgenin **kendi UI oturumu içinde çalışan kodlar** için
geçerlidir — özel menüler, kenar çubukları, `onOpen`/`onEdit` gibi
basit tetikleyiciler. Anlamı tam olarak "bu belge **açıkken** çalıştır".
Ama `doGet()` bir **Web App uç noktasıdır**: internetten gelen anonim
bir HTTP isteğiyle tetiklenir, arkasında "şu an açık bir belge" diye
bir şey yoktur. Bu yüzden Apps Script, Web App bağlamında
`.currentonly`'yi honor edemez ve manifestte ne yazarsanız yazın
sessizce tam `spreadsheets` kapsamına düşer — gördüğünüz
"görüntüleme, değiştirme ve paylaşma" ifadesi budur. `@OnlyCurrentDoc`
eklemek de yardımcı olmaz: hem `oauthScopes` zaten açıkça
tanımlandığından otomatik tespit hiç çalışmaz, hem de çalışsaydı
ürettiği kapsam yine aynı nedenle Web App'te geçersiz kalırdı.

**Çözüm — `spreadsheets.readonly`:** Web App bağlamında **gerçekten
geçerli olan** en dar kapsam budur. Google'ın resmi açıklaması: *"Tüm
Google E-Tablolar elektronik tablolarınızı görüntüleme"* — "değiştirme"
veya "paylaşma" ifadesi yoktur, çünkü bu kapsam yazma/silme/paylaşım
yeteneğini tamamen kaldırır. Dürüst olmak gerekirse bu kapsam "yalnızca
bu tabloya" kısıtlamasını *sağlamaz* (Web App bağlamında bu seviyede
hiçbir OAuth kapsamı bunu sağlayamaz); "yalnızca bağlı tabloya
dokunma" garantisi `Code.gs`'in kendi kodundan gelir — dosya hiçbir
zaman `openById()` çağırmaz, yalnızca `getActiveSpreadsheet()` (bağlı
dosya) kullanır.

Adımlar:

1. Apps Script editöründe, sol alttaki **dişli (⚙) Proje Ayarları**
   simgesine dokunun.
2. **"appsscript.json manifest dosyasını düzenleyicide göster"**
   kutucuğunu işaretleyin.
3. Soldaki dosya listesine geri dönün (**< Düzenleyici**), artık
   görünen **`appsscript.json`** dosyasını açın.
4. İçindeki her şeyi silip bu klasördeki `appsscript.json` dosyasının
   içeriğini yapıştırın (aşağıda). Projenizde zaten bir `"webapp"`
   anahtarı varsa (daha önce dağıtım yaptıysanız olabilir) onu
   **silmeyin**, yalnızca `"oauthScopes"` dizisini ekleyin/değiştirin:

   ```json
   {
     "timeZone": "Europe/Istanbul",
     "dependencies": {},
     "exceptionLogging": "STACKDRIVER",
     "runtimeVersion": "V8",
     "oauthScopes": [
       "https://www.googleapis.com/auth/spreadsheets.readonly"
     ]
   }
   ```

5. Kaydedin (disket simgesi).
6. Üstteki fonksiyon açılır menüsünden **`doGet`**'i seçip **▶ Çalıştır**'a
   basın. Bu, yeni izin ekranını hemen tetikler — metnin yalnızca
   "görüntüleme" dediğini, "değiştirme" veya "paylaşma" ifadesi
   içermediğini burada görüp onaylayabilirsiniz.

**Daha önce geniş kapsamla zaten yetkilendirdiyseniz:** Google, bir
scripte verilen izni kapsam daraldığında otomatik geri çekmez; eski
geniş yetkilendirme hesabınızda kayıtlı kalabilir. Temiz bir sonuç için:

1. Telefonunuzda `myaccount.google.com/permissions` adresini açın
   (Google Hesabım → Güvenlik → Üçüncü taraf erişimi olan uygulamalar).
2. Bu Apps Script projesini bulup **erişimi kaldırın**.
3. Apps Script editörüne dönüp 6. adımı (doGet'i çalıştırma) tekrar
   yapın — bu sefer temiz, dar kapsamlı izin ekranı çıkacaktır.
4. **Dağıt → Dağıtımları Yönet** açın, mevcut dağıtımın yanındaki kalem
   (düzenle) simgesine dokunun, **Sürüm: Yeni sürüm** seçip **Dağıt**'a
   basın. Bu, mevcut `/exec` URL'nizi **değiştirmez** — `js/config.js`'i
   tekrar güncellemenize gerek kalmaz, sadece yeni (dar) yetkiyle
   çalışan bir sürüm yayınlanır.

## Veriyi güncelleme

Tabloya yeni bir satır eklemek veya "Doğrulama Durumu"nu "Doğrulandı"
yapmak, siteye **anında** (sayfa yenilendiğinde) yansır — hiçbir kod
değişikliği veya yeniden dağıtım gerekmez.

## Sorun giderme

- Site veri çekemiyorsa (konsolda hata görürseniz), tarayıcı önce
  `apiUrl`'i deneyip başarısız olursa otomatik olarak `../data/sehitler.json`
  yerel dosyasına döner — bu yüzden site asla tamamen bozulmaz.
- "Yetkisiz" hatası alıyorsanız 7. adımdaki erişim ayarının **Herkes**
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
- Kapsamı değiştirdikten sonra site birden "Beklenmeyen hata" veya boş
  veri dönüyorsa, Apps Script editöründe `doGet`'i elle **▶ Çalıştır**ıp
  bir yetkilendirme hatası çıkıp çıkmadığını kontrol edin; çıkarsa izin
  ekranını onaylamanız yeterlidir (bkz. "Yetkilendirme kapsamı: neden
  readonly, neden currentonly değil" bölümü, 6. adım).
- İzin ekranında hâlâ "değiştirme" veya "paylaşma" ifadesi görüyorsanız
  (manifestiniz `spreadsheets.readonly` olsa bile), olası nedenler:
  (a) daha önce verilmiş geniş bir yetkilendirme hâlâ hesabınızda kayıtlı
  — aşağıdaki "Daha önce geniş kapsamla..." adımlarıyla temizleyin;
  (b) Apps Script editöründe **Hizmetler (⊕)** altına "Google Sheets API"
  veya "Drive API" gibi bir Gelişmiş Servis eklenmiş olabilir — kullanılmıyorsa
  kaldırın; (c) projede `Code.gs` dışında, daha geniş erişim isteyen başka
  bir dosya olabilir.
