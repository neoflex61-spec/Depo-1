/**
 * ŞEHİTLERİMİZ — Google Apps Script veri uç noktası.
 *
 * Bu dosya Google Sheets dosyanıza bağlı bir Apps Script projesine
 * yapıştırılır. Web Uygulaması olarak yayınlandığında, sitenin
 * js/config.js dosyasındaki apiUrl alanına konacak salt-okunur bir
 * JSON adresi üretir. Hiçbir hesap bilgisi, şifre veya gizli anahtar
 * bu kodun İÇİNDE veya ÇIKTISINDA bulunmaz; yetkilendirme tamamen
 * Google'ın kendi "Dağıt > Web Uygulaması" akışında yapılır. Bu uç
 * nokta yalnızca OKUR (doGet) — veri yazma/silme hiçbir şekilde bu
 * adres üzerinden yapılamaz.
 *
 * NOT: Bu entegrasyon MSB Şehit Bilgi Kapısı'ndan OTOMATİK veri
 * çekmez (böyle bir kamuya açık API bulunmamaktadır). Google
 * E-Tablosuna girilecek her satır, kaynağı sizin tarafınızdan elle
 * doğrulanmış olmalıdır.
 *
 * Sayfa adı: "Şehitler" (ya da aksansız "Sehitler" de kabul edilir).
 * Beklenen sütun başlıkları (ilk satır, sıra önemli değil):
 *
 *   ZORUNLU : Ad Soyad | Şehadet Tarihi | Memleket
 *   OPSİYONEL: Dönem | Doğrulama Durumu
 *
 * - "Memleket" değeri, sitenin 81 il listesiyle (bkz. aşağıdaki
 *   IL_LISTESI) birebir eşleşmelidir; eşleşmeyen satırlar atlanır —
 *   böylece il bazlı sayaçlar her zaman doğru il adlarıyla hesaplanır.
 * - "Doğrulama Durumu" sütunu eklerseniz, yalnızca "Doğrulandı" (veya
 *   "Evet") yazan satırlar dışa aktarılır. Bu sütunu HİÇ eklemezseniz,
 *   tablodaki tüm dolu satırlar zaten elle doğruladığınız varsayılarak
 *   aktarılır — bu yüzden tabloya yalnızca kaynağını MSB Şehit Bilgi
 *   Kapısı'ndan (ya da başka güvenilir bir kaynaktan) doğruladığınız
 *   kayıtları girin.
 * - "Dönem" sütunu (örn. "Güncel Dönem", "1853-1928 Dönemi") tarihsel
 *   ve güncel kayıt gruplarının birbirine karışmaması için tutulur.
 *   Veri minimizasyonu gereği yalnızca meta.kapsam alanında
 *   toplulaştırılmış özet olarak dışa aktarılır; her kayıtta tek tek
 *   tekrarlanmaz (site zaten bunu satır bazında kullanmıyor).
 * - Ad Soyad, Şehadet Tarihi veya Memleket boş olan satırlar her zaman
 *   atlanır (eksik/boş kayıt sessizce yayınlanmaz).
 */

var SHEET_ADI_NORMALIZE = "sehitler"; // "Şehitler" / "Sehitler" ikisi de eşleşir

var IL_LISTESI = [
  "Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin",
  "Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa",
  "Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan",
  "Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Isparta",
  "Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir",
  "Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla",
  "Muş","Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas",
  "Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak",
  "Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın","Ardahan",
  "Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce"
];

var DOGRULANMIS_DEGERLER = ["dogrulandi", "evet", "true", "e"];

function doGet(e) {
  try {
    var sheet = sehitlerSayfasiniBul();
    if (!sheet) {
      return jsonCikti({
        meta: { durum: "veri_bekleniyor", kaynak: null, kapsam: null, sonGuncelleme: null, toplamKayit: 0 },
        kayitlar: [],
        hata: "'Şehitler' adlı bir sayfa bulunamadı. Lütfen sayfa adını kontrol edin."
      });
    }

    var veriler = sheet.getDataRange().getValues();
    if (veriler.length < 2) {
      return jsonCikti({
        meta: { durum: "veri_bekleniyor", kaynak: "Google Sheets", kapsam: null, sonGuncelleme: new Date().toISOString(), toplamKayit: 0 },
        kayitlar: []
      });
    }

    var basliklar = veriler[0];
    var sutunlar = sutunIndeksleriniBul(basliklar);

    var eksikZorunlu = [];
    if (sutunlar.ad === -1) eksikZorunlu.push("Ad Soyad");
    if (sutunlar.tarih === -1) eksikZorunlu.push("Şehadet Tarihi");
    if (sutunlar.il === -1) eksikZorunlu.push("Memleket");

    if (eksikZorunlu.length) {
      return jsonCikti({
        meta: { durum: "veri_bekleniyor", kaynak: "Google Sheets", kapsam: null, sonGuncelleme: new Date().toISOString(), toplamKayit: 0 },
        kayitlar: [],
        hata: "Zorunlu sütun(lar) bulunamadı: " + eksikZorunlu.join(", ")
      });
    }

    var gecerliIlSeti = {};
    IL_LISTESI.forEach(function (il) { gecerliIlSeti[il] = true; });

    var kayitlar = [];
    var donemler = {};
    var atlananSayisi = 0;

    for (var i = 1; i < veriler.length; i++) {
      var satir = veriler[i];

      var ad = (satir[sutunlar.ad] || "").toString().trim();
      var il = (satir[sutunlar.il] || "").toString().trim();
      var tarihHam = satir[sutunlar.tarih];
      var tarih = parseTarih(tarihHam);

      // Boş/eksik zorunlu alan taşıyan satırlar sessizce atlanır.
      if (!ad || !il || !tarih) {
        if (ad || il || tarihHam) atlananSayisi++; // tamamen boş satırları saymıyoruz
        continue;
      }

      if (!gecerliIlSeti[il]) {
        atlananSayisi++;
        continue;
      }

      if (sutunlar.durum > -1) {
        var durumHam = (satir[sutunlar.durum] || "").toString();
        var durumNorm = normalizeBaslik(durumHam);
        if (DOGRULANMIS_DEGERLER.indexOf(durumNorm) === -1) {
          atlananSayisi++;
          continue;
        }
      }

      var donem = sutunlar.donem > -1 ? (satir[sutunlar.donem] || "").toString().trim() : "";
      if (donem) donemler[donem] = true;

      // Veri minimizasyonu: "Dönem" bilgisi yalnızca aşağıdaki
      // meta.kapsam alanında, toplulaştırılmış tek bir özet metni olarak
      // dışa aktarılır. Site hiçbir kayıtta "donem" alanını tek tek
      // kullanmadığından, her satırda tekrarlanan gereksiz bir sütun
      // olarak herkese açık uca taşınmaz.
      kayitlar.push({
        adSoyad: ad,
        sehadetTarihi: tarih,
        memleket: il
      });
    }

    var kapsam = Object.keys(donemler);

    return jsonCikti({
      meta: {
        durum: kayitlar.length > 0 ? "yayinda" : "veri_bekleniyor",
        kaynak: "Google Sheets (elle doğrulanmış veri girişi)",
        kapsam: kapsam.length ? kapsam.join(", ") : null,
        sonGuncelleme: new Date().toISOString(),
        toplamKayit: kayitlar.length
      },
      kayitlar: kayitlar,
      atlananSatirSayisi: atlananSayisi
    });
  } catch (hata) {
    // Ham istisna mesajı herkese açık, kimlik doğrulaması olmayan bu uca
    // ASLA döndürülmez (iç uygulama/çalışma zamanı detayı sızdırabilir).
    // Tanılama için yalnızca Apps Script'in kendi Yürütme Günlüğü'ne
    // (Executions / Stackdriver) yazılır — bunu yalnızca proje sahibi,
    // kendi Apps Script editöründen görebilir.
    console.error("doGet beklenmeyen hata: " + hata.message);
    return jsonCikti({
      meta: { durum: "veri_bekleniyor", kaynak: null, kapsam: null, sonGuncelleme: null, toplamKayit: 0 },
      kayitlar: [],
      hata: "Beklenmeyen bir hata oluştu. Ayrıntılar için Apps Script projenizdeki Yürütme Günlüğü'nü (Executions) kontrol edin."
    });
  }
}

function sehitlerSayfasiniBul() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sayfalar = ss.getSheets();
  for (var i = 0; i < sayfalar.length; i++) {
    if (normalizeBaslik(sayfalar[i].getName()) === SHEET_ADI_NORMALIZE) {
      return sayfalar[i];
    }
  }
  return null;
}

function sutunIndeksleriniBul(basliklar) {
  var normBasliklar = basliklar.map(normalizeBaslik);

  function bul(adaylar) {
    for (var i = 0; i < adaylar.length; i++) {
      var idx = normBasliklar.indexOf(adaylar[i]);
      if (idx > -1) return idx;
    }
    return -1;
  }

  return {
    ad: bul(["adsoyad"]),
    tarih: bul(["sehadettarihi"]),
    il: bul(["memleket"]),
    donem: bul(["donem"]),
    durum: bul(["dogrulamadurumu", "dogrulama"])
  };
}

// Başlıkları ve doğrulama değerlerini Türkçe karakter/boşluk/büyük-küçük
// harf farklarından bağımsız karşılaştırmak için sadeleştirir.
// Örn: "Şehadet Tarihi", "sehadet_tarihi", "ŞEHADET TARİHİ" → "sehadettarihi"
function normalizeBaslik(s) {
  if (!s) return "";
  var metin = s.toString().trim();
  metin = metin.replace(/İ/g, "i").replace(/I/g, "i").replace(/ı/g, "i");
  metin = metin.toLocaleLowerCase("tr");
  metin = metin
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/[\s_]/g, "");
  return metin;
}

// Şehadet tarihini GG.AA.YYYY, GG/AA/YYYY, YYYY-AA-GG biçimlerinden veya
// bir Sheets Date hücresinden okuyup her zaman "GG.AA.YYYY" döndürür.
// Tanınmayan/geçersiz biçimler için null döner (satır atlanır).
function parseTarih(deger) {
  if (!deger) return null;

  if (Object.prototype.toString.call(deger) === "[object Date]") {
    return Utilities.formatDate(deger, Session.getScriptTimeZone(), "dd.MM.yyyy");
  }

  var s = deger.toString().trim();
  if (!s) return null;

  var m;
  if ((m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/))) return s;
  if ((m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) return m[1] + "." + m[2] + "." + m[3];
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return m[3] + "." + m[2] + "." + m[1];

  return null;
}

function jsonCikti(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
