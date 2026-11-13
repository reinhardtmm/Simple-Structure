// Atlas Struktur: utilitas bersama, geometri tulangan, dan mesin gambar 2D
export const AREA = {8:50.3,10:78.5,13:132.7,16:201.1,19:283.5,22:380.1,25:490.9,29:660.5,32:804.2};
export const DIAS = [10,13,16,19,22,25,29,32];
export const DAGG = 20;
export const PI = Math.PI;
export const COL = {
  long:'#9a3412', top:'#9a3412', bot:'#c2410c', conf:'#0f766e', mid:'#4f6d8a', lap:'#b7791f',
  tie:'#6d28d9', dowel:'#be185d', matA:'#9a3412', matB:'#c2410c', matT:'#7c2d12', dist:'#4f6d8a',
  spiral:'#0f766e', web:'#4f6d8a', webH:'#2563eb', be:'#0f766e', joint:'#0f766e'
};
export const fmt = (v,d=0)=> Number(v).toLocaleString('id-ID',{maximumFractionDigits:d,minimumFractionDigits:d});
export const up5 = v=>Math.ceil(v/5-1e-9)*5, up50 = v=>Math.ceil(v/50-1e-9)*50, dn5 = v=>Math.floor(v/5+1e-9)*5, dn25=v=>Math.floor(v/25+1e-9)*25;
export const linspace=(a,b,n)=> n<=1?[(a+b)/2]:Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
export const beta1 = fc => fc<=28?0.85:Math.max(0.65,0.85-0.05*(fc-28)/7);
export function devLen(fy,fc,db,psiT=1){ const k=db<=19?2.1:1.7; return Math.max(300, fy*psiT/(k*Math.sqrt(fc))*db); }
export function ldhGen(fy,fc,db){ return Math.max(0.24*fy/Math.sqrt(fc)*db,8*db,150); }
export function ldhSeis(fy,fc,db){ return Math.max(fy*db/(5.4*Math.sqrt(fc)),8*db,150); }
export function ldc(fy,fc,db){ return Math.max(0.24*fy/Math.sqrt(fc)*db,0.043*fy*db,200); }
export const asPerM=(d,s)=>AREA[d]*1000/s;

// posisi merata dari a ke b dengan spasi maksimum s (termasuk kedua ujung)
export function spread(a,b,s){ const n=Math.max(1,Math.ceil((b-a)/s-1e-9)); return Array.from({length:n+1},(_,i)=>a+(b-a)*i/n); }
export function fill(a,b,sMax){ const gap=b-a; if(gap<=1) return {pos:[],s:0}; const n=Math.ceil(gap/sMax-1e-9); const st=gap/n; const pos=[]; for(let i=1;i<=n;i++) pos.push(a+st*i); return {pos,s:st}; }

/* turtle 2D */
export function turtle(x,y,heading){
  const pts=[[x,y]]; let h=heading;
  const t={pts, get pos(){return [x,y];}, get heading(){return h;},
    fwd(L){ if(L<=0) return t; x+=L*Math.cos(h); y+=L*Math.sin(h); pts.push([x,y]); return t; },
    turn(deg,r){ const a=deg*PI/180, sg=Math.sign(a);
      const cx=x+r*Math.cos(h+sg*PI/2), cy=y+r*Math.sin(h+sg*PI/2);
      const p0=Math.atan2(y-cy,x-cx), n=Math.max(4,Math.ceil(Math.abs(a)/(PI/18)));
      for(let i=1;i<=n;i++){const p=p0+a*i/n; x=cx+r*Math.cos(p); y=cy+r*Math.sin(p); pts.push([x,y]);}
      h+=a; return t; }
  };
  return t;
}
// sengkang tertutup (garis sumbu), kait di sudut kiri atas
export function hoop2D(a,b,r,hook,ext){
  const bend = hook===135?135:90;
  const f=turtle(-a+r,b,0);
  f.fwd(2*a-2*r).turn(-90,r).fwd(2*b-2*r).turn(-90,r).fwd(2*a-2*r).turn(-90,r).fwd(2*b-2*r).turn(-bend,r).fwd(ext);
  const g=turtle(-a+r,b,PI); g.turn(bend,r).fwd(ext);
  return g.pts.slice(1).reverse().concat(f.pts);
}
// kait silang sejajar sumbu v pada u=x, kait 135 di atas dan 90 di bawah (flip membalik)
export function crosstie2D(x,yb,yt,rr,ext,flip){
  const f=turtle(x-rr,yb,PI/2); f.fwd(yt-yb).turn(-135,rr).fwd(ext);
  const g=turtle(x-rr,yb,-PI/2); g.turn(90,rr).fwd(ext);
  let pts=g.pts.slice(1).reverse().concat(f.pts);
  if(flip) pts=pts.map(([u,v])=>[u,yb+yt-v]);
  return pts;
}
// helix kecil supaya kedua kait tidak saling tembus
export function lift3D(pts2,map,lift){
  const cum=[0]; for(let i=1;i<pts2.length;i++) cum.push(cum[i-1]+Math.hypot(pts2[i][0]-pts2[i-1][0],pts2[i][1]-pts2[i-1][1]));
  const L=cum.at(-1)||1;
  return pts2.map((q,i)=>map(q[0],q[1],lift*cum[i]/L));
}
// tulangan yang ditumpu lateral
export function supportedIdx(pos,db,allSupported){
  const n=pos.length; const all=pos.map((_,i)=>i);
  if(n<=2||allSupported) return all;
  const sup=[0]; let i=0;
  while(i<n-1){ const j=i+2;
    if(j<=n-1 && (pos[i+1]-pos[i]-db)<=150 && (pos[j]-pos[i+1]-db)<=150){ sup.push(j); i=j; } else { sup.push(i+1); i=i+1; } }
  const set=new Set(sup);
  return pos.every((_,k)=>set.has(k)===set.has(n-1-k))?[...set].sort((a,b)=>a-b):all;
}
// susunan tulangan persegi: kembalikan posisi tulangan, sengkang, dan kait silang (2D, sumbu u dan v)
export function rectCage({B,H,cover,ds,db,nu,nv,hook,allSup}){
  const ext=hook===135?Math.max(6*ds,75):6*ds, r=2.5*ds;
  const ha=B/2-cover-ds/2, hb=H/2-cover-ds/2;
  const au=B/2-cover-ds-db/2, av=H/2-cover-ds-db/2;
  const us=linspace(-au,au,nu), vs=linspace(-av,av,nv);
  const pos=[]; us.forEach(u=>{pos.push([u,-av]);pos.push([u,av]);}); vs.slice(1,-1).forEach(v=>{pos.push([-au,v]);pos.push([au,v]);});
  const supU=supportedIdx(us,db,allSup), supV=supportedIdx(vs,db,allSup);
  const rr=(db+ds)/2, ties=[];
  supU.filter(i=>i>0&&i<nu-1).forEach((i,k)=>ties.push({dir:'v',pts:crosstie2D(us[i],-av,av,rr,Math.max(6*ds,75),k%2===1)}));
  supV.filter(i=>i>0&&i<nv-1).forEach((i,k)=>{ const t=crosstie2D(vs[i],-au,au,rr,Math.max(6*ds,75),k%2===0); ties.push({dir:'u',pts:t.map(([a,b])=>[b,a])}); });
  const hxOf=(arr,sup)=>{let m=0; for(let k=1;k<sup.length;k++) m=Math.max(m,arr[sup[k]]-arr[sup[k-1]]); return m;};
  const hx=Math.max(hxOf(us,supU),hxOf(vs,supV));
  const hoop=hoop2D(ha,hb,r,hook,ext);
  return {pos,us,vs,ties,hx,hoop,ext,ha,hb,au,av,nTieV:ties.filter(t=>t.dir==='v').length,nTieU:ties.filter(t=>t.dir==='u').length};
}
// Ash menurut 18.7.5.4 (persegi)
export function ashReq(s,bc,fc,fyt,Ag,Ach){ return Math.max(0.3*s*bc*fc/fyt*(Ag/Ach-1),0.09*s*bc*fc/fyt); }

// pembuat daftar pemeriksaan
export function checker(){ const C=[]; const add=(ok,t,d,p,opt={})=>C.push({ok,t,d,p,...opt}); return {C,add}; }

/* ================= pasangan bata dan material non-beton ================= */
// Ukuran nominal bata merah pejal SNI 15-2094-2000 (t = tebal/tinggi lapis, w = lebar, l = panjang, mm).
// Bata ringan memakai ukuran pabrikan yang umum, bukan dari SNI tersebut.
export const BATA={
  'M-5a':{t:65,w:90,l:190,nama:'Bata merah M-5a (65 × 90 × 190)'},
  'M-5b':{t:65,w:100,l:190,nama:'Bata merah M-5b (65 × 100 × 190)'},
  'M-6a':{t:52,w:110,l:230,nama:'Bata merah M-6a (52 × 110 × 230)'},
  'M-6b':{t:55,w:110,l:230,nama:'Bata merah M-6b (55 × 110 × 230)'},
  'M-6c':{t:70,w:110,l:230,nama:'Bata merah M-6c (70 × 110 × 230)'},
  'M-6d':{t:80,w:110,l:230,nama:'Bata merah M-6d (80 × 110 × 230)'},
  'ringan':{t:200,w:100,l:600,ringan:true,nama:'Bata ringan (200 × 100 × 600)'}
};
export const BATA_OPTS=Object.entries(BATA).map(([k,v])=>[k,v.nama]);
// Warna material; dipakai di 3D (app.js) dan gambar 2D (renderView)
export const MAT={bata:'#c4603f',ringan:'#d9d6cf',spesi:'#d8d2c4',plester:'#e9e6df',batu:'#8d9097',aanstamping:'#a7a49c',pasir:'#e3d2a2',tanah:'#b39a76',urug:'#c9b48f'};
// Campuran spesi yang lazim (volume semen : pasir) beserta penggunaannya
export const SPESI={
  '1:2':'kedap air (trasraam): dinding kamar mandi dan 30 cm di atas lantai',
  '1:3':'kedap air ringan: dinding yang sering basah dan plester trasraam',
  '1:4':'pasangan dinding dan plester umum, juga pasangan batu kali',
  '1:5':'pasangan batu kali dan dinding nonstruktural',
  '1:6':'pasangan nonstruktural ringan, tidak disarankan untuk dinding luar'
};
/* Susun bata satu bidang dinding.
   axis: arah panjang dinding ('x' atau 'z'); a0..a1: batas bersih antar kolom; y0..y1: tinggi; c: sumbu tebal dinding;
   bond 'half' = ½ bata (tebal = lebar bata), 'full' = 1 bata ikatan Inggris (tebal = panjang bata);
   tooth0/tooth1: gigi ke dalam kolom pada lapis ganjil (0 = tanpa gigi). */
export function bataWall({axis='x',a0,a1,y0,y1,c=0,bt,joint=10,bond='half',tooth0=0,tooth1=0}){
  const full=bond==='full'&&!bt.ringan, T=full?bt.l:bt.w, ch=bt.t+joint, n=Math.max(1,Math.floor((y1-y0)/ch));
  const raw=[]; let volIn=0;
  const put=(p,q,yb,z0,z1)=>{ if(q-p<20) return; raw.push([p,q,yb,yb+bt.t,z0,z1]); const pi=Math.max(p,a0), qi=Math.min(q,a1); if(qi>pi) volIn+=(qi-pi)*bt.t*(z1-z0); };
  const row=(k,len,z0,z1,off)=>{ const lo=a0-(k%2?tooth0:0), hi=a1+(k%2?tooth1:0), m=len+joint, yb=y0+joint+k*ch;
    for(let p=a0-off-m*Math.ceil((off+tooth0)/m+1);p<hi;p+=m){ const s=Math.max(p,lo), e=Math.min(p+len,hi); if(e>s) put(s,e,yb,z0,z1); } };
  for(let k=0;k<n;k++){
    if(!full) row(k,bt.l,c-T/2,c+T/2,k%2?(bt.l+joint)/2:0);
    else if(k%2===0){ row(k,bt.l,c-T/2,c-T/2+bt.w,0); row(k,bt.l,c+T/2-bt.w,c+T/2,(bt.l+joint)/2); }
    else row(k,bt.w,c-T/2,c+T/2,(bt.w+joint)/2);
  }
  const top=y0+joint+n*ch;
  const map=b=>axis==='x'?[b[0],b[1],b[2],b[3],b[4],b[5]]:[b[4],b[5],b[2],b[3],b[0],b[1]];
  const mortar=map([a0,a1,y0,Math.min(top,y1),c-T/2+1,c+T/2-1]);
  const area=(a1-a0)*(top-y0), vWall=area*T;
  return {boxes:raw.map(map),mortar,thick:T,n,ch,top,courseY:k=>y0+joint+k*ch,
    perM2:volIn/(bt.l*bt.w*bt.t)/(area/1e6), mortarPerM2:(vWall-volIn)/1e9/(area/1e6), nBata:volIn/(bt.l*bt.w*bt.t), vMortar:(vWall-volIn)/1e9};
}
/* Tulangan kolom praktis: batang lurus dengan bengkokan 90° sepanjang Lb ke dalam sloof (bawah) dan ring (atas).
   dir = arah bengkokan pada sumbu u (+1/-1). Mengembalikan titik dalam bidang (u, y). */
export function bentBar(u,yB,yT,dir,Lb,r){
  const t=turtle(u+dir*Lb,yT,dir>0?PI:0), sg=dir>0?1:-1;
  t.fwd(Lb-r).turn(90*sg,r).fwd(yT-yB-2*r).turn(90*sg,r).fwd(Lb-r);
  return t.pts;
}

// Rujukan elemen praktis (bangunan sederhana). Label pemeriksaan 'Persyaratan PU' merujuk ke persyaratan teknis bangunan
// gedung sederhana tahan gempa dari Kementerian PU, sebagaimana dikutip dalam lampiran peraturan daerah tentang bangunan gedung.
export const PU='Persyaratan PU bangunan sederhana';
export const REF_PRAKTIS='Rujukan: persyaratan teknis bangunan gedung sederhana tahan gempa dari Kementerian PU (dikutip dalam lampiran peraturan daerah tentang penyelenggaraan bangunan gedung), SNI 15-2094-2000 untuk ukuran bata merah pejal, SNI 6882:2014 untuk mortar, dan SNI 2847:2019 untuk selimut beton. Selain SNI 2847:2019, rujukan ini belum dicocokkan dengan dokumen resminya.';
export const NOTE_PRAKTIS='Komponen ini adalah elemen praktis untuk bangunan sederhana. Batasnya diambil dari persyaratan PU untuk rumah tahan gempa dan praktik umum, bukan dari SNI 2847:2019, dan belum dicocokkan dengan dokumen resminya.';
export const SPESI_TABEL=`<table><tr><th>Campuran (PC : pasir)</th><th>Penggunaan umum</th></tr>${Object.entries(SPESI).map(([k,v])=>`<tr><td>1 PC : ${k.split(':')[1]} Ps</td><td>${v}</td></tr>`).join('')}</table>`;
export const BATA_TABEL=`<table><tr><th>Jenis</th><th>t × w × l (mm)</th></tr>${Object.entries(BATA).map(([k,b])=>`<tr><td>${b.ringan?'Bata ringan':'Bata merah '+k}</td><td>${b.t} × ${b.w} × ${b.l}</td></tr>`).join('')}</table>`;

// bilangan acak dengan seed tetap, supaya susunan batu sama setiap kali dimuat
export function rng(seed){ let s=seed|0; return ()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
/* Susun batu kali di dalam penampang yang lebarnya berubah terhadap y (trapesium).
   width(y): lebar penampang di ketinggian y; axis: arah memanjang fondasi; a0..a1: rentang memanjang; c: sumbu penampang.
   tegak=true untuk aanstamping (batu kosong dipasang berdiri). Hasil: [{c:[x,y,z], s:[sx,sy,sz] (setengah ukuran), r:[rx,ry,rz]}]. */
export function rubble({axis='z',a0,a1,y0,y1,width,c=0,size=180,gap=25,tegak=false,seed=7}){
  const R=rng(seed), rocks=[], put=(al,y,cr,sa,sy,sc)=>{ const r=[(R()-.5)*.5,(R()-.5)*.9,(R()-.5)*.5];
    rocks.push(axis==='z'?{c:[cr,y,al],s:[sc,sy,sa],r}:{c:[al,y,cr],s:[sa,sy,sc],r}); };
  const hC=tegak?(y1-y0):size*0.72+gap;
  for(let yb=y0;yb<y1-gap*1.5;yb+=hC){
    const hh=Math.min(hC,y1-yb), ym=yb+hh/2, W=Math.min(width(yb+gap),width(yb+hh-gap));
    const across=tegak?size*0.45:size, n=Math.max(1,Math.floor((W-gap)/(across+gap))), cw=(W-gap)/n;
    const step=(tegak?size*0.55:size)+gap;
    for(let i=0;i<n;i++){ const cc=c-W/2+gap/2+cw*(i+.5);
      for(let al=a0+step/2+(R()-.5)*step*0.4;al<a1-step/2+gap;al+=step*(0.85+R()*0.3)){
        put(al+(R()-.5)*gap,ym+(R()-.5)*gap*0.6,cc+(R()-.5)*gap*0.6,(step-gap)/2*(0.75+R()*0.25),(hh-gap)/2*(0.8+R()*0.2),(cw-gap)/2*(0.75+R()*0.25)); } }
  }
  return rocks;
}
export const rockVol=r=>2.536*r.s[0]*r.s[1]*r.s[2]; // volume ikosahedron beraturan dengan jari-jari 1 diskalakan

// titik penampang trapesium (fondasi batu kali): lebar atas a di yTop, lebar bawah B sedalam h, simetris terhadap c
export const trapesium=(a,B,yTop,h,c=0)=>[[c-B/2,yTop-h],[c+B/2,yTop-h],[c+a/2,yTop],[c-a/2,yTop]];

/* ================= mesin gambar 2D ================= */
const IX={x:0,y:1,z:2};
const SV={ink:'#1c1c1e',ink2:'#636366',conc:'#ececf0',stub:'#e1e1e6'};
const SVF='-apple-system, BlinkMacSystemFont, SF Pro Text, Inter, Segoe UI, sans-serif';
export function renderView(m,v){
  const n=IX[v.n], iu=IX[v.u], iv=IX[v.v];
  const half=v.half??Infinity, cut=isFinite(half), at=v.at??0;
  const lay=v.layers?new Set(v.layers):null;
  const els=[]; let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
  const ext=(u,w)=>{x0=Math.min(x0,u);x1=Math.max(x1,u);y0=Math.min(y0,-w);y1=Math.max(y1,-w);};
  // beton
  const fillOf=c=>c.mat?(MAT[c.mat]||c.mat):(c.kind==='stub'?SV.stub:SV.conc);
  const rect=(b,c,sw)=>{ const lo=[b[0],b[2],b[4]], hi=[b[1],b[3],b[5]];
    if(cut && (at<lo[n]||at>hi[n])) return;
    els.push({z:0,s:`<rect x="${lo[iu]}" y="${-hi[iv]}" width="${hi[iu]-lo[iu]}" height="${hi[iv]-lo[iv]}" fill="${fillOf(c)}" stroke="${SV.ink}" stroke-width="@${sw}"/>`});
    ext(lo[iu],lo[iv]); ext(hi[iu],hi[iv]); };
  for(const c of m.concrete){
    if(v.skipStub&&c.kind==='stub') continue;
    if(v.skipMat&&c.mat&&v.skipMat.includes(c.mat)) continue;
    if(v.skipLayer&&c.layer&&v.skipLayer.includes(c.layer)) continue;
    if(c.box) rect(c.box,c,1.1);
    else if(c.boxes) c.boxes.forEach(b=>rect(b,c,0.45));
    else if(c.rocks) c.rocks.forEach(r=>{ // batu: digambar sebagai elips; rotasi diabaikan di 2D
      if(cut&&Math.abs(r.c[n]-at)>r.s[n]*0.9) return; const k2=cut?Math.sqrt(Math.max(0.15,1-((r.c[n]-at)/r.s[n])**2)):1, rx=r.s[iu]*k2, ry=r.s[iv]*k2;
      els.push({z:0,s:`<ellipse cx="${r.c[iu].toFixed(1)}" cy="${(-r.c[iv]).toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${fillOf(c)}" stroke="${SV.ink}" stroke-width="@0.5"/>`}); ext(r.c[iu]-rx,r.c[iv]-ry); ext(r.c[iu]+rx,r.c[iv]+ry); });
    else if(c.cyl){ const {x,z,r,y0:ya,y1:yb}=c.cyl;
      if(v.n==='y'){ if(cut&&(at<ya||at>yb)) continue; const cu=iu===0?x:z, cv=iv===0?x:z; els.push({z:0,s:`<circle cx="${cu}" cy="${-cv}" r="${r}" fill="${fillOf(c)}" stroke="${SV.ink}" stroke-width="@1.1"/>`}); ext(cu-r,cv-r); ext(cu+r,cv+r); }
      else { const cn=v.n==='x'?x:z, cu=v.u==='x'?x:z; let w=r; if(cut){ const d=Math.abs(at-cn); if(d>r) continue; w=Math.sqrt(r*r-d*d);}
        els.push({z:0,s:`<rect x="${cu-w}" y="${-yb}" width="${2*w}" height="${yb-ya}" fill="${fillOf(c)}" stroke="${SV.ink}" stroke-width="@1.1"/>`}); ext(cu-w,ya); ext(cu+w,yb); } }
    else if(c.prism){ const P=c.prism, pa=P.axis||'z', e0=pa==='x'?P.x0:P.z0, e1=pa==='x'?P.x1:P.z1;
      const ys=P.pts.map(q=>q[1]), as=P.pts.map(q=>q[0]), ylo=Math.min(...ys), yhi=Math.max(...ys);
      if(v.n===pa){ if(cut&&(at<e0||at>e1)) continue; // penampang asli
        els.push({z:0,s:`<polygon points="${P.pts.map(([a,b])=>`${a},${-b}`).join(' ')}" fill="${fillOf(c)}" stroke="${SV.ink}" stroke-width="@1.1"/>`}); P.pts.forEach(([a,b])=>ext(a,b)); }
      else if(v.n!=='y'){ // dilihat dari samping: digambar sebagai persegi sepanjang ekstrusi (pendekatan)
        if(cut&&(at<Math.min(...as)||at>Math.max(...as))) continue;
        els.push({z:0,s:`<rect x="${e0}" y="${-yhi}" width="${e1-e0}" height="${yhi-ylo}" fill="${fillOf(c)}" stroke="${SV.ink}" stroke-width="@1.1"/>`}); ext(e0,ylo); ext(e1,yhi); } }
  }
  // tulangan
  for(const b of m.bars){
    if(lay&&!lay.has(b.layer)) continue;
    if(v.skipLayer&&v.skipLayer.includes(b.layer)) continue;
    const P=b.pts, w=b.d;
    if(cut){
      let run=[];
      const flush=()=>{ if(run.length>1) els.push({z:1,s:pl(run,b.color,w)}); run=[]; };
      for(let i=0;i<P.length;i++){
        const p=P[i];
        if(Math.abs(p[n]-at)<=half) run.push([p[iu],p[iv]]); else flush();
        if(i>0){ const a=P[i-1], dn=p[n]-a[n]; const L=Math.hypot(p[0]-a[0],p[1]-a[1],p[2]-a[2])||1;
          if(Math.abs(dn)/L>0.6 && (a[n]-at)*(p[n]-at)<=0 && dn!==0){ const t=(at-a[n])/dn; const cu=a[iu]+(p[iu]-a[iu])*t, cv=a[iv]+(p[iv]-a[iv])*t;
            els.push({z:2,s:`<circle cx="${cu.toFixed(1)}" cy="${(-cv).toFixed(1)}" r="${w/2}" fill="${b.color}" stroke="#3b1406" stroke-width="@0.5"/>`}); ext(cu,cv); } }
      }
      flush();
    } else els.push({z:1,s:pl(P.map(p=>[p[iu],p[iv]]),b.color,w)});
  }
  if(!isFinite(x0)){ x0=-100;x1=100;y0=-100;y1=100; }
  const W=x1-x0, H=y1-y0; const padF=v.pad??0.16; const k=Math.max((W*(1+2*padF))/(v.w2?170:340),(H*(1+2*padF))/(v.maxH||460));
  // dimensi dan catatan
  for(const d of v.dims||[]){
    const [ua,va]=d.a,[ub,vb]=d.b, col=d.c||SV.ink2, off=(d.off||0)*k, t=4*k;
    if(Math.abs(va-vb)<1e-6){ const yy=-va-off; els.push({z:3,s:`<g stroke="${col}" stroke-width="${0.8*k}"><line x1="${ua}" y1="${yy}" x2="${ub}" y2="${yy}"/><line x1="${ua}" y1="${yy-t}" x2="${ua}" y2="${yy+t}"/><line x1="${ub}" y1="${yy-t}" x2="${ub}" y2="${yy+t}"/></g><text x="${(ua+ub)/2}" y="${yy-4*k}" font-size="${10*k}" text-anchor="middle" fill="${col}" font-family="${SVF}" font-variant-numeric="tabular-nums">${d.t}</text>`}); y0=Math.min(y0,yy-14*k); y1=Math.max(y1,yy+6*k); }
    else { const xx=ua+off; els.push({z:3,s:`<g stroke="${col}" stroke-width="${0.8*k}"><line x1="${xx}" y1="${-va}" x2="${xx}" y2="${-vb}"/><line x1="${xx-t}" y1="${-va}" x2="${xx+t}" y2="${-va}"/><line x1="${xx-t}" y1="${-vb}" x2="${xx+t}" y2="${-vb}"/></g><text x="${xx-5*k}" y="${-(va+vb)/2}" font-size="${10*k}" text-anchor="middle" fill="${col}" font-family="${SVF}" font-variant-numeric="tabular-nums" transform="rotate(-90 ${xx-5*k} ${-(va+vb)/2})">${d.t}</text>`}); x0=Math.min(x0,xx-16*k); x1=Math.max(x1,xx+6*k); }
  }
  for(const nt of v.notes||[]){ const [u,w]=nt.at; els.push({z:3,s:`<text x="${u}" y="${-w}" font-size="${10*k*(nt.s||1)}" text-anchor="${nt.a||'middle'}" fill="${nt.c||SV.ink2}" font-family="${SVF}" font-variant-numeric="tabular-nums">${nt.t}</text>`}); ext(u,w); }
  const px=(x1-x0)*0.05+4*k, py=(y1-y0)*0.05+4*k;
  const vb=[x0-px,y0-py,(x1-x0)+2*px,(y1-y0)+2*py];
  const body=els.sort((a,b)=>a.z-b.z).map(e=>e.s.replace(/@([\d.]+)/g,(_,q)=>String(+q*k)).replace(/#([\d.]+)#/g,(_,q)=>String(Math.max(+q,1.1*k)))).join('');
  return `<svg viewBox="${vb.map(q=>q.toFixed(1)).join(' ')}" xmlns="http://www.w3.org/2000/svg" style="max-height:${v.maxH||460}px">${body}</svg>`;
  function pl(pts,col,w){ return `<polyline points="${pts.map(([a,b])=>`${a.toFixed(1)},${(-b).toFixed(1)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="#${w}#" stroke-linejoin="round" stroke-linecap="round"/>`; }
}
