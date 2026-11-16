import {AREA,COL,fmt,up50,spread,devLen,ldhSeis,hoop2D,rectCage,lift3D,ashReq,checker,KAIT_FIELD,hookOf} from '../core.js';

/* Balok perangkai (balok kopel) di antara dua dinding geser.
   Rujukan SNI 2847:2019 Pasal 18.10.7 dan Gambar R18.10.7:
   - ℓn/h ≥ 4: penulangan konvensional menurut 18.6 (18.10.7.1).
   - ℓn/h < 2 dan Vu > 0,33√fc' Acw: dua grup tulangan diagonal (18.10.7.2). Di antaranya boleh salah satu (18.10.7.3).
   - Tulangan diagonal (18.10.7.4): (a) Vn = 2 Avd fy sin α ≤ 0,83√fc' Acw; (b) tiap grup ≥ 4 batang dalam ≥ 2 lapis, tertanam
     ≥ 1,25 ℓd ke dalam dinding; lalu (c) setiap grup dikekang sendiri ditambah tulangan keliling 0,002 bw s, atau (d) seluruh
     penampang balok dikekang.
   Untuk dinding biasa, 18.10.7 tidak berlaku: balok didetail menurut Pasal 9, dan menjadi balok tinggi bila ℓn ≤ 4h (9.9).
   Sumbu: x sepanjang balok dari muka dinding kiri (0) ke muka dinding kanan (ℓn), y dari sisi bawah balok, z arah tebal. */
export default {
  id:'balokkopel', name:'Balok perangkai (kopel)', sysDependent:true, noCombo:true,
  sysName:{SRPMB:'dinding biasa',SRPMK:'dinding khusus'},
  sysText:{SRPMB:'Balok perangkai pada dinding struktural biasa. Mengikuti Pasal 9, termasuk syarat balok tinggi bila bentangnya pendek.',SRPMK:'Balok perangkai pada dinding struktural khusus (KDS D sampai F). Mengikuti Pasal 18.10.7.'},
  defaults:{
    SRPMB:{ln:2000,h:700,bw:300,detail:'konv',nd:4,dbd:19,ds:10,s:125,s2:150,nl:3,dbl:19,sl:125,sp:150,fc:25,fy:420,cover:40,kait:90},
    SRPMK:{ln:1800,h:1000,bw:500,detail:'diag',nd:8,dbd:25,ds:16,s:70,s2:150,nl:4,dbl:16,sl:200,sp:150,fc:30,fy:420,cover:40}
  },
  schema:[
    ['Geometri',[{k:'ln',label:'Bentang bersih ℓn',unit:'mm',min:800,max:6000,step:50},{k:'h',label:'Tinggi balok h',unit:'mm',min:400,max:2000,step:25},{k:'bw',label:'Lebar balok bw (tebal dinding)',unit:'mm',min:200,max:800,step:25},{k:'detail',label:'Jenis penulangan',opts:[['diag','Diagonal, tiap grup dikekang'],['penuh','Diagonal, seluruh penampang dikekang'],['konv','Konvensional']],show:s=>s==='SRPMK'}]],
    ['Tulangan utama',[{k:'nd',label:'Jumlah batang per grup',opts:[[4,'4 batang'],[6,'6 batang'],[8,'8 batang']],show:(s,p)=>s==='SRPMK'&&p.detail!=='konv'},{k:'dbd',label:'Diameter tulangan diagonal',unit:'D',opts:[16,19,22,25,29,32],show:(s,p)=>s==='SRPMK'&&p.detail!=='konv'},{k:'nl',label:'Jumlah tulangan atas dan bawah',unit:'batang',min:2,max:8,show:(s,p)=>s!=='SRPMK'||p.detail==='konv'},{k:'dbl',label:(s,p)=>s==='SRPMK'&&p.detail!=='konv'?'Diameter tulangan keliling':'Diameter tulangan longitudinal',unit:'D',opts:[10,13,16,19,22,25]},
      {k:'sl',label:(s,p)=>s==='SRPMK'&&p.detail==='diag'?'Spasi tulangan longitudinal keliling':'Spasi tulangan badan (sisi)',unit:'mm',min:75,max:400,step:5,show:(s,p)=>!(s==='SRPMK'&&p.detail==='penuh')}]],
    ['Tulangan transversal',[{k:'ds',label:(s,p)=>s==='SRPMK'&&p.detail==='diag'?'Diameter sengkang grup diagonal':'Diameter sengkang',unit:'D',opts:[10,13,16]},{k:'s',label:(s,p)=>s==='SRPMK'&&p.detail==='diag'?'Spasi sengkang grup (sejajar diagonal)':s==='SRPMK'&&p.detail==='konv'?'Spasi sengkang di daerah 2h':'Spasi sengkang',unit:'mm',min:50,max:300,step:5},
      {k:'s2',label:'Spasi sengkang di luar 2h',unit:'mm',min:50,max:400,step:5,show:(s,p)=>s==='SRPMK'&&p.detail==='konv'},{k:'sp',label:'Spasi sengkang keliling balok',unit:'mm',min:75,max:400,step:5,show:(s,p)=>s==='SRPMK'&&p.detail==='diag'},KAIT_FIELD]],
    ['Material',[{k:'fc',label:"Mutu beton fc'",unit:'MPa',opts:[25,30,35,40]},{k:'fy',label:'Mutu baja fy',unit:'MPa',opts:[280,420]},{k:'cover',label:'Selimut beton',unit:'mm',min:25,max:60,step:5}]]
  ],
  teori:{
    common:`<h3>Balok perangkai (balok kopel)</h3><p>Balok perangkai menghubungkan dua dinding geser yang berdampingan, misalnya di atas bukaan pintu pada dinding inti lift. Saat gempa, kedua dinding melentur dan ujung balok dipaksa bergeser naik turun. Karena bentangnya pendek dan tingginya besar, balok ini dikendalikan oleh geser, bukan lentur.</p><ul><li><b>Balok pendek</b> dengan sengkang biasa cepat kehilangan kekuatan karena retak geser bolak-balik. Tulangan <b>diagonal</b> bekerja seperti rangka batang: satu grup tertarik, grup lainnya tertekan, dan berganti peran saat arah gempa berbalik.</li><li><b>Dua grup diagonal</b> dipasang bersilangan dan simetris terhadap tengah bentang. Ujungnya ditanam jauh ke dalam dinding supaya bisa leleh tanpa tercabut.</li><li><b>Pengekangan</b> diperlukan supaya batang diagonal yang tertekan tidak menekuk setelah selimut beton terkelupas.</li><li><b>Balok panjang</b> (ℓn/h ≥ 4) berperilaku seperti balok rangka biasa, sehingga tulangan diagonal tidak efektif karena sudutnya terlalu landai.</li></ul>`,
    SRPMB:`<h4>Dinding struktural biasa</h4><ul><li>Pasal 18.10.7 hanya berlaku untuk dinding struktural khusus. Pada dinding biasa, balok perangkai didetail sebagai balok menurut Pasal 9.</li><li>Bila bentang bersih tidak lebih dari empat kali tinggi balok, balok termasuk <b>balok tinggi</b> <span class="pasal">9.9.1.1</span>.</li><li>Balok tinggi memerlukan tulangan terdistribusi di kedua arah: tegak lurus sumbu balok paling sedikit 0,0025 bw s, dan sejajar sumbu balok paling sedikit 0,0025 bw s2 <span class="pasal">9.9.3.1</span>, dengan spasi tidak lebih dari d/5 dan 300 mm <span class="pasal">9.9.4.3</span>.</li><li>Tulangan lentur minimum mengikuti <span class="pasal">9.6.1.2</span>, dan diangkur ke dalam dinding sepanjang ℓd <span class="pasal">25.4.2</span>.</li></ul><div class="box">Ubah ke dinding khusus untuk melihat tulangan diagonal dan pengekangnya.</div>`,
    SRPMK:`<h4>Dinding struktural khusus</h4><ul><li><b>ℓn/h ≥ 4</b>: balok harus memenuhi syarat balok SRPMK di Pasal 18.6, dengan elemen batas dinding dianggap sebagai kolom <span class="pasal">18.10.7.1</span>.</li><li><b>ℓn/h &lt; 2 dan Vu &gt; 0,33 √fc' Acw</b>: wajib dua grup tulangan diagonal <span class="pasal">18.10.7.2</span>. Di antara kedua batas itu boleh diagonal atau konvensional <span class="pasal">18.10.7.3</span>.</li><li><b>Kuat geser</b> Vn = 2 Avd fy sin α, tidak lebih dari 0,83 √fc' Acw <span class="pasal">18.10.7.4(a)</span>.</li><li><b>Setiap grup</b> paling sedikit empat batang dalam dua lapis atau lebih, ditanam ke dalam dinding paling sedikit 1,25 kali panjang penyaluran tarik <span class="pasal">18.10.7.4(b)</span>.</li><li><b>Pilihan (c), tiap grup dikekang</b>: sengkang persegi dengan sisi luar paling sedikit bw/2 searah bw dan bw/5 di sisi lainnya; Ash paling sedikit maks(0,09 s bc fc'/fyt; 0,3 s bc (Ag/Ach − 1) fc'/fyt) dengan Ag dihitung seolah grup berselimut di keempat sisinya; spasi tidak lebih dari so dan 6db; jarak kaki sengkang tidak lebih dari 350 mm. Ditambah tulangan longitudinal dan transversal di keliling balok paling sedikit 0,002 bw s tiap arah dengan spasi tidak lebih dari 300 mm <span class="pasal">18.10.7.4(c)</span>.</li><li><b>Pilihan (d), seluruh penampang dikekang</b>: sengkang dan kait silang di seluruh penampang balok dengan Ash yang sama, spasi tidak lebih dari 150 mm dan 6db, jarak kaki sengkang atau kait silang tidak lebih dari 200 mm ke arah vertikal maupun horizontal, dan setiap kaki mengikat tulangan longitudinal berdiameter sama atau lebih besar <span class="pasal">18.10.7.4(d)</span>.</li><li>Tulangan horizontal balok pada penulangan diagonal hanya masuk sedikit ke dinding dan tidak disalurkan untuk mengembangkan fy <span class="pasal">Gambar R18.10.7</span>. Ketentuan balok tinggi 9.9 tidak perlu dipenuhi <span class="pasal">18.10.7.4</span>.</li></ul>`
  },
  build(p,sys){
    const K=sys==='SRPMK';
    const {ln,h,bw,dbd,ds,s,dbl,fc,fy,cover}=p, nd=Number(p.nd), det=K?p.detail:'konv', diag=det!=='konv';
    const ratio=ln/h, Acw=bw*h, sq=Math.sqrt(fc), dsp=10;
    const bars=[], labels=[], zones=[]; const {C,add}=checker();
    add(cover>=40,'Selimut beton',`${cover} mm ≥ 40 mm (balok)`,'Tabel 20.6.1.3.1');
    let Lw=800, E=400, derived='', views=[], layers=[], colorNote='';
    if(diag){
      /* ===== tulangan diagonal ===== */
      const full=det==='penuh', rows=nd/2, pitch=dbd+Math.max(25,dbd);
      const dC=(rows-1)*pitch+dbd+(full?0:2*ds);          // tinggi grup tegak lurus diagonal (sisi luar sengkang pada pilihan c)
      // posisi batang arah tebal: grup A di luar, grup B masuk di sela grup A supaya keduanya bisa bersilangan
      const zA=full?bw/2-cover-ds-dbl-8-dbd/2:Math.min(bw/2-cover-dsp-5-ds-dbd/2,(340-dbd-ds)/2);
      const zB=full?zA-dbd-5:zA-dbd-ds-3;
      const edge=cover+(full?ds+dbl:dsp+dbl)+12;
      let al=Math.atan((h-2*(edge+dC/2))/ln); const yc=edge+dC/(2*Math.cos(al)); al=Math.atan((h-2*yc)/ln);
      const ca=Math.cos(al), sa=Math.sin(al), Ld=ln/ca, ld=devLen(fy,fc,dbd,1), emb=up50(1.25*ld);
      Lw=up50(Math.max(700,emb*ca+250)); E=up50(Math.max(300,emb*sa+dC+150));
      const G=[{k:'A',P:[0,yc],e:[ca,sa],n:[-sa,ca],z:zA,col:COL.top},{k:'B',P:[0,h-yc],e:[ca,-sa],n:[sa,ca],z:zB,col:COL.bot}];
      const Avd=nd*AREA[dbd], Vn=2*Avd*fy*sa/1000, Vmax=0.83*sq*Acw/1000;
      const iD=g=>({t:`Tulangan diagonal grup ${g.k}: ${nd}D${dbd}`,b:[`Sudut terhadap sumbu balok α = ${fmt(al*180/Math.PI,1)}°. Satu grup tertarik dan grup lainnya tertekan, bergantian saat arah gempa berbalik.`,`Ditanam ${fmt(emb)} mm ke dalam dinding, yaitu 1,25 ℓd (ℓd = ${fmt(ld)} mm).`],pasal:'Pasal 18.10.7.4(b)'});
      const pt=(g,t,v,z)=>[g.P[0]+g.e[0]*t+g.n[0]*v,g.P[1]+g.e[1]*t+g.n[1]*v,z];
      const vs=Array.from({length:rows},(_,i)=>(i-(rows-1)/2)*pitch);
      G.forEach(g=>{ for(const z of [-g.z,g.z]) for(const v of vs) bars.push({pts:[pt(g,-emb,v,z),pt(g,Ld+emb,v,z)],d:dbd,layer:'diag'+g.k,color:g.col,info:iD(g)}); });
      labels.push({p:[ln/2,h+90,0],t:`ℓn = ${fmt(ln)} mm, ℓn/h = ${fmt(ratio,2)}`},{p:[ln*0.25,yc+ln*0.25*Math.tan(al)+70,bw/2],t:`α = ${fmt(al*180/Math.PI,1)}°`,c:'lap',follow:'diagA'},
        {p:[-emb*ca*0.6,yc-emb*sa*0.6-60,bw/2],t:`tertanam 1,25ℓd = ${fmt(emb)} mm`,c:'conf',follow:'diagA'},{p:[-Lw/2,h+E+60,0],t:'dinding geser'});
      add(ratio<4,'Jenis penulangan terhadap ℓn/h',ratio>=4?`ℓn/h = ${fmt(ratio,2)} ≥ 4: balok harus memenuhi 18.6. Pilih jenis Konvensional`:ratio<2?`ℓn/h = ${fmt(ratio,2)} < 2: tulangan diagonal wajib bila Vu > 0,33√fc' Acw = ${fmt(0.33*sq*Acw/1000)} kN`:`ℓn/h = ${fmt(ratio,2)}, di antara 2 dan 4: boleh diagonal atau konvensional`,ratio>=4?'Pasal 18.10.7.1':ratio<2?'Pasal 18.10.7.2':'Pasal 18.10.7.3');
      add(Vn<=Vmax?true:null,'Kuat geser nominal',`Vn = 2 Avd fy sin α = ${fmt(Vn)} kN${Vn<=Vmax?' ≤':'; dibatasi'} 0,83√fc' Acw = ${fmt(Vmax)} kN (Avd = ${fmt(Avd)} mm² per grup)`,'Pasal 18.10.7.4(a)');
      add(nd>=4&&rows>=2,'Jumlah tulangan tiap grup',`${nd} batang dalam ${rows} lapis; syarat paling sedikit 4 batang dalam 2 lapis atau lebih`,'Pasal 18.10.7.4(b)');
      add(true,'Penanaman ke dalam dinding',`${fmt(emb)} mm ≥ 1,25 ℓd = ${fmt(1.25*ld)} mm`,'Pasal 18.10.7.4(b)');
      const t0=40/ca, t1=Ld-40/ca;
      if(!full){
        /* ===== pilihan (c): sengkang di setiap grup, ditambah tulangan keliling balok ===== */
        const ext=Math.max(6*ds,75);
        const iH=g=>({t:`Sengkang grup ${g.k} D${ds}-${s}`,b:['Mengekang grup tulangan diagonal supaya batang yang tertekan tidak menekuk. Spasi diukur sejajar batang diagonal dan menerus melewati persilangan.'],pasal:'Pasal 18.10.7.4(c)'});
        G.forEach(g=>{ const hp=hoop2D(g.z+dbd/2+ds/2,(rows-1)*pitch/2+dbd/2+ds/2,2*ds,135,ext);
          spread(t0,t1,s).forEach(t=>bars.push({pts:lift3D(hp,(u,v,w)=>pt(g,t+w,v,u),ds*1.05),d:ds,layer:'hoop'+g.k,color:COL.conf,info:iH(g)})); });
        // tulangan keliling: sengkang tertutup dan batang longitudinal di sekeliling penampang
        const ha=bw/2-cover-dsp/2, hb2=h/2-cover-dsp/2, hpP=hoop2D(ha,hb2,2*dsp,135,75);
        const iP={t:`Sengkang keliling balok D${dsp}-${p.sp}`,b:['Tulangan transversal tambahan di keliling balok, paling sedikit 0,002 bw s dengan spasi tidak lebih dari 300 mm.'],pasal:'Pasal 18.10.7.4(c)'};
        const xsP=spread(60,ln-60,p.sp), spAct=xsP.length>1?xsP[1]-xsP[0]:p.sp;
        xsP.forEach(x=>bars.push({pts:lift3D(hpP,(u,v,w)=>[x+w,h/2+v,u],dsp*1.05),d:dsp,layer:'kelS',color:COL.mid,info:iP}));
        const zl=bw/2-cover-dsp-dbl/2, ysL=spread(cover+dsp+dbl/2,h-cover-dsp-dbl/2,p.sl), slAct=ysL.length>1?ysL[1]-ysL[0]:p.sl;
        const iL={t:`Tulangan longitudinal keliling D${dbl}`,b:['Tulangan longitudinal tambahan di keliling balok, paling sedikit 0,002 bw s dengan spasi tidak lebih dari 300 mm.','Hanya masuk 150 mm ke dinding dan tidak disalurkan untuk mengembangkan fy.'],pasal:'Pasal 18.10.7.4(c)'};
        ysL.forEach(y=>{ for(const z of [-zl,zl]) bars.push({pts:[[-150,y,z],[ln+150,y,z]],d:dbl,layer:'kelL',color:COL.dist,info:iL}); });
        // pemeriksaan pilihan (c)
        const dims=G.map(g=>({w:2*(g.z+dbd/2+ds),d:dC})), wMin=Math.min(...dims.map(q=>q.w));
        add(wMin>=bw/2-0.5&&dC>=bw/5-0.5,'Ukuran sengkang grup diagonal',`sisi luar searah bw: grup A ${fmt(dims[0].w)} mm, grup B ${fmt(dims[1].w)} mm ≥ bw/2 = ${fmt(bw/2)} mm; sisi lainnya ${fmt(dC)} mm ≥ bw/5 = ${fmt(bw/5)} mm`,'Pasal 18.10.7.4(c)');
        const req=Math.max(...dims.map(q=>{ const Ag=(q.w+2*cover)*(q.d+2*cover), Ach=q.w*q.d; return Math.max(ashReq(s,q.w,fc,fy,Ag,Ach),ashReq(s,q.d,fc,fy,Ag,Ach)); }));
        add(2*AREA[ds]>=req,'Luas sengkang grup Ash',`2 kaki D${ds} = ${fmt(2*AREA[ds])} mm² ≥ maks(0,09 s bc fc'/fyt; 0,3 s bc (Ag/Ach − 1) fc'/fyt) = ${fmt(req)} mm². Ag dihitung dengan selimut ${cover} mm di keempat sisi grup`,'Pasal 18.10.7.4(c)');
        const hx=2*zA, so=Math.min(150,Math.max(100,100+(350-hx)/3)), sMax=Math.min(so,6*dbd);
        add(s<=sMax+0.5,'Spasi sengkang grup',`s = ${s} mm ≤ min(so; 6db) = ${fmt(sMax)} mm, so = ${fmt(so)} mm`,'Pasal 18.10.7.4(c), 18.7.5.3(c)');
        const leg=Math.max(dims[0].w-ds,dC-ds);
        add(leg<=350,'Jarak kaki sengkang grup',`${fmt(leg)} mm ≤ 350 mm, diukur tegak lurus batang diagonal`,'Pasal 18.10.7.4(c)');
        add(2*AREA[dsp]>=0.002*bw*spAct&&spAct<=300.5,'Tulangan transversal keliling balok',`2 kaki D${dsp} = ${fmt(2*AREA[dsp])} mm² ≥ 0,002 bw s = ${fmt(0.002*bw*spAct)} mm²; spasi ${fmt(spAct)} mm ≤ 300 mm`,'Pasal 18.10.7.4(c)');
        add(2*AREA[dbl]>=0.002*bw*slAct&&slAct<=300.5,'Tulangan longitudinal keliling balok',`2D${dbl} tiap baris = ${fmt(2*AREA[dbl])} mm² ≥ 0,002 bw s = ${fmt(0.002*bw*slAct)} mm²; spasi ${fmt(slAct)} mm ≤ 300 mm`,'Pasal 18.10.7.4(c)');
        layers=[{k:'diagA',label:'Diagonal grup A',color:COL.top,ex:[0,0,0]},{k:'diagB',label:'Diagonal grup B',color:COL.bot,ex:[0,0,0]},{k:'hoopA',label:'Sengkang grup A',color:COL.conf,ex:[0,0,bw*1.2]},{k:'hoopB',label:'Sengkang grup B',color:COL.conf,ex:[0,0,bw*1.2]},
          {k:'kelL',label:'Longitudinal keliling',color:COL.dist,ex:[0,0,-bw*1.2]},{k:'kelS',label:'Sengkang keliling',color:COL.mid,ex:[0,0,-bw*1.2]}];
      } else {
        /* ===== pilihan (d): seluruh penampang balok dikekang ===== */
        const nu=Math.max(2,Math.ceil((bw-2*(cover+ds)-dbl)/200-1e-9)+1), nv=Math.max(2,Math.ceil((h-2*(cover+ds)-dbl)/200-1e-9)+1);
        const cg=rectCage({B:bw,H:h,cover,ds,db:dbl,nu,nv,hook:135,allSup:true});
        const iL={t:`Tulangan longitudinal ${cg.pos.length}D${dbl}`,b:['Disebar di keliling penampang supaya setiap kaki sengkang dan kait silang punya batang untuk diikat.','Hanya masuk 150 mm ke dinding dan tidak disalurkan untuk mengembangkan fy.'],pasal:'Pasal 18.10.7.4(d)'};
        cg.pos.forEach(([u,v])=>bars.push({pts:[[-150,h/2+v,u],[ln+150,h/2+v,u]],d:dbl,layer:'kelL',color:COL.dist,info:iL}));
        const iH={t:`Sengkang tertutup D${ds}-${s}`,b:['Mengekang seluruh penampang balok, bukan tiap grup diagonal.'],pasal:'Pasal 18.10.7.4(d)'};
        const iT={t:`Kait silang D${ds}`,b:['Jarak antar kaki sengkang atau kait silang tidak lebih dari 200 mm ke arah vertikal maupun horizontal. Kait silang berurutan diselang-seling ujung 90° dan 135°.'],pasal:'Pasal 18.10.7.4(d)'};
        spread(50,ln-50,s).forEach(x=>{ bars.push({pts:lift3D(cg.hoop,(u,v,w)=>[x+w,h/2+v,u],ds*1.05),d:ds,layer:'hoop',color:COL.conf,info:iH});
          cg.ties.forEach(t=>bars.push({pts:t.pts.map(([u,v])=>[x+ds*1.1,h/2+v,u]),d:ds,layer:'ties',color:COL.tie,info:iT})); });
        const bcz=bw-2*cover, bcy=h-2*cover, Ag=bw*h, Ach=bcz*bcy;
        const pZ=(2+cg.nTieV)*AREA[ds], pY=(2+cg.nTieU)*AREA[ds], rZ=ashReq(s,bcz,fc,fy,Ag,Ach), rY=ashReq(s,bcy,fc,fy,Ag,Ach);
        add(pZ>=rZ&&pY>=rY,'Luas tulangan pengekang Ash',`kaki vertikal: ${2+cg.nTieV} kaki = ${fmt(pZ)} ≥ ${fmt(rZ)} mm²; kaki horizontal: ${2+cg.nTieU} kaki = ${fmt(pY)} ≥ ${fmt(rY)} mm²`,'Pasal 18.10.7.4(d)');
        const sMax=Math.min(150,6*dbd);
        add(s<=sMax+0.5,'Spasi sengkang',`s = ${s} mm ≤ min(150; 6db diagonal) = ${fmt(sMax)} mm`,'Pasal 18.10.7.4(d)');
        add(cg.hx<=200.5,'Jarak kaki sengkang dan kait silang',`${fmt(cg.hx)} mm ≤ 200 mm, vertikal dan horizontal`,'Pasal 18.10.7.4(d)');
        add(dbl>=ds,'Diameter tulangan longitudinal yang diikat',`D${dbl} ≥ diameter sengkang D${ds}`,'Pasal 18.10.7.4(d)');
        layers=[{k:'diagA',label:'Diagonal grup A',color:COL.top,ex:[0,0,0]},{k:'diagB',label:'Diagonal grup B',color:COL.bot,ex:[0,0,0]},{k:'kelL',label:'Tulangan longitudinal',color:COL.dist,ex:[0,0,-bw*1.2]},
          {k:'hoop',label:'Sengkang tertutup',color:COL.conf,ex:[0,0,bw*1.2]},{k:'ties',label:'Kait silang',color:COL.tie,ex:[0,0,bw*2]}];
      }
      add(null,'Tulangan horizontal balok di dinding','masuk 150 mm ke dinding dan tidak disalurkan untuk mengembangkan fy, supaya kekuatan lentur balok tidak bertambah di luar rencana','SNI 2847:2019 Gambar R18.10.7');
      add(null,'Ketentuan balok tinggi','Pasal 9.9 tidak perlu dipenuhi untuk balok kopel bertulangan diagonal','Pasal 18.10.7.4');
      derived=`ℓn/h = <b>${fmt(ratio,2)}</b><br>α = <b>${fmt(al*180/Math.PI,1)}°</b>, panjang diagonal di bentang = <b>${fmt(Ld)}</b> mm<br>Avd = <b>${fmt(Avd)}</b> mm² per grup<br>Vn = <b>${fmt(Math.min(Vn,Vmax))}</b> kN (batas 0,83√fc' Acw = ${fmt(Vmax)} kN)<br>ℓd D${dbd} = <b>${fmt(ld)}</b> mm, penanaman 1,25ℓd = <b>${fmt(emb)}</b> mm`;
      colorNote=`<b style="color:${COL.top}">Grup A</b> naik dari kiri ke kanan, <b style="color:${COL.bot}">grup B</b> turun. <b style="color:${COL.conf}">Hijau</b>: sengkang pengekang.`;
      views=[
        {title:'Tampak memanjang',sub:`2 grup × ${nd}D${dbd}, α = ${fmt(al*180/Math.PI,1)}°`,n:'z',u:'x',v:'y',maxH:420,dims:[{a:[0,-E],b:[ln,-E],off:-12,t:`ℓn = ${fmt(ln)}`},{a:[ln+Lw,0],b:[ln+Lw,h],off:14,t:`h = ${fmt(h)}`}]},
        {title:'Potongan di seperempat bentang',sub:full?`sengkang D${ds}-${s} di seluruh penampang`:`sengkang grup D${ds}-${s}, keliling D${dsp}-${p.sp}`,n:'x',at:ln/4,half:Math.max(s*0.55,ds*2),u:'z',v:'y',skipStub:true,maxH:400,w2:true,dims:[{a:[-bw/2,0],b:[bw/2,0],off:-14,t:`bw = ${fmt(bw)}`},{a:[bw/2,0],b:[bw/2,h],off:14,t:`${fmt(h)}`}]}
      ];
    } else {
      /* ===== penulangan konvensional: balok SRPMK menurut 18.6, atau balok Pasal 9 pada dinding biasa ===== */
      const nl=p.nl, cg=rectCage({B:bw,H:h,cover,ds,db:dbl,nu:nl,nv:2,hook:hookOf(p,K),allSup:false});
      const d=h-cover-ds-dbl/2, As=nl*AREA[dbl], rho=As/(bw*d);
      const ldh=ldhSeis(fy,fc,dbl), eT=K?up50(3.25*ldh):up50(devLen(fy,fc,dbl,1.3)), eB=K?up50(2.5*ldh):up50(devLen(fy,fc,dbl,1));
      Lw=up50(Math.max(700,eT+200)); E=400;
      const iT={t:`Tulangan atas ${nl}D${dbl}`,b:[`Lurus masuk ke dinding ${fmt(eT)} mm${K?', yaitu 3,25 ℓdh untuk batang atas':', yaitu ℓd dengan faktor posisi 1,3'}.`],pasal:K?'Pasal 18.8.5.3':'Pasal 25.4.2'};
      const iB={t:`Tulangan bawah ${nl}D${dbl}`,b:[`Lurus masuk ke dinding ${fmt(eB)} mm${K?', yaitu 2,5 ℓdh':', yaitu ℓd'}.`],pasal:K?'Pasal 18.8.5.3':'Pasal 25.4.2'};
      cg.pos.forEach(([u,v])=>{ const top=v>0; bars.push({pts:[[-(top?eT:eB),h/2+v,u],[ln+(top?eT:eB),h/2+v,u]],d:dbl,layer:top?'atas':'bawah',color:top?COL.top:COL.bot,info:top?iT:iB}); });
      // tulangan badan (sisi): tulangan terdistribusi sejajar sumbu balok
      const dsk=13, zs=bw/2-cover-ds-dsk/2, ysS=spread(cover+ds+dbl+60,h-cover-ds-dbl-60,p.sl).filter((_,i,a)=>a.length>1), slAct=ysS.length>1?ysS[1]-ysS[0]:0;
      const deep=ln<=4*h;
      const iS={t:`Tulangan badan D${dsk}`,b:[deep?'Tulangan terdistribusi sejajar sumbu balok untuk balok tinggi.':'Tulangan sisi untuk mengendalikan retak di badan balok. Wajib bila h lebih dari 900 mm.'],pasal:deep?'Pasal 9.9.3.1':'Pasal 9.7.2.3'};
      ysS.forEach(y=>{ for(const z of [-zs,zs]) bars.push({pts:[[-150,y,z],[ln+150,y,z]],d:dsk,layer:'badan',color:COL.dist,info:iS}); });
      // sengkang
      const st=[]; const lo=K?Math.min(2*h,ln/2):0;
      if(K){ for(let x=50;x<=lo+1e-6;x+=s){ st.push([x,'conf']); if(ln-x>x+1) st.push([ln-x,'conf']); }
        // bagian tengah diisi merata: spasi luar 2h bila kedua daerah 2h tidak bertemu, selain itu spasi daerah 2h
        { const a=st.filter(q=>q[0]<=ln/2).at(-1)[0], mid=lo<ln/2-1, n=Math.ceil((ln-2*a)/(mid?p.s2:s)-1e-9); for(let i=1;i<n;i++) st.push([a+(ln-2*a)*i/n,mid?'mid':'conf']); }
        if(lo>0){ zones.push({box:[0,lo,-15,h+15,-bw/2-15,bw/2+15],color:COL.conf},{box:[ln-lo,ln,-15,h+15,-bw/2-15,bw/2+15],color:COL.conf}); labels.push({p:[lo/2,h+70,bw/2],t:`2h = ${fmt(lo)} mm`,c:'conf'}); } }
      else spread(50,ln-50,s).forEach(x=>st.push([x,'mid']));
      st.sort((a,b)=>a[0]-b[0]);
      const sOf=z=>{ let m=0; for(let i=1;i<st.length;i++){ const u=st[i-1][1], v=st[i][1]; if(z==='conf'?(u==='conf'&&v==='conf'):(u==='mid'||v==='mid')) m=Math.max(m,st[i][0]-st[i-1][0]); } return m; };
      st.forEach(([x,z])=>{ bars.push({pts:lift3D(cg.hoop,(u,v,w)=>[x+w,h/2+v,u],ds*1.05),d:ds,layer:'sengkang',color:COL[z],info:{t:K?`Sengkang tertutup D${ds}`:`Sengkang D${ds}`,b:[z==='conf'?`Daerah 2h dari muka dinding, spasi ${s} mm.`:`Spasi ${fmt(K?p.s2:s)} mm.`],pasal:K?(z==='conf'?'Pasal 18.6.4.4':'Pasal 18.6.4.6'):'Pasal 9.7.6.2'}});
        cg.ties.forEach(t=>bars.push({pts:t.pts.map(([u,v])=>[x+ds*1.1,h/2+v,u]),d:ds,layer:'sengkang',color:COL.tie,info:{t:`Kait silang D${ds}`,b:['Menumpu tulangan longitudinal di tengah lebar balok.'],pasal:K?'Pasal 18.6.4.2':'Pasal 25.7.2.3'}})); });
      labels.push({p:[ln/2,h+90,0],t:`ℓn = ${fmt(ln)} mm, ℓn/h = ${fmt(ratio,2)}`},{p:[-Lw/2,h+E+60,0],t:'dinding geser'},{p:[-eT/2,h+40,bw/2],t:`penyaluran ${fmt(eT)} mm`,c:'lap',follow:'atas'});
      const Asmin=Math.max(0.25*sq/fy,1.4/fy)*bw*d;
      add(As>=Asmin,'Luas tulangan lentur minimum',`As = ${fmt(As)} mm² ≥ As,min = ${fmt(Asmin)} mm² (atas dan bawah)`,'Pasal 9.6.1.2');
      if(K){
        add(ratio>=2?true:null,'Jenis penulangan terhadap ℓn/h',ratio>=4?`ℓn/h = ${fmt(ratio,2)} ≥ 4: balok memenuhi 18.6, elemen batas dinding dianggap kolom`:ratio>=2?`ℓn/h = ${fmt(ratio,2)}, di antara 2 dan 4: boleh konvensional (18.6.3 sampai 18.6.5) atau diagonal`:`ℓn/h = ${fmt(ratio,2)} < 2: tulangan diagonal wajib bila Vu > 0,33√fc' Acw = ${fmt(0.33*sq*Acw/1000)} kN. Periksa gaya geser hasil analisis`,ratio>=4?'Pasal 18.10.7.1':ratio>=2?'Pasal 18.10.7.3':'Pasal 18.10.7.2');
        add(nl>=2&&rho<=0.025,'Tulangan longitudinal',`${nl} batang menerus di atas dan bawah (≥ 2); ρ = ${fmt(rho*100,2)}% ≤ 2,5%`,'Pasal 18.6.3.1');
        const sm=Math.min(d/4,6*dbl,150);
        add(sOf('conf')<=sm+0.5,'Spasi sengkang di daerah 2h',`s = ${fmt(sOf('conf'))} mm ≤ min(d/4; 6db; 150) = ${fmt(sm)} mm; sengkang pertama 50 mm dari muka dinding`,'Pasal 18.6.4.1, 18.6.4.4');
        if(st.some(q=>q[1]==='mid')) add(sOf('mid')<=d/2+0.5,'Spasi sengkang di luar 2h',`s = ${fmt(sOf('mid'))} mm ≤ d/2 = ${fmt(d/2)} mm`,'Pasal 18.6.4.6');
        add(true,'Penyaluran tulangan ke dalam dinding',`lurus: atas 3,25 ℓdh = ${fmt(eT)} mm, bawah 2,5 ℓdh = ${fmt(eB)} mm (ℓdh = ${fmt(ldh)} mm), di dalam inti elemen batas yang terkekang`,'Pasal 18.8.5.3');
        add(null,'Batas dimensi balok SRPMK',`bw = ${bw} mm, syarat ≥ min(0,3h; 250) = ${fmt(Math.min(0.3*h,250))} mm. Syarat 18.6.2.1(b) dan (c) boleh tidak dipenuhi bila stabilitas lateral balok ditunjukkan lewat analisis`,'Pasal 18.10.7.1');
      } else {
        add(null,'Lingkup aturan','Pasal 18.10.7 hanya untuk dinding struktural khusus. Pada dinding biasa balok perangkai didetail menurut Pasal 9','Pasal 18.10.7');
        add(s<=Math.min(d/2,600)+0.5,'Spasi sengkang',`s = ${s} mm ≤ min(d/2; 600) = ${fmt(Math.min(d/2,600))} mm`,'Pasal 9.7.6.2.2');
        add(true,'Penyaluran tulangan ke dalam dinding',`atas ℓd = ${fmt(eT)} mm (faktor posisi 1,3), bawah ℓd = ${fmt(eB)} mm`,'Tabel 25.4.2.2');
      }
      if(deep&&!K){
        const sm=Math.min(d/5,300);
        add(null,'Balok tinggi',`ℓn = ${fmt(ln)} mm ≤ 4h = ${fmt(4*h)} mm, sehingga syarat balok tinggi berlaku`,'Pasal 9.9.1.1');
        add(2*AREA[ds]>=0.0025*bw*s,'Tulangan terdistribusi tegak lurus sumbu balok',`Av = 2 kaki D${ds} = ${fmt(2*AREA[ds])} mm² ≥ 0,0025 bw s = ${fmt(0.0025*bw*s)} mm²`,'Pasal 9.9.3.1(a)');
        add(slAct>0&&2*AREA[dsk]>=0.0025*bw*slAct,'Tulangan terdistribusi sejajar sumbu balok',`Avh = 2D${dsk} = ${fmt(2*AREA[dsk])} mm² ≥ 0,0025 bw s2 = ${fmt(0.0025*bw*slAct)} mm² (s2 = ${fmt(slAct)} mm)`,'Pasal 9.9.3.1(b)');
        add(s<=sm+0.5&&slAct<=sm+0.5,'Spasi tulangan terdistribusi',`sengkang ${s} mm dan tulangan badan ${fmt(slAct)} mm ≤ min(d/5; 300) = ${fmt(sm)} mm`,'Pasal 9.9.4.3');
      } else if(deep) add(null,'Balok tinggi',`ℓn ≤ 4h. Balok kopel SRPMK dengan penulangan konvensional tetap harus diperiksa terhadap 9.9 bila tidak memakai tulangan diagonal`,'Pasal 9.9.1.1');
      derived=`ℓn/h = <b>${fmt(ratio,2)}</b>${deep?' (balok tinggi)':''}<br>d = <b>${fmt(d)}</b> mm, As = <b>${fmt(As)}</b> mm², ρ = <b>${fmt(rho*100,2)}%</b><br>penyaluran atas = <b>${fmt(eT)}</b> mm, bawah = <b>${fmt(eB)}</b> mm<br>jumlah sengkang = <b>${st.length}</b>`;
      colorNote=K?`Warna sengkang: <b style="color:${COL.conf}">hijau</b> daerah 2h, <b style="color:${COL.mid}">biru</b> di luarnya.`:'';
      layers=[{k:'atas',label:'Tulangan atas',color:COL.top,ex:[0,300,0]},{k:'bawah',label:'Tulangan bawah',color:COL.bot,ex:[0,-300,0]},{k:'badan',label:'Tulangan badan',color:COL.dist,ex:[0,0,-bw*1.2]},{k:'sengkang',label:'Sengkang',color:K?COL.conf:COL.mid,ex:[0,0,bw*1.2]}];
      views=[
        {title:'Tampak memanjang',sub:`${nl}D${dbl} atas dan bawah, sengkang D${ds}-${s}`,n:'z',u:'x',v:'y',maxH:400,dims:[{a:[0,-E],b:[ln,-E],off:-12,t:`ℓn = ${fmt(ln)}`},{a:[ln+Lw,0],b:[ln+Lw,h],off:14,t:`h = ${fmt(h)}`}]},
        {title:'Potongan melintang',n:'x',at:(st[1]?.[0]??ln/2)+ds*0.9,half:ds*1.6,u:'z',v:'y',skipStub:true,maxH:380,w2:true,dims:[{a:[-bw/2,0],b:[bw/2,0],off:-14,t:`bw = ${fmt(bw)}`},{a:[bw/2,0],b:[bw/2,h],off:14,t:`${fmt(h)}`}]}
      ];
    }
    const concrete=[{box:[0,ln,0,h,-bw/2,bw/2]},{box:[-Lw,0,-E,h+E,-bw/2,bw/2],kind:'stub'},{box:[ln,ln+Lw,-E,h+E,-bw/2,bw/2],kind:'stub'}];
    return {layers,betonEx:[0,0,-bw*3.2],concrete,zones,bars,labels,views,checks:C,derived,camDir:[0.35,0.25,0.95],camK:0.95,cutAxis:'x',colorNote};
  }
};
