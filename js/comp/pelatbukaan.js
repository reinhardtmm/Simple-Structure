import {COL,fmt,up50,spread,turtle,asPerM,devLen,checker} from '../core.js';

/* Pelat dua arah dengan bukaan.
   SNI 2847:2019 Pasal 8.5.4.1 mengizinkan bukaan berukuran apa pun bila analisis menunjukkan kekuatan dan kemampuan layan
   terpenuhi. Pasal 8.5.4.2 (alternatif tanpa analisis) hanya berlaku untuk pelat TANPA balok; aturan di sana meminta tulangan
   yang terpotong ditambahkan kembali di sisi-sisi bukaan. Untuk pelat yang ditumpu balok seperti model ini, mengganti tulangan
   terpotong di tepi bukaan, memperpanjangnya sejauh ℓd, dan memasang tulangan diagonal di sudut adalah praktik pendetailan
   umum, sehingga pemeriksaannya ditandai 'praktik'. Syarat pelat dasarnya sama dengan pelat.js. */
export default {
  id:'pelatbukaan', name:'Pelat dengan bukaan', sysDependent:false, noCombo:true,
  defaults:{ALL:{Lx:3000,Ly:4000,h:120,bw:300,hbm:450,ax:700,az:700,ox:1150,oz:1650,dbx:10,sx:150,dby:10,sy:150,dt:10,st:200,ntx:3,ntz:3,dd:13,cover:20,fc:25,fy:420}},
  schema:[
    ['Geometri panel',[{k:'Lx',label:'Bentang bersih arah x',unit:'mm',min:2000,max:8000,step:100},{k:'Ly',label:'Bentang bersih arah z',unit:'mm',min:2000,max:10000,step:100},{k:'h',label:'Tebal pelat h',unit:'mm',min:90,max:300,step:10},{k:'bw',label:'Lebar balok tepi',unit:'mm',min:200,max:600,step:25},{k:'hbm',label:'Tinggi balok tepi',unit:'mm',min:250,max:900,step:25}]],
    ['Bukaan',[{k:'ax',label:'Lebar bukaan arah x',unit:'mm',min:200,max:3000,step:50},{k:'az',label:'Lebar bukaan arah z',unit:'mm',min:200,max:3000,step:50},{k:'ox',label:'Jarak bukaan dari muka balok (arah x)',unit:'mm',min:200,max:7000,step:50},{k:'oz',label:'Jarak bukaan dari muka balok (arah z)',unit:'mm',min:200,max:9000,step:50}]],
    ['Tulangan pelat',[{k:'dbx',label:'Diameter bawah arah x',unit:'D',opts:[8,10,13,16]},{k:'sx',label:'Spasi bawah arah x',unit:'mm',min:75,max:450,step:5},{k:'dby',label:'Diameter bawah arah z',unit:'D',opts:[8,10,13,16]},{k:'sy',label:'Spasi bawah arah z',unit:'mm',min:75,max:450,step:5},{k:'dt',label:'Diameter tumpuan',unit:'D',opts:[8,10,13,16]},{k:'st',label:'Spasi tumpuan',unit:'mm',min:75,max:450,step:5}]],
    ['Tulangan di tepi bukaan',[{k:'ntx',label:'Tulangan pengganti arah x per sisi',unit:'batang',min:0,max:8},{k:'ntz',label:'Tulangan pengganti arah z per sisi',unit:'batang',min:0,max:8},{k:'dd',label:'Diameter tulangan diagonal sudut',unit:'D',opts:[10,13,16]}]],
    ['Material',[{k:'fc',label:"Mutu beton fc'",unit:'MPa',opts:[20,25,30,35]},{k:'fy',label:'Mutu baja fy',unit:'MPa',opts:[280,420]},{k:'cover',label:'Selimut beton',unit:'mm',min:15,max:50,step:5}]]
  ],
  teori:{
    common:`<h3>Pelat dengan bukaan</h3><p>Bukaan untuk shaft pipa, tangga, atau void memotong tulangan pelat. Gaya yang semula dipikul tulangan terpotong itu berpindah ke tepi bukaan, dan sudut bukaan menjadi tempat tegangan terkumpul sehingga retak diagonal mudah muncul di sana.</p><ul><li><b>Tulangan terpotong</b> berhenti di tepi bukaan dengan selimut yang cukup.</li><li><b>Tulangan pengganti</b> dipasang sejajar tulangan yang terpotong, rapat di kedua sisi bukaan. Jumlah luasnya paling sedikit sama dengan luas tulangan yang terpotong, dibagi dua untuk setiap sisi.</li><li><b>Perpanjangan</b> tulangan pengganti melewati sudut bukaan paling sedikit sepanjang panjang penyaluran ℓd, supaya gaya tariknya tersalur ke pelat utuh.</li><li><b>Tulangan diagonal</b> di setiap sudut dipasang tegak lurus arah retak sudut, yaitu 45° terhadap tepi bukaan.</li></ul>`,
    ALL:`<h4>Yang diatur SNI 2847:2019</h4><ul><li>Bukaan berukuran apa pun diizinkan bila analisis menunjukkan syarat kekuatan dan kemampuan layan, termasuk batas lendutan, terpenuhi <span class="pasal">8.5.4.1</span>.</li><li>Sebagai alternatif, untuk <b>pelat tanpa balok</b> bukaan diizinkan tanpa analisis khusus dengan batas ukuran menurut letaknya (perpotongan lajur tengah, lajur kolom, atau gabungan keduanya), dan tulangan yang terpotong harus ditambahkan di sisi-sisi bukaan <span class="pasal">8.5.4.2</span>.</li><li>Bukaan di dekat kolom atau beban terpusat mengurangi keliling kritis geser dua arah <span class="pasal">22.6.4.3</span>.</li><li>Syarat pelat dasarnya tetap berlaku: tebal minimum <span class="pasal">8.3.1.2</span>, tulangan minimum <span class="pasal">8.6.1.1</span>, dan spasi maksimum <span class="pasal">8.7.2.2</span>.</li></ul><h4>Yang merupakan praktik pendetailan</h4><ul><li>Model ini adalah pelat yang ditumpu balok, sehingga secara aturan masuk ke 8.5.4.1 (dibuktikan dengan analisis). Mengganti tulangan terpotong di tepi bukaan mengikuti prinsip yang sama dengan 8.5.4.2 dan lazim dipakai di gambar kerja.</li><li>Perpanjangan ℓd dihitung dari <span class="pasal">Tabel 25.4.2.2</span>.</li><li>Tulangan diagonal sudut tidak disebut di SNI 2847:2019; ini praktik umum untuk menahan retak sudut.</li><li>Bukaan besar yang memotong banyak tulangan biasanya diberi balok tepi. Keputusan itu diambil dari hasil analisis.</li></ul><div class="box">Kurangi jumlah tulangan pengganti sampai lebih sedikit dari tulangan yang terpotong, lalu lihat tab Cek.</div>`
  },
  build(p){
    const {Lx,Ly,h,bw,hbm,dbx,sx,dby,sy,dt,st,ntx,ntz,dd,cover,fc,fy}=p;
    // bukaan dijaga tetap di dalam panel, paling dekat 200 mm dari muka balok
    const ax=Math.min(p.ax,Lx-400), az=Math.min(p.az,Ly-400);
    const ox=Math.min(Math.max(p.ox,200),Lx-ax-200), oz=Math.min(Math.max(p.oz,200),Ly-az-200);
    const x1o=ox+ax, z1o=oz+az, ce=25; // ce: jarak ujung tulangan terpotong ke tepi bukaan
    const ext=up50(Lx/4);
    const y1=cover+dbx/2, y2=cover+dbx+dby/2, y3=y2+dby/2+dd/2, yt1=h-cover-dt/2, yt2=h-cover-dt-dt/2;
    const ldx=devLen(fy,fc,dbx,1), ldz=devLen(fy,fc,dby,1), ldd=devLen(fy,fc,dd,1);
    const bars=[];
    const inZ=z=>z>oz-ce&&z<z1o+ce, inX=x=>x>ox-ce&&x<x1o+ce;
    const iBX={t:`Tulangan bawah arah x D${dbx}-${sx}`,b:['Lapisan paling bawah. Batang yang mengenai bukaan dihentikan di tepi bukaan.'],pasal:'Pasal 8.7.2'};
    const iBZ={t:`Tulangan bawah arah z D${dby}-${sy}`,b:['Lapisan kedua dari bawah. Batang yang mengenai bukaan dihentikan di tepi bukaan.'],pasal:'Pasal 8.7.2'};
    let nCutX=0, nCutZ=0;
    spread(50,Ly-50,sx).forEach(z=>{ if(inZ(z)){ nCutX++; bars.push({pts:[[-bw/2,y1,z],[ox-ce,y1,z]],d:dbx,layer:'bx',color:COL.matA,info:iBX},{pts:[[x1o+ce,y1,z],[Lx+bw/2,y1,z]],d:dbx,layer:'bx',color:COL.matA,info:iBX}); }
      else bars.push({pts:[[-bw/2,y1,z],[Lx+bw/2,y1,z]],d:dbx,layer:'bx',color:COL.matA,info:iBX}); });
    spread(50,Lx-50,sy).forEach(x=>{ if(inX(x)){ nCutZ++; bars.push({pts:[[x,y2,-bw/2],[x,y2,oz-ce]],d:dby,layer:'bz',color:COL.matB,info:iBZ},{pts:[[x,y2,z1o+ce],[x,y2,Ly+bw/2]],d:dby,layer:'bz',color:COL.matB,info:iBZ}); }
      else bars.push({pts:[[x,y2,-bw/2],[x,y2,Ly+bw/2]],d:dby,layer:'bz',color:COL.matB,info:iBZ}); });
    // tulangan pengganti: sejajar tulangan terpotong, rapat di kedua sisi bukaan, diperpanjang ℓd melewati sudut
    const gap=45, e0=30;
    const xa=Math.max(-bw/2,ox-ldx), xb=Math.min(Lx+bw/2,x1o+ldx), za=Math.max(-bw/2,oz-ldz), zb=Math.min(Ly+bw/2,z1o+ldz);
    const iTX={t:`Tulangan pengganti arah x ${ntx}D${dbx} per sisi`,b:[`Menggantikan ${nCutX} batang arah x yang terpotong bukaan.`,`Diperpanjang ℓd = ${fmt(ldx)} mm melewati sudut bukaan.`],pasal:'praktik'};
    const iTZ={t:`Tulangan pengganti arah z ${ntz}D${dby} per sisi`,b:[`Menggantikan ${nCutZ} batang arah z yang terpotong bukaan.`,`Diperpanjang ℓd = ${fmt(ldz)} mm melewati sudut bukaan.`],pasal:'praktik'};
    for(let i=0;i<ntx;i++) for(const z of [oz-e0-i*gap,z1o+e0+i*gap]) if(z>30&&z<Ly-30) bars.push({pts:[[xa,y1,z],[xb,y1,z]],d:dbx,layer:'trim',color:COL.conf,info:iTX});
    for(let i=0;i<ntz;i++) for(const x of [ox-e0-i*gap,x1o+e0+i*gap]) if(x>30&&x<Lx-30) bars.push({pts:[[x,y2,za],[x,y2,zb]],d:dby,layer:'trim',color:COL.conf,info:iTZ});
    // tulangan diagonal sudut: dua batang per sudut, tegak lurus garis bagi sudut, panjang 2ℓd
    const iD={t:`Tulangan diagonal sudut 2D${dd}`,b:[`Dipasang 45° di setiap sudut bukaan, di atas anyaman bawah. Panjang 2ℓd = ${fmt(2*ldd)} mm.`,'Menahan retak yang menjalar dari sudut bukaan.'],pasal:'praktik'};
    const q=Math.SQRT1_2;
    for(const [cx,cz,sgx,sgz] of [[ox,oz,-1,-1],[x1o,oz,1,-1],[ox,z1o,-1,1],[x1o,z1o,1,1]]) for(const o of [60,115]){
      const mx=cx+sgx*q*o, mz=cz+sgz*q*o, ux=sgx*q, uz=-sgz*q;
      // dipotong di muka dalam balok supaya tidak keluar dari panel
      let t0=-ldd, t1=ldd; const lim=(m,u,lo,hi)=>{ if(Math.abs(u)<1e-9) return; const a=(lo-m)/u, b=(hi-m)/u; t0=Math.max(t0,Math.min(a,b)); t1=Math.min(t1,Math.max(a,b)); };
      lim(mx,ux,20,Lx-20); lim(mz,uz,20,Ly-20);
      if(t1-t0>200) bars.push({pts:[[mx+ux*t0,y3,mz+uz*t0],[mx+ux*t1,y3,mz+uz*t1]],d:dd,layer:'diag',color:COL.tie,info:iD}); }
    // tulangan tumpuan (atas): seperti pelat biasa, dipendekkan bila mengenai bukaan
    const rb=3*dt, tail=Math.max(12*dt,150);
    const topHook=(y,len)=>{ const t=turtle(0,y-rb-tail,Math.PI/2); t.fwd(tail).turn(-90,rb).fwd(len-rb); return t.pts; };
    const iT={t:`Tulangan tumpuan D${dt}-${st}`,b:[`Tulangan atas di atas balok untuk momen negatif, panjang ℓx/4 = ${fmt(ext)} mm dari muka balok. Dipendekkan bila mengenai bukaan.`],pasal:'praktik'};
    const lenOf=(hit,free)=>bw-40+(hit?Math.min(ext,free-ce):ext);
    spread(50,Ly-50,st).forEach(z=>{ const hit=inZ(z);
      const a=lenOf(hit,ox), b=lenOf(hit,Lx-x1o);
      bars.push({pts:topHook(yt1,a).map(([s,y])=>[-bw+40+s,y,z]),d:dt,layer:'tx',color:COL.matT,info:iT},{pts:topHook(yt1,b).map(([s,y])=>[Lx+bw-40-s,y,z]),d:dt,layer:'tx',color:COL.matT,info:iT}); });
    spread(50,Lx-50,st).forEach(x=>{ const hit=inX(x);
      const a=lenOf(hit,oz), b=lenOf(hit,Ly-z1o);
      bars.push({pts:topHook(yt2,a).map(([s,y])=>[x,y,-bw+40+s]),d:dt,layer:'tz',color:COL.top,info:iT},{pts:topHook(yt2,b).map(([s,y])=>[x,y,Ly+bw-40-s]),d:dt,layer:'tz',color:COL.top,info:iT}); });
    const yb=h-hbm;
    const concrete=[{boxes:[[0,ox,0,h,0,Ly],[x1o,Lx,0,h,0,Ly],[ox,x1o,0,h,0,oz],[ox,x1o,0,h,z1o,Ly]]},
      {box:[-bw,0,yb,h,-bw,Ly+bw],kind:'stub'},{box:[Lx,Lx+bw,yb,h,-bw,Ly+bw],kind:'stub'},{box:[0,Lx,yb,h,-bw,0],kind:'stub'},{box:[0,Lx,yb,h,Ly,Ly+bw],kind:'stub'}];
    const labels=[{p:[Lx/2,h+60,-bw-80],t:`ℓx = ${fmt(Lx)} mm`},{p:[Lx+bw+80,h+60,Ly/2],t:`ℓz = ${fmt(Ly)} mm`},{p:[ox+ax/2,h+70,oz+az/2],t:`bukaan ${fmt(ax)} × ${fmt(az)}`,follow:null},
      {p:[xa+60,h+40,z1o+e0],t:'tulangan pengganti',c:'conf',follow:'trim'},{p:[x1o+120,h+40,z1o+120],t:'diagonal sudut',c:'lap',follow:'diag'}];
    // pemeriksaan pelat dasar (sama dengan komponen Pelat lantai)
    const lmax=Math.max(Lx,Ly), lmin=Math.min(Lx,Ly), beta=lmax/lmin, two=beta<=2;
    const hmin=two?Math.max(lmax*(0.8+fy/1400)/(36+9*beta),90):lmin/28*(fy>420?(0.4+fy/700):1);
    const rmin=fy>=420?0.0018:0.0020, Asmin=rmin*1000*h;
    const AsX=asPerM(dbx,sx), AsZ=asPerM(dby,sy), AsT=asPerM(dt,st);
    const {C,add}=checker();
    add(null,'Jenis pelat',`β = ${fmt(beta,2)} → ${two?'pelat dua arah':'pelat satu arah'}, ditumpu balok di keempat sisi`,two?'Pasal 8':'Pasal 7');
    add(cover>=20,'Selimut beton',`${cover} mm ≥ 20 mm`,'Tabel 20.6.1.3.1');
    add(h>=hmin,'Tebal minimum pelat',two?`h = ${h} ≥ ℓn(0,8+fy/1400)/(36+9β) = ${fmt(hmin)} mm (balok tepi dianggap kaku, αfm > 2)`:`h = ${h} ≥ ℓ/28 = ${fmt(hmin)} mm (kedua ujung menerus)`,two?'Pasal 8.3.1.2':'Tabel 7.3.1.1');
    add(AsX>=Asmin&&AsZ>=Asmin&&AsT>=Asmin,'Tulangan minimum',`arah x ${fmt(AsX)}, arah z ${fmt(AsZ)}, tumpuan ${fmt(AsT)} mm²/m ≥ ${rmin}·b·h = ${fmt(Asmin)} mm²/m`,'Pasal 8.6.1.1, 24.4.3.2');
    const sm=two?Math.min(2*h,450):Math.min(3*h,450);
    add(Math.max(sx,sy,st)<=sm,'Spasi maksimum tulangan',`x ${sx}, z ${sy}, tumpuan ${st} mm ≤ ${two?'min(2h; 450)':'min(3h; 450)'} = ${fmt(sm)} mm`,two?'Pasal 8.7.2.2':'Pasal 7.7.2.3');
    // bukaan
    add(null,'Dasar izin bukaan',`bukaan ${fmt(ax)} × ${fmt(az)} mm pada pelat yang ditumpu balok: kekuatan dan kemampuan layan, termasuk lendutan, harus ditunjukkan lewat analisis. Aturan tanpa analisis di 8.5.4.2 hanya untuk pelat tanpa balok`,'Pasal 8.5.4.1');
    add(null,'Tulangan yang terpotong bukaan',`arah x ${nCutX} batang D${dbx}, arah z ${nCutZ} batang D${dby}`,'praktik');
    add(2*ntx>=nCutX,'Tulangan pengganti arah x',`${ntx} batang per sisi, total ${2*ntx} batang ≥ ${nCutX} batang yang terpotong. Prinsipnya sama dengan 8.5.4.2 untuk pelat tanpa balok`,'praktik');
    add(2*ntz>=nCutZ,'Tulangan pengganti arah z',`${ntz} batang per sisi, total ${2*ntz} batang ≥ ${nCutZ} batang yang terpotong`,'praktik');
    const exX=Math.min(ox-xa,xb-x1o), exZ=Math.min(oz-za,zb-z1o);
    add(exX>=ldx-0.5&&exZ>=ldz-0.5,'Perpanjangan tulangan pengganti',`arah x ${fmt(exX)} mm ≥ ℓd = ${fmt(ldx)} mm; arah z ${fmt(exZ)} mm ≥ ℓd = ${fmt(ldz)} mm, diukur dari sudut bukaan. Nilai ℓd dari Tabel 25.4.2.2`,'praktik');
    add(null,'Tulangan diagonal sudut',`2D${dd} di setiap sudut, panjang 2ℓd = ${fmt(2*ldd)} mm. Tidak diatur SNI 2847:2019`,'praktik');
    add(null,'Bukaan besar','bukaan yang memotong banyak tulangan atau mendekati tumpuan biasanya diberi balok tepi; diputuskan dari analisis','Pasal 8.5.4.1');
    const views=[
      {title:'Denah tulangan bawah',sub:`bawah D${dbx}-${sx} dan D${dby}-${sy}, pengganti ${ntx} dan ${ntz} batang per sisi, diagonal 2D${dd}`,n:'y',u:'x',v:'z',layers:['bx','bz','trim','diag'],maxH:440,
        dims:[{a:[0,-bw],b:[Lx,-bw],off:-12,t:`ℓx = ${fmt(Lx)}`},{a:[-bw,0],b:[-bw,Ly],off:-12,t:`ℓz = ${fmt(Ly)}`},{a:[ox,z1o],b:[x1o,z1o],off:26,t:`${fmt(ax)}`,c:COL.conf},{a:[x1o,oz],b:[x1o,z1o],off:30,t:`${fmt(az)}`,c:COL.conf}]},
      {title:'Denah tulangan pengganti dan diagonal',sub:`perpanjangan ℓd = ${fmt(ldx)} mm dari sudut bukaan`,n:'y',u:'x',v:'z',layers:['trim','diag'],maxH:440,
        dims:[{a:[xa,oz-e0],b:[ox,oz-e0],off:-30,t:`ℓd=${fmt(ox-xa)}`,c:COL.conf}]},
      {title:'Denah tulangan atas',sub:`tumpuan D${dt}-${st}`,n:'y',u:'x',v:'z',layers:['tx','tz'],maxH:440,dims:[{a:[0,-bw],b:[ext,-bw],off:-12,t:`ℓx/4=${fmt(ext)}`,c:COL.conf}]},
      {title:'Potongan melalui bukaan, sejajar arah x',n:'z',at:oz+az/2,half:Math.max(az/2-40,sx*0.6),u:'x',v:'y',maxH:240,layers:['bx','bz','tx','tz'],dims:[{a:[ox,h],b:[x1o,h],off:10,t:`bukaan ${fmt(ax)}`,c:COL.conf},{a:[Lx+bw,0],b:[Lx+bw,h],off:12,t:`h=${h}`}]}
    ];
    const derived=`β = <b>${fmt(beta,2)}</b> (${two?'dua arah':'satu arah'})<br>bukaan = <b>${fmt(ax)} × ${fmt(az)}</b> mm, luas <b>${fmt(ax*az/1e6,2)}</b> m² (${fmt(ax*az/(Lx*Ly)*100,1)}% panel)<br>tulangan terpotong = <b>${nCutX}</b> arah x, <b>${nCutZ}</b> arah z<br>ℓd D${dbx} = <b>${fmt(ldx)}</b> mm, ℓd D${dd} = <b>${fmt(ldd)}</b> mm<br>h min = <b>${fmt(hmin)}</b> mm, As min = <b>${fmt(Asmin)}</b> mm²/m`;
    return {layers:[{k:'bx',label:'Bawah arah x',color:COL.matA,ex:[0,-250,0]},{k:'bz',label:'Bawah arah z',color:COL.matB,ex:[0,-120,0]},{k:'trim',label:'Tulangan pengganti',color:COL.conf,ex:[0,-380,0]},{k:'diag',label:'Diagonal sudut',color:COL.tie,ex:[0,-500,0]},{k:'tx',label:'Tumpuan arah x',color:COL.matT,ex:[0,260,0]},{k:'tz',label:'Tumpuan arah z',color:COL.top,ex:[0,420,0]}],
      betonEx:[0,-1400,0],concrete,zones:[],bars,labels,views,checks:C,derived,camDir:[0.6,0.85,1.0],camK:1.0,cutAxis:'x',
      colorNote:`<b style="color:${COL.conf}">Hijau</b>: tulangan pengganti di tepi bukaan. <b style="color:${COL.tie}">Ungu</b>: diagonal sudut.`};
  }
};
