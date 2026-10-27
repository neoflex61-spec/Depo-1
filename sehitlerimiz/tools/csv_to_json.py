#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ŞEHİTLERİMİZ — CSV/Excel (CSV olarak dışa aktarılmış) içe aktarma aracı.

Google Sheets/Apps Script entegrasyonunu kullanmak istemeyenler için:
elle doğrulanmış kayıtları bir CSV dosyasından sitenin okuduğu
data/sehitler.json formatına dönüştürür.

Girdi CSV sütunları (başlık satırı zorunlu, bu adlarla, bu sırayla
olması gerekmez ama bu adlar aranır):
    ad_soyad, sehadet_tarihi, memleket, donem, dogrulama

- "memleket" değeri data/iller.json içindeki 81 il adından biri
  OLMALIDIR; değilse satır atlanır ve uyarı yazılır (yazım hatalarının
  sessizce veriye girmesini önler).
- "dogrulama" sütunu tam olarak "evet", "doğrulandı" veya "dogrulandi"
  (büyük/küçük harf duyarsız) DEĞİLSE satır dışa aktarılmaz. Böylece
  sadece elle doğrulanmış kayıtlar siteye ulaşır.
- "sehadet_tarihi" GG.AA.YYYY veya YYYY-AA-GG biçiminde olmalıdır.

Kullanım:
    python3 csv_to_json.py girdi.csv \\
        --kaynak "Elle doğrulanmış CSV içe aktarımı" \\
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
    (re.compile(r"^\d{4}-\d{2}-\d{2}$"), "%Y-%m-%d"),
]

DOGRULANMIS_DEGERLER = {"evet", "doğrulandı", "dogrulandi", "e", "true"}


def il_listesini_yukle(betik_dizini: Path):
    il_dosyasi = betik_dizini.parent / "data" / "iller.json"
    with open(il_dosyasi, "r", encoding="utf-8") as f:
        iller = json.load(f)
    return {kayit["il"] for kayit in iller}


def tarihi_dogrula_ve_bicimle(deger: str):
    deger = deger.strip()
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
        gerekli = {"ad_soyad", "sehadet_tarihi", "memleket", "dogrulama"}
        eksik = gerekli - set(okuyucu.fieldnames or [])
        if eksik:
            print(f"HATA: CSV'de şu sütunlar eksik: {', '.join(sorted(eksik))}", file=sys.stderr)
            sys.exit(1)

        for satir_no, satir in enumerate(okuyucu, start=2):
            ad = (satir.get("ad_soyad") or "").strip()
            il = (satir.get("memleket") or "").strip()
            tarih_ham = (satir.get("sehadet_tarihi") or "").strip()
            donem = (satir.get("donem") or "").strip() or None
            dogrulama = (satir.get("dogrulama") or "").strip().lower()

            if not ad:
                print(f"UYARI: Satır {satir_no} atlandı — ad_soyad boş.", file=sys.stderr)
                atlanan += 1
                continue

            if dogrulama not in DOGRULANMIS_DEGERLER:
                print(f"UYARI: Satır {satir_no} atlandı — '{ad}' doğrulanmamış (dogrulama='{dogrulama}').", file=sys.stderr)
                atlanan += 1
                continue

            if il not in gecerli_iller:
                print(f"UYARI: Satır {satir_no} atlandı — '{il}' geçerli bir il adı değil (satır: '{ad}').", file=sys.stderr)
                atlanan += 1
                continue

            tarih = tarihi_dogrula_ve_bicimle(tarih_ham)
            if tarih is None:
                print(f"UYARI: Satır {satir_no} atlandı — tarih biçimi geçersiz: '{tarih_ham}' (satır: '{ad}').", file=sys.stderr)
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
