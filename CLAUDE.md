# Atlas Struktur

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

- `index.html`: tata letak, CSS, dan importmap. Tidak ada build step. Gaya mengikuti Apple Human Interface Guidelines: font sistem (SF Pro di perangkat Apple, Inter dari Google Fonts sebagai cadangan), warna sistem HIG sebagai token di `:root`, segmented control, daftar bergrup, dan switch. Elemen yang melayang di atas model (panel Tampilan di kiri bawah, panel Urutan di kanan bawah, legenda, kartu info, petunjuk) memakai kelas `.lg` (liquid glass: transparan, blur, kilau tepi; `.dense` untuk teks yang lebih padat). Panel kiri dan kanan sengaja tetap solid demi keterbacaan. Pengaturan sistem 'kurangi transparansi' dihormati. Kaca hanya terlihat bila ada sesuatu di belakangnya, jadi `#view` memakai latar bergradasi halus dan renderer dibuat transparan (`alpha:true`). Di Chrome dan Edge, `.lg` memakai filter SVG `#lg-refract` (displacement) di `backdrop-filter` untuk efek pembiasan; browser lain memakai blur biasa. Jangan kembali ke IBM Plex; pemilik proyek tidak ingin tampilan yang mirip antarmuka Claude. Mode terang dan gelap: tombol tema di header berputar Otomatis (ikut sistem), Terang, Gelap, disimpan di `atlas-tulangan-theme`. Token gelap ditulis dua kali (media query sistem dan `:root[data-theme=dark]`), dan aturan gelap per elemen memakai CSS nesting di dalam `body`. Gambar 2D di mode gelap dibalik warnanya dengan `filter: invert(1) hue-rotate(180deg)`. Warna di atas kaca memakai `--glass-text` dan `--glass-sep`.
- `js/app.js`: scene Three.js, kamera, pemotongan (clipping), urai (explode), toggle lapisan, raycast klik, dan semua panel UI. Nilai slider transparansi, potong, dan urai disimpan per komponen di `state.viewBy` (bukan global), termasuk dua ujung slider Potong `cut0` dan `cut` (fraksi sepanjang sumbu potong; bidang `clip2` memotong dari kiri dan `clip` dari kanan, sehingga yang tersisa bagian di antaranya; `inCut()` dipakai untuk label dan klik). Slider Potong adalah dua input range yang ditumpuk di `#cutDual`: mouse dan sentuhan ditangani wadahnya (ujung terdekat yang digeser; bila bertumpuk, arah seret pertama yang menentukan), input range tetap dipakai untuk keyboard, dan kedua ujung boleh bertemu dengan jarak minimum `CUT_GAP`. Simpanan lama dengan `cut2` dikonversi saat dimuat. Label tanpa `follow` ikut kelompoknya saat diurai lewat `autoFollow()`: nama lapisan yang memuat kata di label diutamakan, lalu jarak terdekat. Mode jelajah (tombol Jelajah atau F): WASD/panah bergerak, gerak mouse untuk melihat tanpa klik (Pointer Lock; bila browser menolak, gerak mouse di atas kanvas tetap memutar pandangan), E/Spasi naik, Q turun, Shift cepat, gulir mengubah kecepatan, klik untuk info tulangan di titik bidik tengah, F atau Esc keluar; OrbitControls dimatikan selama mode ini. Pintasan keyboard memakai `isTyping()`: switch, tombol, dan slider tidak dianggap mengetik, sehingga F dan WASD tetap bekerja setelah switch diklik; saat masuk mode jelajah fokus dilepas agar Spasi tidak membalik switch. Loop render dibungkus try/catch karena di three.js satu frame yang melempar galat menghentikan loop selamanya. Scene hanya dirender ulang bila ada perubahan: panggil `invalidate()` setiap kali mengubah sesuatu yang terlihat di 3D (kamera lewat event `change` OrbitControls, `applyView`, `build3D`, `select`, `seqApply`, label); mode jelajah dan tween urutan merender setiap frame. Tulangan dibuat oleh `tubeGeo` (satu cincin per titik polyline, langsung ke typed array, jauh lebih cepat dari TubeGeometry), dan geometrinya disimpan per bentuk (`barKey`, `geoNew`, `geoSpare`) sehingga batang yang tidak berubah dipakai ulang saat model dibangun ulang; jangan me-dispose geometri bertanda `userData.cached` di luar mekanisme itu. Selama panel kiri atau kanan bergeser (kelas `panel-anim`), ukuran buffer WebGL baru diubah setelah animasi selesai. Gambar 2D dibuat saat tab Gambar terbuka (`drawingsLater`). Toggle mode gabungan menunda bangun ulang sekitar 110 ms (`scheduleCombo`) supaya animasi switch terlihat lebih dulu dan klik beruntun digabung. `window.__atlas.timing` berisi waktu tahap update terakhir. Di layar sempit (≤ 980 px) panel kiri menjadi satu baris berisi kotak setinggi 46 px; pembungkus `[data-grp]` dan `.tg` memakai `display: contents`. Daftar komponen dan pengelompokan navigasi ada di konstanta `GROUPS`, dikelompokkan menurut jenis elemen (Fondasi; Sloof dan balok; Kolom, termasuk hbk; Pelat dan tangga; Dinding), dengan elemen praktis didahulukan di setiap kelompok. `gabungan` tidak masuk `GROUPS`: tombol Gabungan ada di bawah daftar, dan saat aktif panel kiri (`comboNav`) berubah menjadi dropdown Preset (dengan deskripsi bertinggi tetap supaya toggle di bawahnya tidak bergeser, dan tombol Putar tahapan yang membuka animasi urutan) serta satu toggle per komponen di `GROUPS`. Kedua mode panel kiri punya kotak pencarian (`navQ`, `applyNavFilter`) yang hanya menyembunyikan elemen lewat `data-q` dan `data-grp`, dengan kata kunci tambahan di `KW`; Enter membuka hasil pertama. Tombol bagikan di header (`shareURL`) menyalin tautan `?k=komponen&s=sistem&p=...&v=...#komponen`, dengan `p` berisi parameter yang berbeda dari nilai awal dan `v` lapisan yang berbeda dari bawaannya (JSON base64url). `readShared` membacanya saat halaman dibuka, hanya menerima kunci yang ada di nilai awal dengan tipe yang sama, lalu menghapus query dari URL. Gambar 2D hanya memuat lapisan yang menyala di panel Lapisan (`visibleModel`), dan digambar ulang setiap kali lapisan diubah.
- `js/home.js`: halaman utama (`#home` di `index.html`). Tampil bila alamat tanpa hash atau `#beranda`; tautan komponen (`#balok`) dan tautan berbagi (`?k=`) langsung membuka aplikasi. Pembuka hanya berisi judul dan tombol Mulai (tautan ke komponen terakhir, atau `#balok`), yang membuka aplikasi lengkap dengan daftar komponen dan Gabungan; saat keluar dari halaman utama, panel kiri dan kanan yang tersembunyi dibuka kembali. Kartu komponen adalah tautan `<a href="#id">`, jadi tombol Kembali browser kembali ke halaman utama, dan nama Atlas Struktur di header menuju `#beranda`. Di `app.js`, `showHome()` mengatur kelas `body.home` (menyembunyikan `main` dan tombol header selain tema), `homeOn` menghentikan loop render utama dan pintasan keyboard, dan model utama tetap dibangun di latar. Model di pembuka berputar pelan dan bergilir setiap 7 detik dengan transisi memudar: mode gabungan lebih dulu, lalu setiap komponen sesuai urutan `GROUPS`, dengan keterangan dan tautan "Buka model ini" yang ikut berganti. Pergantian berhenti saat kursor atau fokus ada di area model, saat halaman tidak terlihat, dan sepenuhnya bila 'kurangi gerakan' (model diam). Waktu tayang memakai waktu sebenarnya, bukan selisih frame yang dibatasi, dan model lama langsung dibuang. `__atlas.home.reel` (`idx`, `shownFor`, `held`, `next()`) adalah kait pengujian karena `requestAnimationFrame` berhenti saat pane browser tersembunyi, dan setiap kartu memakai gambar mini yang dirender dari model komponennya (nilai awal, SRPMK). Keduanya memakai renderer sendiri lewat `staticModel(id)` di `app.js` (material salinan dengan transparansi tetap, tulangan tanpa cache geometri), sehingga scene utama tidak terganggu; renderer gambar mini dibuang setelah selesai. Susunan pita mengikuti rujukan skill awesome-design-md (Apple untuk model sebagai pusat dan satu warna aksi, DJI untuk kartu komponen, IBM untuk bagian Dasar rujukan). Token pita: `--h-a`, `--h-b`, `--h-bh`, `--h-dark`.
- `js/core.js`: utilitas bersama.
  - Rumus: `devLen` (ℓd Tabel 25.4.2.2, bentuk sederhana), `ldhGen` (25.4.3.1), `ldhSeis` (18.8.5.1), `ldc` (25.4.9.2), `ashReq` (18.7.5.4).
  - Geometri: `turtle` (pembuat polyline 2D dengan lengkung), `hoop2D` (sengkang tertutup dengan kait 90 atau 135), `crosstie2D`, `rectCage` (susunan tulangan, sengkang, kait silang, dan hx untuk penampang persegi), `lift3D` (helix kecil supaya dua kait sengkang tidak saling tembus).
  - Pasangan: `BATA` (ukuran nominal SNI 15-2094-2000 dan bata ringan), `MAT` (warna material non-beton), `SPESI` (campuran dan penggunaannya), `bataWall` (menyusun bata per lapis dengan ikatan ½ atau 1 bata, gigi ke kolom, dan menghitung bata serta spesi per m²), `bentBar` (tulangan dengan bengkokan 90° di kedua ujung), `trapesium`, `rng` (acak dengan seed tetap), `rubble` (menyusun batu kali tak beraturan per lapis di penampang yang lebarnya berubah, termasuk aanstamping berdiri), `rockVol`, serta teks rujukan `PU`, `REF_PRAKTIS`, `NOTE_PRAKTIS`.
  - `renderView`: mesin gambar 2D generik. Memproyeksikan atau memotong model 3D yang sama menjadi SVG, jadi gambar selalu sinkron dengan parameter. Teks ukuran dan catatan diberi tepi putih (`halo`) supaya terbaca di atas arsiran; ukuran horizontal boleh `side:'r'|'l'` untuk menaruh teks di samping garis. Batu dari `rubble()` membawa `k` (baris, lajur, pusat lajur, sumbu); pada potongan, `pickRocks` memilih lajur terdekat per lapis (potongan memanjang) atau batu terdekat per lajur (potongan melintang) lalu menggambarnya utuh, dan item `rocks` boleh punya `clip` (prisma atau kotak) agar batu tidak keluar dari batas pasangan.
- `js/comp/*.js`: satu file per komponen.
- `js/comp/gabungan.js`: mode gabungan. Satu portal (kolom di x = 0 dan x = Lb, y = 0 di atas sloof) yang menyambungkan fondasi kolom (telapak atau tiang), fondasi batu kali, sloof praktis atau struktur, kolom, sengkang joint, balok (ring balok bila tanpa kolom), pelat, dinding bata, dan kolom praktis. Setiap komponen punya parameter bool dengan kunci sama dengan id komponennya, dan sambungannya (kait kolom di fondasi dan joint, kait balok dan sloof di kolom, sengkang joint, angkur) ikut muncul atau hilang. Objek `combo` memuat aturan kombinasi untuk panel kiri: `excl` (pasangan yang saling meniadakan: telapak/tiang, sloof praktis/struktur, dinding bata/dinding geser), `why` (alasan toggle dinonaktifkan: hbk butuh kolom dan balok, kolom praktis butuh dinding bata, dinding geser butuh kolom struktur, tangga butuh pelat), `hint`, dan `presets`. Dinding geser mengisi bentang antar kolom (kolom menjadi elemen batas, tulangan horizontal dikaitkan ke inti kolom). Tangga memanggil `tangga.build()` untuk dua lajur, dengan bordes yang ditumpu balok bordes, dua kolom tangga di atas fondasi setempat, dan lantai dasar di bawah ruang tangga (semuanya `praktik`), lalu memetakan koordinatnya (arah naik menjadi sumbu z, di luar tepi pelat z = 1500); lapisannya `tanggaB`, `tangga`, `tanggaD` disembunyikan dari tampak depan dan potongan portal lewat opsi gambar `skipLayer`. Urutan tahap (`ORDER`) dan teksnya menyesuaikan kombinasi: tanpa kolom struktur, ring balok dicor setelah bata dan kolom praktis, dan tulangan kolom praktis berdiri sejak tahap sloof. `build()` juga menegakkan aturan ini supaya parameter tersimpan yang bertentangan tetap aman. Model ini membangun geometrinya sendiri dengan helper `core.js`, bukan memanggil `build()` komponen lain, dan pemeriksaannya hanya untuk sambungan antar komponen.
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
- `views`: spesifikasi gambar untuk `renderView`: `{title, sub?, n:'x'|'y'|'z', at?, half?, u, v, layers?, dims?, notes?, skipStub?, skipMat?:[...], skipLayer?:[...], w2?, maxH?}`. `skipLayer` membuang beton dan tulangan dengan kunci lapisan tersebut. Tanpa `half` berarti proyeksi penuh. Dengan `half` berarti potongan setebal 2·half di koordinat `at`.
- `checks`: `[{ok:true|false|null, t, d, p}]`. `null` adalah info. `p` yang diawali `Pasal` atau `Tabel` otomatis diberi awalan SNI 2847:2019; `'praktik'` ditampilkan sebagai praktik umum; selain itu ditulis apa adanya (mis. 'SNI 15-2094-2000' atau konstanta `PU`).
- `stages` (opsional): `[{t, d}]` urutan pelaksanaan. Bila ada, panel Tampilan menampilkan tombol Urutan; panel animasi di kanan bawah berisi tombol putar/jeda, judul dan penjelasan tahap, titik tahap yang bisa diklik, dan slider durasi per tahap (`atlas-tulangan-seqdur`). Item `concrete`, `bars`, dan `labels` boleh punya `stage` (indeks tahap); objek dengan tahap lebih besar dari tahap aktif disembunyikan, tulangan tahap aktif turun ke posisinya, dan beton atau bata tahap aktif "dicor" naik dari bawah lewat bidang potong horizontal. Saat ini hanya `gabungan.js` yang memakainya, dan tahap untuk komponen yang dimatikan otomatis dilewati. `window.__atlas.seq` menyediakan kait pengujian (`open`, `go`, `tick`, `close`) karena `requestAnimationFrame` berhenti saat tab tersembunyi.
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

## Detail tulangan tangga

`tangga.js` mengikuti SP 34:1987 (India) Pasal 10.8 dan Gambar 10.11: pada sudut dalam, tulangan disilangkan dan diangkur di kedua sisi titik silang sepanjang ≥ ℓd. Ada dua sudut dalam: sisi bawah di bawah bordes (B1 naik ke atas bordes, B2 masuk ke pelat tangga) dan sisi atas di kaki tangga (T1 turun ke pelat lantai lalu mendatar, T0 dari pelat lantai menembus ke sisi bawah pelat tangga). Sudut atas di pertemuan pelat tangga dan bordes cembung, sehingga T1 boleh dibengkokkan menerus. SNI 2847:2019 tidak memuat gambar detail tangga.

Batas yang ditandai `praktik` memang bukan pasal SNI: zona ℓn/4 balok SRPMB, jarak tiang 2,5D, kepala tiang 75 sampai 150 mm, 2R + T, dan panjang tulangan tumpuan pelat ℓx/4. Juga tebal spesi 8 sampai 15 mm (bata ringan 2 sampai 5 mm), aanstamping 100 sampai 200 mm, kemiringan fondasi batu kali ≥ 60°, dan ukuran ring balok.

## Ide lanjutan

- Tambahan SRPMM sebagai sistem ketiga.
- Pelat dengan bukaan, balok T, kolom bulat dengan spiral, dan dinding penahan tanah.
- Ekspor gambar SVG dan daftar potong tulangan (bar bending schedule).
- Deploy ke GitHub Pages atau Vercel. Proyek ini statis, jadi cukup unggah foldernya.
