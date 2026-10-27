/*
 * ŞEHİTLERİMİZ — Veri kaynağı yapılandırması.
 *
 * apiUrl: Google Apps Script'ten "Web Uygulaması" olarak yayınladığınız
 * doGet adresi (örn. https://script.google.com/macros/s/XXXXXXXX/exec).
 * Bu adres BİR HESAP ŞİFRESİ VEYA GİZLİ ANAHTAR DEĞİLDİR — yalnızca
 * herkese açık, salt okunur bir JSON uç noktasıdır. Apps Script projesi
 * "Yürütme: Ben" + "Erişim: Herkes" olarak yayınlandığında, uç nokta
 * sadece doğrulanmış şehit kayıtlarını okuyarak döndürür; yazma (ekleme/
 * silme) işlemi bu adres üzerinden ASLA yapılamaz. Veri girişi/düzenleme
 * yalnızca Google Sheets'in kendi arayüzünde, sahibinin Google hesabıyla
 * giriş yapmasıyla yapılır.
 *
 * apiUrl boş ("") bırakılırsa site otomatik olarak data/sehitler.json
 * dosyasını (CSV/Excel içe aktarma aracıyla üretilen yerel veri) kullanır.
 */
window.SEHITLERIMIZ_CONFIG = {
  apiUrl: ""
};
