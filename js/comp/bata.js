import {COL,fmt,spread,turtle,hoop2D,lift3D,checker,BATA,BATA_OPTS,MAT,SPESI,SPESI_TABEL,BATA_TABEL,bataWall,bentBar,trapesium,PU,REF_PRAKTIS,NOTE_PRAKTIS} from '../core.js';

const CV=20; // selimut kolom praktis, sloof, dan ring balok (mm); Persyaratan PU menyebut 1,5 cm

export default {
  id:'bata', name:'Dinding bata', sysDependent:false, std:'Persyaratan PU',
  ref:REF_PRAKTIS, checkNote:NOTE_PRAKTIS,
  defaults:{ALL:{L:3000,H:2800,jenis:'M-5a',ikatan:'half',joint:10,campuran:'1:4',bk:150,dbk:10,dsk:8,sk:150,bs:150,hs:200,br:150,hr:150,nAng:6,La:400,dAng:10}},
  schema:[
    ['Bidang dinding',[{k:'L',label:'Jarak bersih antar kolom praktis',unit:'mm',min:1000,max:5000,step:100},{k:'H',label:'Tinggi dinding',unit:'mm',min:1500,max:4000,step:100}]],
    ['Bata dan spesi',[{k:'jenis',label:'Jenis bata',opts:BATA_OPTS},{k:'ikatan',label:'Ikatan',opts:[['half','½ bata'],['full','1 bata (ikatan Inggris)']],show:(s,p)=>!BATA[p.jenis].ringan},
      {k:'joint',label:'Tebal spesi',unit:'mm',min:2,max:20,step:1},{k:'campuran',label:'Campuran spesi',opts:Object.keys(SPESI).map(k=>[k,`1 PC : ${k.split(':')[1]} Ps`])}]],
    ['Kolom praktis',[{k:'bk',label:'Sisi kolom',unit:'mm',min:100,max:300,step:10},{k:'dbk',label:'Diameter tulangan (4 batang)',unit:'D',opts:[10,13]},{k:'dsk',label:'Diameter sengkang',unit:'D',opts:[8,10]},{k:'sk',label:'Jarak sengkang',unit:'mm',min:50,max:300,step:10}]],
    ['Sloof dan ring balok',[{k:'bs',label:'Lebar sloof',unit:'mm',min:100,max:300,step:10},{k:'hs',label:'Tinggi sloof',unit:'mm',min:150,max:400,step:10},{k:'br',label:'Lebar ring balok',unit:'mm',min:100,max:300,step:10},{k:'hr',label:'Tinggi ring balok',unit:'mm',min:100,max:400,step:10}]],
    ['Angkur dinding',[{k:'nAng',label:'Angkur tiap',unit:'lapis bata',min:1,max:12},{k:'La',label:'Panjang angkur',unit:'mm',min:200,max:800,step:10},{k:'dAng',label:'Diameter angkur',unit:'D',opts:[8,10,13]}]]
  ],
  teori:{
    common:`<h3>Dinding bata</h3><p>Dinding bata adalah pasangan bata yang direkatkan dengan spesi. Pada rumah sederhana, dinding tidak dirancang memikul beban, tetapi saat gempa dinding ikut menerima gaya lateral. Karena itu setiap bidang dinding dikurung oleh rangka beton bertulang kecil: <b>sloof</b> di bawah, <b>kolom praktis</b> di kedua sisi, dan <b>ring balok</b> di atas. Sistem ini sering disebut dinding terkekang (confined masonry).</p><ul><li><b>Urutan kerja</b>: bata dipasang dulu dengan ujung bergigi, lalu kolom praktis dicor menempel ke gigi itu. Gigi membuat beton kolom mengunci pasangan bata.</li><li><b>Angkur</b> dari kolom praktis masuk ke siar datar (spesi horizontal) setiap beberapa lapis, sehingga dinding tidak terlepas dari kolom saat gempa.</li><li><b>Ikatan ½ bata</b> memakai tebal sama dengan lebar bata dan lapisnya digeser setengah bata. <b>Ikatan 1 bata</b> lebih tebal; lapis memanjang dan lapis melintang dipasang berselang (ikatan Inggris).</li><li><b>Spesi</b> adalah campuran semen, pasir, dan air. Selain merekatkan, spesi meratakan beban di antara bata. Spesi yang terlalu tebal justru melemahkan pasangan.</li><li><b>Bata ringan</b> dipasang dengan perekat instan yang tipis, sekitar 2 sampai 5 mm, dan karena ukurannya besar jumlah lapisnya jauh lebih sedikit.</li></ul>`,
    ALL:`<h4>Syarat utama</h4><ul><li>Luas bidang dinding di antara kolom paling besar 9 m², sehingga jarak antar kolom paling jauh 3 m <span class="pasal">${PU}</span>.</li><li>Kolom praktis 15 × 15 cm dengan 4 tulangan diameter 10 mm, begel diameter 8 mm berjarak 15 cm, dan ujung begel ditekuk 135° sepanjang paling sedikit 5 cm <span class="pasal">${PU}</span>.</li><li>Angkur diameter 10 mm, panjang paling sedikit 40 cm, dipasang setiap 6 lapis bata <span class="pasal">${PU}</span>.</li><li>Tulangan kolom diteruskan dan dibengkokkan ke sloof dan ring balok sepanjang paling sedikit 40 kali diameter atau 40 cm <span class="pasal">${PU}</span>.</li><li>Spesi dan plester memakai campuran 1 semen : 4 pasir, plester setebal 2 cm <span class="pasal">${PU}</span>.</li></ul><h4>Ukuran bata</h4>${BATA_TABEL}<p>Ukuran bata merah adalah ukuran nominal SNI 15-2094-2000 (t tebal atau tinggi lapis, w lebar, l panjang). Bata ringan memakai ukuran pabrikan yang umum.</p><h4>Campuran spesi</h4>${SPESI_TABEL}<p>SNI 6882:2014 membagi mortar pasangan menjadi tipe M, S, N, dan O dengan kuat tekan rata-rata minimum sekitar 17,2; 12,4; 5,2; dan 2,4 MPa. Angka ini diambil dari ringkasan sekunder dan belum dicocokkan dengan dokumen standarnya.</p><div class="box">Ganti jenis bata ke bata ringan, lalu bandingkan jumlah bata dan volume spesi per m² di nilai turunan.</div>`
  },
  build(p){
    const {L,H,joint,bk,dbk,dsk,sk,bs,hs,br,hr,nAng,La,dAng}=p;
    const bt=BATA[p.jenis], bond=bt.ringan?'half':p.ikatan, tooth=bt.ringan?0:50;
    const w=bataWall({axis:'x',a0:0,a1:L,y0:0,y1:H,c:0,bt,joint,bond,tooth0:tooth,tooth1:tooth});
    const T=w.thick, zf=Math.max(T/2,bk/2)+15;
    const concrete=[
      {box:[-bk,0,0,H,-bk/2,bk/2]},{box:[L,L+bk,0,H,-bk/2,bk/2]},
      {box:[-bk-300,L+bk+300,-hs,0,-bs/2,bs/2]},{box:[-bk-300,L+bk+300,H,H+hr,-br/2,br/2]},
      {box:w.mortar,mat:'spesi',layer:'spesi'},
      {boxes:w.boxes,mat:bt.ringan?'ringan':'bata',layer:'bata'},
      {boxes:[[-bk,L+bk,0,H,T/2,zf],[-bk,L+bk,0,H,-zf,-T/2]],mat:'plester',layer:'plester',edges:false},
      {prism:{axis:'x',pts:trapesium(300,600,-hs,450),x0:-bk-300,x1:L+bk+300},mat:'batu',layer:'fondasi'}
    ];
    const bars=[];
    // kolom praktis
    const a=bk/2-CV-dsk-dbk/2, Lb=Math.max(40*dbk,400), r=3*dbk;
    const yB=-hs+CV+dsk+dbk/2, yT=H+hr-CV-dsk-dbk/2;
    const iK={t:`Tulangan kolom praktis 4D${dbk}`,b:[`Diteruskan dan dibengkokkan ke sloof dan ring balok sepanjang maks(40db; 400) = ${fmt(Lb)} mm.`,'Kolom dicor setelah pasangan bata selesai, menempel pada gigi bata.'],pasal:PU};
    const ext=Math.max(50,6*dsk), hoopK=hoop2D(bk/2-CV-dsk/2,bk/2-CV-dsk/2,2*dsk,135,ext);
    const iS={t:`Sengkang kolom praktis D${dsk}-${sk}`,b:[`Kait 135° dengan panjang ${fmt(ext)} mm, paling sedikit 5 cm.`],pasal:PU};
    [[-bk/2,1],[L+bk/2,-1]].forEach(([xc,dir])=>{
      for(const u of [-a,a]) for(const z of [-a,a]) bars.push({pts:bentBar(xc+u,yB,yT,dir,Lb,r).map(([x,y])=>[x,y,z]),d:dbk,layer:'kp',color:COL.long,info:iK});
      spread(50,H-50,sk).forEach(y=>bars.push({pts:lift3D(hoopK,(u,v,wv)=>[xc+u,y+wv,v],dsk*1.05),d:dsk,layer:'kps',color:COL.mid,info:iS}));
    });
    // sloof dan ring balok
    const beam=(yc,b,h,layer,color,nama)=>{
      const as=b/2-CV-dsk-dbk/2, ys=h/2-CV-dsk-dbk/2, inf={t:`Tulangan ${nama} 4D${dbk}`,b:[nama==='sloof'?'Mengikat kaki kolom praktis dan meratakan beban dinding ke fondasi.':'Mengikat kepala kolom praktis dan dinding di bagian atas.'],pasal:PU};
      for(const z of [-as,as]) for(const y of [yc-ys,yc+ys]) bars.push({pts:[[-bk-280,y,z],[L+bk+280,y,z]],d:dbk,layer,color,info:inf});
      const hp=hoop2D(b/2-CV-dsk/2,h/2-CV-dsk/2,2*dsk,135,ext), iH={t:`Sengkang ${nama} D${dsk}-${sk}`,b:['Kait 135° ke arah dalam.'],pasal:PU};
      spread(-bk-250,L+bk+250,sk).forEach(x=>bars.push({pts:lift3D(hp,(u,v,wv)=>[x+wv,yc+v,u],dsk*1.05),d:dsk,layer,color:COL.mid,info:iH}));
    };
    beam(-hs/2,bs,hs,'sloof',COL.bot,'sloof'); beam(H+hr/2,br,hr,'ring',COL.top,'ring balok');
    // angkur di siar datar setiap nAng lapis
    const iA={t:`Angkur D${dAng}, panjang ${fmt(La)} mm`,b:[`Dipasang di siar datar setiap ${nAng} lapis bata, ujungnya dikaitkan ke tulangan kolom praktis.`],pasal:PU};
    const ys=[]; for(let k=nAng-1;k<w.n;k+=nAng){ const y=w.courseY(k)+bt.t+joint/2; if(y<H-joint) ys.push(y); }
    const rA=2*dAng;
    ys.forEach(y=>{
      const tl=turtle(-bk/2-a,y-60,Math.PI/2); tl.fwd(60-rA).turn(-90,rA).fwd(La-rA); bars.push({pts:tl.pts.map(([x,yy])=>[x,yy,0]),d:dAng,layer:'angkur',color:COL.dowel,info:iA});
      const tr=turtle(L+bk/2+a,y-60,Math.PI/2); tr.fwd(60-rA).turn(90,rA).fwd(La-rA); bars.push({pts:tr.pts.map(([x,yy])=>[x,yy,0]),d:dAng,layer:'angkur',color:COL.dowel,info:iA});
    });
    const area=L*H/1e6, sA=nAng*w.ch, jr=bt.ringan?[2,5]:[8,15], yA0=ys[0]??H/2;
    const labels=[{p:[L/2,H+hr+90,0],t:`luas bidang ${fmt(area,2)} m²`},{p:[-bk/2,H*0.62,bk/2+30],t:'kolom praktis'},{p:[L*0.25,-hs-40,bs/2],t:'sloof'},{p:[L*0.25,H+hr+30,br/2],t:'ring balok'},
      ...(tooth?[{p:[0,H*0.35,T/2+10],t:'gigi bata',c:'lap'}]:[]),...(ys.length?[{p:[La*0.55,yA0+50,0],t:`angkur tiap ${nAng} lapis`,c:'conf'}]:[])];
    // pemeriksaan
    const {C,add}=checker();
    add(area<=9,'Luas bidang dinding antar kolom',`${fmt(area,2)} m² ≤ 9 m²`,PU);
    add(L<=3000,'Jarak antar kolom praktis',`${fmt(L)} mm ≤ 3.000 mm`,PU);
    add(bk>=150,'Ukuran kolom praktis',`${bk} × ${bk} mm ≥ 150 × 150 mm`,PU);
    add(dbk>=10,'Tulangan kolom praktis',`4D${dbk}, paling sedikit 4 batang diameter 10 mm`,PU);
    add(dsk>=8&&sk<=150,'Sengkang kolom praktis',`D${dsk}-${sk}: diameter ≥ 8 mm dan jarak ≤ 150 mm`,PU);
    add(true,'Kait sengkang',`135° dengan panjang ${fmt(ext)} mm ≥ 50 mm`,PU);
    add(true,'Tulangan kolom ke sloof dan ring',`dibengkokkan ${fmt(Lb)} mm = maks(40db; 400 mm)`,PU);
    add(bs>=150&&hs>=200,'Ukuran sloof',`${bs} × ${hs} mm ≥ 150 × 200 mm`,PU);
    add(br>=120&&hr>=150,'Ukuran ring balok',`${br} × ${hr} mm ≥ 120 × 150 mm`,'praktik');
    add(Math.min(bs,br)>=T,'Lebar sloof dan ring terhadap tebal dinding',`sloof ${bs} mm, ring ${br} mm ≥ tebal dinding ${fmt(T)} mm`,'praktik');
    add(dAng>=10&&La>=400&&(bt.ringan?sA<=450:nAng<=6),'Angkur kolom ke dinding',`D${dAng}, panjang ${La} mm, tiap ${nAng} lapis (${fmt(sA)} mm). Syarat: diameter ≥ 10 mm, panjang ≥ 400 mm, tiap ≤ 6 lapis bata${bt.ringan?'; untuk bata ringan dipakai jarak setara ±450 mm':''}`,PU);
    add(joint>=jr[0]&&joint<=jr[1],'Tebal spesi',`${joint} mm; lazimnya ${jr[0]} sampai ${jr[1]} mm untuk ${bt.ringan?'perekat bata ringan':'bata merah'}`,'praktik');
    add(null,'Campuran spesi',`1 PC : ${p.campuran.split(':')[1]} Ps, ${SPESI[p.campuran]}. Persyaratan PU memakai 1 : 4 untuk pasangan dan plester dinding`,PU);
    add(null,'Ukuran bata',bt.nama+(bond==='full'?', ikatan 1 bata':', ikatan ½ bata'),bt.ringan?'praktik':'SNI 15-2094-2000');
    add(null,'Plesteran','setebal 2 cm dengan campuran 1 : 4. Lapisan ini disembunyikan secara bawaan; nyalakan di panel Lapisan',PU);
    const views=[
      {title:'Tampak dinding',sub:`${bt.nama}, ${bond==='full'?'1 bata':'½ bata'}, spesi ${joint} mm`,n:'z',u:'x',v:'y',skipMat:['plester'],layers:['kp','sloof','ring','angkur'],maxH:380,
        dims:[{a:[0,-hs-450],b:[L,-hs-450],off:-12,t:`L = ${fmt(L)}`},{a:[L+bk+300,0],b:[L+bk+300,H],off:14,t:`H = ${fmt(H)}`}]},
      {title:'Potongan horizontal di lapis angkur',sub:`angkur D${dAng}-${fmt(sA)} mm, panjang ${La} mm`,n:'y',at:yA0,half:Math.max(dAng,joint)/2+1,u:'x',v:'z',skipMat:['plester'],maxH:200},
      {title:'Potongan melintang dinding',n:'x',at:L/2+3,half:sk/2,u:'z',v:'y',skipMat:['plester'],maxH:420,dims:[{a:[-T/2,H+hr],b:[T/2,H+hr],off:-10,t:`tebal ${fmt(T)}`}]}
    ];
    const derived=`tebal dinding = <b>${fmt(T)}</b> mm, jumlah lapis = <b>${w.n}</b><br>luas bidang = <b>${fmt(area,2)}</b> m²<br>bata per m² = <b>${fmt(w.perM2,1)}</b> buah<br>bata satu bidang = <b>${fmt(w.nBata)}</b> buah (belum termasuk sisa potong)<br>spesi per m² = <b>${fmt(w.mortarPerM2,4)}</b> m³<br>spesi satu bidang = <b>${fmt(w.vMortar,3)}</b> m³<br>angkur = <b>${ys.length*2}</b> batang`;
    const layers=[{k:'bata',label:bt.ringan?'Bata ringan':'Bata merah',color:bt.ringan?MAT.ringan:MAT.bata,block:true,ex:[0,0,-900]},{k:'spesi',label:'Spesi',color:MAT.spesi,block:true,ex:[0,0,-1500]},{k:'plester',label:'Plesteran',color:MAT.plester,block:true,off:true,ex:[0,0,-2100]},
      {k:'fondasi',label:'Fondasi batu kali',color:MAT.batu,block:true,ex:[0,-500,0]},{k:'kp',label:'Tulangan kolom praktis',color:COL.long,ex:[0,0,0]},{k:'kps',label:'Sengkang kolom praktis',color:COL.mid,ex:[0,0,0]},
      {k:'sloof',label:'Sloof',color:COL.bot,ex:[0,-250,0]},{k:'ring',label:'Ring balok',color:COL.top,ex:[0,250,0]},{k:'angkur',label:'Angkur dinding',color:COL.dowel,ex:[0,0,600]}];
    return {layers,betonEx:[0,0,900],concrete,zones:[],bars,labels,views,checks:C,derived,camDir:[0.35,0.32,0.9],camK:0.95,cutAxis:'x'};
  }
};
