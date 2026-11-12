# Atlas Tulangan

Web app edukasi untuk melihat detailing tulangan komponen struktur beton bertulang dalam 3D, lengkap dengan gambar 2D, pemeriksaan syarat SNI 2847:2019, dan penjelasan. Pemilik proyek: mahasiswa Teknik Sipil UGM.

## Menjalankan

Halaman memakai ES module, jadi tidak bisa dibuka langsung lewat file://. Jalankan server lokal dari folder ini:

```
python -m http.server 8765
# atau
npx serve -l 8765 .
```

Lalu buka http://localhost:8765. Three.js r160 dimuat dari CDN jsdelivr lewat importmap di index.html, jadi butuh internet.

## Struktur

- `index.html`: tata letak, CSS, dan importmap. Tidak ada build step.
- `js/app.js`: scene Three.js, kamera, pemotongan (clipping), urai (explode), toggle lapisan, raycast klik, dan semua panel UI. Daftar komponen dan pengelompokan navigasi ada di konstanta `GROUPS`.
- `js/core.js`: utilitas bersama.
  - Rumus: `devLen` (ℓd 25.4.2.3 bentuk sederhana), `ldhGen` (25.4.3.1), `ldhSeis` (18.8.5.1), `ldc` (25.4.9.2), `ashReq` (18.7.5.4).
  - Geometri: `turtle` (pembuat polyline 2D dengan lengkung), `hoop2D` (sengkang tertutup dengan kait 90 atau 135), `crosstie2D`, `rectCage` (susunan tulangan, sengkang, kait silang, dan hx untuk penampang persegi), `lift3D` (helix kecil supaya dua kait sengkang tidak saling tembus).
  - `renderView`: mesin gambar 2D generik. Memproyeksikan atau memotong model 3D yang sama menjadi SVG, jadi gambar selalu sinkron dengan parameter.
- `js/comp/*.js`: satu file per komponen.
- `tools/screenshot_all.py`: uji visual dengan Playwright dan Chrome headless. Membuka setiap komponen di kedua sistem rangka, mencatat pemeriksaan yang gagal, error JavaScript, dan menyimpan screenshot.

## Kontrak komponen

Setiap file di `js/comp/` mengekspor objek:

```js
{
  id, name, sysDependent,           // sysDependent false: pelat, tangga (params disimpan di kunci 'ALL')
  sysName?, sysText?,               // opsional, label sistem khusus (dipakai dinding: biasa vs khusus)
  defaults: { SRPMB:{...}, SRPMK:{...} } atau { ALL:{...} },
  schema: [[judulGrup, [field...]]],  // field: {k,label,unit,min,max,step} | {k,label,opts} | {k,label,type:'bool'}; label dan show boleh fungsi (sys, params)
  teori: { common, SRPMB, SRPMK } atau { common, ALL },  // HTML
  build(params, sys) -> model
}
```

`model` berisi:

- `layers`: `[{k, label, color, ex:[dx,dy,dz]}]`. `ex` adalah perpindahan dalam mm saat slider urai penuh.
- `betonEx`: perpindahan beton saat diurai.
- `concrete`: `[{box:[x0,x1,y0,y1,z0,z1], kind?:'stub'}]`, `{cyl:{x,z,r,y0,y1}}`, atau `{prism:{pts:[[x,y]...], z0, z1}}`.
- `zones`: kotak transparan berwarna untuk daerah khusus seperti 2h, ℓo, dan lewatan.
- `bars`: `[{pts:[[x,y,z]...], d, layer, color, info:{t, b:[...], pasal}, maxSeg?}]`.
- `labels`: `[{p:[x,y,z], t, c?:'conf'|'lap'|'mid'}]`.
- `views`: spesifikasi gambar untuk `renderView`: `{title, sub?, n:'x'|'y'|'z', at?, half?, u, v, layers?, dims?, notes?, skipStub?, w2?, maxH?}`. Tanpa `half` berarti proyeksi penuh. Dengan `half` berarti potongan setebal 2·half di koordinat `at`.
- `checks`: `[{ok:true|false|null, t, d, p}]`. `null` adalah info. `p` adalah nomor pasal, `'praktik'`, atau string yang diawali `SNI`.
- `derived`: HTML nilai turunan. `camDir`, `camK`: arah dan jarak kamera. `cutAxis`: sumbu slider potong. `colorNote` opsional.

## Konvensi

- Satuan mm di semua model. Konversi ke meter (`S = 0.001`) hanya di `app.js`.
- Sumbu y ke atas. Balok dan sloof sepanjang x, kolom sepanjang y.
- Bahasa UI: Bahasa Indonesia formal tetapi kalimat sederhana. Hindari kata informal seperti nggak, cuma, atau mikirin. Hindari tanda pisah panjang.
- Notasi tulangan ulir memakai D, misalnya D10-150, dan baja BjTS 420 sebagai default.
- Warna lapisan diambil dari `COL` di `core.js`. Sengkang diwarnai per zona: `conf` daerah kekang, `mid` daerah biasa, `lap` lewatan.

## Status rujukan SNI

Nomor pasal ditulis dari pengetahuan tentang SNI 2847:2019, yang mengadopsi ACI 318M-14, dan **belum diverifikasi** terhadap dokumen resmi. Prioritas verifikasi:

1. Sengkang joint SRPMB, Pasal 15.4.2 (`hbk.js`). Model memasang dua lapis, tetapi syarat persisnya belum pasti.
2. Rasio spiral tiang SRPMK (`tiang.js`). Sengaja dibuat info, bukan lolos atau gagal, karena rumus kolom 18.7.5.4 mungkin tidak berlaku untuk tiang.
3. Tabel 18.10.6.4(f) untuk Ash elemen batas dinding (`dinding.js`).
4. Pasal 18.13.3.3 untuk dimensi dan spasi sengkang sloof, serta 18.13.4.2 untuk daerah kekang tiang.

Batas yang ditandai `praktik` memang bukan pasal SNI: zona ℓn/4 balok SRPMB, jarak tiang 2,5D, kepala tiang 75 sampai 150 mm, 2R + T, dan panjang tulangan tumpuan pelat ℓx/4.

## Ide lanjutan

- Verifikasi pasal setelah PDF SNI tersedia, lalu hapus label belum diverifikasi.
- Tambahan SRPMM sebagai sistem ketiga.
- Pelat dengan bukaan, balok T, kolom bulat dengan spiral, dan dinding penahan tanah.
- Ekspor gambar SVG dan daftar potong tulangan (bar bending schedule).
- Deploy ke GitHub Pages atau Vercel. Proyek ini statis, jadi cukup unggah foldernya.
