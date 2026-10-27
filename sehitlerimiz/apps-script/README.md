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
  `spreadsheets.currentonly` olarak sınırlar (`Code.gs`'in başında da
  resmî `@OnlyCurrentDoc` ek açıklaması tanımlıdır). "Yalnızca bu
  tabloya dokunma" garantisi zaten OAuth kapsamından değil, `Code.gs`'in
  kendi mantığından gelir: dosya hiçbir zaman `openById()` veya
  `DriveApp` çağırmaz, yalnızca `getActiveSpreadsheet()` (bağlı dosya)
  kullanır (bkz. aşağıdaki "Yetkilendirme kapsamı").

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
6. **(Önerilir) Önce eski yetkilendirmeyi temizleyin, sonra manifesti
   uygulayın** — bkz. aşağıdaki "Yetkilendirme kapsamı" bölümü. Bunu
   atlarsanız Google'ın izin ekranı "tüm Google E-Tablolar
   dosyalarınızı görüntüleme, düzenleme, oluşturma ve silme" gibi
   gereğinden geniş bir izin ister.
7. **Dağıt → Yeni Dağıtım** deyin:
   - Tür: **Web Uygulaması**
   - Yürütülecek kullanıcı hesabı: **Ben (siz)**
   - Erişim yetkisi olanlar: **Herkes**
8. "Dağıt" butonuna basın, Google'ın izin ekranını onaylayın. Ekranda
   çıkan metni dikkatle okuyun — aşağıdaki "Yetkilendirme kapsamı"
   bölümünde hangi metnin beklendiği ve hangisinin sorun işareti
   olduğu ayrıntılı anlatılıyor. Hesap bilgileriniz hiçbir yere
   gönderilmez.
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

## Yetkilendirme kapsamı

**Sorun:** Apps Script, kodunuzda hangi Google servislerinin
kullanıldığını otomatik tespit edip buna göre bir yetki (OAuth scope)
istiyor. `Code.gs` yalnızca `SpreadsheetApp.getActiveSpreadsheet()`
çağırıyor — başka hiçbir tabloyu açmıyor, Drive'a dokunmuyor, hiçbir
şey yazmıyor — ama açık bir manifest olmadan Apps Script otomatik
olarak en geniş `https://www.googleapis.com/auth/spreadsheets` kapsamını
ister. Google'ın izin ekranında bu, tam olarak **"Tüm Google Sheets
elektronik tablolarınızı görüntüleme, değiştirme ve paylaşma"**
şeklinde görünür.

**Şu anki yaklaşım — `spreadsheets.currentonly` + `@OnlyCurrentDoc`:**
`appsscript.json`'da bu kapsam, `Code.gs`'in başında da resmî
`@OnlyCurrentDoc` ek açıklaması tanımlı. Bu kapsamın belgelenmiş
kısıtlaması şudur: `openById()`/`openByUrl()` ile **başka** bir dosya
açamazsınız ve Gelişmiş Google Servisleri (Sheets API, Drive API vb.)
bu kapsamla çalışmaz — ama `getActiveSpreadsheet()` gibi "bağlı dosyayı
okuma" çağrıları desteklenir. `Code.gs`'te `openById()` veya herhangi
bir Gelişmiş Servis **yoktur** — yalnızca `getActiveSpreadsheet()`
kullanılır — yani kod bu kısıtlamalarla tam uyumludur.

> **Dürüstlük notu:** Bu kapsamın bir Web App (`doGet`) bağlamında,
> belge-UI'sından tetiklenen kodlardaki kadar güvenilir biçimde
> daraldığı, resmî Google kaynaklarında web app'e özel olarak ayrıca
> teyit edilmiş değildir. Bu depo daha önce (yanlışlıkla, yeterli
> kanıt olmadan) bunun "mimari olarak imkânsız" olduğunu iddia etmişti
> — bu iddia geri çekildi. Doğrusu: deneyip Google'ın izin ekranında
> gerçekte ne yazdığını görmek. Çalışırsa harika; çalışmazsa, daha önce
> bu projede test edilip doğrulanmış bir alternatif (`spreadsheets.readonly`)
> hazır (bkz. aşağıdaki "Eğer currentonly yine de dar bir izin
> üretmezse").

**Önce eski yetkilendirmeyi temizleyin (çok önemli):** Google, bir
scripte verilen izni kapsam daraldığında otomatik geri çekmez. Daha
önce bu projeyi (herhangi bir kapsamla) yetkilendirdiyseniz, test
sonucunuz o eski, geniş yetkilendirmeyi yansıtır — gerçek kapsamı
değil. Temiz bir test için önce bunu temizleyin:

1. `myaccount.google.com/permissions` adresini açın (Google Hesabım →
   Güvenlik → Üçüncü taraf erişimi olan uygulamalar).
2. Bu Apps Script projesini bulup **erişimi kaldırın**.

**Sonra manifesti/kodu uygulayın ve TEMİZ bir test yapın:**

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
       "https://www.googleapis.com/auth/spreadsheets.currentonly"
     ]
   }
   ```

5. `Code.gs`'i de bu klasördeki (güncel) `Code.gs` ile değiştirin —
   dosyanın en başında artık `/** @OnlyCurrentDoc */` bloğu var.
6. İkisini de kaydedin (disket simgesi).
7. **Sol menüde Hizmetler (⊕ puzzle parçası ikonu)**'ne bakın. "Google
   Sheets API" veya "Google Drive API" gibi bir Gelişmiş Servis
   listeleniyorsa **kaldırın** — `currentonly` bu servislerle
   çalışmaz, listede kalırsa kapsam yine geniş kalabilir.
8. Üstteki fonksiyon açılır menüsünden **`doGet`**'i seçip **▶ Çalıştır**'a
   basın. Çıkan izin ekranının metnini **tam olarak** okuyun:
   - **"Bu uygulamanın yüklü olduğu Google E-Tablolar dosyasını
     görüntüleme"** gibi, yalnızca BU tabloya veya "yüklü olduğu"
     dosyaya atıfta bulunan bir metin çıkarsa → `currentonly` çalışıyor,
     bu en iyi sonuç. Onaylayın.
   - **"Tüm Google E-Tablolar elektronik tablolarınızı..."** gibi "tüm"
     ifadesi geçen bir metin çıkarsa (değiştirme/paylaşma ekli olsun
     olmasın) → `currentonly` bu Web App için beklendiği gibi
     daralmıyor demektir. **Onaylamadan önce** aşağıdaki "Eğer
     currentonly yine de dar bir izin üretmezse" bölümüne geçin.

### Eğer currentonly yine de dar bir izin üretmezse

Hizmetler panelini temizlediniz, eski yetkilendirmeyi kaldırdınız,
temiz bir test yaptınız ve izin ekranı hâlâ "tüm e-tablolarınız"
diyorsa, bu durumda `currentonly`'nin bu Web App dağıtımı için honor
edilmediğine dair elinizde somut, gözlemlenmiş bir kanıt var demektir.
Bu durumda `spreadsheets.readonly`'ye geçin — bu depo üzerinde daha
önce test edilip doğrulanmış, yazma/silme/paylaşım yeteneğini kesin
olarak kaldıran bir alternatiftir (Google'ın resmi açıklaması: *"Tüm
Google E-Tablolar elektronik tablolarınızı görüntüleme"* — "değiştirme"
veya "paylaşma" ifadesi yoktur):

1. `appsscript.json`'da `"oauthScopes"` değerini
   `["https://www.googleapis.com/auth/spreadsheets.readonly"]` yapın.
2. `Code.gs`'in başındaki `/** @OnlyCurrentDoc */` bloğunu silebilirsiniz
   (readonly ile birlikte kullanıldığında zararsızdır ama anlamsızdır).
3. Kaydedin, `doGet`'i tekrar **▶ Çalıştır**'la test edin.

Her iki durumda da (`currentonly` çalışsın ya da `readonly`'ye dönülsün)
**"yalnızca bağlı tabloya dokunma" garantisi zaten `Code.gs`'in kendi
kodundan geliyor** — dosya hiçbir zaman `openById()` çağırmaz, yalnızca
`getActiveSpreadsheet()` (bağlı dosya) kullanır. Bu nedenle hangi
seçenek işe yararsa yarasın, scriptin davranışı değişmez.

9. **Dağıt → Dağıtımları Yönet** açın, mevcut dağıtımın yanındaki kalem
   (düzenle) simgesine dokunun, **Sürüm: Yeni sürüm** seçip **Dağıt**'a
   basın. Bu, mevcut `/exec` URL'nizi **değiştirmez** — `js/config.js`'i
   tekrar güncellemenize gerek kalmaz, sadece yeni yetkiyle çalışan
   bir sürüm yayınlanır.

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
  ekranını onaylamanız yeterlidir (bkz. "Yetkilendirme kapsamı" bölümü).
- İzin ekranında hâlâ "tüm e-tablolarınız" / "değiştirme" / "paylaşma"
  ifadesi görüyorsanız, olası nedenler sırasıyla: (a) daha önce verilmiş
  bir yetkilendirme hâlâ hesabınızda kayıtlı — "Önce eski yetkilendirmeyi
  temizleyin" adımlarıyla kaldırın; (b) Apps Script editöründe
  **Hizmetler (⊕)** altına "Google Sheets API" veya "Drive API" gibi bir
  Gelişmiş Servis eklenmiş olabilir — `currentonly` bunlarla çalışmaz,
  kaldırın; (c) projede `Code.gs` dışında, daha geniş erişim isteyen
  başka bir dosya olabilir; (d) hiçbiri değilse, `currentonly`'nin bu
  Web App dağıtımı için honor edilmediğine dair elinizde kanıt var
  demektir — "Eğer currentonly yine de dar bir izin üretmezse" bölümünü
  uygulayıp `spreadsheets.readonly`'ye geçin.
