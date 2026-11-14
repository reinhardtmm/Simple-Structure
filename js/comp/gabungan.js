import tg from './tangga.js';
import {AREA,COL,MAT,BATA,BATA_OPTS,fmt,spread,linspace,turtle,hoop2D,lift3D,rectCage,checker,bataWall,bentBar,trapesium,rubble,devLen,ldc,ldhGen,ldhSeis,PU,PI} from '../core.js';

/* Mode gabungan: satu portal yang menyambungkan komponen-komponen lain.
   Sumbu x sepanjang portal (kolom di x = 0 dan x = Lb), y ke atas dengan y = 0 di atas sloof (peil lantai), z melintang. */
const COV=40, CV_P=20;
const FKN={telapak:'Fondasi telapak',tiang:'Tiang bor dan pile cap'};
// Satu kunci boolean per komponen di navigasi. Kunci yang sama dengan id komponen supaya panel kiri bisa memetakannya langsung.
const KEYS=['batukali','telapak','tiang','sloofpraktis','sloof','balok','kolompraktis','kolom','hbk','pelat','tangga','bata','dinding'];
const OFF=Object.fromEntries(KEYS.map(k=>[k,false]));
const ON=k=>Object.fromEntries(k.map(x=>[x,true]));
const DIM={b:250,hb:450,Lb:4000,Hk:3600};
const PRESETS=[
  {id:'rumahbeton',t:'Rumah dengan portal beton',d:'Fondasi telapak dan batu kali, sloof, kolom, balok, pelat, serta dinding bata dengan kolom praktis.',
    set:{...OFF,...ON(['telapak','batukali','sloof','kolom','hbk','balok','pelat','bata','kolompraktis']),...DIM}},
  {id:'portal',t:'Portal beton terbuka',d:'Fondasi telapak, sloof, kolom, hubungan balok-kolom, balok, dan pelat tanpa dinding.',
    set:{...OFF,...ON(['telapak','sloof','kolom','hbk','balok','pelat']),...DIM}},
  {id:'tiang',t:'Portal di atas tiang bor',d:'Seperti portal beton, tetapi kolom berdiri di atas pile cap dan tiang bor.',
    set:{...OFF,...ON(['tiang','sloof','kolom','hbk','balok','pelat']),...DIM}},
  {id:'gedung',t:'Portal dengan dinding geser dan tangga',d:'Fondasi telapak, sloof, kolom, balok, dan pelat; satu bentang diisi dinding geser, dan tangga dua lajur naik ke pelat.',
    set:{...OFF,...ON(['telapak','sloof','kolom','hbk','balok','pelat','dinding','tangga']),...DIM}},
  {id:'hbk',t:'Fokus hubungan balok-kolom',d:'Hanya fondasi telapak, kolom, dan balok, supaya tulangan di dalam joint mudah dilihat.',
    set:{...OFF,...ON(['telapak','kolom','hbk','balok']),...DIM}},
  {id:'rumah',t:'Rumah tembokan sederhana',d:'Fondasi batu kali, sloof praktis, dinding bata, kolom praktis, dan ring balok 150 × 200 tanpa kolom struktur.',
    set:{...OFF,...ON(['batukali','sloofpraktis','bata','kolompraktis','balok']),Lb:4000,Hk:3000,b:150,hb:200}}
];
const D0={...PRESETS[0].set,Df:1100,bc:400,tp:120,bs:250,hs:350,jenis:'M-5a'};

export default {
  id:'gabungan', name:'Mode gabungan', sysDependent:true, std:'SNI 2847:2019 dan Persyaratan PU',
  ref:'Rujukan: SNI 2847:2019 untuk elemen beton bertulang, dan persyaratan PU bangunan sederhana untuk pasangan bata, kolom praktis, sloof praktis, dan fondasi batu kali. Rujukan selain SNI 2847:2019 belum dicocokkan dengan dokumen resminya.',
  checkNote:'Mode gabungan memeriksa sambungan antar komponen. Pemeriksaan lengkap setiap komponen ada di halaman komponennya masing-masing. Batas untuk pasangan bata dan elemen praktis diambil dari persyaratan PU dan belum dicocokkan dengan dokumen resminya.',
  defaults:{SRPMB:{...D0},SRPMK:{...D0}},
  // Aturan kombinasi untuk panel kiri. excl: menyalakan satu mematikan pasangannya. why: alasan toggle tidak bisa dipakai.
  combo:{
    keys:KEYS, presets:PRESETS,
    excl:[['telapak','tiang'],['sloofpraktis','sloof'],['bata','dinding']],
    why:(k,p)=>!KEYS.includes(k)?'Belum tersedia di mode gabungan'
      :k==='hbk'&&!(p.kolom&&p.balok)?'Butuh kolom struktur dan balok'
      :k==='kolompraktis'&&!p.bata?'Butuh dinding bata'
      :k==='dinding'&&!p.kolom?'Butuh kolom struktur sebagai elemen batas'
      :k==='tangga'&&!p.pelat?'Butuh pelat lantai sebagai tujuan tangga':'',
    hint:{tiang:'Pengganti fondasi telapak',sloof:'Pengganti sloof praktis',sloofpraktis:'150 × 200, 4D10',hbk:'Sengkang di dalam joint',kolompraktis:'Disisipkan tiap ≤ 3 m',balok:'Tanpa kolom menjadi ring balok',
      dinding:'Pengganti dinding bata di bentang ini',tangga:'Dua lajur dengan bordes, naik ke pelat'}
  },
  schema:[
    ['Geometri portal',[{k:'Lb',label:'Bentang as ke as kolom',unit:'mm',min:2000,max:8000,step:100},{k:'Hk',label:'Tinggi atas sloof ke atas pelat',unit:'mm',min:2500,max:5000,step:100},{k:'Df',label:'Atas fondasi kolom di bawah atas sloof',unit:'mm',min:400,max:2500,step:50,show:(s,p)=>p.telapak||p.tiang}]],
    ['Ukuran elemen',[{k:'bc',label:'Sisi kolom',unit:'mm',min:250,max:800,step:25,show:(s,p)=>p.kolom},{k:'b',label:'Lebar balok',unit:'mm',min:120,max:600,step:10,show:(s,p)=>p.balok},{k:'hb',label:'Tinggi balok',unit:'mm',min:150,max:900,step:25,show:(s,p)=>p.balok},{k:'tp',label:'Tebal pelat',unit:'mm',min:90,max:250,step:10,show:(s,p)=>p.pelat},
      {k:'bs',label:'Lebar sloof',unit:'mm',min:150,max:500,step:25,show:(s,p)=>p.sloof},{k:'hs',label:'Tinggi sloof',unit:'mm',min:200,max:700,step:25,show:(s,p)=>p.sloof},{k:'jenis',label:'Jenis bata',opts:BATA_OPTS,show:(s,p)=>p.bata}]]
  ],
  teori:{
    common:`<h3>Mode gabungan</h3><p>Halaman lain memperlihatkan satu komponen. Di sini komponen-komponen itu dipasang menjadi satu portal, sehingga terlihat bagaimana tulangan dari satu elemen masuk dan terangkur ke elemen lain. Nyalakan dan matikan komponen di panel kiri untuk melihat sambungannya muncul atau hilang, atau pilih salah satu preset. Tombol Putar tahapan di bawah preset memperlihatkan urutan pelaksanaannya.</p><p>Tidak semua komponen bisa dinyalakan bersamaan. Fondasi kolom hanya satu jenis (telapak atau tiang), sloof hanya satu jenis (praktis atau struktur), dan bentang di antara kolom diisi dinding bata atau dinding geser, tidak keduanya. Sengkang joint butuh kolom dan balok, kolom praktis butuh dinding bata, dinding geser butuh kolom struktur sebagai elemen batasnya, dan tangga butuh pelat lantai sebagai tujuannya. Kombinasi yang tidak lazim tetap boleh dicoba; akibatnya terlihat di tab Cek.</p><ul><li><b>Fondasi ke kolom</b>: tulangan kolom diteruskan ke dalam fondasi telapak atau pile cap dan diakhiri kait 90°.</li><li><b>Sloof ke kolom</b>: tulangan sloof diangkur ke dalam kolom. Sloof di atas fondasi batu kali diikat dengan angkur.</li><li><b>Balok ke kolom</b>: tulangan balok dibengkokkan ke dalam kolom, dan joint diberi sengkang (hubungan balok-kolom).</li><li><b>Kolom di lantai teratas</b>: tulangan kolom dibengkokkan ke dalam joint.</li><li><b>Dinding bata</b>: duduk di atas sloof, diangkur ke kolom struktur, dan dibagi oleh kolom praktis bila bentang bersihnya lebih dari 3 m.</li><li><b>Dinding geser</b>: kolom di kedua ujung menjadi elemen batas. Tulangan horizontal dinding dikaitkan ke dalam inti kolom, dan tulangan vertikal dikaitkan ke sloof di bawah dan balok di atas.</li><li><b>Tangga</b>: dua lajur dengan bordes di tengah tinggi lantai, di sisi luar pelat. Lajur atas masuk ke pelat lantai, dan tulangan di sudut dalam disilangkan seperti di halaman Tangga.</li></ul>`,
    SRPMB:`<h4>SRPMB</h4><p>Sengkang memakai kait 90°, jarak sengkang relatif seragam, dan sengkang joint mengikuti Pasal 15.4.2 dengan spasi tidak lebih dari setengah tinggi balok.</p>`,
    SRPMK:`<h4>SRPMK</h4><p>Sengkang memakai kait gempa 135°. Sengkang dirapatkan di daerah ℓo kolom dan 2h balok, diteruskan di dalam joint, dan kait tulangan kolom di fondasi diarahkan ke sumbu kolom (Pasal 18.13.2.2).</p>`
  },
  build(p0,sys){
    const K=sys==='SRPMK', hook=K?135:90;
    // aturan kombinasi juga ditegakkan di sini, supaya parameter tersimpan yang bertentangan tetap menghasilkan model yang wajar
    const p={...p0}; if(p.tiang&&p.telapak) p.tiang=false; if(p.sloof&&p.sloofpraktis) p.sloofpraktis=false;
    const fk=p.telapak?'telapak':p.tiang?'tiang':'none', SP=!!p.sloofpraktis, hasS=!!(p.sloof||SP);
    if(p.bata&&p.dinding) p.dinding=false;
    const jOn=!!(p.hbk&&p.kolom&&p.balok), kpOn=!!(p.kolompraktis&&p.bata), dgOn=!!(p.dinding&&p.kolom), tgOn=!!(p.tangga&&p.pelat);
    const {Lb,Hk,Df,bc,b,hb,tp}=p, bt=BATA[p.jenis];
    // sloof praktis mengikuti buku saku PU: 150 × 200, 4D10, begel D8-150 kait 135°, selimut 20 mm
    const bs=SP?150:p.bs, hs=SP?200:p.hs, sCov=SP?CV_P:COV, sds=SP?8:10, dbs=SP?10:13, nS=SP?2:3;
    const dbk=16, dbb=16, ds=10, nc=3, xs=[0,Lb];
    const fx0=p.kolom?bc/2:0, fx1=p.kolom?Lb-bc/2:Lb;            // muka dalam kolom (atau as bila tanpa kolom)
    const yF=-Df, hfT=450, Bf=1400, hcap=600, capX=900, capZ=2000, Dp=400, spP=1200;
    const yFtop=fk==='none'?null:yF, yFbot=fk==='telapak'?yF-hfT:fk==='tiang'?yF-hcap:null;
    const yBKtop=hasS?-hs:0, hBK=600;
    const yW0=0, yW1=p.balok?Hk-hb:p.pelat?Hk-tp:Hk-150;
    const concrete=[], bars=[], labels=[], {C,add}=checker();
    // tahap pelaksanaan: setiap objek diberi kunci tahap; dipetakan ke nomor urut di akhir build
    const STL={fondasi:'fk1',sloof:'s1',kolom:'k1',kolomS:'k1',hbk:'bp1',balok:'bp1',balokS:'bp1',pelat:'bp1',kp:'kp',angkur:'bata'};
    const push=(pts,d,layer,color,info,stage)=>bars.push({pts,d,layer,color,info,stage:stage||STL[layer]});
    const cp=(stage,...items)=>concrete.push(...items.map(o=>({...o,stage})));
    // ---------- fondasi kolom ----------
    if(fk==='telapak') xs.forEach(xc=>{
      cp('fk2',{box:[xc-Bf/2,xc+Bf/2,yFbot,yFtop,-Bf/2,Bf/2]});
      const dm=13, a=Bf/2-75-dm/2, inf={t:'Tulangan bawah fondasi telapak D13-150',b:['Anyaman dua arah, ujung dibengkokkan ke atas.'],pasal:'Pasal 13.3'};
      const up=(L,y)=>{ const t=turtle(-L,y+150,-PI/2); t.fwd(150-39).turn(90,39).fwd(2*L-78).turn(90,39).fwd(150-39); return t.pts; };
      spread(-a,a,150).forEach(z=>push(up(a,yFbot+75+dm/2).map(([u,y])=>[xc+u,y,z]),dm,'fondasi',COL.matA,inf));
      spread(-a+dm,a-dm,150).forEach(x=>push(up(a-dm,yFbot+75+dm*1.5).map(([u,y])=>[xc+x,y,u]),dm,'fondasi',COL.matB,inf));
    });
    if(fk==='tiang') xs.forEach(xc=>{
      cp('fk2',{box:[xc-capX/2,xc+capX/2,yFbot,yFtop,-capZ/2,capZ/2]});
      const dm=16, inf={t:'Tulangan bawah pile cap D16-150',b:['Pengikat tarik antar kepala tiang.'],pasal:'Pasal 13.4'};
      spread(-capZ/2+90,capZ/2-90,150).forEach(z=>push([[xc-capX/2+90,yFbot+100,z],[xc+capX/2-90,yFbot+100,z]],dm,'fondasi',COL.matA,inf));
      spread(-capX/2+90,capX/2-90,150).forEach(x=>push([[xc+x,yFbot+100+dm,-capZ/2+90],[xc+x,yFbot+100+dm,capZ/2-90]],dm,'fondasi',COL.matB,inf));
      [-spP/2,spP/2].forEach(zc=>{ const y0=yFbot-2500, y1=yFbot+75; cp('fk2',{cyl:{x:xc,z:zc,r:Dp/2,y0,y1}});
        const Rb=Dp/2-75-10-6.5, Rs=Dp/2-75-5, ld=devLen(420,30,13), iP={t:'Tulangan tiang 6D13',b:[`Diteruskan ke pile cap sepanjang ℓd = ${fmt(ld)} mm.`],pasal:K?'Pasal 18.13.4.1':'Tabel 25.4.2.2'};
        for(let i=0;i<6;i++){ const t=2*PI*i/6; push([[xc+Rb*Math.cos(t),y0+100,zc+Rb*Math.sin(t)],[xc+Rb*Math.cos(t),Math.min(yFtop-80,y1+ld),zc+Rb*Math.sin(t)]],13,'fondasi',COL.long,iP); }
        const pitch=K?75:150, turns=(y1-y0-150)/pitch, n=Math.ceil(turns*20), sp=[]; for(let k=0;k<=n;k++){ const th=2*PI*turns*k/n; sp.push([xc+Rs*Math.cos(th),y1-30-(y1-y0-150)*k/n,zc+Rs*Math.sin(th)]); }
        push(sp,10,'fondasi',K?COL.conf:COL.mid,{t:`Spiral tiang D10 jarak ${pitch} mm`,b:[K?'Daerah kekang di kepala tiang (Pasal 18.13.4.3).':'Mengekang beton tiang.'],pasal:K?'Pasal 18.13.4.3':'praktik'}); });
    });
    // ---------- fondasi batu kali di bawah dinding ----------
    let bkX0=0, bkX1=0;
    if(p.batukali){
      bkX0=fk==='telapak'?Bf/2+50:fk==='tiang'?capX/2+50:-300; bkX1=Lb-bkX0;
      const a=300, B=600, wT=y=>B+(a-B)*(y-(yBKtop-hBK))/hBK;
      cp('bk',{prism:{axis:'x',pts:trapesium(a,B,yBKtop,hBK),x0:bkX0,x1:bkX1},mat:'spesi',layer:'batukali'},
        {rocks:rubble({axis:'x',a0:bkX0,a1:bkX1,y0:yBKtop-hBK,y1:yBKtop,width:wT,size:200,gap:25,seed:3}),mat:'batu',layer:'batukali',clip:{prism:{axis:'x',pts:trapesium(a,B,yBKtop,hBK),x0:bkX0,x1:bkX1}}},
        {rocks:rubble({axis:'x',a0:bkX0,a1:bkX1,y0:yBKtop-hBK-150,y1:yBKtop-hBK,width:()=>B,size:200,gap:15,tegak:true,seed:9}),mat:'aanstamping',layer:'batukali',clip:{box:[bkX0,bkX1,yBKtop-hBK-150,yBKtop-hBK,-B/2,B/2]}});
      labels.push({p:[(bkX0+bkX1)/2,yBKtop-hBK/2,B/2+40],t:'fondasi batu kali',stage:'bk'});
      if(hasS){ const iA={t:'Angkur sloof ke batu kali D10',b:['Ditanam di pasangan batu kali dan masuk ke sloof, jarak paling jauh 1 m.'],pasal:PU};
        spread(bkX0+200,bkX1-200,1000).forEach(x=>{ const t=turtle(x,yBKtop-300,PI/2); t.fwd(300+hs-sCov-sds-dbs-60).turn(-90,20).fwd(80); push(t.pts.map(([xx,y])=>[xx,y,0]),10,'angkur',COL.dowel,iA,'bk'); }); }
    }
    // ---------- kolom struktur ----------
    const cg=rectCage({B:bc,H:bc,cover:COV,ds,db:dbk,nu:nc,nv:nc,hook,allSup:K});
    if(p.kolom){
      const yCB=yFtop??(hasS?-hs:0), yBarB=fk==='telapak'?yFbot+75+13*2+dbk/2:fk==='tiang'?yFbot+100+16*2+dbk/2:yCB+50;
      const topHook=p.balok||p.pelat, yBarT=Hk-COV-ds-dbb-dbk/2, Lh=12*dbk, r=4*dbk;
      const iC={t:`Tulangan kolom ${cg.pos.length}D${dbk}`,b:[fk!=='none'?`Diteruskan ke ${fk==='telapak'?'fondasi telapak':'pile cap'} dengan kait 90° ${K?'ke arah sumbu kolom':'ke arah luar'}.`:'Tanpa fondasi kolom.',topHook?'Di lantai teratas dibengkokkan 90° ke dalam joint.':''],pasal:K?'Pasal 18.13.2.2, 18.7.4':'Pasal 10.7'};
      xs.forEach((xc,ic)=>{
        cp('k2',{box:[xc-bc/2,xc+bc/2,yCB,Hk,-bc/2,bc/2]});
        cg.pos.forEach(([u,v])=>{
          const sgn=Math.abs(u)>1?Math.sign(u):(ic===0?-1:1), dirB=fk==='none'?0:(K?-sgn:sgn), dirT=topHook?-sgn:0;
          const t=dirB?turtle(xc+u+dirB*Lh,yBarB,dirB>0?PI:0):turtle(xc+u,yBarB,PI/2);
          if(dirB) t.fwd(Lh-r).turn(dirB>0?-90:90,r);
          t.fwd(yBarT-yBarB-(dirB?r:0)-(dirT?r:0));
          if(dirT) t.turn(dirT>0?-90:90,r).fwd(Lh-r);
          push(t.pts.map(([x,y])=>[x,y,v]),dbk,'kolom',COL.long,iC);
        });
        // sengkang kolom per zona
        const Hc=(Hk-(p.balok?hb:0))-(hasS?0:yCB), lo=Math.max(bc,Hc/6,450), sLo=100, sMid=150, sJ=K?100:Math.min(150,Math.floor(hb/2/5)*5);
        const ys=[]; const lim0=yCB+50, lim1=Hk-50, jTop=Hk, jBot=Hk-(p.balok?hb:0);
        for(let y=lim0;y<=lim1;){ const inJ=p.balok&&y>jBot-25; const conf=K&&(y<(hasS?0:yCB)+lo||y>jBot-lo);
          ys.push({y,z:inJ?'joint':conf?'conf':'mid'}); y+=inJ?sJ:conf?sLo:K?sMid:Math.min(16*dbk,48*ds,bc,150); }
        const iH=z=>({t:z==='joint'?`Sengkang joint D${ds}-${sJ}`:`Sengkang kolom D${ds}`,b:[z==='joint'?(K?'Hubungan balok-kolom SRPMK: sama dengan daerah ℓo (Pasal 18.8.3.1).':'Joint SRPMB: disebar sepanjang tinggi balok dengan spasi ≤ h/2 (Pasal 15.4.2).'):z==='conf'?`Daerah ℓo = ${fmt(lo)} mm, spasi ${sLo} mm.`:'Daerah tengah kolom.'],pasal:z==='joint'?(K?'Pasal 18.8.3.1':'Pasal 15.4.2'):K?'Pasal 18.7.5':'Pasal 25.7.2'});
        ys.forEach(({y,z})=>{ if(z==='joint'&&!jOn) return; push(lift3D(cg.hoop,(u,v,w)=>[xc+u,y+w,v],ds*1.05),ds,z==='joint'?'hbk':'kolomS',z==='joint'?COL.webH:COL[z],iH(z)); cg.ties.forEach(t=>push(t.pts.map(([u,v])=>[xc+u,y+ds*1.1,v]),ds,z==='joint'?'hbk':'kolomS',COL.tie,iH(z))); });
      });
      labels.push({p:[0,Hk*0.5,bc/2+40],t:'kolom struktur',stage:'k2'});
    }
    // ---------- balok ----------
    if(p.balok){
      const x0=p.kolom?fx0:kpOn?-75:-200, x1=p.kolom?fx1:kpOn?Lb+75:Lb+200;
      cp('bp2',{box:[x0,x1,Hk-hb,Hk,-b/2,b/2]});
      const zl=b/2-COV-ds-dbb/2, yT=Hk-COV-ds-dbb/2-(p.kolom?dbk:0), yB=Hk-hb+COV+ds+dbb/2+(p.kolom?dbk:0), rb=3.5*dbb, tail=12*dbb;
      const xa=p.kolom?-bc/2+COV+ds+dbk+dbb*1.5:x0+30, xb=Lb-xa;
      const ldh=(K?ldhSeis:ldhGen)(420,30,dbb), iB={t:`Tulangan balok 3D${dbb} atas dan bawah`,b:[p.kolom?`Dibengkokkan 90° ke dalam kolom dengan ekor 12db; ℓdh perlu ${fmt(ldh)} mm.`:'Tanpa kolom penumpu.'],pasal:K?'Pasal 18.8.5':'Pasal 25.4.3'};
      linspace(-zl,zl,3).forEach(z=>{ [[yT,-1],[yB,1]].forEach(([y,sv])=>{
        if(!p.kolom){ push([[xa,y,z],[xb,y,z]],dbb,'balok',sv<0?COL.top:COL.bot,iB); return; }
        const t=turtle(xa,y+sv*tail,sv<0?PI/2:-PI/2); t.fwd(tail-rb).turn(sv<0?-90:90,rb).fwd(xb-xa-2*rb).turn(sv<0?-90:90,rb).fwd(tail-rb);
        push(t.pts.map(([x,yy])=>[x,yy,z]),dbb,'balok',sv<0?COL.top:COL.bot,iB); }); });
      const ext=K?Math.max(6*ds,75):6*ds, hp=hoop2D(b/2-COV-ds/2,hb/2-COV-ds/2,2.5*ds,hook,ext), z2=2*hb, d=hb-COV-ds-dbb/2;
      const sC=K?Math.min(100,Math.floor(Math.min(d/4,6*dbb,150)/5)*5):150, sM=K?150:Math.min(150,Math.floor(d/2/5)*5);
      const posB=[]; for(let x=x0+50;x<=x1-50;){ const c=K&&(x<x0+z2||x>x1-z2); posB.push({x,c}); x+=c?sC:sM; }
      posB.forEach(({x,c})=>push(lift3D(hp,(u,v,w)=>[x+w,Hk-hb/2+v,u],ds*1.05),ds,'balokS',c?COL.conf:COL.mid,{t:`Sengkang balok D${ds}-${c?sC:sM}`,b:[c?'Daerah 2h dari muka kolom (Pasal 18.6.4.4).':'Daerah lapangan.'],pasal:K?(c?'Pasal 18.6.4.4':'Pasal 18.6.4.6'):'Tabel 9.7.6.2.2'}));
      labels.push({p:[Lb/2,Hk+80,b/2],t:p.kolom?'balok':'ring balok',stage:'bp2'});
      if(p.kolom){ const avail=bc-COV; add(ldh<=avail,'Kait tulangan balok di dalam kolom',`ℓdh = ${fmt(ldh)} mm ≤ tersedia ${fmt(avail)} mm`,K?'Pasal 18.8.5.1':'Pasal 25.4.3.1');
        if(K) add(bc>=20*dbb,'Kolom terhadap diameter tulangan balok',`hc = ${bc} mm ≥ 20db = ${20*dbb} mm`,'Pasal 18.8.2.3');
        add(jOn,'Sengkang di dalam joint',!jOn?'joint tanpa sengkang; nyalakan Hubungan balok-kolom':K?'diteruskan dengan spasi 100 mm sepanjang tinggi balok':`disebar sepanjang tinggi balok, spasi ≤ h/2 = ${fmt(hb/2)} mm`,K?'Pasal 18.8.3.1':'Pasal 15.4.2'); }
      else if(kpOn) add(null,'Balok sebagai ring balok','tanpa kolom struktur, balok bertumpu pada kolom praktis dan dinding bata',PU);
      else add(false,'Balok tanpa kolom penumpu','nyalakan kolom struktur, atau dinding bata dengan kolom praktis','praktik');
    }
    // ---------- pelat ----------
    if(p.pelat){
      const px0=-bc/2-300, px1=Lb+bc/2+300, W=1500;
      cp('bp2',{box:[px0,px1,Hk-tp,Hk,-W,W]});
      const iP={t:'Tulangan pelat D10-150',b:['Tulangan bawah dua arah; tulangan atas melintang di atas balok untuk momen negatif.'],pasal:'Pasal 8.7.2'};
      spread(-W+50,W-50,150).forEach(z=>push([[px0+30,Hk-tp+25,z],[px1-30,Hk-tp+25,z]],10,'pelat',COL.matA,iP));
      spread(px0+50,px1-50,200).forEach(x=>push([[x,Hk-tp+35,-W+30],[x,Hk-tp+35,W-30]],10,'pelat',COL.matB,iP));
      spread(px0+75,px1-75,150).forEach(x=>push([[x,Hk-25,-1000],[x,Hk-25,1000]],10,'pelat',COL.matT,iP));
      labels.push({p:[Lb/2,Hk+60,W*0.7],t:'pelat lantai',stage:'bp2'});
      if(!p.balok) add(null,'Pelat tanpa balok','pelat langsung bertumpu pada kolom; tebal minimum dan geser pons diperiksa terpisah','praktik');
    }
    // ---------- sloof ----------
    if(hasS){
      const x0=p.kolom?fx0:-300, x1=p.kolom?fx1:Lb+300;
      cp('s2',{box:[x0,x1,-hs,0,-bs/2,bs/2]});
      const zl=bs/2-sCov-sds-dbs/2, yT=-sCov-sds-dbs/2-(p.kolom?dbk:0), yB=-hs+sCov+sds+dbs/2+(p.kolom?dbk:0), rb=3*dbs, tail=12*dbs;
      const xa=p.kolom?-bc/2+COV+ds+dbk+dbs*1.5:x0+30, xb=Lb-xa;
      const iS=SP?{t:'Tulangan sloof praktis 4D10',b:['Ukuran minimum 150 × 200 mm menurut buku saku PU.',p.kolom?'Diangkur ke dalam kolom dengan kait 90°.':'Menerus di bawah dinding dan mengikat kolom praktis.'],pasal:PU}
        :{t:`Tulangan sloof ${2*nS}D${dbs}, ${nS} atas dan ${nS} bawah`,b:[p.kolom?'Diangkur ke dalam kolom dengan kait 90°.':'Sloof tanpa kolom struktur.',K?'Menerus dan disalurkan di setiap diskontinuitas (Pasal 18.13.3.1).':''],pasal:K?'Pasal 18.13.3.1':'Pasal 25.4.3'};
      linspace(-zl,zl,nS).forEach(z=>[[yT,-1],[yB,1]].forEach(([y,sv])=>{
        if(!p.kolom){ push([[xa,y,z],[xb,y,z]],dbs,'sloof',COL.bot,iS); return; }
        const t=turtle(xa,y+sv*tail,sv<0?PI/2:-PI/2); t.fwd(tail-rb).turn(sv<0?-90:90,rb).fwd(xb-xa-2*rb).turn(sv<0?-90:90,rb).fwd(tail-rb);
        push(t.pts.map(([x,yy])=>[x,yy,z]),dbs,'sloof',COL.bot,iS); }));
      const sS=SP?150:K?Math.min(150,Math.floor(Math.min(bs,hs)/2/5)*5):150, sHook=SP?135:hook, ext=SP?50:K?Math.max(6*sds,75):6*sds, hp=hoop2D(bs/2-sCov-sds/2,hs/2-sCov-sds/2,2.5*sds,sHook,ext);
      const iSS=SP?{t:'Begel sloof praktis D8-150',b:['Kait 135° dengan panjang ekor ≥ 50 mm.'],pasal:PU}:{t:`Sengkang sloof D${sds}-${sS}`,b:[K?'Sengkang pengekang tertutup, spasi ≤ min(b/2; 300) (Pasal 18.13.3.2).':'Sengkang sloof.'],pasal:K?'Pasal 18.13.3.2':'Tabel 9.7.6.2.2'};
      spread(x0+50,x1-50,sS).forEach(x=>push(lift3D(hp,(u,v,w)=>[x+w,-hs/2+v,u],sds*1.05),sds,'sloof',COL.mid,iSS));
      labels.push({p:[Lb*0.3,-hs-40,bs/2],t:SP?'sloof praktis':'sloof',stage:'s2'});
      if(SP&&p.kolom) add(K?false:null,'Sloof praktis pada kolom struktur',K?'SRPMK memerlukan sloof struktur (Pasal 18.13.3); ganti ke sloof struktur':'sloof praktis hanya untuk dinding; pada portal beton sebaiknya dipakai sloof struktur',K?'Pasal 18.13.3.2':'praktik');
      if(K&&p.kolom&&!SP){ const Lc=Lb-bc, dmin=Math.min(Lc/20,450); add(Math.min(bs,hs)>=dmin,'Dimensi sloof',`${Math.min(bs,hs)} mm ≥ min(ℓ bersih/20; 450) = ${fmt(dmin)} mm`,'Pasal 18.13.3.2'); }
      if(p.batukali) add(300>=bs,'Sloof di atas batu kali',`lebar atas batu kali 300 mm ${300>=bs?'≥':'<'} lebar sloof ${bs} mm`,'praktik');
    }
    // ---------- dinding bata dan kolom praktis ----------
    if(p.bata){
      const bk=150, span=fx1-fx0;
      // pos: as, lebar, apakah kolom praktis. Tanpa kolom praktis, dinding hanya dibatasi kolom struktur (atau berdiri bebas, w = 0).
      let posts=p.kolom?[{x:fx0-bc/2,w:bc,kp:false}]:[];
      const nIn=kpOn?Math.max(0,Math.ceil(span/3000)-1):0;
      if(p.kolom){ for(let i=1;i<=nIn;i++) posts.push({x:fx0+span*i/(nIn+1),w:bk,kp:true}); posts.push({x:fx1+bc/2,w:bc,kp:false}); }
      else if(kpOn){ const n=Math.max(1,Math.ceil(Lb/3000)); for(let i=0;i<=n;i++) posts.push({x:Lb*i/n,w:bk,kp:true}); }
      else posts=[{x:0,w:0,kp:false},{x:Lb,w:0,kp:false}];
      let T=0, nCourse=0, wInfo=null; const areas=[];
      for(let i=0;i<posts.length-1;i++){
        const P0=posts[i], P1=posts[i+1], a0=P0.x+P0.w/2, a1=P1.x-P1.w/2;
        const w=bataWall({axis:'x',a0,a1,y0:yW0,y1:yW1,c:0,bt,joint:10,tooth0:P0.kp&&!bt.ringan?50:0,tooth1:P1.kp&&!bt.ringan?50:0});
        T=w.thick; nCourse=w.n; wInfo=w; areas.push((a1-a0)*(yW1-yW0)/1e6);
        cp('bata',{box:w.mortar,mat:'spesi',layer:'bata'},{boxes:w.boxes,mat:bt.ringan?'ringan':'bata',layer:'bata'});
      }
      // kolom praktis
      const iK={t:'Kolom praktis 4D10, sengkang D8-150',b:['Dicor setelah pasangan bata, mengunci gigi bata.',hasS||p.balok?'Tulangannya dibengkokkan ke sloof dan balok sepanjang 400 mm.':''],pasal:PU};
      const a=bk/2-CV_P-8-5, yB=hasS?-hs+sCov+sds+dbs/2+dbs:yW0+40, yT=p.balok?Hk-hb+COV+ds+dbb+dbb:yW1-40;
      const hkp=hoop2D(bk/2-CV_P-4,bk/2-CV_P-4,16,135,50), kpBarStage=hasS?'s1':'kp';
      posts.filter(q=>q.kp).forEach(q=>{ cp('kp',{box:[q.x-bk/2,q.x+bk/2,yW0,yW1,-bk/2,bk/2]});
        for(const u of [-a,a]) for(const z of [-a,a]){ const dir=u<0?-1:1;
          push((hasS&&p.balok?bentBar(q.x+u,yB,yT,dir,400,30):[[q.x+u,yB],[q.x+u,yT]]).map(([x,y])=>[x,y,z]),10,'kp',COL.long,iK,kpBarStage); }
        spread(yW0+50,yW1-50,150).forEach(y=>push(lift3D(hkp,(u,v,w)=>[q.x+u,y+w,v],8.4),8,'kp',COL.mid,iK,kpBarStage)); });
      if(kpOn){ const miss=[!hasS&&'sloof',!p.balok&&'ring balok'].filter(Boolean);
        add(!miss.length,'Angkur tulangan kolom praktis',miss.length?`tidak ada ${miss.join(' dan ')}, sehingga tulangan kolom praktis tidak terangkur ≥ 40d atau 400 mm di ujung itu`:'dibengkokkan 400 mm ke dalam sloof dan ring balok (≥ 40d dan ≥ 400 mm)',PU); }
      // angkur dari setiap tiang ke dinding di sebelahnya, tiap 6 lapis
      const iA={t:'Angkur dinding D10, panjang 400 mm',b:['Dipasang di siar datar setiap 6 lapis bata.'],pasal:PU};
      const yA=[]; for(let k=5;k<nCourse;k+=6) yA.push(wInfo.courseY(k)+bt.t+5);
      posts.forEach((q,i)=>[[i>0,-1],[i<posts.length-1,1]].forEach(([ok,dir])=>{ if(!ok||!q.w) return; const xs0=q.x-dir*(q.w/2-50);
        yA.forEach(y=>{ const t=turtle(xs0,y-60,PI/2); t.fwd(40).turn(dir>0?-90:90,20).fwd(400+q.w/2-70); push(t.pts.map(([x,yy])=>[x,yy,0]),10,'angkur',COL.dowel,iA); }); }));
      labels.push({p:[Lb/2,yW1*0.45,T/2+30],t:'dinding bata',stage:'bata'},...posts.filter(q=>q.kp).slice(0,1).map(q=>({p:[q.x,yW1*0.7,bk/2+30],t:'kolom praktis',c:'lap',stage:'kp'})));
      const amax=Math.max(...areas), lmax=Math.max(...posts.slice(1).map((q,i)=>q.x-q.w/2-(posts[i].x+posts[i].w/2)));
      add(amax<=9,'Luas bidang dinding per panel',`terbesar ${fmt(amax,2)} m² ≤ 9 m², ${areas.length} panel`,PU);
      add(lmax<=3000,'Jarak antar kolom pada dinding',`terbesar ${fmt(lmax)} mm ≤ 3.000 mm; ${kpOn?`${posts.filter(q=>q.kp).length} kolom praktis disisipkan otomatis`:'kolom praktis dimatikan'}`,PU);
      if(!p.kolom&&!kpOn) add(false,'Dinding tanpa kolom pengikat','dinding berdiri bebas; nyalakan kolom praktis atau kolom struktur',PU);
      const sup=[hasS?bs:null,p.balok?b:null].filter(v=>v!==null);
      if(sup.length) add(Math.min(...sup)>=T,'Dudukan dinding',`tebal dinding ${fmt(T)} mm ≤ lebar ${hasS?`sloof ${bs} mm`:''}${hasS&&p.balok?' dan ':''}${p.balok?`balok ${b} mm`:''}`,'praktik');
      if(!hasS&&!p.batukali) add(false,'Dinding tanpa dudukan','nyalakan sloof atau fondasi batu kali di bawah dinding','praktik');
      if(yA.length&&posts.some(q=>q.w)) add(true,'Angkur dinding ke kolom',`D10 panjang 400 mm tiap 6 lapis, ${yA.length} lapis angkur per sisi kolom`,PU);
    }
    let tgView=null;
    // ---------- dinding geser di bentang antar kolom ----------
    // Kolom di kedua ujung berperan sebagai elemen batas. Ukuran dan tulangan dibuat tetap supaya memenuhi rasio minimum.
    if(dgOn){
      const tw=K?250:200, curt=K?2:1, dbv=10, dbh=10, sv=K?200:250, sh=K?200:150, cv=K?25:20;
      const yTop=p.balok?Hk-hb:Hk-tp, yBotC=0;
      cp('k2',{box:[fx0,fx1,yBotC,yTop,-tw/2,tw/2]});
      // tulangan vertikal di dalam sengkang sloof dan balok; tulangan horizontal di sisi luarnya
      let zv=curt===2?tw/2-cv-dbh-dbv/2:0;
      if(curt===2){ if(hasS) zv=Math.min(zv,bs/2-sCov-sds-dbv/2-1); if(p.balok) zv=Math.min(zv,b/2-COV-ds-dbv/2-1); }
      const zh=curt===2?zv+(dbv+dbh)/2+1:dbk/2+dbh/2+2, zvs=curt===2?[-zv,zv]:[zh-(dbv+dbh)/2-1], zhs=curt===2?[-zh,zh]:[zh];
      const yb=hasS?-hs+sCov+sds+dbs+dbv/2:yBotC+50, yt=p.balok?Hk-COV-ds-dbb-dbb-dbv/2:yTop+tp-25-dbv;
      const Lh=12*dbv, r=3*dbv, botH=hasS, topH=true;
      const iV={t:`Tulangan vertikal dinding D${dbv}-${sv}${curt===2?', dua lapis':''}`,b:[hasS?'Bawahnya dikaitkan 90° di dalam sloof.':'Tidak ada sloof di bawah dinding.',p.balok?'Atasnya dikaitkan 90° di dalam balok.':'Atasnya dikaitkan 90° di dalam pelat.'],pasal:K?'Pasal 18.10.2.1':'Pasal 11.6.1'};
      const iHz={t:`Tulangan horizontal dinding D${dbh}-${sh}${curt===2?', dua lapis':''}`,b:['Menahan geser. Kedua ujungnya dikaitkan 90° di dalam inti kolom yang menjadi elemen batas.'],pasal:K?'Pasal 18.10.6.4(h)':'Pasal 11.6.1'};
      spread(fx0+sv/2,fx1-sv/2,sv).forEach((x,i)=>zvs.forEach(zc=>{ const dir=i%2?1:-1;
        const t=botH?turtle(x+dir*Lh,yb,dir>0?PI:0):turtle(x,yb,PI/2); if(botH) t.fwd(Lh-r).turn(dir>0?-90:90,r);
        t.fwd(yt-yb-(botH?r:0)-(topH?r:0)); if(topH) t.turn(dir>0?-90:90,r).fwd(Lh-r);
        push(t.pts.map(([xx,y])=>[xx,y,zc]),dbv,'dgV',COL.matA,iV,'k1'); }));
      const xa=-bc/2+COV+ds+dbk+dbh, xb=Lb-xa, Lhh=12*dbh, rh=3*dbh;
      spread(yBotC+60,yTop-60,sh).forEach(y=>zhs.forEach(zc=>{ const sg=zc>=0?1:-1;
        const t=turtle(xa,zc-sg*Lhh,sg>0?PI/2:-PI/2); t.fwd(Lhh-rh).turn(sg>0?-90:90,rh).fwd(xb-xa-2*rh).turn(sg>0?-90:90,rh).fwd(Lhh-rh);
        push(t.pts.map(([x,z])=>[x,y,z]),dbh,'dgH',COL.webH,iHz,'k1'); }));
      labels.push({p:[Lb/2,yTop*0.5,tw/2+30],t:'dinding geser',stage:'k2'});
      const Av=AREA[dbv]*curt, Ah=AREA[dbh]*curt, rl=Av/(tw*sv), rt=Ah/(tw*sh);
      if(K){ add(rl>=0.0025&&rt>=0.0025,'Rasio tulangan badan dinding',`ρℓ = ${fmt(rl*100,3)}%, ρt = ${fmt(rt*100,3)}% ≥ 0,25%`,'Pasal 18.10.2.1');
        add(sv<=450&&sh<=450,'Spasi tulangan dinding',`vertikal ${sv}, horizontal ${sh} mm ≤ 450 mm`,'Pasal 18.10.2.1');
        add(true,'Jumlah lapis tulangan dinding','dua lapis','Pasal 18.10.2.2');
        add(true,'Angkur tulangan horizontal dinding','dikaitkan 90° di dalam inti kolom yang menjadi elemen batas','Pasal 18.10.6.4(h)');
        add(null,'Kolom sebagai elemen batas','kebutuhan dan detail elemen batas diperiksa di halaman Dinding geser; di sini kolom struktur dipakai sebagai elemen batas','Pasal 18.10.6.2'); }
      else { add(rl>=0.0012&&rt>=0.0020,'Rasio tulangan badan dinding',`ρℓ = ${fmt(rl*100,3)}% ≥ 0,12%, ρt = ${fmt(rt*100,3)}% ≥ 0,20%`,'Pasal 11.6.1');
        const sm=Math.min(3*tw,450); add(sv<=sm&&sh<=sm,'Spasi tulangan dinding',`vertikal ${sv}, horizontal ${sh} mm ≤ min(3h; 450) = ${fmt(sm)} mm`,'Pasal 11.7.2.1, 11.7.3.1');
        add(true,'Jumlah lapis tulangan dinding',`tebal ${tw} mm, satu lapis cukup karena tebal ≤ 250 mm`,'Pasal 11.7.2.3'); }
      if(hasS){ const avail=hs-sCov-sds-dbs, lh=ldhGen(420,30,dbv); add(lh<=avail,'Kait tulangan vertikal dinding di sloof',`ℓdh = ${fmt(lh)} mm ≤ tersedia ${fmt(avail)} mm`,'Pasal 25.4.3.1');
        add(bs>=tw,'Dudukan dinding geser',`lebar sloof ${bs} mm ${bs>=tw?'≥':'<'} tebal dinding ${tw} mm`,'praktik'); }
      else add(false,'Dinding geser tanpa dudukan','nyalakan sloof struktur di bawah dinding geser','praktik');
      add(bc>=tw,'Kolom elemen batas lebih tebal dari dinding',`sisi kolom ${bc} mm ≥ tebal dinding ${tw} mm`,'praktik');
    }
    // ---------- tangga dua lajur dengan bordes di sisi luar pelat ----------
    // Dibangun dengan tangga.build() untuk setiap lajur, lalu dipindahkan: arah naik tangga menjadi sumbu z gabungan.
    if(tgOn){
      const W=1500, gap=100, span=fx1-fx0, wd=Math.max(800,Math.min(1200,Math.floor((span-200-gap)/2/50)*50)), H2=Hk/2, tt=170;
      const base={...tg.defaults.ALL,H:H2,wd,t:tt,tump:'1'}, m1=tg.build({...base,Lb:1200}), m2=tg.build({...base,Lb:800});
      const n=Math.max(2,Math.round(H2/base.R)), Lr=(n-1)*base.T, xF=Lr+1200;
      const X1=fx0+100, X2=X1+wd+gap;
      const f1=([x,y,z])=>[X1+z,y,W+x], f2=([x,y,z])=>[X2+z,y+H2,W+Lr-x];
      const kb=200, hbb=450, bbb=250, bx0=X1-150, bx1=X2+wd+150, zb0=W+xF;
      const mapC=(c,lane)=>({prism:{axis:'x',pts:c.prism.pts.map(([x,y])=>lane===1?[W+x,y]:[W+Lr-x,y+H2]),x0:(lane===1?X1:X2)+c.prism.z0,x1:(lane===1?X1:X2)+c.prism.z1}});
      cp('tg2',...m1.concrete.filter(c=>c.prism).map(c=>({...mapC(c,1),layer:'tanggaB'})),...m2.concrete.filter(c=>c.prism).map(c=>({...mapC(c,2),layer:'tanggaB'})),
        {box:[X1+wd,X2+wd,H2-tt,H2,W+Lr,W+xF],layer:'tanggaB'},                                          // bordes: celah antar lajur dan seluruh lebar lajur kedua
        {box:[bx0,bx1,H2-hbb,H2,zb0,zb0+bbb],layer:'tanggaB'});                                         // balok bordes
      // Bordes ditumpu balok bordes, dan balok bordes ditumpu dua kolom tangga di atas fondasi setempat.
      // Lantai dasar di bawah ruang tangga menjadi pijakan kaki tangga, supaya tangga tidak tampak melayang.
      const yLt=-120, kxs=[bx0+kb/2,bx1-kb/2], kzc=zb0+bbb/2, yFt=-450, hFt=300, BFt=700;
      cp('tgL',{box:[bx0,bx1,yLt,0,W-800,zb0+bbb+150],layer:'tanggaB'});
      kxs.forEach(x=>cp('tgK2',{box:[x-BFt/2,x+BFt/2,yFt-hFt,yFt,kzc-BFt/2,kzc+BFt/2],layer:'tanggaB'},{box:[x-kb/2,x+kb/2,yFt,H2-hbb,kzc-kb/2,kzc+kb/2],layer:'tanggaB'}));
      const iL={t:'Tulangan lantai dasar D8-200',b:['Satu lapis di tengah tebal pelat lantai kerja di bawah ruang tangga. Pelat ini menumpu kaki tangga.'],pasal:'praktik'};
      spread(W-800+40,zb0+bbb+150-40,200).forEach(z=>push([[bx0+40,yLt/2,z],[bx1-40,yLt/2,z]],8,'tanggaL',COL.matA,iL,'tgL'));
      spread(bx0+40,bx1-40,200).forEach(x=>push([[x,yLt/2+8,W-800+40],[x,yLt/2+8,zb0+bbb+150-40]],8,'tanggaL',COL.matB,iL,'tgL'));
      const iK={t:'Kolom tangga 200 × 200, 4D13, sengkang D8-150',b:['Menumpu balok bordes. Tulangannya dikaitkan ke fondasi setempat di bawah dan ke dalam balok bordes di atas.'],pasal:'praktik'};
      const ak=kb/2-25-8-6.5, hk=hoop2D(kb/2-25-4,kb/2-25-4,16,hook,K?75:50);
      kxs.forEach(x=>{ for(const u of [-ak,ak]) for(const v of [-ak,ak]){ const dir=u<0?-1:1, t=turtle(x+u+dir*150,yFt-hFt+75,dir>0?PI:0); t.fwd(150-39).turn(dir>0?-90:90,39).fwd(H2-40-(yFt-hFt+75)-2*39).turn(x<(bx0+bx1)/2?-90:90,39).fwd(150-39);
          push(t.pts.map(([xx,y])=>[xx,y,kzc+v]),13,'tanggaK',COL.long,iK,'tgK1'); }
        spread(yFt+50,H2-hbb-50,150).forEach(y=>push(lift3D(hk,(u,v,w)=>[x+u,y+w,kzc+v],8.4),8,'tanggaK',COL.mid,iK,'tgK1')); });
      const iBb={t:'Balok bordes 250 × 450, 2D13 atas dan bawah, sengkang D8-150',b:['Menumpu bordes dan menyalurkan bebannya ke kolom tangga.'],pasal:'praktik'};
      const zbl=bbb/2-30-8-6.5; [H2-30-8-6.5-13,H2-hbb+30+8+6.5+13].forEach(y=>[-zbl,zbl].forEach(dz=>push([[bx0+30,y,kzc+dz],[bx1-30,y,kzc+dz]],13,'tanggaK',COL.top,iBb,'tg1')));
      const hbbH=hoop2D(bbb/2-30-4,hbb/2-30-4,16,hook,K?75:50);
      spread(bx0+kb+50,bx1-kb-50,150).forEach(x=>push(lift3D(hbbH,(u,v,w)=>[x+w,H2-hbb/2+v,kzc+u],8.4),8,'tanggaK',COL.mid,iBb,'tg1'));
      [[m1,f1],[m2,f2]].forEach(([m,f],li)=>m.bars.forEach(bb=>push(bb.pts.map(f),bb.d,bb.layer==='bagi'?'tanggaD':'tangga',bb.color,{...bb.info,t:`Tangga lajur ${li+1}: ${bb.info.t}`},'tg1')));
      // tulangan bordes di bagian antara kedua lajur
      const iBd={t:'Tulangan bordes D10-200',b:['Menyambung bordes kedua lajur, atas dan bawah.'],pasal:'Pasal 24.4.3'};
      spread(W+Lr+50,W+xF-50,200).forEach(z=>[H2-tt+30,H2-30].forEach(y=>push([[X1+60,y,z],[X2+wd-60,y,z]],10,'tanggaD',COL.dist,iBd,'tg1')));
      labels.push({p:[X1+wd/2,H2*0.5,W+Lr*0.5],t:'tangga',stage:'tg2'},{p:[X1+wd,H2+60,W+Lr+600],t:'bordes',stage:'tg2'});
      m1.checks.filter(c=>c.ok!==null).forEach(c=>add(c.ok,`Tangga: ${c.t[0].toLowerCase()+c.t.slice(1)}`,c.d,c.p));
      add(span>=2*800+gap+200,'Ruang tangga di antara kolom',`lebar lajur ${fmt(wd)} mm, dua lajur dan celah ${gap} mm di bentang bersih ${fmt(span)} mm`,'praktik');
      add(true,'Tumpuan bordes',`balok bordes ${bbb} × ${hbb} ditumpu dua kolom tangga ${kb} × ${kb} di atas fondasi setempat`,'praktik');
      const zs=spread(50,wd-50,base.sm), zm=zs[Math.floor(zs.length/2)];
      tgView={title:'Potongan tangga lajur pertama',sub:`naik ${n} × ${fmt(H2/n,1)} / ${base.T} mm sampai bordes, tulangan disilangkan di sudut dalam`,n:'x',at:X1+zm+base.dbm*0.6,half:base.dbm*1.5,u:'z',v:'y',maxH:440};
    }
    // ---------- pemeriksaan sambungan fondasi ----------
    if(p.kolom&&fk!=='none'){
      const avail=(fk==='telapak'?hfT-75-26:hcap-100-32)-dbk, lc=ldc(420,30,dbk);
      add(lc<=avail,'Penyaluran tekan tulangan kolom di fondasi',`ℓdc = ${fmt(lc)} mm ≤ tersedia ${fmt(avail)} mm`,'Pasal 25.4.9.2');
      if(K){ const lh=ldhGen(420,30,dbk); add(lh<=avail,'Penyaluran tarik dengan kait di fondasi',`ℓdh = ${fmt(lh)} mm ≤ tersedia ${fmt(avail)} mm`,'Pasal 18.13.2.1, 25.4.3'); add(true,'Arah kait tulangan kolom','ujung bebas kait mengarah ke sumbu kolom','Pasal 18.13.2.2'); }
      add(Df>=hs+100,'Kedalaman fondasi kolom',`atas fondasi ${fmt(Df)} mm di bawah atas sloof, sloof setinggi ${hs} mm`,'praktik');
    }
    if(p.kolom&&fk==='none') add(false,'Kolom struktur tanpa fondasi kolom',p.batukali?'kolom struktur tidak boleh bertumpu pada fondasi batu kali; pilih fondasi telapak atau tiang':'pilih fondasi telapak atau tiang','praktik');
    add(null,'Pemeriksaan lengkap','setiap komponen diperiksa lengkap di halamannya masing-masing; di sini yang diperiksa adalah sambungannya','praktik');
    // ---------- gambar ----------
    // tangga berada di luar bidang portal, jadi disembunyikan dari tampak depan dan potongan portal; ia punya potongan sendiri
    const noTg=['tanggaB','tangga','tanggaD','tanggaK','tanggaL'];
    const views=[
      {title:'Tampak depan portal',sub:`bentang ${fmt(Lb)} mm, tinggi ${fmt(Hk)} mm`,n:'z',u:'x',v:'y',skipMat:['spesi'],skipLayer:noTg,layers:['kolom','balok','sloof','fondasi','kp','angkur','hbk','dgV','dgH'],maxH:520,
        dims:[{a:[0,Hk+150],b:[Lb,Hk+150],off:8,t:`${fmt(Lb)}`}]},
      {title:'Potongan melintang di tengah bentang',n:'x',at:Lb/2+7,half:80,u:'z',v:'y',maxH:520,skipLayer:noTg},
      ...(p.kolom?[{title:'Potongan melintang di as kolom',n:'x',at:0,half:60,u:'z',v:'y',maxH:520,skipLayer:noTg}]:[]),
      ...(tgView?[tgView]:[])
    ];
    const comps=[FKN[fk],p.batukali&&'batu kali',hasS&&(SP?'sloof praktis':'sloof struktur'),p.kolom&&'kolom struktur',jOn&&'sengkang joint',p.balok&&(p.kolom?'balok':'ring balok'),p.pelat&&'pelat',tgOn&&'tangga',p.bata&&'dinding bata',kpOn&&'kolom praktis',dgOn&&'dinding geser'].filter(Boolean);
    const derived=`komponen aktif = <b>${comps.length}</b>: ${comps.join(', ')}<br>bentang bersih antar kolom = <b>${fmt(fx1-fx0)}</b> mm<br>tinggi dinding = <b>${fmt(yW1-yW0)}</b> mm<br>jumlah batang dan sengkang = <b>${bars.length}</b>`;
    const layers=[{k:'fondasi',label:'Tulangan fondasi kolom',color:COL.matA,ex:[0,-700,0]},{k:'batukali',label:'Fondasi batu kali',color:MAT.batu,block:true,ex:[0,-900,0]},
      {k:'sloof',label:'Tulangan sloof',color:COL.bot,ex:[0,-350,0]},{k:'kolom',label:'Tulangan kolom',color:COL.long,ex:[0,0,0]},{k:'kolomS',label:'Sengkang kolom',color:COL.conf,ex:[0,0,0]},
      {k:'hbk',label:'Sengkang joint (HBK)',color:COL.webH,ex:[0,0,0]},{k:'balok',label:'Tulangan balok',color:COL.top,ex:[0,450,0]},{k:'balokS',label:'Sengkang balok',color:COL.mid,ex:[0,450,0]},
      {k:'pelat',label:'Tulangan pelat',color:COL.matT,ex:[0,900,0]},{k:'bata',label:'Dinding bata',color:bt.ringan?MAT.ringan:MAT.bata,block:true,ex:[0,0,-1200]},
      {k:'kp',label:'Kolom praktis',color:COL.long,ex:[0,0,-1200]},{k:'angkur',label:'Angkur',color:COL.dowel,ex:[0,0,600]},
      {k:'dgV',label:'Tulangan vertikal dinding geser',color:COL.matA,ex:[0,0,-1200]},{k:'dgH',label:'Tulangan horizontal dinding geser',color:COL.webH,ex:[0,0,-1200]},
      {k:'tanggaB',label:'Beton tangga',color:'#c9c4b8',block:true,ex:[0,0,1500]},{k:'tangga',label:'Tulangan utama tangga',color:COL.matA,ex:[0,0,1500]},{k:'tanggaD',label:'Tulangan bagi tangga',color:COL.dist,ex:[0,0,1500]},
      {k:'tanggaK',label:'Kolom dan balok bordes',color:COL.long,ex:[0,0,1500]},{k:'tanggaL',label:'Tulangan lantai dasar',color:COL.matA,ex:[0,-400,1500]}];
    // ---------- urutan pelaksanaan ----------
    // Urutan dan teksnya menyesuaikan komponen yang menyala. Tanpa kolom struktur (rumah tembokan), ring balok dicor
    // setelah dinding bata dan kolom praktis, bukan sebelum dinding seperti pada portal beton.
    const BP=p.kolom?'Balok':'Ring balok', BPn=`${BP}${p.pelat?' dan pelat':''}`;
    const ORDER=[
      ['fk1','Fondasi kolom: pembesian','Tanah digali dan lantai kerja dicor. Anyaman tulangan fondasi dipasang di atas beton decking; stek kolom diikat di atasnya dengan kait masuk ke fondasi.'],
      ['fk2',fk==='tiang'?'Tiang bor dan pile cap: pengecoran':'Fondasi kolom: pengecoran',fk==='tiang'?'Tiang bor dicor lebih dulu. Kepala tiang dibobok sampai tulangannya terlihat, lalu pile cap dicor menyatu dengan tulangan tiang.':'Fondasi telapak dicor sampai elevasi rencana. Bekisting dibongkar setelah beton cukup kuat, lalu galian diurug kembali.'],
      ['bk','Fondasi batu kali',`${fk==='none'?'Tanah digali mengikuti as dinding. ':'Di antara fondasi kolom, '}pasir urug dihampar, aanstamping dipasang berdiri, lalu batu kali disusun dengan spesi.${hasS?' Angkur sloof ditanam di bagian atas pasangan.':''}`],
      ['s1',SP?'Sloof praktis: pembesian':'Sloof: pembesian',SP?`Tulangan sloof praktis 4D10 dengan begel D8-150 dirangkai di atas fondasi${p.batukali?' batu kali dan diikat ke angkur':''}.${kpOn?' Tulangan kolom praktis didirikan sekarang dan diikat ke sloof, karena nantinya terkunci di dalam sloof.':''}`
        :`Tulangan sloof dirangkai di atas fondasi.${p.kolom?' Ujungnya dibengkokkan ke daerah kolom dan diikat ke stek kolom.':''}${kpOn?' Tulangan kolom praktis ikut didirikan dan diikat ke sloof.':''}`],
      ['s2',SP?'Sloof praktis: pengecoran':'Sloof: pengecoran','Bekisting sloof dipasang dan sloof dicor. Permukaan atas sloof menjadi peil lantai.'],
      ['k1',dgOn?'Kolom dan dinding geser: pembesian':'Kolom: pembesian',`Tulangan kolom disambung dari stek. Sengkang dipasang dengan jarak lebih rapat di ujung atas dan bawah kolom.${dgOn?' Tulangan dinding geser dirangkai di antara kolom: tulangan vertikal dikaitkan ke sloof, tulangan horizontal dikaitkan ke dalam inti kolom.':''}`],
      ['k2',dgOn?'Kolom dan dinding geser: pengecoran':'Kolom: pengecoran',`${dgOn?'Bekisting kolom dan dinding dipasang, lalu keduanya dicor bersamaan sampai di bawah balok. ':'Bekisting kolom dipasang dan kolom dicor bertahap. '}Pengecoran berhenti di bawah balok; joint dicor bersama balok dan pelat.`],
      ['bp1',`${BPn}: pembesian`,p.kolom?`Perancah dan bekisting balok${p.pelat?' serta pelat':''} dipasang. ${jOn?'Sengkang joint dipasang lebih dulu, lalu tulangan balok dimasukkan menembus joint':'Tulangan balok dimasukkan dan dibengkokkan ke dalam kolom'}${p.pelat?', dan terakhir tulangan pelat dirangkai.':'.'}`
        :`Bekisting ring balok dipasang di atas dinding bata. Tulangan ring balok dirangkai dan diikat ke ujung tulangan kolom praktis yang dibengkokkan.${p.pelat?' Tulangan pelat dirangkai sesudahnya.':''}`],
      ['bp2',`${BPn}: pengecoran`,p.kolom?`${BPn}${jOn?' dan joint':''} dicor bersamaan dalam satu tahap, lalu dirawat beberapa hari sebelum perancah dibongkar.`:`Ring balok dicor dan mengikat semua kolom praktis serta puncak dinding menjadi satu kesatuan.`],
      ['tgK1','Kolom tangga: pembesian','Fondasi setempat untuk kolom tangga digali dan dicor. Tulangan kolom tangga didirikan dari fondasi itu dan dipasangi sengkang.'],
      ['tgK2','Kolom tangga: pengecoran','Kolom tangga dicor sampai di bawah balok bordes.'],
      ['tgL','Lantai dasar ruang tangga','Tanah dipadatkan, lalu pelat lantai kerja dengan satu lapis tulangan D8-200 dicor sebagai pijakan kaki tangga.'],
      ['tg1','Tangga: pembesian','Bekisting lajur tangga, bordes, dan balok bordes dipasang. Di sudut dalam, tulangan tidak dibengkokkan mengikuti sudut tetapi disilangkan dan diangkur ke sisi seberang; tulangan atas lajur kedua masuk ke pelat lantai.'],
      ['tg2','Tangga: pengecoran','Tangga, bordes, dan balok bordes dicor dari kaki ke bordes, lalu lajur kedua sampai pelat. Anak tangga dibentuk dengan papan bekisting tegak.'],
      ['bata','Pasangan dinding bata',`Bata dipasang lapis demi lapis di atas ${hasS?'sloof':'fondasi'}. ${kpOn?'Ujung pasangan dibuat bergigi di posisi kolom praktis, dan angkur':'Angkur'} dipasang di siar datar setiap 6 lapis.`],
      ['kp','Kolom praktis: pengecoran',`${hasS?'Tulangan kolom praktis sudah berdiri sejak tahap sloof. ':'Tulangan kolom praktis didirikan. '}Setelah bata terpasang, bekisting dipasang dan kolom praktis dicor menempel pada gigi bata.`]
    ];
    if(!p.kolom){ const mv=ORDER.filter(([k])=>k==='bp1'||k==='bp2'); mv.forEach(e=>ORDER.splice(ORDER.indexOf(e),1)); ORDER.push(...mv);
      const t=ORDER.filter(([k])=>/^tg/.test(k)); t.forEach(e=>ORDER.splice(ORDER.indexOf(e),1)); ORDER.push(...t); }
    const present=new Set([...concrete,...bars,...labels].map(o=>o.stage).filter(Boolean));
    const stages=ORDER.filter(([k])=>present.has(k)), sIdx=Object.fromEntries(stages.map(([k],i)=>[k,i]));
    [...concrete,...bars,...labels].forEach(o=>{ if(o.stage) o.stage=sIdx[o.stage]; });
    return {layers,betonEx:[0,0,1800],stages:stages.map(([,t,d])=>({t,d})),concrete,zones:[],bars,labels,views,checks:C,derived,camDir:[0.55,0.35,0.95],camK:1.08,cutAxis:'x',
      colorNote:`Sengkang: <b style="color:${COL.conf}">hijau</b> daerah kekang, <b style="color:${COL.mid}">biru</b> daerah biasa, <b style="color:${COL.webH}">biru terang</b> di dalam joint.`};
  }
};
