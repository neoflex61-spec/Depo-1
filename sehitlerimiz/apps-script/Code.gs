/**
 * ŞEHİTLERİMİZ — Google Apps Script veri uç noktası.
 *
 * Bu dosya Google Sheets dosyanıza bağlı bir Apps Script projesine
 * yapıştırılır. Web Uygulaması olarak yayınlandığında, sitenin
 * js/config.js dosyasındaki apiUrl alanına konacak salt-okunur bir
 * JSON adresi üretir. Hiçbir hesap bilgisi, şifre veya gizli anahtar
 * bu kodun İÇİNDE veya ÇIKTISINDA bulunmaz; yetkilendirme tamamen
 * Google'ın kendi "Dağıt > Web Uygulaması" akışında yapılır.
 *
 * Beklenen sayfa adı: "Sehitler"
 * Beklenen sütun başlıkları (ilk satır, bu sırayla):
 *   Ad Soyad | Sehadet Tarihi | Memleket | Donem | Dogrulama Durumu
 *
 * - "Dogrulama Durumu" sütunu "Doğrulandı" DIŞINDA bir değer taşıyan
 *   satırlar asla dışa aktarılmaz (yayınlanmamış/şüpheli kayıtlar
 *   siteye hiç ulaşmaz).
 * - "Donem" sütunu (örn. "Güncel Dönem", "1853-1928 Dönemi") tarihsel
 *   ve güncel kayıt gruplarının birbirine karışmaması için tutulur;
 *   şu an site tek bir liste gösterdiğinden, farklı dönemleri aynı
 *   sayfada tutuyorsanız içe aktarmadan önce ayrıştırmanız önerilir.
 */

var SHEET_ADI = "Sehitler";
var DOGRULANMIS_DEGER = "doğrulandı";

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_ADI);

  if (!sheet) {
    return jsonCikti({
      meta: { durum: "veri_bekleniyor", kaynak: null, kapsam: null, sonGuncelleme: null, toplamKayit: 0 },
      kayitlar: [],
      hata: "'" + SHEET_ADI + "' adlı sayfa bulunamadı."
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
  var idxAd = basliklar.indexOf("Ad Soyad");
  var idxTarih = basliklar.indexOf("Sehadet Tarihi");
  var idxIl = basliklar.indexOf("Memleket");
  var idxDonem = basliklar.indexOf("Donem");
  var idxDurum = basliklar.indexOf("Dogrulama Durumu");

  var kayitlar = [];
  var donemler = {};

  for (var i = 1; i < veriler.length; i++) {
    var satir = veriler[i];
    if (!satir[idxAd]) continue;

    var durum = (idxDurum > -1 ? satir[idxDurum] : "").toString().trim().toLocaleLowerCase("tr");
    if (durum !== DOGRULANMIS_DEGER) continue;

    var donem = idxDonem > -1 ? satir[idxDonem].toString().trim() : "";
    if (donem) donemler[donem] = true;

    kayitlar.push({
      adSoyad: satir[idxAd].toString().trim(),
      sehadetTarihi: tarihStringYap(satir[idxTarih]),
      memleket: satir[idxIl] ? satir[idxIl].toString().trim() : "",
      donem: donem || null
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
    kayitlar: kayitlar
  });
}

function tarihStringYap(deger) {
  if (!deger) return null;
  if (Object.prototype.toString.call(deger) === "[object Date]") {
    return Utilities.formatDate(deger, Session.getScriptTimeZone(), "dd.MM.yyyy");
  }
  return deger.toString().trim();
}

function jsonCikti(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
