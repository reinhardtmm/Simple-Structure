# Atlas Tulangan

Model 3D interaktif detailing tulangan komponen struktur beton bertulang menurut SNI 2847:2019, dengan pilihan SRPMB dan SRPMK.

Komponen yang tersedia: pelat lantai, balok, kolom, hubungan balok-kolom, dinding geser, tangga, sloof, fondasi telapak, serta tiang bor dan pile cap.

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
