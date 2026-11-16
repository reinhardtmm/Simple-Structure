import * as THREE from 'three';

/* Halaman utama.
   Pembuka menampilkan model gabungan yang berputar pelan, dan setiap kartu komponen memakai gambar mini yang dirender
   dari model komponennya sendiri (nilai awal, SRPMK). Keduanya memakai renderer sendiri, terpisah dari scene utama,
   sehingga keadaan aplikasi (komponen aktif, kamera, lapisan) tidak berubah selama halaman ini terbuka.
   staticModel(id) disediakan app.js: mengembalikan {group, camDir, camK} berisi beton, pasangan, dan tulangan dengan
   material tetap. Geometri di dalamnya milik pemanggil dan dibuang di sini setelah tidak dipakai. */

const PRAKTIS=c=>!!c.std;

function lights(scene){
  scene.add(new THREE.HemisphereLight(0xffffff,0xb4b7bf,2.2));
  const a=new THREE.DirectionalLight(0xffffff,2.2); a.position.set(4,7,5); scene.add(a);
  const b=new THREE.DirectionalLight(0xffffff,0.8); b.position.set(-5,3,-4); scene.add(b);
}
// Kamera diarahkan seperti fitCamera di app.js: jarak dari bola pembatas, arah dari model.camDir.
function frame(camera,obj,dir,k){
  const sph=new THREE.Box3().setFromObject(obj).getBoundingSphere(new THREE.Sphere());
  const vf=camera.fov*Math.PI/180, hf=2*Math.atan(Math.tan(vf/2)*camera.aspect);
  const dist=sph.radius/Math.sin(Math.min(vf,hf)/2)*(k||0.92);
  const d=new THREE.Vector3(...(dir||[0.4,0.35,0.85])).normalize();
  camera.position.copy(sph.center).addScaledVector(d,dist); camera.lookAt(sph.center);
  camera.near=dist/50; camera.far=dist*10; camera.updateProjectionMatrix();
}
const disposeTree=o=>o.traverse(x=>x.geometry?.dispose());

export function initHome({groups,staticModel}){
  const stage=document.getElementById('homeStage'), cv=document.getElementById('homeCv');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');

  /* kartu komponen, dikelompokkan seperti urutan membangun */
  document.getElementById('homeGroups').innerHTML=groups.map(([g,cs],i)=>
    `<div class="h-grp"><h3><span class="step" aria-hidden="true">${i+1}</span>${g}</h3><div class="h-tiles">`+
    cs.map(c=>`<a class="h-tile" href="#${c.id}" data-id="${c.id}"><div class="ph"><img alt="" width="400" height="300" decoding="async"></div>`+
      `<span class="h-tag${PRAKTIS(c)?' pr':''}">${PRAKTIS(c)?'Elemen praktis':c.sysDependent?'SRPMB dan SRPMK':'Struktur'}</span>`+
      `<b>${c.name}</b><small>${c.std||'SNI 2847:2019'}</small></a>`).join('')+`</div></div>`).join('');
  const go=document.getElementById('homeGo');
  // Pilih komponen menggulir ke kartu komponen. Memakai tombol, bukan tautan hash, karena hash dipakai untuk rute komponen.
  document.getElementById('homePick').onclick=()=>document.getElementById('homeTiles').scrollIntoView({block:'start'});

  /* Model pembuka bergilir: mode gabungan lebih dulu, lalu setiap komponen sesuai urutan membangun, berganti setiap
     7 detik dengan transisi memudar. Pergantian berhenti saat kursor atau fokus ada di area model, saat halaman tidak
     terlihat, dan sepenuhnya saat 'kurangi gerakan' aktif (model diam di sudut awal). Model yang diganti langsung dibuang,
     jadi hanya satu model pembuka yang ada di memori. Renderer dibuat saat halaman pertama kali tampil. */
  const SHOW_MS=7000, FADE_MS=380;
  const reel=[{id:'gabungan',t:'Mode gabungan: fondasi sampai pelat dalam satu model.'},...groups.flatMap(([g,cs])=>cs.map(c=>({id:c.id,t:`${g} · ${c.name}`})))];
  const capT=document.getElementById('homeCapT'), capA=document.getElementById('homeCapA');
  let hero=null, running=false, onScreen=true, shown=false, held=false, idx=0, shownFor=0, swapping=false;
  function makeHero(){
    const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
    renderer.setClearColor(0x000000,0);
    const scene=new THREE.Scene(); lights(scene);
    const camera=new THREE.PerspectiveCamera(32,1,0.01,300), pivot=new THREE.Group(); scene.add(pivot);
    hero={renderer,scene,camera,pivot,inner:null,dir:null,k:0.8,clock:new THREE.Clock()};
    put(0); }
  // Memasang model ke-i: model lama dibuang, model baru dipusatkan supaya berputar terhadap pusatnya sendiri.
  function put(i){
    idx=(i+reel.length)%reel.length; const r=reel[idx];
    let sm; try{ sm=staticModel(r.id); }catch(e){ console.warn('Model pembuka gagal dibuat untuk',r.id,e); return; }
    if(hero.inner){ hero.pivot.remove(hero.inner); disposeTree(hero.inner); }
    const c=new THREE.Box3().setFromObject(sm.group).getCenter(new THREE.Vector3()); sm.group.position.sub(c);
    hero.pivot.add(sm.group); hero.pivot.rotation.y=-0.35;
    Object.assign(hero,{inner:sm.group,dir:sm.camDir,k:(sm.camK||0.92)*(r.id==='gabungan'?0.82:0.88)});
    capT.textContent=r.t; capA.href='#'+r.id; capA.setAttribute('aria-label',`Buka model ${r.t}`);
    cv.setAttribute('aria-label',`Model 3D yang berputar pelan: ${r.t}`);
    shownFor=0; size();
  }
  function swap(){ if(swapping) return; swapping=true;
    cv.classList.add('fade');
    setTimeout(()=>{ put(idx+1); cv.classList.remove('fade'); swapping=false; },FADE_MS); }
  function size(){ if(!hero) return; const w=cv.clientWidth, h=cv.clientHeight; if(!w||!h) return;
    hero.renderer.setPixelRatio(Math.min(2,devicePixelRatio)); hero.renderer.setSize(w,h,false);
    hero.camera.aspect=w/h; frame(hero.camera,hero.pivot,hero.dir,hero.k); draw(); }
  function draw(){ try{ hero.renderer.render(hero.scene,hero.camera); }catch(e){ console.error('Gagal merender model pembuka:',e); } }
  // Diputar 0,12 rad/detik. Waktu tayang memakai selisih waktu sebenarnya (bukan yang dibatasi 0,1 detik untuk putaran),
  // supaya tetap 7 detik walau frame patah-patah; hanya dihitung saat loop berjalan dan tidak ditahan.
  function loop(){ const raw=hero.clock.getDelta(); hero.pivot.rotation.y+=Math.min(raw,0.1)*0.12;
    if(!held&&!swapping){ shownFor+=raw*1000; if(shownFor>=SHOW_MS) swap(); }
    draw(); }
  const hold=on=>{ held=on; };
  stage.addEventListener('pointerenter',()=>hold(true)); stage.addEventListener('pointerleave',()=>hold(false));
  stage.addEventListener('focusin',()=>hold(true)); stage.addEventListener('focusout',()=>hold(false));
  function sync(){ const want=shown&&onScreen&&!document.hidden&&!reduce.matches&&!!hero;
    if(want===running) return; running=want; hero?.clock.getDelta(); hero?.renderer.setAnimationLoop(want?loop:null); }
  new ResizeObserver(size).observe(stage);
  new IntersectionObserver(es=>{ onScreen=es[0].isIntersecting; sync(); }).observe(stage);
  document.addEventListener('visibilitychange',sync); reduce.addEventListener('change',()=>{ sync(); if(hero) draw(); });

  /* gambar mini: satu renderer kecil di luar halaman, satu komponen per giliran supaya halaman tetap responsif.
     Hasilnya disimpan selama halaman terbuka, dan renderernya dibuang setelah semua selesai. */
  let thumbsStarted=false;
  function makeThumbs(){
    if(thumbsStarted) return; thumbsStarted=true;
    const W=400, H=300, r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
    r.setPixelRatio(1.5); r.setSize(W,H,false); r.setClearColor(0x000000,0);
    const scene=new THREE.Scene(); lights(scene); const cam=new THREE.PerspectiveCamera(34,W/H,0.01,300);
    const ids=groups.flatMap(g=>g[1].map(c=>c.id));
    const next=()=>{
      const id=ids.shift();
      if(!id){ r.dispose(); r.forceContextLoss(); return; }
      try{ const sm=staticModel(id); scene.add(sm.group); frame(cam,sm.group,sm.camDir,sm.camK); r.render(scene,cam);
        const url=r.domElement.toDataURL('image/png'); scene.remove(sm.group); disposeTree(sm.group);
        const img=document.querySelector(`.h-tile[data-id="${id}"] img`); if(img){ img.onload=()=>img.classList.add('ok'); img.src=url; } }
      catch(e){ console.warn('Gambar mini gagal dibuat untuk',id,e); }
      setTimeout(next,16);
    };
    setTimeout(next,60);
  }

  return {
    // start: komponen yang dibuka tombol Mulai (komponen terakhir, atau balok untuk kunjungan pertama)
    show(start){
      go.href='#'+(start||'balok'); shown=true; if(!hero){ try{ makeHero(); }catch(e){ console.error('Model pembuka gagal dibuat:',e); } }
      else size();
      sync(); makeThumbs();
    },
    hide(){ shown=false; sync(); },
    get running(){ return running; },
    // kait pengujian: requestAnimationFrame berhenti saat tab di latar, jadi giliran model bisa dimajukan langsung
    reel:{get idx(){ return idx; }, get shownFor(){ return shownFor; }, get held(){ return held; }, next:()=>hero&&swap()}
  };
}
