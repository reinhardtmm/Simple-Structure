import {AREA,COL,fmt,spread,turtle,rectCage,lift3D,crosstie2D,ashReq,checker} from '../core.js';

export default {
  id:'dinding', name:'Dinding geser', sysDependent:true,
  sysName:{SRPMB:'dinding biasa',SRPMK:'dinding khusus'},
  sysText:{SRPMB:'Dinding struktural biasa, padanan untuk bangunan dengan risiko gempa rendah. Mengikuti Pasal 11.',SRPMK:'Dinding struktural khusus, wajib sebagai penahan gempa di KDS D sampai F. Mengikuti Pasal 18.10.'},
  defaults:{
    SRPMB:{lw:3000,tw:200,hu:3500,ts:150,curt:1,dbv:10,sv:250,dbh:10,sh:150,be:false,lbe:500,nbe:3,dbe:16,dse:10,sbe:150,fc:25,fy:420,cover:20},
    SRPMK:{lw:3000,tw:300,hu:3500,ts:150,curt:2,dbv:13,sv:200,dbh:13,sh:200,be:true,lbe:600,nbe:3,dbe:19,dse:13,sbe:100,fc:30,fy:420,cover:25}
  },
  schema:[
    ['Geometri',[{k:'lw',label:'Panjang dinding ℓw',unit:'mm',min:1500,max:8000,step:100},{k:'tw',label:'Tebal dinding',unit:'mm',min:150,max:500,step:25},{k:'hu',label:'Tinggi bersih satu lantai',unit:'mm',min:2500,max:5000,step:100},{k:'ts',label:'Tebal pelat lantai',unit:'mm',min:100,max:250,step:10}]],
    ['Tulangan badan',[{k:'curt',label:'Jumlah lapis',opts:[[1,'1 lapis'],[2,'2 lapis']]},{k:'dbv',label:'Diameter vertikal',unit:'D',opts:[10,13,16,19]},{k:'sv',label:'Spasi vertikal',unit:'mm',min:100,max:500,step:5},{k:'dbh',label:'Diameter horizontal',unit:'D',opts:[10,13,16,19]},{k:'sh',label:'Spasi horizontal',unit:'mm',min:100,max:500,step:5}]],
    ['Elemen batas',[{k:'be',label:'Pasang elemen batas di kedua ujung',type:'bool'},{k:'lbe',label:'Panjang elemen batas',unit:'mm',min:300,max:1500,step:25,show:(s,p)=>p.be},{k:'nbe',label:'Tulangan per sisi panjang',unit:'batang',min:2,max:6,show:(s,p)=>p.be},{k:'dbe',label:'Diameter tulangan elemen batas',unit:'D',opts:[16,19,22,25,29],show:(s,p)=>p.be},{k:'dse',label:'Diameter sengkang elemen batas',unit:'D',opts:[10,13,16],show:(s,p)=>p.be},{k:'sbe',label:'Spasi sengkang elemen batas',unit:'mm',min:50,max:300,step:5,show:(s,p)=>p.be}]],
    ['Material',[{k:'fc',label:"Mutu beton fc'",unit:'MPa',opts:[20,25,30,35,40]},{k:'fy',label:'Mutu baja fy',unit:'MPa',opts:[280,420]},{k:'cover',label:'Selimut beton',unit:'mm',min:20,max:50,step:5}]]
  ],
  teori:{
    common:`<h3>Dinding geser (dinding struktural)</h3><p>Dinding geser adalah dinding beton bertulang yang menahan gaya lateral gempa atau angin. Dinding ini sangat kaku di arah panjangnya, sehingga menarik sebagian besar gaya gempa dan membatasi simpangan antar lantai.</p><ul><li><b>Tulangan badan</b> vertikal dan horizontal tersebar merata. Tulangan horizontal terutama menahan geser, tulangan vertikal menahan lentur dan geser.</li><li><b>Dua lapis tulangan</b> dipakai untuk dinding tebal atau dinding yang menerima geser besar, supaya retak terkendali di kedua muka.</li><li><b>Elemen batas</b> adalah bagian ujung dinding yang diberi tulangan vertikal besar dan sengkang rapat seperti kolom. Saat dinding melentur akibat gempa, ujung dinding menerima tekan sangat besar, sehingga betonnya perlu dikekang.</li></ul>`,
    SRPMB:`<h4>Dinding struktural biasa</h4><ul><li><b>Rasio minimum</b> vertikal 0,0012 dan horizontal 0,0020 untuk tulangan D16 ke bawah dengan fy ≥ 420 MPa. Untuk tulangan lebih besar, 0,0015 dan 0,0025 <span class="pasal">11.6.1</span>.</li><li><b>Spasi maksimum</b> 3 kali tebal dinding dan 450 mm <span class="pasal">11.7.2.1, 11.7.3.1</span>.</li><li><b>Dua lapis</b> wajib bila tebal dinding lebih dari 250 mm <span class="pasal">11.7.2.3</span>.</li><li><b>Selimut</b> 20 mm untuk dinding yang tidak terekspos cuaca <span class="pasal">Tabel 20.6.1.3.1</span>.</li></ul><div class="box">Ubah ke dinding khusus dan perhatikan elemen batas di kedua ujung, kenaikan rasio minimum, dan tulangan horizontal yang dikaitkan ke dalam inti elemen batas.</div>`,
    SRPMK:`<h4>Dinding struktural khusus</h4><ul><li><b>Rasio minimum</b> vertikal dan horizontal 0,0025 dengan spasi maksimum 450 mm <span class="pasal">18.10.2.1</span>.</li><li><b>Dua lapis</b> wajib bila hw/ℓw ≥ 2 atau geser terfaktor melebihi 0,17 Acv √fc' <span class="pasal">18.10.2.2</span>.</li><li><b>Kebutuhan elemen batas</b> diperiksa dengan pendekatan perpindahan atau tegangan <span class="pasal">18.10.6.2, 18.10.6.3</span>. Keduanya butuh hasil analisis, sehingga di sini elemen batas dipasang sebagai pilihan.</li><li><b>Detail elemen batas</b>: lebar minimal hu/16 <span class="pasal">18.10.6.4(b)</span>, spasi sengkang tidak lebih dari 1/3 dimensi terkecil, 6db, dan so <span class="pasal">18.10.6.4(e)</span>, luas sengkang menurut Tabel 18.10.6.4(f).</li><li><b>Tulangan horizontal badan</b> diangkur ke dalam inti elemen batas, misalnya dengan kait mengelilingi tulangan vertikal ujung <span class="pasal">18.10.6.4</span>.</li></ul>`
  },
  build(p,sys){
    const K=sys==='SRPMK';
    const {lw,tw,hu,ts,dbv,sv,dbh,sh,be,lbe,nbe,dbe,dse,sbe,fc,fy,cover}=p, curt=Number(p.curt);
    const zH=curt===2?(be?tw/2-cover-dse-dbe-dbh/2:tw/2-cover-dbh/2):dbv/2+dbh/2;
    const zV=curt===2?zH-dbh/2-dbv/2:0;
    const yB=-ts+40, yT=hu+ts+500;
    const bars=[];
    const xa=be?-lw/2+lbe+40:-lw/2+cover+dbh+dbv/2, xb=-xa;
    const vx=spread(xa,xb,sv);
    const iV={t:`Tulangan vertikal badan D${dbv}-${sv}`,b:[`${curt} lapis. Menahan lentur dan geser, diteruskan ke lantai berikutnya.`],pasal:K?'Pasal 18.10.2.1':'Pasal 11.6.1'};
    const zVs=curt===2?[-zV,zV]:[0];
    vx.forEach(x=>zVs.forEach(z=>bars.push({pts:[[x,yB,z],[x,yT,z]],d:dbv,layer:'vert',color:COL.long,info:iV})));
    const xe=be?lw/2-cover-dse-dbe/2:lw/2-cover-dbh/2, r=3*dbh, tail=curt===2?Math.min(12*dbh,2*zH-2*r-dbh):0;
    const iH={t:`Tulangan horizontal badan D${dbh}-${sh}`,b:['Menahan geser dinding.',curt===2?(be?'Ujungnya dikaitkan ke dalam inti elemen batas.':'Ujung dibengkokkan ke arah lapis seberang.'):'Satu lapis di tengah tebal dinding.'],pasal:K?'Pasal 18.10.2.1, 18.10.6.4':'Pasal 11.6.1'};
    const hys=spread(60,hu-60,sh);
    hys.forEach(y=>{
      if(curt===2){ [1,-1].forEach(sg=>{ const t=turtle(-xe,sg*(zH-r-tail),sg>0?Math.PI/2:-Math.PI/2); t.fwd(tail).turn(sg>0?-90:90,r).fwd(2*xe-2*r).turn(sg>0?-90:90,r).fwd(tail); bars.push({pts:t.pts.map(([x,z])=>[x,y,z]),d:dbh,layer:'horz',color:COL.webH,info:iH}); }); }
      else bars.push({pts:[[-xe,y,zH],[xe,y,zH]],d:dbh,layer:'horz',color:COL.webH,info:iH});
    });
    // kait silang badan (praktik)
    if(curt===2){ const iX={t:`Kait silang badan D10`,b:['Mengikat kedua lapis tulangan badan. Wajib bila tulangan vertikal lebih dari 0,01 Ag. Di bawah batas itu, kait silang dipasang sebagai praktik untuk menjaga jarak antar lapis.'],pasal:'Pasal 11.7.4.1'};
      vx.forEach((x,i)=>{ if(i%2) return; hys.forEach((y,j)=>{ if(j%2!==(i/2)%2) return; const t=crosstie2D(x,-zV,zV,(dbv+10)/2,75,j%4===0); bars.push({pts:t.map(([u,v])=>[u,y+dbh,v]),d:10,layer:'tiesWeb',color:COL.tie,info:iX}); }); }); }
    // elemen batas
    let cg=null;
    if(be){
      cg=rectCage({B:lbe,H:tw,cover,ds:dse,db:dbe,nu:nbe,nv:2,hook:135,allSup:true});
      const iB={t:`Tulangan elemen batas ${cg.pos.length}D${dbe}`,b:['Menahan tekan dan tarik besar di ujung dinding saat dinding melentur akibat gempa.'],pasal:'Pasal 18.10.6'};
      const iS={t:`Sengkang elemen batas D${dse}-${sbe}`,b:['Mengekang beton di ujung dinding seperti sengkang kolom SRPMK.'],pasal:'Pasal 18.10.6.4'};
      const iT={t:`Kait silang elemen batas D${dse}`,b:['Menumpu tulangan tengah elemen batas.'],pasal:'Pasal 18.10.6.4'};
      [-1,1].forEach(sg=>{ const xc=sg*(lw/2-lbe/2);
        cg.pos.forEach(([u,v])=>bars.push({pts:[[xc+u,yB,v],[xc+u,yT,v]],d:dbe,layer:'beVert',color:COL.top,info:iB}));
        spread(50,hu-50,sbe).forEach(y=>{ bars.push({pts:lift3D(cg.hoop,(u,v,w)=>[xc+u,y+w,v],dse*1.05),d:dse,layer:'beHoop',color:COL.conf,info:iS}); cg.ties.forEach(t=>bars.push({pts:t.pts.map(([u,v])=>[xc+u,y+dse*1.1,v]),d:dse,layer:'beHoop',color:COL.tie,info:iT})); });
      });
    }
    const concrete=[{box:[-lw/2,lw/2,0,hu,-tw/2,tw/2]},{box:[-lw/2-400,lw/2+400,-ts,0,-900,900],kind:'stub'},{box:[-lw/2-400,lw/2+400,hu,hu+ts,-900,900],kind:'stub'}];
    const zones=be?[-1,1].map(sg=>({box:[sg>0?lw/2-lbe:-lw/2-15,sg>0?lw/2+15:-lw/2+lbe,0,hu,-tw/2-15,tw/2+15],color:COL.conf})):[];
    const labels=[{p:[0,hu+ts+80,0],t:`ℓw = ${fmt(lw)} mm`},...(be?[{p:[lw/2-lbe/2,hu/2,tw/2+60],t:`elemen batas ${fmt(lbe)} mm`,c:'conf'}]:[])];
    // pemeriksaan
    const rl=(curt*AREA[dbv]/sv)/tw, rt=(curt*AREA[dbh]/sh)/tw;
    const {C,add}=checker();
    add(cover>=20,'Selimut beton',`${cover} mm ≥ 20 mm`,'Tabel 20.6.1.3.1');
    if(K){
      add(rl>=0.0025,'Rasio tulangan vertikal ρℓ',`${fmt(rl*100,3)}% ≥ 0,25%`,'Pasal 18.10.2.1');
      add(rt>=0.0025,'Rasio tulangan horizontal ρt',`${fmt(rt*100,3)}% ≥ 0,25%`,'Pasal 18.10.2.1');
      add(sv<=450&&sh<=450,'Spasi tulangan badan',`vertikal ${sv}, horizontal ${sh} mm ≤ 450 mm`,'Pasal 18.10.2.1');
      add(curt===2?true:null,'Jumlah lapis tulangan',curt===2?'dua lapis':'satu lapis. Dua lapis wajib bila hw/ℓw ≥ 2 atau Vu > 0,17 Acv √fc\'','Pasal 18.10.2.2');
      if(be){
        add(tw>=hu/16,'Lebar elemen batas',`${tw} mm ≥ hu/16 = ${fmt(hu/16)} mm`,'Pasal 18.10.6.4(b)');
        add(cg.hx<=350,'Jarak hx tulangan elemen batas',`${fmt(cg.hx)} mm ≤ 350 mm`,'Pasal 18.10.6.4');
        const so=Math.min(150,Math.max(100,100+(350-cg.hx)/3)), sm=Math.min(tw/3,6*dbe,so);
        add(sbe<=sm+0.5,'Spasi sengkang elemen batas',`${sbe} mm ≤ min(b/3; 6db; so) = ${fmt(sm)} mm`,'Pasal 18.10.6.4(e)');
        const bcx=lbe-2*cover, bcz=tw-2*cover, Ag=lbe*tw, Ach=bcx*bcz;
        const rX=ashReq(sbe,bcx,fc,fy,Ag,Ach), rZ=ashReq(sbe,bcz,fc,fy,Ag,Ach), pX=(2+cg.nTieV)*AREA[dse], pZ=2*AREA[dse];
        add(pX>=rX&&pZ>=rZ,'Luas sengkang elemen batas Ash',`arah ℓw: ${2+cg.nTieV} kaki = ${fmt(pX)} ≥ ${fmt(rX)} mm²; arah tebal: 2 kaki = ${fmt(pZ)} ≥ ${fmt(rZ)} mm²`,'Tabel 18.10.6.4(f)');
        add(null,'Panjang elemen batas',`${fmt(lbe)} mm. Syaratnya maks(c − 0,1ℓw; c/2) dengan c dari analisis penampang`,'Pasal 18.10.6.4(a)');
        add(true,'Angkur tulangan horizontal','dikaitkan di dalam inti elemen batas','Pasal 18.10.6.4');
      } else add(null,'Kebutuhan elemen batas','tidak dipasang. Periksa kebutuhannya dengan Pasal 18.10.6.2 atau 18.10.6.3','Pasal 18.10.6.2');
    } else {
      const rlm=(dbv<=16&&fy>=420)?0.0012:0.0015, rtm=(dbh<=16&&fy>=420)?0.0020:0.0025, sm=Math.min(3*tw,450);
      add(rl>=rlm,'Rasio tulangan vertikal ρℓ',`${fmt(rl*100,3)}% ≥ ${fmt(rlm*100,2)}%`,'Pasal 11.6.1');
      add(rt>=rtm,'Rasio tulangan horizontal ρt',`${fmt(rt*100,3)}% ≥ ${fmt(rtm*100,2)}%`,'Pasal 11.6.1');
      add(sv<=sm&&sh<=sm,'Spasi tulangan',`vertikal ${sv}, horizontal ${sh} mm ≤ min(3h; 450) = ${fmt(sm)} mm`,'Pasal 11.7.2.1, 11.7.3.1');
      add(tw<=250||curt===2,'Jumlah lapis tulangan',`tebal ${tw} mm, ${curt} lapis${tw>250?' (wajib dua lapis karena tebal > 250 mm)':''}`,'Pasal 11.7.2.3');
    }
    const yS=be?spread(50,hu-50,sbe)[8]:hys[5];
    const views=[
      {title:'Potongan horizontal dinding',sub:`badan ${curt}×D${dbv}-${sv} vertikal, D${dbh}-${sh} horizontal`,n:'y',at:yS+Math.max(dse,dbh)*0.8,half:Math.max(dse,dbh)*1.8,u:'x',v:'z',skipStub:true,maxH:200,dims:[{a:[-lw/2,-tw/2],b:[lw/2,-tw/2],off:-14,t:`ℓw = ${fmt(lw)}`},...(be?[{a:[lw/2-lbe,tw/2],b:[lw/2,tw/2],off:12,t:`${fmt(lbe)}`,c:COL.conf}]:[])]},
      {title:'Tampak muka (lapis depan)',n:'z',at:curt===2?-(zH+zV)/2:0,half:curt===2?(zH-zV)/2+dbh*1.2+(be?tw/2:0):dbh*2,u:'x',v:'y',maxH:420,dims:[{a:[lw/2+400,0],b:[lw/2+400,hu],off:12,t:`${fmt(hu)}`}]}
    ];
    const layers=[{k:'vert',label:'Vertikal badan',color:COL.long,ex:[0,0,0]},{k:'horz',label:'Horizontal badan',color:COL.webH,ex:[0,0,-700]},...(curt===2?[{k:'tiesWeb',label:'Kait silang badan',color:COL.tie,ex:[0,0,700]}]:[]),...(be?[{k:'beVert',label:'Tulangan elemen batas',color:COL.top,ex:[0,500,0]},{k:'beHoop',label:'Sengkang elemen batas',color:COL.conf,ex:[0,500,0]}]:[])];
    return {layers,betonEx:[0,0,-2600],concrete,zones,bars,labels,views,checks:C,camDir:[0.45,0.35,0.9],camK:0.95,cutAxis:'x',
      derived:`ρℓ = <b>${fmt(rl*100,3)}%</b>, ρt = <b>${fmt(rt*100,3)}%</b><br>jumlah lapis = <b>${curt}</b><br>${be?`hx elemen batas = <b>${fmt(cg.hx)}</b> mm<br>`:''}hu/16 = <b>${fmt(hu/16)}</b> mm`};
  }
};
