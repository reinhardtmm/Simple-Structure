import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { fmt, renderView, PI, MAT } from './core.js';
import pelat from './comp/pelat.js';
import balok from './comp/balok.js';
import kolom from './comp/kolom.js';
import hbk from './comp/hbk.js';
import dinding from './comp/dinding.js';
import tangga from './comp/tangga.js';
import sloof from './comp/sloof.js';
import telapak from './comp/telapak.js';
import tiang from './comp/tiang.js';
import batukali from './comp/batukali.js';
import sloofpraktis from './comp/sloofpraktis.js';
import kolompraktis from './comp/kolompraktis.js';
import bata from './comp/bata.js';
import gabungan from './comp/gabungan.js';

// Dikelompokkan menurut urutan pelaksanaan gedung beton bertulang. Kelompok tanpa nomor berada di luar urutan.
const GROUPS=[
  ['Fondasi',[batukali,telapak,tiang],1],
  ['Sloof',[sloofpraktis,sloof],2],
  ['Kolom dan dinding geser',[kolom,dinding],3],
  ['Balok dan pelat',[balok,pelat],4],
  ['Tangga',[tangga],5],
  ['Pasangan dinding',[bata,kolompraktis],6],
  ['Hubungan',[hbk,gabungan]]
];
const COMPS=Object.fromEntries(GROUPS.flatMap(g=>g[1]).map(c=>[c.id,c]));
const S=0.001;
const SYS_TEXT={
  SRPMB:'Sistem Rangka Pemikul Momen Biasa. Untuk KDS B, detailing mengikuti pasal umum.',
  SRPMK:'Sistem Rangka Pemikul Momen Khusus. Wajib untuk KDS D sampai F, detailing daktail Pasal 18.'
};
const clone=o=>JSON.parse(JSON.stringify(o));
const state={comp:'balok',sys:'SRPMK',params:{},vis:{},view:{xray:0.72,cut:1,explode:0,labels:true}};
for(const c of Object.values(COMPS)){ state.params[c.id]=clone(c.defaults); state.vis[c.id]={}; }
const sysKey=c=>c.sysDependent?state.sys:'ALL';
// lapisan boleh mati secara bawaan (off:true), misalnya plesteran; pilihan pengguna tetap diutamakan
const isOn=L=>{ const v=state.vis[state.comp]?.[L.k]; return v===undefined?!L.off:v!==false; };

/* ===== three ===== */
const view=document.getElementById('view');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(2,window.devicePixelRatio));
renderer.setClearColor(0xf5f5f7);
renderer.localClippingEnabled=true;
view.prepend(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(38,1,0.01,300);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.dampingFactor=0.1;
scene.add(new THREE.HemisphereLight(0xffffff,0xb4b7bf,2.2));
const dl=new THREE.DirectionalLight(0xffffff,2.2); dl.position.set(4,7,5); scene.add(dl);
const dl2=new THREE.DirectionalLight(0xffffff,0.8); dl2.position.set(-5,3,-4); scene.add(dl2);
const clip=new THREE.Plane(new THREE.Vector3(-1,0,0),1e6), clips=[clip];
const M={
  concrete:new THREE.MeshStandardMaterial({color:0xc4c6cc,roughness:.95,transparent:true,opacity:.28,depthWrite:false,clippingPlanes:clips,side:THREE.DoubleSide}),
  stub:new THREE.MeshStandardMaterial({color:0xb0b3ba,roughness:.95,transparent:true,opacity:.18,depthWrite:false,clippingPlanes:clips,side:THREE.DoubleSide}),
  edge:new THREE.LineBasicMaterial({color:0x8e8e93,transparent:true,opacity:.7,clippingPlanes:clips}),
};
// material pasangan (bata, spesi, batu kali, dan sebagainya); transparansinya ikut slider beton
const masonMat=new Map();
const matMason=k=>{ if(!masonMat.has(k)) masonMat.set(k,new THREE.MeshStandardMaterial({color:MAT[k]||k,roughness:.9,transparent:true,opacity:.5,depthWrite:false,clippingPlanes:clips,side:THREE.DoubleSide})); return masonMat.get(k); };
const hiMat=new THREE.MeshStandardMaterial({color:0xff9500,emissive:0xff9500,emissiveIntensity:.5,roughness:.4,clippingPlanes:clips});
const matCache=new Map();
const matOf=c=>{ if(!matCache.has(c)) matCache.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.45,metalness:.3,clippingPlanes:clips})); return matCache.get(c); };
const zoneCache=new Map();
const zoneMat=c=>{ if(!zoneCache.has(c)) zoneCache.set(c,new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.09,depthWrite:false,side:THREE.DoubleSide,clippingPlanes:clips})); return zoneCache.get(c); };

class Polyline3 extends THREE.Curve{
  constructor(pts){super();this.pts=pts;this.cum=[0];for(let i=1;i<pts.length;i++)this.cum.push(this.cum[i-1]+pts[i].distanceTo(pts[i-1]));this.len=this.cum.at(-1)||1e-6;}
  getPoint(t,target=new THREE.Vector3()){const L=t*this.len,c=this.cum;let lo=0,hi=c.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(c[m]<=L)lo=m;else hi=m;}const seg=c[hi]-c[lo]||1;return target.copy(this.pts[lo]).lerp(this.pts[hi],(L-c[lo])/seg);}
}
function tube(ptsMM,d,mat,maxSeg=900){
  const pts=ptsMM.map(p=>new THREE.Vector3(p[0]*S,p[1]*S,p[2]*S));
  const c=new Polyline3(pts), r=d/2*S;
  const segs=pts.length===2?1:Math.min(maxSeg,Math.max(8,Math.ceil(c.len/Math.max(r*1.6,0.006))));
  return new THREE.Mesh(new THREE.TubeGeometry(c,segs,r,8,false),mat);
}
function withEdges(mesh,thr=1){ mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry,thr),M.edge)); return mesh; }
function boxMesh(b,mat,edges=true){
  const [x0,x1,y0,y1,z0,z1]=b; const g=new THREE.BoxGeometry((x1-x0)*S,(y1-y0)*S,(z1-z0)*S);
  const m=new THREE.Mesh(g,mat); m.position.set((x0+x1)/2*S,(y0+y1)/2*S,(z0+z1)/2*S); return edges?withEdges(m):m;
}
function concreteMesh(c){
  const mat=c.mat?matMason(c.mat):c.kind==='stub'?M.stub:M.concrete;
  if(c.box) return boxMesh(c.box,mat);
  if(c.boxes){ // banyak kotak (misalnya bata) digabung menjadi satu geometri agar ringan
    const gs=c.boxes.map(([x0,x1,y0,y1,z0,z1])=>new THREE.BoxGeometry((x1-x0)*S,(y1-y0)*S,(z1-z0)*S).translate((x0+x1)/2*S,(y0+y1)/2*S,(z0+z1)/2*S));
    const m=new THREE.Mesh(mergeGeometries(gs),mat); gs.forEach(g=>g.dispose()); return c.edges===false?m:withEdges(m,20); }
  if(c.rocks){ // batu tak beraturan: ikosahedron yang diskalakan dan diputar, digabung jadi satu geometri
    const e=new THREE.Euler(), gs=c.rocks.map(r=>new THREE.IcosahedronGeometry(1,0).scale(r.s[0]*S,r.s[1]*S,r.s[2]*S).applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(e.set(r.r[0],r.r[1],r.r[2]))).translate(r.c[0]*S,r.c[1]*S,r.c[2]*S));
    const g=mergeGeometries(gs); gs.forEach(q=>q.dispose()); g.computeVertexNormals(); return new THREE.Mesh(g,mat); }
  if(c.cyl){ const {x,z,r,y0,y1}=c.cyl; const m=new THREE.Mesh(new THREE.CylinderGeometry(r*S,r*S,(y1-y0)*S,40),mat); m.position.set(x*S,(y0+y1)/2*S,z*S); return withEdges(m,30); }
  if(c.prism){ const P=c.prism;
    if(P.axis==='x'){ // penampang di bidang z-y, diekstrusi sepanjang x (misalnya fondasi menerus di bawah sloof)
      const sh=new THREE.Shape(P.pts.map(([z,y])=>new THREE.Vector2(-z*S,y*S)));
      const g=new THREE.ExtrudeGeometry(sh,{depth:(P.x1-P.x0)*S,bevelEnabled:false}).rotateY(PI/2); const m=new THREE.Mesh(g,mat); m.position.x=P.x0*S; return withEdges(m,20); }
    const sh=new THREE.Shape(P.pts.map(([a,b])=>new THREE.Vector2(a*S,b*S)));
    const g=new THREE.ExtrudeGeometry(sh,{depth:(P.z1-P.z0)*S,bevelEnabled:false}); const m=new THREE.Mesh(g,mat); m.position.z=P.z0*S; return withEdges(m,20); }
}

const root=new THREE.Group(); scene.add(root);
let groups={}, pickables=[], labels=[], model=null, selected=null, cutRange=null, layerDefs=[];

function clearRoot(){ root.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); root.clear(); }
function build3D(m){
  clearRoot(); pickables=[]; groups={};
  const G=k=>groups[k]??=(()=>{const g=new THREE.Group(); g.name=k; root.add(g); return g;})();
  m.concrete.forEach(c=>G(c.layer||'beton').add(concreteMesh(c)));
  (m.zones||[]).forEach(z=>G('zona').add(boxMesh(z.box,zoneMat(z.color),false)));
  m.bars.forEach(b=>{ const mesh=tube(b.pts,b.d,matOf(b.color),b.maxSeg); mesh.userData={info:b.info,base:mesh.material}; pickables.push(mesh); G(b.layer).add(mesh); });
  labels=m.labels||[];
  layerDefs=[{k:'beton',label:'Beton',color:'#c9c4b8',ex:m.betonEx||[0,0,0]},...m.layers.filter(l=>groups[l.k]),...((m.zones||[]).length?[{k:'zona',label:'Zona daerah khusus',color:'#0f766e',ex:m.betonEx||[0,0,0],zone:true}]:[])];
  // rentang potong
  const bb=new THREE.Box3().setFromObject(root); const ax=m.cutAxis||'x';
  cutRange={axis:ax,min:bb.min[ax],max:bb.max[ax]};
  renderLayers(); applyView();
}
// Bila area 3D sedang berukuran nol (tab di latar, panel tersembunyi), aspect = 0/0 = NaN dan posisi kamera ikut NaN.
// Render lalu gagal setiap frame dan model tampak membeku, jadi penyesuaian kamera ditunda sampai ukurannya nyata.
let fitPending=false;
function fitCamera(){
  if(!view.clientWidth||!view.clientHeight){ fitPending=true; return; }
  fitPending=false;
  const bb=new THREE.Box3().setFromObject(root); const sph=bb.getBoundingSphere(new THREE.Sphere());
  const vf=camera.fov*PI/180, hf=2*Math.atan(Math.tan(vf/2)*camera.aspect);
  const dist=sph.radius/Math.sin(Math.min(vf,hf)/2)*(model.camK||0.92);
  const dir=new THREE.Vector3(...(model.camDir||[0.4,0.35,0.85])).normalize();
  const tgt=sph.center.clone(); tgt.y-=sph.radius*0.08;
  camera.position.copy(tgt).addScaledVector(dir,dist); controls.target.copy(tgt); controls.update();
}
function applyView(){
  const v=state.view, op=1-v.xray;
  M.concrete.opacity=Math.max(0.02,op*0.9+0.04); M.stub.opacity=Math.max(0.02,op*0.6+0.03);
  M.concrete.depthWrite=op>0.97; M.edge.opacity=0.25+op*0.5;
  for(const mm of masonMat.values()){ mm.opacity=Math.max(0.1,1-0.8*v.xray); mm.depthWrite=mm.opacity>0.97; }
  for(const L of layerDefs){ const g=groups[L.k]; if(!g) continue; g.visible=isOn(L); const e=L.ex||[0,0,0]; g.position.set(e[0]*S*v.explode,e[1]*S*v.explode,e[2]*S*v.explode); }
  if(cutRange){ const a=cutRange.axis; clip.normal.set(a==='x'?-1:0,a==='y'?-1:0,a==='z'?-1:0); const c=cutRange.min+(cutRange.max-cutRange.min)*v.cut; clip.constant=(v.cut>=0.999||!Number.isFinite(c))?1e6:c; }
}
/* label */
const labelLayer=document.getElementById('labels'); const _v=new THREE.Vector3();
function drawLabels(){
  if(!state.view.labels){ labelLayer.innerHTML=''; return; }
  const w=view.clientWidth,h=view.clientHeight; let html='';
  for(const L of labels){
    _v.set(L.p[0]*S,L.p[1]*S,L.p[2]*S);
    const g=groups[L.follow||'beton']; if(L.follow!==null && g){ if(!g.visible && L.follow) continue; _v.add(g.position); }
    if(clip.distanceToPoint(_v)<0) continue;
    _v.project(camera); if(_v.z>1) continue;
    html+=`<div class="lbl ${L.c||'dim'}" style="left:${(_v.x*.5+.5)*w}px;top:${(-_v.y*.5+.5)*h}px">${L.t}</div>`;
  }
  labelLayer.innerHTML=html;
}
/* pick */
const ray=new THREE.Raycaster(); const mv=new THREE.Vector2(); let downAt=null;
renderer.domElement.addEventListener('pointerdown',e=>{downAt=[e.clientX,e.clientY];});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!downAt||Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1])>5) return;
  const r=renderer.domElement.getBoundingClientRect();
  mv.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
  ray.setFromCamera(mv,camera);
  const hits=ray.intersectObjects(pickables,false).filter(h=>clip.distanceToPoint(h.point)>=0 && h.object.parent.visible);
  select(hits[0]?.object||null);
});
function select(o){
  if(selected) selected.material=selected.userData.base;
  selected=o; const card=document.getElementById('card');
  if(!o||!o.userData.info){ selected=null; card.classList.remove('show'); return; }
  o.material=hiMat; const i=o.userData.info;
  document.getElementById('cardT').textContent=i.t;
  document.getElementById('cardB').innerHTML=(i.b||[]).filter(Boolean).map(s=>`<p>${s}</p>`).join('')+(i.pasal?`<p class="pasal">${pasalTxt(i.pasal)}</p>`:'');
  card.classList.add('show');
}
document.getElementById('cardX').onclick=()=>select(null);
// Hanya rujukan berbentuk "Pasal ..." atau "Tabel ..." yang merujuk SNI 2847:2019; rujukan lain ditulis apa adanya
const pasalTxt=p=>p==='praktik'?'Praktik umum, bukan pasal SNI':/^(Pasal|Tabel)\b/.test(p)?'SNI 2847:2019 '+p:p;

// devicePixelRatio bisa berubah setelah halaman dimuat (pindah monitor, zoom, tab dibuka di latar), jadi selalu baca ulang
function resize(){ const w=view.clientWidth,h=view.clientHeight; if(!w||!h) return; renderer.setPixelRatio(Math.min(2,window.devicePixelRatio)); renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); if(fitPending&&model) fitCamera(); }
new ResizeObserver(resize).observe(view);
(function watchDPR(){ matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener('change',()=>{ resize(); watchDPR(); },{once:true}); })();
renderer.setAnimationLoop(()=>{ controls.update(); renderer.render(scene,camera); drawLabels(); });

/* ===== UI ===== */
function renderNav(){
  let h='';
  for(const [g,cs,no] of GROUPS){ h+=`<h4>${no?`<span class="step">${no}</span>`:''}${g}</h4>`+cs.map(c=>`<button data-comp="${c.id}" class="${c.id===state.comp?'on':''}">${c.name}</button>`).join(''); }
  h+=`<p class="note">Komponen diurutkan menurut urutan pelaksanaan, dari fondasi sampai pasangan dinding. Ubah parameter di panel kanan; model, gambar, dan hasil pemeriksaan berubah bersamaan.</p>`;
  document.getElementById('nav').innerHTML=h;
}
function renderLayers(){
  const vis=state.vis[state.comp], isBlock=L=>L.k==='beton'||L.block;
  const el=document.getElementById('legend'), open=el.classList.contains('open');
  let h=`<div class="lh"><button class="lt" aria-expanded="${open}" aria-controls="legendBody"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2.5 7.5 6 4 9.5"/></svg>Lapisan</button><span><button data-all="1">Semua</button><button data-all="0">Tulangan saja</button></span></div>`;
  h+=`<div class="lb" id="legendBody">`+layerDefs.map(L=>`<label><i style="background:${L.color}" class="${isBlock(L)?'blk':''}"></i><span>${L.label}</span><input type="checkbox" class="sw" data-layer="${L.k}" ${isOn(L)?'checked':''}></label>`).join('');
  if(model.colorNote) h+=`<div class="cn">${model.colorNote}</div>`;
  h+=`</div>`;
  el.innerHTML=h;
  el.querySelector('.lt').onclick=()=>{ const o=el.classList.toggle('open'); el.querySelector('.lt').setAttribute('aria-expanded',String(o)); try{ localStorage.setItem('atlas-tulangan-legend',o?'1':'0'); }catch(e){} };
  el.querySelectorAll('[data-layer]').forEach(cb=>cb.onchange=()=>{ vis[cb.dataset.layer]=cb.checked; applyView(); save(); });
  el.querySelectorAll('[data-all]').forEach(b=>b.onclick=()=>{ const all=b.dataset.all==='1'; layerDefs.forEach(L=>vis[L.k]= all?true:!(isBlock(L)||L.k==='zona')); renderLayers(); applyView(); save(); });
}
function renderParams(c,m){
  const pr=state.params[c.id][sysKey(c)];
  let h='';
  for(const [g,fields] of c.schema){
    h+=`<div class="grp"><h6>${g}</h6><div class="list">`;
    for(const f of fields){
      if(f.show && !f.show(state.sys,pr)) continue;
      const lab=typeof f.label==='function'?f.label(state.sys,pr):f.label;
      if(f.type==='bool'){ h+=`<div class="row"><label for="f-${f.k}">${lab}</label><input type="checkbox" id="f-${f.k}" data-k="${f.k}" ${pr[f.k]?'checked':''} class="sw"></div>`; continue; }
      if(f.opts){ h+=`<div class="row"><label for="f-${f.k}">${lab}<small>${f.unit||''}</small></label><select id="f-${f.k}" data-k="${f.k}">${f.opts.map(o=>{const [v,t]=Array.isArray(o)?o:[o,f.unit==='D'?'D'+o:o]; return `<option value="${v}" ${v==pr[f.k]?'selected':''}>${t}</option>`;}).join('')}</select></div>`; continue; }
      h+=`<div class="row"><label for="f-${f.k}">${lab}<small>${f.unit||''}</small></label><input type="number" id="f-${f.k}" data-k="${f.k}" min="${f.min}" max="${f.max}" step="${f.step||1}" value="${pr[f.k]}"></div>`;
    }
    h+='</div></div>';
  }
  if(m.derived) h+=`<div class="grp"><h6>Nilai turunan</h6><div class="derived">${m.derived}</div></div>`;
  h+=`<button class="btn2" id="resetP">Kembalikan nilai awal</button>`;
  const pane=document.getElementById('pane-param'); const st=pane.scrollTop; pane.innerHTML=h; pane.scrollTop=st;
  pane.querySelectorAll('[data-k]').forEach(el=>el.addEventListener('change',()=>{
    const k=el.dataset.k; let v=el.type==='checkbox'?el.checked:(isNaN(Number(el.value))?el.value:Number(el.value));
    if(el.type==='number'){ const mn=Number(el.min),mx=Number(el.max); if(!isFinite(v)) v=pr[k]; v=Math.min(mx,Math.max(mn,v)); }
    pr[k]=v; update(false);
  }));
  document.getElementById('resetP').onclick=()=>{ state.params[c.id][sysKey(c)]=clone(c.defaults[sysKey(c)]); update(true); };
}
function renderChecks(m){
  const cs=m.checks, n=cs.filter(c=>c.ok!==null).length, ok=cs.filter(c=>c.ok===true).length, bad=n-ok;
  const b=document.getElementById('badge'); b.textContent=bad?`${bad} gagal`:'lolos'; b.className='badge '+(bad?'bad':'good');
  let h=`<div class="sum ${bad?'bad':'good'}">${bad?`${bad} dari ${n} pemeriksaan tidak terpenuhi`:`${ok} dari ${n} pemeriksaan terpenuhi`}</div>`;
  h+='<div class="list">'+cs.map(c=>`<div class="chk ${c.ok===null?'info':c.ok?'ok':'bad'}"><div class="ic" aria-label="${c.ok===null?'info':c.ok?'terpenuhi':'tidak terpenuhi'}">${c.ok===null?'i':c.ok?'✓':'✕'}</div><div><div class="t">${c.t}</div><div class="d">${c.d}</div><div class="p">${pasalTxt(c.p)}</div></div></div>`).join('')+'</div>';
  const c0=COMPS[state.comp];
  h+=`<p class="disclaimer">Pemeriksaan ini hanya mencakup detailing dan syarat geometri. Kapasitas lentur, geser, aksial, serta daya dukung tanah tidak dihitung karena memerlukan data beban dan tanah. ${c0.checkNote||'Nomor pasal mengacu pada SNI 2847:2019, adopsi modifikasi dari ACI 318M-14, dan sudah dicocokkan dengan teks SNI. Asumsi: agregat maksimum 20 mm, beton normal, tulangan tanpa lapisan epoksi.'} Pemeriksaan ini tetap alat bantu belajar, bukan pengganti desain oleh perencana.</p>`;
  document.getElementById('pane-cek').innerHTML=h;
}
function renderDrawings(m){
  let h='', i=0; const V=m.views||[];
  while(i<V.length){
    const v=V[i];
    if(v.w2 && V[i+1]?.w2){ const v2=V[i+1]; h+=`<div class="draw2">${box(v)}${box(v2)}</div>`; i+=2; }
    else { h+=box(v); i++; }
  }
  h+=`<p class="disclaimer">Satuan mm. Gambar dihasilkan dari model 3D yang sama, sehingga selalu sesuai dengan parameter. ${m.drawNote||''}</p>`;
  document.getElementById('pane-gambar').innerHTML=h;
  function box(v){ return `<div class="draw"><h6>${v.title}</h6>${v.sub?`<div class="sub">${v.sub}</div>`:''}${renderView(m,v)}</div>`; }
}
function renderTeori(c){
  const t=c.teori; const body=t.common+(c.sysDependent?t[state.sys]:(t.ALL||''));
  document.getElementById('pane-teori').innerHTML=body+`<p class="disclaimer">${c.ref||`Rujukan utama: SNI 2847:2019 Persyaratan Beton Struktural untuk Bangunan Gedung, SNI 1726:2019 untuk kategori desain seismik${c.refExtra||''}. Nomor pasal SNI 2847:2019 sudah dicocokkan dengan teks standar.`}</p>`;
}
function save(){ try{ localStorage.setItem('atlas-tulangan-v2',JSON.stringify({comp:state.comp,sys:state.sys,params:state.params,vis:state.vis})); }catch(e){} }

function update(refit){
  const c=COMPS[state.comp]; const p=state.params[c.id][sysKey(c)];
  model=c.build(p,state.sys);
  select(null); build3D(model); if(refit) fitCamera();
  renderParams(c,model); renderChecks(model); renderDrawings(model); renderTeori(c);
  document.body.classList.remove('sys-SRPMB','sys-SRPMK','sys-NA'); document.body.classList.add('sys-'+(c.sysDependent?state.sys:'NA'));
  document.getElementById('crumb').textContent=`${c.name} · ${c.sysDependent?(c.sysName?.[state.sys]||state.sys):'umum'} · ${c.std||'SNI 2847:2019'}`;
  document.getElementById('syslabel').textContent=c.sysDependent?(c.sysText?.[state.sys]||SYS_TEXT[state.sys]):'Komponen ini tidak bergantung pada sistem rangka. Detailingnya sama untuk SRPMB dan SRPMK.';
  document.querySelectorAll('#sysSeg button').forEach(x=>{ x.disabled=!c.sysDependent; x.classList.toggle('on',c.sysDependent&&x.dataset.sys===state.sys); });
  document.title=`Atlas Tulangan: ${c.name}`;
  save();
}

document.getElementById('sysSeg').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b||b.disabled) return; state.sys=b.dataset.sys; update(false); });
document.getElementById('nav').addEventListener('click',e=>{ const b=e.target.closest('button[data-comp]'); if(!b) return; state.comp=b.dataset.comp; renderNav(); state.view.cut=1; document.getElementById('cut').value=1; update(true); try{ history.replaceState(null,'','#'+state.comp);}catch(_){} });
document.getElementById('tabs').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('on',x===b)); document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.id==='pane-'+b.dataset.tab)); });
const bindRange=(id,k)=>document.getElementById(id).addEventListener('input',e=>{ state.view[k]=Number(e.target.value); applyView(); });
bindRange('xray','xray'); bindRange('cut','cut'); bindRange('explode','explode');
document.getElementById('labelsOn').onchange=e=>{state.view.labels=e.target.checked;};
document.getElementById('resetCam').onclick=fitCamera;

try{ const sv=JSON.parse(localStorage.getItem('atlas-tulangan-v2')||'null');
  if(sv){ for(const id in COMPS){ for(const k in state.params[id]) Object.assign(state.params[id][k],sv.params?.[id]?.[k]||{}); Object.assign(state.vis[id],sv.vis?.[id]||{}); }
    if(COMPS[sv.comp]) state.comp=sv.comp; if(sv.sys) state.sys=sv.sys; } }catch(e){}
const hash=(location.hash||'').slice(1); if(COMPS[hash]) state.comp=hash;
// legenda Lapisan: terbuka di layar lebar, terlipat di layar sempit, kecuali pengguna pernah memilih
{ let lo=null; try{ lo=localStorage.getItem('atlas-tulangan-legend'); }catch(e){} document.getElementById('legend').classList.toggle('open',lo===null?!matchMedia('(max-width: 980px)').matches:lo==='1'); }
/* ===== panel kiri dan kanan bisa disembunyikan ===== */
const PANELS={nav:{cls:'hide-nav',btn:'tglNav',nama:'daftar komponen'},side:{cls:'hide-side',btn:'tglSide',nama:'panel konfigurasi'}};
function setPanel(k,show,store=true){
  const P=PANELS[k], b=document.getElementById(P.btn);
  document.body.classList.toggle(P.cls,!show);
  b.setAttribute('aria-expanded',String(show));
  const t=`${show?'Sembunyikan':'Tampilkan'} ${P.nama}`; b.setAttribute('aria-label',t); b.title=`${t} ( ${k==='nav'?'[':']'} )`;
  if(store) try{ localStorage.setItem('atlas-tulangan-layout',JSON.stringify({nav:!document.body.classList.contains('hide-nav'),side:!document.body.classList.contains('hide-side')})); }catch(e){}
}
const togglePanel=k=>setPanel(k,document.body.classList.contains(PANELS[k].cls));
document.getElementById('tglNav').onclick=()=>togglePanel('nav');
document.getElementById('tglSide').onclick=()=>togglePanel('side');
window.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
  if(e.key==='[') togglePanel('nav'); else if(e.key===']') togglePanel('side');
});
try{ const ly=JSON.parse(localStorage.getItem('atlas-tulangan-layout')||'null'); if(ly){ setPanel('nav',ly.nav!==false,false); setPanel('side',ly.side!==false,false); } }catch(e){}

renderNav(); resize(); update(true);
window.addEventListener('hashchange',()=>{ const h=(location.hash||'').slice(1); if(COMPS[h]&&h!==state.comp){ state.comp=h; renderNav(); update(true); } });
window.__atlas={state,update,camera,get pickables(){return pickables;},COMPS};
