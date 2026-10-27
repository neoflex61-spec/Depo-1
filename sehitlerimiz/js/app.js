(function () {
  "use strict";

  var state = {
    iller: [],
    kayitlar: [],
    meta: null,
    aktifIl: ""
  };

  var els = {
    banner: document.getElementById("durum-banner"),
    statCard: document.getElementById("toplam-kart"),
    statValue: document.getElementById("toplam-deger"),
    aramaInput: document.getElementById("arama-input"),
    ilSelect: document.getElementById("il-select"),
    sonucSayaci: document.getElementById("sonuc-sayaci"),
    ilGrid: document.getElementById("il-grid"),
    listeDurum: document.getElementById("liste-durum"),
    kayitListe: document.getElementById("kayit-liste"),
    kaynakAdi: document.getElementById("kaynak-adi"),
    sonGuncelleme: document.getElementById("son-guncelleme")
  };

  function turkceKucult(s) {
    return (s || "")
      .toString()
      .replace(/İ/g, "i")
      .replace(/I/g, "ı")
      .toLocaleLowerCase("tr-TR");
  }

  // Arama kutusunda kullanıcının klavyesi Türkçe karakter (ı/İ, ş, ğ, ç, ö, ü)
  // üretmeyebilir; bu yüzden arama eşleştirmesi noktalı/noktasız i ve aksan
  // farklarını yok sayar. Görüntüleme ve sıralama bu sadeleştirmeyi kullanmaz.
  function aramaIcinSadele(s) {
    return turkceKucult(s)
      .replace(/ı/g, "i")
      .replace(/ş/g, "s")
      .replace(/ğ/g, "g")
      .replace(/ç/g, "c")
      .replace(/ö/g, "o")
      .replace(/ü/g, "u");
  }

  function tarihBicimle(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
    } catch (e) {
      return iso;
    }
  }

  function veriGeldiMi() {
    return !!(state.meta && state.meta.durum === "yayinda" && state.kayitlar.length > 0);
  }

  function veriYukle() {
    var apiUrl = (window.SEHITLERIMIZ_CONFIG && window.SEHITLERIMIZ_CONFIG.apiUrl) || "";
    var kaynakPromise;

    if (apiUrl) {
      kaynakPromise = fetch(apiUrl, { cache: "no-store" })
        .then(function (r) {
          if (!r.ok) throw new Error("API yanıtı başarısız: " + r.status);
          return r.json();
        })
        .catch(function (err) {
          console.warn("Apps Script API'den veri alınamadı, yerel data/sehitler.json kullanılacak:", err);
          return fetch("data/sehitler.json", { cache: "no-store" }).then(function (r) { return r.json(); });
        });
    } else {
      kaynakPromise = fetch("data/sehitler.json", { cache: "no-store" }).then(function (r) { return r.json(); });
    }

    return Promise.all([
      fetch("data/iller.json", { cache: "no-store" }).then(function (r) { return r.json(); }),
      kaynakPromise
    ]).then(function (sonuclar) {
      state.iller = sonuclar[0] || [];
      var veri = sonuclar[1] || {};
      state.meta = veri.meta || { durum: "veri_bekleniyor" };
      state.kayitlar = Array.isArray(veri.kayitlar) ? veri.kayitlar : [];
    }).catch(function (err) {
      console.error("Veri yüklenemedi:", err);
      state.iller = [];
      state.kayitlar = [];
      state.meta = { durum: "veri_bekleniyor" };
    });
  }

  function ilSelectDoldur() {
    state.iller.forEach(function (ilKaydi) {
      var opt = document.createElement("option");
      opt.value = ilKaydi.il;
      opt.textContent = ilKaydi.il;
      els.ilSelect.appendChild(opt);
    });
  }

  function ilSayilariniHesapla() {
    var sayac = {};
    state.kayitlar.forEach(function (k) {
      sayac[k.memleket] = (sayac[k.memleket] || 0) + 1;
    });
    return sayac;
  }

  function ilGridCiz() {
    var sayac = ilSayilariniHesapla();
    var veriVar = veriGeldiMi();
    els.ilGrid.innerHTML = "";

    state.iller.forEach(function (ilKaydi) {
      var sayi = sayac[ilKaydi.il] || 0;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "il-kart" + (state.aktifIl === ilKaydi.il ? " aktif" : "");
      btn.setAttribute("data-il", ilKaydi.il);

      var adSpan = document.createElement("span");
      adSpan.textContent = ilKaydi.il;

      var sayiSpan = document.createElement("span");
      sayiSpan.className = "il-sayi" + (sayi === 0 ? " sifir" : "");
      sayiSpan.textContent = veriVar ? String(sayi) : "—";

      btn.appendChild(adSpan);
      btn.appendChild(sayiSpan);
      btn.addEventListener("click", function () {
        state.aktifIl = state.aktifIl === ilKaydi.il ? "" : ilKaydi.il;
        els.ilSelect.value = state.aktifIl;
        render();
      });
      els.ilGrid.appendChild(btn);
    });
  }

  function listeyiFiltrele() {
    var aramaMetni = aramaIcinSadele(els.aramaInput.value.trim());
    var il = state.aktifIl;
    return state.kayitlar.filter(function (k) {
      var ilUyar = !il || k.memleket === il;
      var adUyar = !aramaMetni || aramaIcinSadele(k.adSoyad).indexOf(aramaMetni) !== -1;
      return ilUyar && adUyar;
    });
  }

  function kayitListesiCiz() {
    els.kayitListe.innerHTML = "";

    if (!veriGeldiMi()) {
      els.listeDurum.textContent = "Henüz görüntülenecek doğrulanmış kayıt bulunmuyor.";
      els.sonucSayaci.textContent = "";
      return;
    }

    var filtreli = listeyiFiltrele();
    els.sonucSayaci.textContent = filtreli.length + " kayıt gösteriliyor (toplam " + state.kayitlar.length + " kayıt içinde).";
    els.listeDurum.textContent = filtreli.length === 0 ? "Arama kriterlerinize uyan kayıt bulunamadı." : "";

    filtreli
      .slice()
      .sort(function (a, b) { return a.adSoyad.localeCompare(b.adSoyad, "tr"); })
      .forEach(function (k) {
        var li = document.createElement("li");

        var adSpan = document.createElement("span");
        adSpan.className = "k-ad";
        adSpan.textContent = k.adSoyad;

        var tarihSpan = document.createElement("span");
        tarihSpan.className = "k-tarih";
        tarihSpan.textContent = k.sehadetTarihi || "—";

        var ilSpan = document.createElement("span");
        ilSpan.className = "k-il";
        ilSpan.textContent = k.memleket || "—";

        li.appendChild(adSpan);
        li.appendChild(tarihSpan);
        li.appendChild(ilSpan);
        els.kayitListe.appendChild(li);
      });
  }

  function basliklariCiz() {
    var veriVar = veriGeldiMi();
    els.banner.hidden = veriVar;

    if (veriVar) {
      els.statCard.classList.remove("beklemede");
      els.statValue.textContent = state.kayitlar.length.toLocaleString("tr-TR");
    } else {
      els.statCard.classList.add("beklemede");
      els.statValue.textContent = "Veri Bekleniyor";
    }

    els.kaynakAdi.textContent = (state.meta && state.meta.kaynak) || "Henüz bağlanmadı";
    els.sonGuncelleme.textContent = (state.meta && state.meta.sonGuncelleme) ? tarihBicimle(state.meta.sonGuncelleme) : "—";
  }

  function render() {
    basliklariCiz();
    ilGridCiz();
    kayitListesiCiz();
  }

  function olaylariBagla() {
    var debounceTimer = null;
    els.aramaInput.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(render, 120);
    });
    els.ilSelect.addEventListener("change", function () {
      state.aktifIl = els.ilSelect.value;
      render();
    });
  }

  veriYukle().then(function () {
    ilSelectDoldur();
    olaylariBagla();
    render();
  });
})();
