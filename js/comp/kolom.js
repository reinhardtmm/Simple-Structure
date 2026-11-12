import {AREA,DIAS,COL,fmt,up50,devLen,fill,checker,rectCage,lift3D,ashReq,DAGG} from '../core.js';

export default {
  id:'kolom', name:'Kolom', sysDependent:true,
  defaults:{
    SRPMB:{bx:400,by:400,H:3500,hb:500,nx:3,ny:3,db:16,ds:10,sLo:150,sMid:200,fc:30,fy:420,cover:40,lap:true},
    SRPMK:{bx:500,by:500,H:3500,hb:500,nx:4,ny:4,db:19,ds:13,sLo:100,sMid:110,fc:30,fy:420,cover:40,lap:true}
  },
  schema:[
    ['Penampang',[{k:'bx',label:'Lebar bx',unit:'mm',min:200,max:1000,step:25},{k:'by',label:'Lebar bz',unit:'mm',min:200,max:1000,step:25},{k:'H',label:'Tinggi bersih ℓu',unit:'mm',min:2000,max:6000,step:100},{k:'hb',label:'Tinggi balok di HBK',unit:'mm',min:300,max:1000,step:25}]],
    ['Tulangan',[{k:'nx',label:'Tulangan per sisi arah x',unit:'batang',min:2,max:8},{k:'ny',label:'Tulangan per sisi arah z',unit:'batang',min:2,max:8},{k:'db',label:'Diameter longitudinal',unit:'D',opts:DIAS},{k:'ds',label:'Diameter sengkang',unit:'D',opts:[10,13,16]},
      {k:'sLo',label:'Spasi sengkang di ℓo',unit:'mm',min:50,max:300,step:5,show:s=>s==='SRPMK'},{k:'sMid',label:s=>s==='SRPMK'?'Spasi sengkang lainnya':'Spasi sengkang',unit:'mm',min:50,max:400,step:5}]],
    ['Material',[{k:'fc',label:"Mutu beton fc'",unit:'MPa',opts:[20,25,30,35,40]},{k:'fy',label:'Mutu baja fy',unit:'MPa',opts:[280,420]},{k:'cover',label:'Selimut beton',unit:'mm',min:20,max:75,step:5},{k:'lap',label:'Tampilkan sambungan lewatan',type:'bool'}]]
  ],
  teori:{
    common:`<h3>Kolom beton bertulang</h3><p>Kolom menyalurkan beban aksial dan momen dari balok ke fondasi. Kegagalan kolom bisa memicu keruntuhan bertingkat, sehingga kolom diperlakukan sebagai elemen paling kritis.</p><ul><li><b>Tulangan longitudinal</b> menahan aksial dan lentur. Rasio ρg dibatasi agar ada daktilitas minimum dan beton masih bisa dicor dengan baik.</li><li><b>Sengkang</b> menahan tulangan longitudinal agar tidak menekuk, menahan geser, dan mengekang inti beton.</li><li><b>Kait silang</b> menumpu tulangan di tengah sisi. Satu ujungnya 135° dan ujung lainnya 90°, diselang-seling antar lapis.</li></ul>`,
    SRPMB:`<h4>Detailing SRPMB</h4><ul><li>Rasio tulangan 1% sampai 8% <span class="pasal">10.6.1.1</span>. Dalam praktik, rasio di atas 4% menyulitkan pengecoran di daerah sambungan.</li><li>Spasi sengkang maksimum adalah nilai terkecil dari 16db, 48ds, dan dimensi terkecil kolom <span class="pasal">25.7.2.1</span>.</li><li>Setiap tulangan sudut dan tulangan berselang harus ditumpu sudut sengkang atau kait silang. Tulangan yang tidak ditumpu maksimal berjarak bersih 150 mm dari tulangan yang ditumpu <span class="pasal">25.7.2.3</span>.</li><li>Sambungan lewatan biasanya diletakkan tepat di atas lantai karena memudahkan pelaksanaan. Panjangnya dihitung sebagai lewatan tekan <span class="pasal">25.5.5.1</span>.</li></ul><div class="box">Ubah ke SRPMK dan bandingkan. Lewatan pindah ke tengah tinggi kolom, muncul daerah ℓo, dan sengkang diteruskan ke dalam joint.</div>`,
    SRPMK:`<h4>Detailing SRPMK</h4><p>Kolom SRPMK harus tetap utuh walaupun ujung balok sudah meleleh. Namun ujung kolom tetap disiapkan untuk berdeformasi inelastis, misalnya di dasar kolom lantai pertama.</p><ul><li><b>Dimensi</b> terkecil minimal 300 mm dan rasio sisi pendek terhadap sisi panjang minimal 0,4 <span class="pasal">18.7.2.1</span>.</li><li><b>Rasio tulangan</b> 1% sampai 6% <span class="pasal">18.7.4.1</span>.</li><li><b>Daerah ℓo</b> diukur dari tiap muka joint dengan panjang maks(h; ℓu/6; 450 mm) <span class="pasal">18.7.5.1</span>.</li><li><b>Spasi di ℓo</b> tidak lebih dari b/4, 6db, dan so. Nilai so = 100 + (350 − hx)/3, dibatasi antara 100 dan 150 mm <span class="pasal">18.7.5.3</span>.</li><li><b>Luas pengekang Ash</b> dihitung terhadap rasio Ag/Ach. Semakin tebal selimut dibanding inti, semakin banyak tulangan pengekang yang dibutuhkan. Bila Pu > 0,3Ag fc' atau fc' > 70 MPa, ada syarat tambahan 0,2 kf kn Pu/(fyt Ach) <span class="pasal">Tabel 18.7.5.4</span>, dan setiap tulangan longitudinal harus ditumpu dengan hx ≤ 200 mm <span class="pasal">18.7.5.2(f)</span>.</li><li><b>hx</b>, jarak antar tulangan yang ditumpu, maksimal 350 mm <span class="pasal">18.7.5.2</span>. Model ini menumpu setiap tulangan sebagai praktik konservatif.</li><li><b>Sambungan lewatan</b> hanya di setengah tinggi bagian tengah kolom dan dihitung sebagai lewatan tarik <span class="pasal">18.7.4.3</span>.</li><li><b>Sengkang di dalam joint</b> tetap dipasang <span class="pasal">18.8.3.1</span>.</li></ul>`
  },
  build(p,sys){
    const K=sys==='SRPMK';
    const {bx,by,H,hb,nx,ny,db,ds,fc,fy,cover}=p;
    const cg=rectCage({B:bx,H:by,cover,ds,db,nu:nx,nv:ny,hook:K?135:90,allSup:K});
    const {pos,ties,hx,hoop,ext}=cg;
    const nBar=pos.length, bmin=Math.min(bx,by), bmax=Math.max(bx,by);
    const lo=K?up50(Math.max(bmax,H/6,450)):0;
    const so=Math.min(150,Math.max(100,100+(350-hx)/3));
    const sMaxLo=Math.min(bmin/4,6*db,so), sMaxMid=K?Math.min(6*db,150):Math.min(16*db,48*ds,bmin);
    const ld=devLen(fy,fc,db,1.0);
    const lapLen=K?up50(1.3*ld):up50(Math.max(0.071*fy*db,300));
    const lapS=K?H/2-lapLen/2:0, lapE=lapS+lapLen;
    const st=[];
    if(K){
      const B=[],T=[];
      for(let y=50;y<=lo+1e-6;y+=p.sLo) B.push(y);
      for(let y=H-50;y>=H-lo-1e-6;y-=p.sLo) T.push(y);
      B.forEach(y=>st.push({y,z:'conf'}));
      const Bl=B.at(-1), Tf=T.at(-1);
      const ok=p.lap&&lapS>Bl&&lapE<Tf;
      const segs=ok?[[Bl,lapS,p.sMid,'mid'],[lapS,lapE,p.sLo,'lap'],[lapE,Tf,p.sMid,'mid']]:[[Bl,Tf,p.sMid,'mid']];
      segs.forEach(([a,c,s,z],i)=>{ let ps=fill(a,c,s).pos; if(i===segs.length-1) ps=ps.slice(0,-1); ps.forEach(y=>st.push({y,z})); });
      T.slice().reverse().forEach(y=>st.push({y,z:'conf'}));
      for(let y=-50;y>=-hb+50-1e-6;y-=p.sLo) st.push({y,z:'joint'});
      for(let y=H+50;y<=H+hb-50+1e-6;y+=p.sLo) st.push({y,z:'joint'});
    } else { st.push({y:50,z:'mid'}); fill(0,H-50,p.sMid).pos.forEach(y=>{ if(y>51) st.push({y,z:'mid'}); }); }
    st.sort((a,c)=>a.y-c.y);
    const lapOn=p.lap&&(K?(lapS>lo&&lapE<H-lo):true);
    const yBot=-hb-350, yTop=H+hb+350;
    const rho=nBar*AREA[db]/(bx*by);
    const iL={t:`Tulangan longitudinal ${nBar}D${db}`,b:[`ρg = ${fmt(rho*100,2)}%. Menahan beban aksial dan momen.`,p.lap?(K?`Disambung lewatan ${fmt(lapLen)} mm di setengah tinggi tengah kolom, jauh dari daerah sendi plastis.`:`Disambung lewatan ${fmt(lapLen)} mm tepat di atas lantai. Ini praktik umum karena memudahkan pelaksanaan.`):''],pasal:K?'Pasal 18.7.4':'Pasal 10.6, 10.7'};
    const bars=[];
    pos.forEach(([x,z])=>{
      if(p.lap){ const L=Math.hypot(x,z), ix=x-x/L*db, iz=z-z/L*db;
        bars.push({pts:[[x,yBot,z],[x,lapE,z]],d:db,layer:'long',color:COL.long,info:iL});
        bars.push({pts:[[ix,lapS,iz],[ix,yTop,iz]],d:db,layer:'long',color:COL.long,info:{...iL,b:[...iL.b,'Batang atas dikrep ke dalam agar bisa bersebelahan dengan batang bawah.']}});
      } else bars.push({pts:[[x,yBot,z],[x,yTop,z]],d:db,layer:'long',color:COL.long,info:iL});
    });
    const tieInfo={t:`Kait silang (crosstie) D${ds}`,b:['Menumpu tulangan longitudinal di tengah sisi. Satu ujung kait 135°, ujung lain 90°, diselang-seling antar kait silang yang berurutan.',K?`Membuat hx = ${fmt(hx)} mm ≤ 350 mm dan menambah luas Ash.`:'Diperlukan agar tidak ada tulangan tak tertumpu yang berjarak bersih lebih dari 150 mm dari tulangan tertumpu.'],pasal:K?'Pasal 18.7.5.2':'Pasal 25.7.2.3'};
    st.forEach(s=>{
      const zt=s.z==='conf'?`daerah ℓo, s = ${fmt(p.sLo)} mm`:s.z==='lap'?`daerah lewatan, s = ${fmt(p.sLo)} mm`:s.z==='joint'?'di dalam hubungan balok-kolom':`s = ${fmt(p.sMid)} mm`;
      bars.push({pts:lift3D(hoop,(u,v,w)=>[u,s.y+w,v],ds*1.05),d:ds,layer:'sengkang',color:COL[s.z],info:{t:K?`Sengkang tertutup (hoop) D${ds}`:`Sengkang D${ds}`,b:[`Posisi y = ${fmt(s.y)} mm dari muka atas lantai bawah, ${zt}.`,K?'Mengekang inti beton dan mencegah tekuk tulangan longitudinal saat sendi plastis terbentuk.':'Fungsi utama menahan tekuk tulangan longitudinal dan menahan geser.'],pasal:K?(s.z==='joint'?'Pasal 18.8.3':'Pasal 18.7.5'):'Pasal 25.7.2'}});
      ties.forEach(t=>bars.push({pts:t.pts.map(([u,v])=>[u,s.y+ds*1.1,v]),d:ds,layer:'ties',color:COL.tie,info:tieInfo}));
    });
    const jw=bx+300, jd=by+300;
    const concrete=[{box:[-bx/2,bx/2,0,H,-by/2,by/2]},{box:[-jw/2,jw/2,-hb,0,-jd/2,jd/2],kind:'stub'},{box:[-jw/2,jw/2,H,H+hb,-jd/2,jd/2],kind:'stub'}];
    const zb=(y0,y1,c)=>({box:[-bx/2-15,bx/2+15,y0,y1,-by/2-15,by/2+15],color:c});
    const zones=[]; if(K){ zones.push(zb(0,lo,COL.conf),zb(H-lo,H,COL.conf)); } if(lapOn) zones.push(zb(lapS,lapE,COL.lap));
    const labels=[{p:[bx/2+160,H/2,0],t:`ℓu = ${fmt(H)} mm`}];
    if(K){ labels.push({p:[bx/2+120,lo/2,0],t:`ℓo = ${fmt(lo)} mm`,c:'conf'},{p:[bx/2+120,H-lo/2,0],t:`ℓo = ${fmt(lo)} mm`,c:'conf'},{p:[jw/2+60,-hb/2,0],t:'HBK'},{p:[jw/2+60,H+hb/2,0],t:'HBK'}); }
    if(lapOn) labels.push({p:[-bx/2-120,lapS+lapLen/2,0],t:`lewatan ${fmt(lapLen)} mm`,c:'lap'});
    const sA=st.filter(s=>s.z==='conf')[1]||st[1], sB=st.filter(s=>s.z==='mid')[1]||st[1];
    const sec=(t,s,sp)=>({title:t,sub:`${nBar}D${db} / D${ds}-${fmt(sp)}`,n:'y',at:s.y+ds*0.9,half:ds*1.6,u:'x',v:'z',w2:K,maxH:300,dims:[{a:[-bx/2,-by/2],b:[bx/2,-by/2],off:-16,t:fmt(bx)},{a:[-bx/2,-by/2],b:[-bx/2,by/2],off:-16,t:fmt(by)}]});
    const views=K?[sec('Potongan A, daerah ℓo',sA,p.sLo),sec('Potongan B, luar ℓo',sB,p.sMid)]:[sec('Potongan tipikal',sB,p.sMid)];
    views.push({title:'Tampak memanjang (potongan di muka depan)',n:'z',at:-cg.av,half:db*1.6,u:'x',v:'y',maxH:520,
      dims:[{a:[jw/2,0],b:[jw/2,H],off:44,t:`ℓu = ${fmt(H)}`},...(K?[{a:[jw/2,0],b:[jw/2,lo],off:20,t:`ℓo=${fmt(lo)}`,c:COL.conf},{a:[jw/2,H-lo],b:[jw/2,H],off:20,t:`ℓo=${fmt(lo)}`,c:COL.conf}]:[]),...(lapOn?[{a:[-jw/2,lapS],b:[-jw/2,lapE],off:-12,t:`lewatan ${fmt(lapLen)}`,c:COL.lap}]:[])]});
    // pemeriksaan
    const clrX=nx>1?(cg.us[1]-cg.us[0])-db:Infinity, clrZ=ny>1?(cg.vs[1]-cg.vs[0])-db:Infinity, clrReq=Math.max(40,1.5*db,4/3*DAGG);
    const maxS=z=>{let m=0; for(let i=1;i<st.length;i++) if(st[i].z===z&&st[i-1].z===z) m=Math.max(m,st[i].y-st[i-1].y); return m;};
    const {C,add}=checker();
    add(cover>=40,'Selimut beton',`${cover} mm ≥ 40 mm`,'Tabel 20.6.1.3.1');
    add(nBar>=4,'Jumlah tulangan longitudinal',`${nBar} batang ≥ 4 (sengkang persegi)`,'Pasal 10.7.3.1');
    add(Math.min(clrX,clrZ)>=clrReq,'Spasi bersih tulangan longitudinal',`${fmt(Math.min(clrX,clrZ))} mm ≥ maks(40; 1,5db; 4/3·dagg) = ${fmt(clrReq,1)} mm`,'Pasal 25.2.3');
    add(ds>=(db<=32?10:13),'Diameter sengkang',`D${ds} ≥ D${db<=32?10:13} untuk tulangan D${db}`,'Pasal 25.7.2.2');
    if(K){
      add(bmin>=300,'Dimensi penampang terkecil',`${bmin} mm ≥ 300 mm`,'Pasal 18.7.2.1(a)');
      add(bmin/bmax>=0.4,'Rasio dimensi penampang',`${fmt(bmin/bmax,2)} ≥ 0,4`,'Pasal 18.7.2.1(b)');
      add(rho>=0.01&&rho<=0.06,'Rasio tulangan ρg',`${fmt(rho*100,2)}% (batas 1% sampai 6%)`,'Pasal 18.7.4.1');
      add(null,'Panjang daerah ℓo',`ℓo = maks(h; ℓu/6; 450) = ${fmt(lo)} mm dari tiap muka HBK`,'Pasal 18.7.5.1');
      add(hx<=350,'Jarak hx tulangan yang ditumpu',`hx = ${fmt(hx)} mm ≤ 350 mm`,'Pasal 18.7.5.2');
      add(maxS('conf')<=sMaxLo+0.5,'Spasi sengkang di ℓo',`s = ${fmt(maxS('conf'))} mm ≤ min(b/4; 6db; so) = ${fmt(sMaxLo)} mm, so = ${fmt(so)} mm`,'Pasal 18.7.5.3');
      const bcx=bx-2*cover, bcz=by-2*cover, Ag=bx*by, Ach=bcx*bcz;
      const provX=(2+cg.nTieV)*AREA[ds], provZ=(2+cg.nTieU)*AREA[ds], rX=ashReq(p.sLo,bcx,fc,fy,Ag,Ach), rZ=ashReq(p.sLo,bcz,fc,fy,Ag,Ach);
      add(provX>=rX&&provZ>=rZ,'Luas tulangan pengekang Ash',`arah x: ${2+cg.nTieV} kaki = ${fmt(provX)} ≥ ${fmt(rX)} mm²; arah z: ${2+cg.nTieU} kaki = ${fmt(provZ)} ≥ ${fmt(rZ)} mm². Memakai baris (a) dan (b), dengan anggapan Pu ≤ 0,3Ag fc' dan fc' ≤ 70 MPa. Bila Pu lebih besar, baris (c) dengan faktor kf dan kn ikut menentukan, setiap tulangan harus ditumpu, dan hx ≤ 200 mm`,'Tabel 18.7.5.4, 18.7.5.2(f)');
      add(maxS('mid')<=sMaxMid+0.5,'Spasi sengkang di luar ℓo',`s = ${fmt(maxS('mid'))} mm ≤ min(6db; 150) = ${fmt(sMaxMid)} mm`,'Pasal 18.7.5.5');
      if(p.lap) add(lapOn,'Sambungan lewatan di setengah tinggi tengah',`lewatan tarik 1,3ℓd = ${fmt(lapLen)} mm pada ${fmt(lapS)} s.d. ${fmt(lapE)} mm, sengkang mengikuti spasi ℓo`,'Pasal 18.7.4.3');
      add(null,'Tulangan transversal di HBK',`sengkang diteruskan di dalam joint dengan spasi ${fmt(p.sLo)} mm`,'Pasal 18.8.3.1');
      add(null,'Kait gempa 135° dan kait silang',`perpanjangan ${fmt(ext)} mm; kait silang berurutan diselang-seling ujung 90° dan 135°`,'Pasal 25.3.4, 18.7.5.2');
    } else {
      add(rho>=0.01&&rho<=0.08,'Rasio tulangan ρg',`${fmt(rho*100,2)}% (batas 1% sampai 8%)`,'Pasal 10.6.1.1');
      add(maxS('mid')<=sMaxMid+0.5,'Spasi sengkang',`s = ${fmt(maxS('mid'))} mm ≤ min(16db; 48ds; b) = ${fmt(sMaxMid)} mm`,'Pasal 25.7.2.1');
      add(true,'Tumpuan lateral tulangan','setiap sudut dan tulangan berselang ditumpu, jarak bersih tak tertumpu ≤ 150 mm','Pasal 25.7.2.3');
      if(p.lap) add(null,'Sambungan lewatan tekan',`ℓ = maks(0,071 fy db; 300) = ${fmt(lapLen)} mm, tepat di atas lantai (praktik umum)`,'Pasal 25.5.5.1');
      add(null,'Kait sengkang 90°',`perpanjangan ${fmt(ext)} mm. Kait 135° tetap dianjurkan`,'Pasal 25.3.2');
    }
    const derived=`jumlah tulangan = <b>${nBar}D${db}</b>, ρg = <b>${fmt(rho*100,2)}%</b><br>${K?`ℓo = <b>${fmt(lo)}</b> mm, hx = <b>${fmt(hx)}</b> mm, so = <b>${fmt(so)}</b> mm<br>s maks ℓo = <b>${fmt(sMaxLo)}</b> mm, s maks lainnya = <b>${fmt(sMaxMid)}</b> mm<br>`:`s maks = <b>${fmt(sMaxMid)}</b> mm<br>`}panjang lewatan = <b>${fmt(lapLen)}</b> mm<br>kait silang per lapis = <b>${ties.length}</b><br>jumlah sengkang = <b>${st.length}</b>`;
    const layers=[{k:'long',label:'Tulangan longitudinal',color:COL.long,ex:[0,0,0]},{k:'sengkang',label:K?'Sengkang (hoop)':'Sengkang',color:K?COL.conf:COL.mid,ex:[0,0,0]},{k:'ties',label:'Kait silang',color:COL.tie,ex:[0,0,by*1.4]}];
    return {layers,betonEx:[-bx*2.6,0,0],concrete,zones,bars,labels,views,checks:C,derived,camDir:[0.62,0.25,0.75],camK:1.05,cutAxis:'y',
      colorNote:K?`Warna sengkang: <b style="color:${COL.conf}">hijau</b> ℓo dan HBK, <b style="color:${COL.mid}">biru</b> daerah biasa, <b style="color:${COL.lap}">kuning</b> lewatan.`:''};
  }
};
