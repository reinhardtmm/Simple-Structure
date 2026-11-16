# Atlas Struktur

Model 3D interaktif detailing tulangan komponen struktur beton bertulang menurut SNI 2847:2019, dengan pilihan SRPMB dan SRPMK.

Komponen struktur: pelat lantai, pelat dengan bukaan, balok, balok perangkai (kopel), kolom, kolom bulat dengan spiral, hubungan balok-kolom, dinding geser, tangga, sloof, fondasi telapak, serta tiang bor dan pile cap.

Elemen praktis bangunan sederhana: fondasi batu kali, sloof praktis, kolom praktis, ring balok dan lintel, serta dinding bata. Mode gabungan menyambungkan beberapa komponen menjadi satu model.

## Menjalankan

```
python -m http.server 8765
```

Buka http://localhost:8765.

## Uji visual

```
pip install playwright && playwright install chromium
python -m http.server 8765 &
python tools/screenshot_all.py
```

Detail arsitektur dan konvensi ada di `CLAUDE.md`.
