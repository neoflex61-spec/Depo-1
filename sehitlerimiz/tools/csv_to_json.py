#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ŞEHİTLERİMİZ — CSV/Excel (CSV olarak dışa aktarılmış) içe aktarma aracı.

Google Sheets/Apps Script entegrasyonunu kullanmak istemeyenler için:
elle doğrulanmış kayıtları bir CSV dosyasından sitenin okuduğu
data/sehitler.json formatına dönüştürür.

NOT: Bu araç MSB Şehit Bilgi Kapısı'ndan OTOMATİK veri çekmez (böyle
bir kamuya açık API bulunmamaktadır). CSV'ye girilecek her satır,
kaynağı sizin tarafınızdan elle doğrulanmış olmalıdır.

Girdi CSV başlıkları (büyük/küçük harf, Türkçe karakter, boşluk/alt
çizgi farkları önemli değildir — "Ad Soyad", "ad_soyad", "AD SOYAD"
hepsi aynı sütun olarak tanınır):

    ZORUNLU : Ad Soyad | Şehadet Tarihi | Memleket
    OPSİYONEL: Dönem | Doğrulama Durumu

- "Memleket" değeri, data/iller.json içindeki 81 il adından biri
  OLMALIDIR; değilse satır atlanır ve uyarı yazılır (yazım hatalarının
  sessizce veriye girip il sayaçlarını bozmasını önler).
- "Doğrulama Durumu" sütunu eklerseniz, yalnızca "Doğrulandı" / "Evet"
  (büyük/küçük harf duyarsız) yazan satırlar dışa aktarılır. Bu sütunu
  HİÇ eklemezseniz, CSV'deki tüm dolu satırlar zaten elle doğruladığınız
  varsayılarak aktarılır — bu yüzden CSV'ye yalnızca kaynağını
  doğruladığınız kayıtları girin.
- "Şehadet Tarihi" GG.AA.YYYY, GG/AA/YYYY veya YYYY-AA-GG biçiminde
  olmalıdır.
- Ad Soyad, Şehadet Tarihi veya Memleket boş olan satırlar her zaman
  atlanır.

Kullanım:
    python3 csv_to_json.py girdi.csv \\
        --kaynak "MSB Şehit Bilgi Kapısı'ndan elle doğrulanmış içe aktarım" \\
        --kapsam "Güncel Dönem" \\
        --cikti ../data/sehitler.json
"""

import argparse
import csv
import json
import re
import sys
from datetime import datetime
from pathlib import Path

TARIH_DESENLERI = [
    (re.compile(r"^\d{2}\.\d{2}\.\d{4}$"), "%d.%m.%Y"),
    (re.compile(r"^\d{2}/\d{2}/\d{4}$"), "%d/%m/%Y"),
    (re.compile(r"^\d{4}-\d{2}-\d{2}$"), "%Y-%m-%d"),
]

DOGRULANMIS_DEGERLER = {"dogrulandi", "evet", "e", "true"}

AD_SOYAD_ADAYLARI = {"adsoyad"}
TARIH_ADAYLARI = {"sehadettarihi"}
MEMLEKET_ADAYLARI = {"memleket"}
DONEM_ADAYLARI = {"donem"}
DOGRULAMA_ADAYLARI = {"dogrulamadurumu", "dogrulama"}


def sadelestir(s: str) -> str:
    """Türkçe karakter/boşluk/alt çizgi/büyük-küçük harf farklarını yok sayar.
    Örn: "Şehadet Tarihi", "sehadet_tarihi", "ŞEHADET TARİHİ" -> "sehadettarihi"
    """
    s = (s or "").strip()
    s = s.replace("İ", "i").replace("I", "i").replace("ı", "i")
    s = s.lower()
    for a, b in (("ş", "s"), ("ğ", "g"), ("ç", "c"), ("ö", "o"), ("ü", "u")):
        s = s.replace(a, b)
    s = s.replace(" ", "").replace("_", "")
    return s


def sutun_bul(normalize_harita, adaylar):
    for aday in adaylar:
        if aday in normalize_harita:
            return normalize_harita[aday]
    return None


def il_listesini_yukle(betik_dizini: Path):
    il_dosyasi = betik_dizini.parent / "data" / "iller.json"
    with open(il_dosyasi, "r", encoding="utf-8") as f:
        iller = json.load(f)
    return {kayit["il"] for kayit in iller}


def tarihi_dogrula_ve_bicimle(deger: str):
    deger = (deger or "").strip()
    if not deger:
        return None
    for desen, fmt in TARIH_DESENLERI:
        if desen.match(deger):
            try:
                dt = datetime.strptime(deger, fmt)
                return dt.strftime("%d.%m.%Y")
            except ValueError:
                return None
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("girdi_csv", type=Path, help="İçe aktarılacak CSV dosyasının yolu (UTF-8)")
    ap.add_argument("--kaynak", required=True, help="meta.kaynak alanına yazılacak açıklama (örn. 'MSB Şehit Bilgi Kapısı'ndan elle doğrulanmış içe aktarım')")
    ap.add_argument("--kapsam", default=None, help="meta.kapsam alanına yazılacak dönem açıklaması (örn. 'Güncel Dönem' / '1853-1928 Dönemi')")
    ap.add_argument("--cikti", type=Path, default=None, help="Çıktı JSON yolu (varsayılan: data/sehitler.json)")
    args = ap.parse_args()

    betik_dizini = Path(__file__).resolve().parent
    cikti_yolu = args.cikti or (betik_dizini.parent / "data" / "sehitler.json")
    gecerli_iller = il_listesini_yukle(betik_dizini)

    if not args.girdi_csv.exists():
        print(f"HATA: '{args.girdi_csv}' bulunamadı.", file=sys.stderr)
        sys.exit(1)

    kayitlar = []
    atlanan = 0

    with open(args.girdi_csv, "r", encoding="utf-8-sig", newline="") as f:
        okuyucu = csv.DictReader(f)
        baslik_sutunlari = okuyucu.fieldnames or []
        normalize_harita = {sadelestir(h): h for h in baslik_sutunlari}

        ad_sutun = sutun_bul(normalize_harita, AD_SOYAD_ADAYLARI)
        tarih_sutun = sutun_bul(normalize_harita, TARIH_ADAYLARI)
        memleket_sutun = sutun_bul(normalize_harita, MEMLEKET_ADAYLARI)
        donem_sutun = sutun_bul(normalize_harita, DONEM_ADAYLARI)
        dogrulama_sutun = sutun_bul(normalize_harita, DOGRULAMA_ADAYLARI)

        eksik = []
        if ad_sutun is None:
            eksik.append("Ad Soyad")
        if tarih_sutun is None:
            eksik.append("Şehadet Tarihi")
        if memleket_sutun is None:
            eksik.append("Memleket")
        if eksik:
            print(f"HATA: CSV'de şu zorunlu sütunlar bulunamadı: {', '.join(eksik)}", file=sys.stderr)
            sys.exit(1)

        if dogrulama_sutun is None:
            print(
                "UYARI: 'Doğrulama Durumu' sütunu bulunamadı — CSV'deki tüm dolu "
                "satırlar zaten elle doğruladığınız varsayılarak içe aktarılacak.",
                file=sys.stderr,
            )

        for satir_no, satir in enumerate(okuyucu, start=2):
            ad = (satir.get(ad_sutun) or "").strip()
            il = (satir.get(memleket_sutun) or "").strip()
            tarih_ham = (satir.get(tarih_sutun) or "").strip()
            donem = (satir.get(donem_sutun) or "").strip() if donem_sutun else ""
            donem = donem or None

            # Tamamen boş bir satırsa (ör. CSV'deki boş bir satır) sessizce atla.
            if not ad and not il and not tarih_ham:
                continue

            if not ad:
                print(f"UYARI: Satır {satir_no} atlandı — Ad Soyad boş.", file=sys.stderr)
                atlanan += 1
                continue

            if not il:
                print(f"UYARI: Satır {satir_no} atlandı — '{ad}' için Memleket boş.", file=sys.stderr)
                atlanan += 1
                continue

            if not tarih_ham:
                print(f"UYARI: Satır {satir_no} atlandı — '{ad}' için Şehadet Tarihi boş.", file=sys.stderr)
                atlanan += 1
                continue

            if dogrulama_sutun is not None:
                dogrulama = sadelestir(satir.get(dogrulama_sutun) or "")
                if dogrulama not in DOGRULANMIS_DEGERLER:
                    print(f"UYARI: Satır {satir_no} atlandı — '{ad}' doğrulanmamış (Doğrulama Durumu='{satir.get(dogrulama_sutun)}').", file=sys.stderr)
                    atlanan += 1
                    continue

            if il not in gecerli_iller:
                print(f"UYARI: Satır {satir_no} atlandı — '{il}' geçerli bir il adı değil (satır: '{ad}').", file=sys.stderr)
                atlanan += 1
                continue

            tarih = tarihi_dogrula_ve_bicimle(tarih_ham)
            if tarih is None:
                print(f"UYARI: Satır {satir_no} atlandı — tarih biçimi tanınamadı: '{tarih_ham}' (satır: '{ad}'). Beklenen: GG.AA.YYYY, GG/AA/YYYY veya YYYY-AA-GG.", file=sys.stderr)
                atlanan += 1
                continue

            kayitlar.append({
                "adSoyad": ad,
                "sehadetTarihi": tarih,
                "memleket": il,
                "donem": donem
            })

    kapsam_degerleri = sorted({k["donem"] for k in kayitlar if k["donem"]})
    cikti = {
        "meta": {
            "durum": "yayinda" if kayitlar else "veri_bekleniyor",
            "kaynak": args.kaynak,
            "kapsam": args.kapsam or (", ".join(kapsam_degerleri) if kapsam_degerleri else None),
            "sonGuncelleme": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "toplamKayit": len(kayitlar)
        },
        "kayitlar": kayitlar
    }

    cikti_yolu.parent.mkdir(parents=True, exist_ok=True)
    with open(cikti_yolu, "w", encoding="utf-8") as f:
        json.dump(cikti, f, ensure_ascii=False, indent=2)

    print(f"\nTamamlandı: {len(kayitlar)} kayıt içe aktarıldı, {atlanan} satır atlandı.")
    print(f"Çıktı: {cikti_yolu}")


if __name__ == "__main__":
    main()
