# Atlas Tulangan

Web app edukasi untuk melihat detailing tulangan komponen struktur beton bertulang dan elemen praktis bangunan sederhana (pasangan bata, kolom praktis, sloof praktis, fondasi batu kali) dalam 3D, lengkap dengan gambar 2D, pemeriksaan syarat SNI 2847:2019, dan penjelasan. Pemilik proyek: mahasiswa Teknik Sipil UGM.

## Catatan iCloud Drive

Folder proyek berada di iCloud Drive. Saat file sering ditulis ulang, iCloud kadang membuat salinan konflik bernama `nama 2.js` dan file aslinya hilang, sehingga aplikasi gagal dimuat. Bila itu terjadi, bandingkan isinya, lalu kembalikan nama filenya. Periksa juga `git status` sebelum commit.

## Menjalankan

Halaman memakai ES module, jadi tidak bisa dibuka langsung lewat file://. Jalankan server lokal dari folder ini:

```
python -m http.server 8765
# atau
npx serve -l 8765 .
```

Lalu buka http://localhost:8765. Three.js r160 dimuat dari CDN jsdelivr lewat importmap di index.html, jadi butuh internet.

## Struktur

- `index.html`: tata letak, CSS, dan importmap. Tidak ada build step. Gaya mengikuti Apple Human Interface Guidelines: font sistem (SF Pro di perangkat Apple, Inter dari Google Fonts sebagai cadangan), warna sistem HIG sebagai token di `:root`, segmented control, daftar bergrup, dan switch. Jangan kembali ke IBM Plex; pemilik proyek tidak ingin tampilan yang mirip antarmuka Claude. Hanya mode terang.
- `js/app.js`: scene Three.js, kamera, pemotongan (clipping), urai (explode), toggle lapisan, raycast klik, dan semua panel UI. Daftar komponen dan pengelompokan navigasi ada di konstanta `GROUPS`, diurutkan menurut urutan pelaksanaan (1 Fondasi, 2 Sloof, 3 Kolom dan dinding geser, 4 Balok dan pelat, 5 Tangga, 6 Pasangan dinding) ditambah kelompok Hubungan tanpa nomor. Kelompok Hubungan berisi hbk dan `gabungan` (mode gabungan).
- `js/core.js`: utilitas bersama.
  - Rumus: `devLen` (ℓd Tabel 25.4.2.2, bentuk sederhana), `ldhGen` (25.4.3.1), `ldhSeis` (18.8.5.1), `ldc` (25.4.9.2), `ashReq` (18.7.5.4).
  - Geometri: `turtle` (pembuat polyline 2D dengan lengkung), `hoop2D` (sengkang tertutup dengan kait 90 atau 135), `crosstie2D`, `rectCage` (susunan tulangan, sengkang, kait silang, dan hx untuk penampang persegi), `lift3D` (helix kecil supaya dua kait sengkang tidak saling tembus).
  - Pasangan: `BATA` (ukuran nominal SNI 15-2094-2000 dan bata ringan), `MAT` (warna material non-beton), `SPESI` (campuran dan penggunaannya), `bataWall` (menyusun bata per lapis dengan ikatan ½ atau 1 bata, gigi ke kolom, dan menghitung bata serta spesi per m²), `bentBar` (tulangan dengan bengkokan 90° di kedua ujung), `trapesium`, `rng` (acak dengan seed tetap), `rubble` (menyusun batu kali tak beraturan per lapis di penampang yang lebarnya berubah, termasuk aanstamping berdiri), `rockVol`, serta teks rujukan `PU`, `REF_PRAKTIS`, `NOTE_PRAKTIS`.
  - `renderView`: mesin gambar 2D generik. Memproyeksikan atau memotong model 3D yang sama menjadi SVG, jadi gambar selalu sinkron dengan parameter.
- `js/comp/*.js`: satu file per komponen.
- `js/comp/gabungan.js`: mode gabungan. Satu portal (kolom di x = 0 dan x = Lb, y = 0 di atas sloof) yang menyambungkan fondasi kolom (telapak, tiang, atau tanpa), fondasi batu kali, sloof, kolom, balok, pelat, serta dinding bata dengan kolom praktis otomatis. Setiap komponen bisa dimatikan lewat parameter bool, dan sambungannya (kait kolom di fondasi dan joint, kait balok dan sloof di kolom, sengkang joint, angkur) ikut muncul atau hilang. Model ini membangun geometrinya sendiri dengan helper `core.js`, bukan memanggil `build()` komponen lain, dan pemeriksaannya hanya untuk sambungan antar komponen.
- `tools/screenshot_all.py`: uji visual dengan Playwright dan Chrome headless. Membuka setiap komponen di kedua sistem rangka, mencatat pemeriksaan yang gagal, error JavaScript, dan menyimpan screenshot.

## Kontrak komponen

Setiap file di `js/comp/` mengekspor objek:

```js
{
  id, name, sysDependent,           // sysDependent false: pelat, tangga (params disimpan di kunci 'ALL')
  sysName?, sysText?,               // opsional, label sistem khusus (dipakai dinding: biasa vs khusus)
  std?, ref?, checkNote?,           // opsional untuk elemen non-SNI 2847: label standar di header, teks rujukan di tab Penjelasan, catatan di tab Cek
  defaults: { SRPMB:{...}, SRPMK:{...} } atau { ALL:{...} },
  schema: [[judulGrup, [field...]]],  // field: {k,label,unit,min,max,step} | {k,label,opts} | {k,label,type:'bool'}; label dan show boleh fungsi (sys, params)
  teori: { common, SRPMB, SRPMK } atau { common, ALL },  // HTML
  build(params, sys) -> model
}
```

`model` berisi:

- `layers`: `[{k, label, color, ex:[dx,dy,dz], block?, off?}]`. `ex` adalah perpindahan dalam mm saat slider urai penuh. `block:true` untuk lapisan material (bata, spesi, batu) yang ikut disembunyikan oleh tombol Tulangan saja. `off:true` membuat lapisan mati secara bawaan.
- `betonEx`: perpindahan beton saat diurai.
- `concrete`: `[{box:[x0,x1,y0,y1,z0,z1], kind?:'stub'}]`, `{boxes:[[...],...]}` (banyak kotak digabung jadi satu geometri, misalnya bata), `{cyl:{x,z,r,y0,y1}}`, `{prism:{pts:[[x,y]...], z0, z1}}`, atau `{prism:{axis:'x', pts:[[z,y]...], x0, x1}}`, atau `{rocks:[{c, s, r}]}` (batu berupa ikosahedron yang diskalakan dan diputar; di 2D digambar sebagai elips). Setiap item boleh punya `mat` (kunci `MAT`, mis. 'bata', 'spesi', 'batu') dan `layer` (grup toggle sendiri; tanpa `layer` masuk grup 'beton'). Di gambar 2D, item yang didaftarkan lebih dulu tergambar di bawah, jadi spesi harus sebelum bata.
- `zones`: kotak transparan berwarna untuk daerah khusus seperti 2h, ℓo, dan lewatan.
- `bars`: `[{pts:[[x,y,z]...], d, layer, color, info:{t, b:[...], pasal}, maxSeg?}]`.
- `labels`: `[{p:[x,y,z], t, c?:'conf'|'lap'|'mid', follow?}]`. `follow` adalah kunci lapisan; label ikut bergeser saat diurai dan disembunyikan bila lapisannya mati.
- `views`: spesifikasi gambar untuk `renderView`: `{title, sub?, n:'x'|'y'|'z', at?, half?, u, v, layers?, dims?, notes?, skipStub?, skipMat?:[...], w2?, maxH?}`. Tanpa `half` berarti proyeksi penuh. Dengan `half` berarti potongan setebal 2·half di koordinat `at`.
- `checks`: `[{ok:true|false|null, t, d, p}]`. `null` adalah info. `p` yang diawali `Pasal` atau `Tabel` otomatis diberi awalan SNI 2847:2019; `'praktik'` ditampilkan sebagai praktik umum; selain itu ditulis apa adanya (mis. 'SNI 15-2094-2000' atau konstanta `PU`).
- `derived`: HTML nilai turunan. `camDir`, `camK`: arah dan jarak kamera. `cutAxis`: sumbu slider potong. `colorNote` opsional.

## Konvensi

- Satuan mm di semua model. Konversi ke meter (`S = 0.001`) hanya di `app.js`.
- Sumbu y ke atas. Balok dan sloof sepanjang x, kolom sepanjang y.
- Bahasa UI: Bahasa Indonesia formal tetapi kalimat sederhana. Hindari kata informal seperti nggak, cuma, atau mikirin. Hindari tanda pisah panjang.
- Notasi tulangan ulir memakai D, misalnya D10-150, dan baja BjTS 420 sebagai default.
- Warna lapisan diambil dari `COL` di `core.js`. Sengkang diwarnai per zona: `conf` daerah kekang, `mid` daerah biasa, `lap` lewatan.

## Status rujukan SNI

SNI 2847:2019 adalah adopsi modifikasi (MOD) dari ACI 318M-14. Beberapa bagian sudah memakai isi ACI 318-19, misalnya Tabel 18.7.5.4 dengan faktor kf dan kn. Semua nomor pasal di kode sudah dicocokkan dengan PDF SNI 2847:2019 pada November 2026. Hal yang perlu diingat saat mengubah kode:

- Joint SRPMB (`hbk.js`) memakai 15.4.2: Av ≥ maks(0,062√fc', 0,35)·b·s/fyt, disebar sepanjang tinggi balok (15.4.2.1), dengan s ≤ h/2 balok terendah (15.4.2.2).
- Kuat geser joint (Tabel 18.8.4.1) memakai koefisien 1,7 untuk 4 sisi, 1,2 untuk 3 sisi atau 2 sisi berlawanan, dan 1,0 untuk kasus lainnya.
- Tiang SRPMK (`tiang.js`) memakai 18.13.4.3: daerah kekang maks(5D; 1,8 m), serta 18.7.5.2(a) sampai (e), 18.7.5.3, dan Tabel 18.7.5.4 kecuali baris (c) dan (f). Rasio spiral (d) dan (e) karena itu berupa pemeriksaan lolos atau gagal.
- Sloof: menerus dan diangkur di 18.13.3.1; dimensi ≥ jarak bersih antar kolom/20 dan sengkang ≤ min(b/2; 300) di 18.13.3.2; lentur dari kolom di 18.13.3.3 (ikut 18.6).
- Fondasi: kait stek ke arah pusat kolom di 18.13.2.2; tulangan transversal kolom di dekat tepi fondasi di 18.13.2.3; anyaman atas akibat gaya angkat di 18.13.2.4.
- Elemen batas dinding 18.10.6.4(e): hx ≤ min(350; 2/3 tebal) dan s ≤ 1/3 dimensi terkecil. `dinding.js` otomatis menambah baris tulangan tengah arah tebal bila perlu. Tulangan horizontal badan diatur di (h).
- Tebal minimum pelat satu arah (Tabel 7.3.1.1) hanya dikali (0,4 + fy/700) bila fy > 420 MPa (7.3.1.1.1).

Batas yang belum dimodelkan karena butuh gaya dalam: baris (c) Tabel 18.7.5.4 untuk Pu > 0,3Ag fc', syarat 11.6.2 untuk dinding dengan Vu > 0,5Vc, dan pengecualian rasio dinding khusus bila Vu ≤ 0,083Acv√fc'.

## Rujukan elemen praktis (belum diverifikasi)

Komponen `batukali`, `sloofpraktis`, `kolompraktis`, dan `bata` tidak diatur SNI 2847:2019. Batasnya diambil dari sumber berikut dan belum dicocokkan dengan dokumen resminya:

- Persyaratan teknis bangunan gedung sederhana tahan gempa dari Kementerian PU, dibaca dari lampiran Perbup Fakfak tentang penyelenggaraan bangunan gedung: dinding maks 9 m² dan jarak kolom maks 3 m; spesi dan plester 1:4, plester 2 cm; angkur dinding Ø10 panjang ≥ 40 cm tiap 6 lapis; angkur fondasi ke sloof Ø10 jarak ≤ 1 m; tulangan kolom ke sloof dan ring ≥ 40d atau 40 cm; begel 135° ≥ 5 cm.
- Ringkasan sekunder buku saku PU: kolom 15×15 cm 4Ø10 begel Ø8-150 selimut 1,5 cm; sloof min 15×20 cm; fondasi batu kali dalam 60 cm, lebar atas 30 cm, bawah 60 cm. Ring balok 12×15 cm dari artikel, sehingga ditandai `praktik`.
- SNI 15-2094-2000 untuk ukuran bata merah pejal (dikonfirmasi beberapa jurnal; satu sumber menulis lebar M-5a 92 mm).
- SNI 6882:2014 untuk tipe mortar M, S, N, O (17,2; 12,4; 5,2; 2,4 MPa) dari ringkasan sekunder; proporsi volumenya belum ditemukan.

Batas yang ditandai `praktik` memang bukan pasal SNI: zona ℓn/4 balok SRPMB, jarak tiang 2,5D, kepala tiang 75 sampai 150 mm, 2R + T, dan panjang tulangan tumpuan pelat ℓx/4. Juga tebal spesi 8 sampai 15 mm (bata ringan 2 sampai 5 mm), aanstamping 100 sampai 200 mm, kemiringan fondasi batu kali ≥ 60°, dan ukuran ring balok.

## Ide lanjutan

- Tambahan SRPMM sebagai sistem ketiga.
- Pelat dengan bukaan, balok T, kolom bulat dengan spiral, dan dinding penahan tanah.
- Ekspor gambar SVG dan daftar potong tulangan (bar bending schedule).
- Deploy ke GitHub Pages atau Vercel. Proyek ini statis, jadi cukup unggah foldernya.
