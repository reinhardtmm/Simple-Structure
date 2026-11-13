import {AREA,COL,MAT,BATA,BATA_OPTS,fmt,spread,linspace,turtle,hoop2D,lift3D,rectCage,checker,bataWall,bentBar,trapesium,rubble,devLen,ldc,ldhGen,ldhSeis,PU,PI} from '../core.js';

/* Mode gabungan: satu portal yang menyambungkan komponen-komponen lain.
   Sumbu x sepanjang portal (kolom di x = 0 dan x = Lb), y ke atas dengan y = 0 di atas sloof (peil lantai), z melintang. */
const COV=40, CV_P=20;
const FK=[['telapak','Fondasi telapak'],['tiang','Tiang bor dan pile cap'],['none','Tanpa fondasi kolom']];
const D0={fk:'telapak',batukali:true,sloof:true,kolom:true,balok:true,pelat:true,bata:true,Lb:4000,Hk:3600,Df:1100,bc:400,b:250,hb:450,tp:120,bs:250,hs:350,jenis:'M-5a'};

export default {
  id:'gabungan', name:'Mode gabungan', sysDependent:true, std:'SNI 2847:2019 dan Persyaratan PU',
  ref:'Rujukan: SNI 2847:2019 untuk elemen beton bertulang, dan persyaratan PU bangunan sederhana untuk pasangan bata, kolom praktis, dan fondasi batu kali. Rujukan selain SNI 2847:2019 belum dicocokkan dengan dokumen resminya.',
  checkNote:'Mode gabungan memeriksa sambungan antar komponen. Pemeriksaan lengkap setiap komponen ada di halaman komponennya masing-masing. Batas untuk pasangan bata dan elemen praktis diambil dari persyaratan PU dan belum dicocokkan dengan dokumen resminya.',
  defaults:{SRPMB:{...D0},SRPMK:{...D0}},
  schema:[
    ['Komponen yang digabung',[{k:'fk',label:'Fondasi kolom',opts:FK},{k:'batukali',label:'Fondasi batu kali di bawah dinding',type:'bool'},{k:'sloof',label:'Sloof',type:'bool'},{k:'kolom',label:'Kolom struktur',type:'bool'},
      {k:'balok',label:'Balok',type:'bool'},{k:'pelat',label:'Pelat lantai',type:'bool'},{k:'bata',label:'Dinding bata dan kolom praktis',type:'bool'}]],
    ['Geometri portal',[{k:'Lb',label:'Bentang as ke as kolom',unit:'mm',min:2000,max:8000,step:100},{k:'Hk',label:'Tinggi atas sloof ke atas pelat',unit:'mm',min:2500,max:5000,step:100},{k:'Df',label:'Atas fondasi kolom di bawah atas sloof',unit:'mm',min:400,max:2500,step:50,show:(s,p)=>p.fk!=='none'}]],
    ['Ukuran elemen',[{k:'bc',label:'Sisi kolom',unit:'mm',min:250,max:800,step:25},{k:'b',label:'Lebar balok',unit:'mm',min:200,max:600,step:25},{k:'hb',label:'Tinggi balok',unit:'mm',min:300,max:900,step:25},{k:'tp',label:'Tebal pelat',unit:'mm',min:90,max:250,step:10},
      {k:'bs',label:'Lebar sloof',unit:'mm',min:150,max:500,step:25},{k:'hs',label:'Tinggi sloof',unit:'mm',min:200,max:700,step:25},{k:'jenis',label:'Jenis bata',opts:BATA_OPTS}]]
  ],
  teori:{
    common:`<h3>Mode gabungan</h3><p>Halaman lain memperlihatkan satu komponen. Di sini komponen-komponen itu dipasang menjadi satu portal, sehingga terlihat bagaimana tulangan dari satu elemen masuk dan terangkur ke elemen lain. Nyalakan dan matikan komponen di panel Parameter untuk melihat sambungannya muncul atau hilang.</p><ul><li><b>Fondasi ke kolom</b>: tulangan kolom diteruskan ke dalam fondasi telapak atau pile cap dan diakhiri kait 90°.</li><li><b>Sloof ke kolom</b>: tulangan sloof diangkur ke dalam kolom. Sloof di atas fondasi batu kali diikat dengan angkur.</li><li><b>Balok ke kolom</b>: tulangan balok dibengkokkan ke dalam kolom, dan joint diberi sengkang (hubungan balok-kolom).</li><li><b>Kolom di lantai teratas</b>: tulangan kolom dibengkokkan ke dalam joint.</li><li><b>Dinding bata</b>: duduk di atas sloof, diangkur ke kolom struktur, dan dibagi oleh kolom praktis bila bentang bersihnya lebih dari 3 m.</li></ul><p>Tangga dan dinding geser belum termasuk dalam mode ini.</p>`,
    SRPMB:`<h4>SRPMB</h4><p>Sengkang memakai kait 90°, jarak sengkang relatif seragam, dan sengkang joint mengikuti Pasal 15.4.2 dengan spasi tidak lebih dari setengah tinggi balok.</p>`,
    SRPMK:`<h4>SRPMK</h4><p>Sengkang memakai kait gempa 135°. Sengkang dirapatkan di daerah ℓo kolom dan 2h balok, diteruskan di dalam joint, dan kait tulangan kolom di fondasi diarahkan ke sumbu kolom (Pasal 18.13.2.2).</p>`
  },
  build(p,sys){
    const K=sys==='SRPMK', hook=K?135:90;
    const {fk,Lb,Hk,Df,bc,b,hb,tp,bs,hs}=p, bt=BATA[p.jenis];
    const dbk=16, dbb=16, dbs=13, ds=10, nc=3, xs=[0,Lb];
    const fx0=p.kolom?bc/2:0, fx1=p.kolom?Lb-bc/2:Lb;            // muka dalam kolom (atau as bila tanpa kolom)
    const yF=-Df, hfT=450, Bf=1400, hcap=600, capX=900, capZ=2000, Dp=400, spP=1200;
    const yFtop=fk==='none'?null:yF, yFbot=fk==='telapak'?yF-hfT:fk==='tiang'?yF-hcap:null;
    const yBKtop=p.sloof?-hs:0, hBK=600;
    const yW0=0, yW1=p.balok?Hk-hb:p.pelat?Hk-tp:Hk-150;
    const concrete=[], bars=[], labels=[], {C,add}=checker();
    const push=(pts,d,layer,color,info)=>bars.push({pts,d,layer,color,info});
    // ---------- fondasi kolom ----------
    if(fk==='telapak') xs.forEach(xc=>{
      concrete.push({box:[xc-Bf/2,xc+Bf/2,yFbot,yFtop,-Bf/2,Bf/2]});
      const dm=13, a=Bf/2-75-dm/2, inf={t:'Tulangan bawah fondasi telapak D13-150',b:['Anyaman dua arah, ujung dibengkokkan ke atas.'],pasal:'Pasal 13.3'};
      const up=(L,y)=>{ const t=turtle(-L,y+150,-PI/2); t.fwd(150-39).turn(90,39).fwd(2*L-78).turn(90,39).fwd(150-39); return t.pts; };
      spread(-a,a,150).forEach(z=>push(up(a,yFbot+75+dm/2).map(([u,y])=>[xc+u,y,z]),dm,'fondasi',COL.matA,inf));
      spread(-a+dm,a-dm,150).forEach(x=>push(up(a-dm,yFbot+75+dm*1.5).map(([u,y])=>[xc+x,y,u]),dm,'fondasi',COL.matB,inf));
    });
    if(fk==='tiang') xs.forEach(xc=>{
      concrete.push({box:[xc-capX/2,xc+capX/2,yFbot,yFtop,-capZ/2,capZ/2]});
      const dm=16, inf={t:'Tulangan bawah pile cap D16-150',b:['Pengikat tarik antar kepala tiang.'],pasal:'Pasal 13.4'};
      spread(-capZ/2+90,capZ/2-90,150).forEach(z=>push([[xc-capX/2+90,yFbot+100,z],[xc+capX/2-90,yFbot+100,z]],dm,'fondasi',COL.matA,inf));
      spread(-capX/2+90,capX/2-90,150).forEach(x=>push([[xc+x,yFbot+100+dm,-capZ/2+90],[xc+x,yFbot+100+dm,capZ/2-90]],dm,'fondasi',COL.matB,inf));
      [-spP/2,spP/2].forEach(zc=>{ const y0=yFbot-2500, y1=yFbot+75; concrete.push({cyl:{x:xc,z:zc,r:Dp/2,y0,y1}});
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
      concrete.push({prism:{axis:'x',pts:trapesium(a,B,yBKtop,hBK),x0:bkX0,x1:bkX1},mat:'spesi',layer:'batukali'},
        {rocks:rubble({axis:'x',a0:bkX0,a1:bkX1,y0:yBKtop-hBK,y1:yBKtop,width:wT,size:200,gap:25,seed:3}),mat:'batu',layer:'batukali'},
        {rocks:rubble({axis:'x',a0:bkX0,a1:bkX1,y0:yBKtop-hBK-150,y1:yBKtop-hBK,width:()=>B,size:200,gap:15,tegak:true,seed:9}),mat:'aanstamping',layer:'batukali'});
      labels.push({p:[(bkX0+bkX1)/2,yBKtop-hBK/2,B/2+40],t:'fondasi batu kali'});
      if(p.sloof){ const iA={t:'Angkur sloof ke batu kali D10',b:['Ditanam di pasangan batu kali dan masuk ke sloof, jarak paling jauh 1 m.'],pasal:PU};
        spread(bkX0+200,bkX1-200,1000).forEach(x=>{ const t=turtle(x,yBKtop-300,PI/2); t.fwd(300+hs-COV-ds-dbs-60).turn(-90,20).fwd(80); push(t.pts.map(([xx,y])=>[xx,y,0]),10,'angkur',COL.dowel,iA); }); }
    }
    // ---------- kolom struktur ----------
    const cg=rectCage({B:bc,H:bc,cover:COV,ds,db:dbk,nu:nc,nv:nc,hook,allSup:K});
    if(p.kolom){
      const yCB=yFtop??(p.sloof?-hs:0), yBarB=fk==='telapak'?yFbot+75+13*2+dbk/2:fk==='tiang'?yFbot+100+16*2+dbk/2:yCB+50;
      const topHook=p.balok||p.pelat, yBarT=Hk-COV-ds-dbb-dbk/2, Lh=12*dbk, r=4*dbk;
      const iC={t:`Tulangan kolom ${cg.pos.length}D${dbk}`,b:[fk!=='none'?`Diteruskan ke ${fk==='telapak'?'fondasi telapak':'pile cap'} dengan kait 90° ${K?'ke arah sumbu kolom':'ke arah luar'}.`:'Tanpa fondasi kolom.',topHook?'Di lantai teratas dibengkokkan 90° ke dalam joint.':''],pasal:K?'Pasal 18.13.2.2, 18.7.4':'Pasal 10.7'};
      xs.forEach((xc,ic)=>{
        concrete.push({box:[xc-bc/2,xc+bc/2,yCB,Hk,-bc/2,bc/2]});
        cg.pos.forEach(([u,v])=>{
          const sgn=Math.abs(u)>1?Math.sign(u):(ic===0?-1:1), dirB=fk==='none'?0:(K?-sgn:sgn), dirT=topHook?-sgn:0;
          const t=dirB?turtle(xc+u+dirB*Lh,yBarB,dirB>0?PI:0):turtle(xc+u,yBarB,PI/2);
          if(dirB) t.fwd(Lh-r).turn(dirB>0?-90:90,r);
          t.fwd(yBarT-yBarB-(dirB?r:0)-(dirT?r:0));
          if(dirT) t.turn(dirT>0?-90:90,r).fwd(Lh-r);
          push(t.pts.map(([x,y])=>[x,y,v]),dbk,'kolom',COL.long,iC);
        });
        // sengkang kolom per zona
        const Hc=(Hk-(p.balok?hb:0))-(p.sloof?0:yCB), lo=Math.max(bc,Hc/6,450), sLo=100, sMid=150, sJ=K?100:Math.min(150,Math.floor(hb/2/5)*5);
        const ys=[]; const lim0=yCB+50, lim1=Hk-50, jTop=Hk, jBot=Hk-(p.balok?hb:0);
        for(let y=lim0;y<=lim1;){ const inJ=p.balok&&y>jBot-25; const conf=K&&(y<(p.sloof?0:yCB)+lo||y>jBot-lo);
          ys.push({y,z:inJ?'joint':conf?'conf':'mid'}); y+=inJ?sJ:conf?sLo:K?sMid:Math.min(16*dbk,48*ds,bc,150); }
        const iH=z=>({t:z==='joint'?`Sengkang joint D${ds}-${sJ}`:`Sengkang kolom D${ds}`,b:[z==='joint'?(K?'Hubungan balok-kolom SRPMK: sama dengan daerah ℓo (Pasal 18.8.3.1).':'Joint SRPMB: disebar sepanjang tinggi balok dengan spasi ≤ h/2 (Pasal 15.4.2).'):z==='conf'?`Daerah ℓo = ${fmt(lo)} mm, spasi ${sLo} mm.`:'Daerah tengah kolom.'],pasal:z==='joint'?(K?'Pasal 18.8.3.1':'Pasal 15.4.2'):K?'Pasal 18.7.5':'Pasal 25.7.2'});
        ys.forEach(({y,z})=>{ push(lift3D(cg.hoop,(u,v,w)=>[xc+u,y+w,v],ds*1.05),ds,z==='joint'?'hbk':'kolomS',z==='joint'?COL.webH:COL[z],iH(z)); cg.ties.forEach(t=>push(t.pts.map(([u,v])=>[xc+u,y+ds*1.1,v]),ds,z==='joint'?'hbk':'kolomS',COL.tie,iH(z))); });
      });
      labels.push({p:[0,Hk*0.5,bc/2+40],t:'kolom struktur'});
    }
    // ---------- balok ----------
    if(p.balok){
      const x0=p.kolom?fx0:-200, x1=p.kolom?fx1:Lb+200;
      concrete.push({box:[x0,x1,Hk-hb,Hk,-b/2,b/2]});
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
      labels.push({p:[Lb/2,Hk+80,b/2],t:'balok'});
      if(p.kolom){ const avail=bc-COV; add(ldh<=avail,'Kait tulangan balok di dalam kolom',`ℓdh = ${fmt(ldh)} mm ≤ tersedia ${fmt(avail)} mm`,K?'Pasal 18.8.5.1':'Pasal 25.4.3.1');
        if(K) add(bc>=20*dbb,'Kolom terhadap diameter tulangan balok',`hc = ${bc} mm ≥ 20db = ${20*dbb} mm`,'Pasal 18.8.2.3');
        add(true,'Sengkang di dalam joint',K?'diteruskan dengan spasi 100 mm sepanjang tinggi balok':`disebar sepanjang tinggi balok, spasi ≤ h/2 = ${fmt(hb/2)} mm`,K?'Pasal 18.8.3.1':'Pasal 15.4.2'); }
      else add(false,'Balok tanpa kolom penumpu','nyalakan kolom struktur agar balok punya tumpuan','praktik');
    }
    // ---------- pelat ----------
    if(p.pelat){
      const px0=-bc/2-300, px1=Lb+bc/2+300, W=1500;
      concrete.push({box:[px0,px1,Hk-tp,Hk,-W,W]});
      const iP={t:'Tulangan pelat D10-150',b:['Tulangan bawah dua arah; tulangan atas melintang di atas balok untuk momen negatif.'],pasal:'Pasal 8.7.2'};
      spread(-W+50,W-50,150).forEach(z=>push([[px0+30,Hk-tp+25,z],[px1-30,Hk-tp+25,z]],10,'pelat',COL.matA,iP));
      spread(px0+50,px1-50,200).forEach(x=>push([[x,Hk-tp+35,-W+30],[x,Hk-tp+35,W-30]],10,'pelat',COL.matB,iP));
      spread(px0+75,px1-75,150).forEach(x=>push([[x,Hk-25,-1000],[x,Hk-25,1000]],10,'pelat',COL.matT,iP));
      labels.push({p:[Lb/2,Hk+60,W*0.7],t:'pelat lantai'});
      if(!p.balok) add(null,'Pelat tanpa balok','pelat langsung bertumpu pada kolom; tebal minimum dan geser pons diperiksa terpisah','praktik');
    }
    // ---------- sloof ----------
    if(p.sloof){
      const x0=p.kolom?fx0:-300, x1=p.kolom?fx1:Lb+300;
      concrete.push({box:[x0,x1,-hs,0,-bs/2,bs/2]});
      const zl=bs/2-COV-ds-dbs/2, yT=-COV-ds-dbs/2-(p.kolom?dbk:0), yB=-hs+COV+ds+dbs/2+(p.kolom?dbk:0), rb=3*dbs, tail=12*dbs;
      const xa=p.kolom?-bc/2+COV+ds+dbk+dbs*1.5:x0+30, xb=Lb-xa;
      const iS={t:`Tulangan sloof 3D${dbs} atas dan bawah`,b:[p.kolom?'Diangkur ke dalam kolom dengan kait 90°.':'Sloof tanpa kolom struktur, berperan sebagai sloof praktis.',K?'Menerus dan disalurkan di setiap diskontinuitas (Pasal 18.13.3.1).':''],pasal:K?'Pasal 18.13.3.1':'Pasal 25.4.3'};
      linspace(-zl,zl,3).forEach(z=>[[yT,-1],[yB,1]].forEach(([y,sv])=>{
        if(!p.kolom){ push([[xa,y,z],[xb,y,z]],dbs,'sloof',COL.bot,iS); return; }
        const t=turtle(xa,y+sv*tail,sv<0?PI/2:-PI/2); t.fwd(tail-rb).turn(sv<0?-90:90,rb).fwd(xb-xa-2*rb).turn(sv<0?-90:90,rb).fwd(tail-rb);
        push(t.pts.map(([x,yy])=>[x,yy,z]),dbs,'sloof',COL.bot,iS); }));
      const sS=K?Math.min(150,Math.floor(Math.min(bs,hs)/2/5)*5):150, ext=K?Math.max(6*ds,75):6*ds, hp=hoop2D(bs/2-COV-ds/2,hs/2-COV-ds/2,2.5*ds,hook,ext);
      spread(x0+50,x1-50,sS).forEach(x=>push(lift3D(hp,(u,v,w)=>[x+w,-hs/2+v,u],ds*1.05),ds,'sloof',COL.mid,{t:`Sengkang sloof D${ds}-${sS}`,b:[K?'Sengkang pengekang tertutup, spasi ≤ min(b/2; 300) (Pasal 18.13.3.2).':'Sengkang sloof.'],pasal:K?'Pasal 18.13.3.2':'Tabel 9.7.6.2.2'}));
      labels.push({p:[Lb*0.3,-hs-40,bs/2],t:'sloof'});
      if(K&&p.kolom){ const Lc=Lb-bc, dmin=Math.min(Lc/20,450); add(Math.min(bs,hs)>=dmin,'Dimensi sloof',`${Math.min(bs,hs)} mm ≥ min(ℓ bersih/20; 450) = ${fmt(dmin)} mm`,'Pasal 18.13.3.2'); }
      if(p.batukali) add(300>=bs,'Sloof di atas batu kali',`lebar atas batu kali 300 mm ${300>=bs?'≥':'<'} lebar sloof ${bs} mm`,'praktik');
    }
    // ---------- dinding bata dan kolom praktis ----------
    if(p.bata){
      const bk=150, span=fx1-fx0;
      let posts=p.kolom?[{x:fx0-bc/2,w:bc,kp:false}]:[];  // pos: as, lebar, apakah kolom praktis
      const nIn=Math.max(0,Math.ceil(span/3000)-1);
      if(p.kolom){ for(let i=1;i<=nIn;i++) posts.push({x:fx0+span*i/(nIn+1),w:bk,kp:true}); posts.push({x:fx1+bc/2,w:bc,kp:false}); }
      else { const n=Math.max(1,Math.ceil(Lb/3000)); for(let i=0;i<=n;i++) posts.push({x:Lb*i/n,w:bk,kp:true}); }
      let T=0, nCourse=0, wInfo=null; const areas=[];
      for(let i=0;i<posts.length-1;i++){
        const P0=posts[i], P1=posts[i+1], a0=P0.x+P0.w/2, a1=P1.x-P1.w/2;
        const w=bataWall({axis:'x',a0,a1,y0:yW0,y1:yW1,c:0,bt,joint:10,tooth0:P0.kp&&!bt.ringan?50:0,tooth1:P1.kp&&!bt.ringan?50:0});
        T=w.thick; nCourse=w.n; wInfo=w; areas.push((a1-a0)*(yW1-yW0)/1e6);
        concrete.push({box:w.mortar,mat:'spesi',layer:'bata'},{boxes:w.boxes,mat:bt.ringan?'ringan':'bata',layer:'bata'});
      }
      // kolom praktis
      const iK={t:'Kolom praktis 4D10, sengkang D8-150',b:['Dicor setelah pasangan bata, mengunci gigi bata.',p.sloof||p.balok?'Tulangannya dibengkokkan ke sloof dan balok sepanjang 400 mm.':''],pasal:PU};
      const a=bk/2-CV_P-8-5, yB=p.sloof?-hs+COV+ds+dbs/2+dbs:yW0+40, yT=p.balok?Hk-hb+COV+ds+dbb+dbb:yW1-40;
      const hkp=hoop2D(bk/2-CV_P-4,bk/2-CV_P-4,16,135,50);
      posts.filter(q=>q.kp).forEach(q=>{ concrete.push({box:[q.x-bk/2,q.x+bk/2,yW0,yW1,-bk/2,bk/2]});
        for(const u of [-a,a]) for(const z of [-a,a]){ const dir=u<0?-1:1;
          push((p.sloof&&p.balok?bentBar(q.x+u,yB,yT,dir,400,30):[[q.x+u,yB],[q.x+u,yT]]).map(([x,y])=>[x,y,z]),10,'kp',COL.long,iK); }
        spread(yW0+50,yW1-50,150).forEach(y=>push(lift3D(hkp,(u,v,w)=>[q.x+u,y+w,v],8.4),8,'kp',COL.mid,iK)); });
      // angkur dari setiap tiang ke dinding di sebelahnya, tiap 6 lapis
      const iA={t:'Angkur dinding D10, panjang 400 mm',b:['Dipasang di siar datar setiap 6 lapis bata.'],pasal:PU};
      const yA=[]; for(let k=5;k<nCourse;k+=6) yA.push(wInfo.courseY(k)+bt.t+5);
      posts.forEach((q,i)=>[[i>0,-1],[i<posts.length-1,1]].forEach(([ok,dir])=>{ if(!ok) return; const xs0=q.x-dir*(q.w/2-50);
        yA.forEach(y=>{ const t=turtle(xs0,y-60,PI/2); t.fwd(40).turn(dir>0?-90:90,20).fwd(400+q.w/2-70); push(t.pts.map(([x,yy])=>[x,yy,0]),10,'angkur',COL.dowel,iA); }); }));
      labels.push({p:[Lb/2,yW1*0.45,T/2+30],t:'dinding bata'},...posts.filter(q=>q.kp).slice(0,1).map(q=>({p:[q.x,yW1*0.7,bk/2+30],t:'kolom praktis',c:'lap'})));
      const amax=Math.max(...areas), lmax=Math.max(...posts.slice(1).map((q,i)=>q.x-q.w/2-(posts[i].x+posts[i].w/2)));
      add(amax<=9,'Luas bidang dinding per panel',`terbesar ${fmt(amax,2)} m² ≤ 9 m², ${areas.length} panel`,PU);
      add(lmax<=3000,'Jarak antar kolom pada dinding',`terbesar ${fmt(lmax)} mm ≤ 3.000 mm; ${posts.filter(q=>q.kp).length} kolom praktis disisipkan otomatis`,PU);
      const sup=[p.sloof?bs:null,p.balok?b:null].filter(v=>v!==null);
      if(sup.length) add(Math.min(...sup)>=T,'Dudukan dinding',`tebal dinding ${fmt(T)} mm ≤ lebar ${p.sloof?`sloof ${bs} mm`:''}${p.sloof&&p.balok?' dan ':''}${p.balok?`balok ${b} mm`:''}`,'praktik');
      if(!p.sloof&&!p.batukali) add(false,'Dinding tanpa dudukan','nyalakan sloof atau fondasi batu kali di bawah dinding','praktik');
      add(true,'Angkur dinding ke kolom',`D10 panjang 400 mm tiap 6 lapis, ${yA.length} lapis angkur per sisi kolom`,PU);
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
    const views=[
      {title:'Tampak depan portal',sub:`bentang ${fmt(Lb)} mm, tinggi ${fmt(Hk)} mm`,n:'z',u:'x',v:'y',skipMat:['spesi'],layers:['kolom','balok','sloof','fondasi','kp','angkur','hbk'],maxH:520,
        dims:[{a:[0,Hk+150],b:[Lb,Hk+150],off:8,t:`${fmt(Lb)}`}]},
      {title:'Potongan melintang di tengah bentang',n:'x',at:Lb/2+7,half:80,u:'z',v:'y',maxH:520},
      ...(p.kolom?[{title:'Potongan melintang di as kolom',n:'x',at:0,half:60,u:'z',v:'y',maxH:520}]:[])
    ];
    const comps=[fk!=='none'&&FK.find(f=>f[0]===fk)[1],p.batukali&&'batu kali',p.sloof&&'sloof',p.kolom&&'kolom',p.balok&&'balok',p.pelat&&'pelat',p.bata&&'dinding bata'].filter(Boolean);
    const derived=`komponen aktif = <b>${comps.length}</b>: ${comps.join(', ')}<br>bentang bersih antar kolom = <b>${fmt(fx1-fx0)}</b> mm<br>tinggi dinding = <b>${fmt(yW1-yW0)}</b> mm<br>jumlah batang dan sengkang = <b>${bars.length}</b>`;
    const layers=[{k:'fondasi',label:'Tulangan fondasi kolom',color:COL.matA,ex:[0,-700,0]},{k:'batukali',label:'Fondasi batu kali',color:MAT.batu,block:true,ex:[0,-900,0]},
      {k:'sloof',label:'Tulangan sloof',color:COL.bot,ex:[0,-350,0]},{k:'kolom',label:'Tulangan kolom',color:COL.long,ex:[0,0,0]},{k:'kolomS',label:'Sengkang kolom',color:COL.conf,ex:[0,0,0]},
      {k:'hbk',label:'Sengkang joint (HBK)',color:COL.webH,ex:[0,0,0]},{k:'balok',label:'Tulangan balok',color:COL.top,ex:[0,450,0]},{k:'balokS',label:'Sengkang balok',color:COL.mid,ex:[0,450,0]},
      {k:'pelat',label:'Tulangan pelat',color:COL.matT,ex:[0,900,0]},{k:'bata',label:'Dinding bata',color:bt.ringan?MAT.ringan:MAT.bata,block:true,ex:[0,0,-1200]},
      {k:'kp',label:'Kolom praktis',color:COL.long,ex:[0,0,-1200]},{k:'angkur',label:'Angkur',color:COL.dowel,ex:[0,0,600]}];
    return {layers,betonEx:[0,0,1800],concrete,zones:[],bars,labels,views,checks:C,derived,camDir:[0.55,0.35,0.95],camK:1.08,cutAxis:'x',
      colorNote:`Sengkang: <b style="color:${COL.conf}">hijau</b> daerah kekang, <b style="color:${COL.mid}">biru</b> daerah biasa, <b style="color:${COL.webH}">biru terang</b> di dalam joint.`};
  }
};
