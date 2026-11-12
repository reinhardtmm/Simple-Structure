import {AREA,DIAS,COL,fmt,dn5,linspace,turtle,rectCage,lift3D,ashReq,ldhGen,ldhSeis,spread,checker} from '../core.js';

export default {
  id:'hbk', name:'Hubungan balok-kolom', sysDependent:true,
  defaults:{
    SRPMB:{tipe:'interior',bc:450,b:300,h:500,nb:3,dbB:16,nc:3,dbC:16,ds:10,sj:150,fc:30,fy:420,cover:40},
    SRPMK:{tipe:'interior',bc:500,b:400,h:550,nb:3,dbB:19,nc:4,dbC:19,ds:13,sj:100,fc:30,fy:420,cover:40}
  },
  schema:[
    ['Konfigurasi',[{k:'tipe',label:'Tipe joint',opts:[['interior','Interior, balok di 4 sisi'],['tepi','Tepi, balok di 3 sisi']]}]],
    ['Dimensi',[{k:'bc',label:'Sisi kolom (bujur sangkar)',unit:'mm',min:300,max:900,step:25},{k:'b',label:'Lebar balok',unit:'mm',min:200,max:700,step:25},{k:'h',label:'Tinggi balok',unit:'mm',min:300,max:900,step:25}]],
    ['Tulangan',[{k:'nb',label:'Tulangan balok atas dan bawah',unit:'batang',min:2,max:6},{k:'dbB',label:'Diameter tulangan balok',unit:'D',opts:DIAS},{k:'nc',label:'Tulangan kolom per sisi',unit:'batang',min:2,max:7},{k:'dbC',label:'Diameter tulangan kolom',unit:'D',opts:DIAS},{k:'ds',label:'Diameter sengkang',unit:'D',opts:[10,13,16]},{k:'sj',label:'Spasi sengkang di joint',unit:'mm',min:50,max:300,step:5}]],
    ['Material',[{k:'fc',label:"Mutu beton fc'",unit:'MPa',opts:[20,25,30,35,40]},{k:'fy',label:'Mutu baja fy',unit:'MPa',opts:[280,420]},{k:'cover',label:'Selimut beton',unit:'mm',min:25,max:75,step:5}]]
  ],
  teori:{
    common:`<h3>Hubungan balok-kolom (HBK)</h3><p>HBK atau joint adalah volume beton tempat balok dan kolom bertemu. Saat gempa, momen balok di kiri dan kanan joint bekerja searah, sehingga inti joint menerima gaya geser yang sangat besar. Banyak keruntuhan gedung saat gempa berawal dari joint yang tidak diberi sengkang.</p><ul><li><b>Tulangan balok</b> menerus melewati joint interior. Di joint tepi, tulangan balok berhenti dengan kait 90° yang ekornya diarahkan ke dalam joint.</li><li><b>Tulangan kolom</b> menerus melewati joint.</li><li><b>Sengkang joint</b> mengekang inti beton dan menahan tulangan kolom.</li><li>Pada pelaksanaan, tulangan balok arah z diletakkan sedikit di bawah atau di atas tulangan balok arah x supaya tidak bertabrakan.</li></ul>`,
    SRPMB:`<h4>Detailing SRPMB</h4><ul><li>Joint SRPMB adalah bagian sistem pemikul gaya seismik, sehingga pengecualian 15.4.1 tidak berlaku dan joint wajib diberi tulangan transversal <span class="pasal">15.4.1</span>.</li><li><b>Luas kaki sengkang</b> pada setiap arah utama joint diambil terbesar dari 0,062√fc' b s/fyt dan 0,35 b s/fyt, dengan b dimensi kolom tegak lurus arah yang ditinjau <span class="pasal">15.4.2</span>.</li><li><b>Sengkang disebar</b> sepanjang tinggi kolom sekurang-kurangnya setinggi balok tertinggi yang merangka ke joint <span class="pasal">15.4.2.1</span>, dengan spasi tidak lebih dari setengah tinggi balok terendah <span class="pasal">15.4.2.2</span>.</li><li>Kait tulangan balok di joint tepi mengikuti panjang penyaluran kait umum ℓdh <span class="pasal">25.4.3.1</span>.</li></ul><div class="box">Bandingkan dengan SRPMK. Joint SRPMK diisi sengkang rapat sepanjang tinggi balok dan diperiksa dimensinya terhadap diameter tulangan balok.</div>`,
    SRPMK:`<h4>Detailing SRPMK</h4><ul><li><b>Dimensi kolom</b> sejajar tulangan balok minimal 20 kali diameter tulangan balok terbesar. Syarat ini mencegah tulangan balok tergelincir di dalam joint saat beban bolak-balik <span class="pasal">18.8.2.3</span>.</li><li><b>Sengkang joint</b> sama dengan daerah ℓo kolom <span class="pasal">18.8.3.1</span>. Bila balok di keempat sisi lebarnya minimal 3/4 lebar kolom, Ash boleh dikurangi setengah dan spasi boleh sampai 150 mm <span class="pasal">18.8.3.2</span>.</li><li><b>Kait di joint tepi</b> memakai ℓdh = fy db/(5,4√fc') dan ekornya diarahkan ke dalam inti joint <span class="pasal">18.8.5.1</span>.</li><li><b>Kuat geser joint</b> bergantung pada kekangan: 1,7√fc' Aj untuk joint terkekang balok di 4 sisi, 1,2√fc' Aj untuk 3 sisi atau 2 sisi berlawanan, dan 1,0√fc' Aj untuk kasus lainnya. Satu muka dianggap terkekang bila lebar baloknya minimal 3/4 lebar efektif joint <span class="pasal">Tabel 18.8.4.1, 18.8.4.2</span>. Nilai ini tidak dihitung di sini karena butuh gaya dalam.</li></ul>`
  },
  build(p,sys){
    const K=sys==='SRPMK', inter=p.tipe==='interior';
    const {bc,b,h,nb,dbB,nc,dbC,ds,sj,fc,fy,cover}=p;
    const Lb=1100, Lc=800;
    const cg=rectCage({B:bc,H:bc,cover,ds,db:dbC,nu:nc,nv:nc,hook:K?135:90,allSup:K});
    const bars=[];
    const iC={t:`Tulangan kolom ${cg.pos.length}D${dbC}`,b:['Menerus melewati joint.'],pasal:K?'Pasal 18.7.4':'Pasal 10.7'};
    cg.pos.forEach(([x,z])=>bars.push({pts:[[x,-h/2-Lc,z],[x,h/2+Lc,z]],d:dbC,layer:'kolom',color:COL.long,info:iC}));
    // sengkang kolom di atas dan bawah joint
    const sCol=K?sj:Math.min(16*dbC,48*ds,bc,200);
    const ys=[]; for(let y=h/2+50;y<h/2+Lc;y+=sCol) ys.push({y,z:K?'conf':'mid'}); for(let y=-h/2-50;y>-h/2-Lc;y-=sCol) ys.push({y,z:K?'conf':'mid'});
    // sengkang joint
    const jy=spread(-h/2+60,h/2-60-ds,sj);
    const iH={t:`Sengkang kolom D${ds}`,b:['Sengkang kolom di luar joint.'],pasal:K?'Pasal 18.7.5':'Pasal 25.7.2'};
    const iJ={t:`Sengkang joint D${ds}`,b:[K?`Dipasang sepanjang tinggi balok dengan spasi ${fmt(sj)} mm. Mengekang inti joint yang menerima geser besar saat gempa.`:`Disebar sepanjang tinggi balok dengan spasi ${fmt(sj)} mm, tidak lebih dari setengah tinggi balok.`],pasal:K?'Pasal 18.8.3':'Pasal 15.4.2'};
    const iT={t:`Kait silang D${ds}`,b:['Menumpu tulangan kolom di tengah sisi.'],pasal:K?'Pasal 18.7.5.2':'Pasal 25.7.2.3'};
    const addHoop=(y,z,inf,lay)=>{ bars.push({pts:lift3D(cg.hoop,(u,v,w)=>[u,y+w,v],ds*1.05),d:ds,layer:lay,color:COL[z],info:inf}); cg.ties.forEach(t=>bars.push({pts:t.pts.map(([u,v])=>[u,y+ds*1.1,v]),d:ds,layer:'ties',color:COL.tie,info:iT})); };
    ys.forEach(s=>addHoop(s.y,s.z,iH,'sengkangK'));
    jy.forEach(y=>addHoop(y,'joint',iJ,'sengkangJ'));
    // tulangan balok arah x
    const zl=b/2-cover-ds-dbB/2, zs=linspace(-zl,zl,nb);
    const yT=h/2-cover-ds-dbB/2;
    const ldh=K?ldhSeis(fy,fc,dbB):ldhGen(fy,fc,dbB), xEnd=-bc/2+cover+ds+dbC+dbB/2, avail=bc-cover-ds-dbC;
    const rb=4*dbB, tail=12*dbB;
    const iBx={t:`Tulangan balok arah x ${nb}D${dbB}`,b:[inter?'Menerus melewati joint interior.':`Berhenti di joint tepi dengan kait 90°, ekor ${fmt(tail)} mm diarahkan ke dalam joint. ℓdh perlu ${fmt(ldh)} mm.`],pasal:K?'Pasal 18.8.5':'Pasal 25.4.3'};
    zs.forEach(z=>{
      if(inter){ bars.push({pts:[[-bc/2-Lb,yT,z],[bc/2+Lb,yT,z]],d:dbB,layer:'balokX',color:COL.top,info:iBx}); bars.push({pts:[[-bc/2-Lb,-yT,z],[bc/2+Lb,-yT,z]],d:dbB,layer:'balokX',color:COL.bot,info:iBx}); }
      else {
        const t1=turtle(bc/2+Lb,yT,Math.PI); t1.fwd(bc/2+Lb-xEnd-rb).turn(90,rb).fwd(tail); bars.push({pts:t1.pts.map(([x,y])=>[x,y,z]),d:dbB,layer:'balokX',color:COL.top,info:iBx});
        const t2=turtle(bc/2+Lb,-yT,Math.PI); t2.fwd(bc/2+Lb-xEnd-rb-dbB*1.5).turn(-90,rb).fwd(tail); bars.push({pts:t2.pts.map(([x,y])=>[x,y,z]),d:dbB,layer:'balokX',color:COL.bot,info:iBx});
      }
    });
    // tulangan balok arah z (lapis di bawah/atas tulangan arah x)
    const iBz={t:`Tulangan balok arah z ${nb}D${dbB}`,b:['Menerus melewati joint. Diletakkan satu diameter lebih dalam dari tulangan arah x agar tidak bertabrakan.'],pasal:'praktik'};
    zs.forEach(x=>{ bars.push({pts:[[x,yT-dbB*1.05,-bc/2-Lb],[x,yT-dbB*1.05,bc/2+Lb]],d:dbB,layer:'balokZ',color:COL.matT,info:iBz}); bars.push({pts:[[x,-yT+dbB*1.05,-bc/2-Lb],[x,-yT+dbB*1.05,bc/2+Lb]],d:dbB,layer:'balokZ',color:COL.matB,info:iBz}); });
    // sengkang balok
    const d=h-cover-ds-dbB/2, sB=K?dn5(Math.min(d/4,6*dbB,150)):dn5(Math.min(d/2,300));
    const iS={t:`Sengkang balok D${ds}-${sB}`,b:[K?'Daerah 2h balok SRPMK, sengkang pertama 50 mm dari muka kolom.':'Sengkang balok.'],pasal:K?'Pasal 18.6.4':'Pasal 9.7.6'};
    const hp=rectCage({B:b,H:h,cover,ds,db:dbB,nu:2,nv:2,hook:K?135:90,allSup:true}).hoop;
    const xs=[]; for(let x=bc/2+50;x<bc/2+Lb-20;x+=sB) xs.push(x);
    xs.forEach(x=>{
      bars.push({pts:lift3D(hp,(u,v,w)=>[x+w,v,u],ds*1.05),d:ds,layer:'sengkangB',color:COL.mid,info:iS});
      if(inter) bars.push({pts:lift3D(hp,(u,v,w)=>[-x-w,v,u],ds*1.05),d:ds,layer:'sengkangB',color:COL.mid,info:iS});
      bars.push({pts:lift3D(hp,(u,v,w)=>[u,v,x+w],ds*1.05),d:ds,layer:'sengkangB',color:COL.mid,info:iS});
      bars.push({pts:lift3D(hp,(u,v,w)=>[u,v,-x-w],ds*1.05),d:ds,layer:'sengkangB',color:COL.mid,info:iS});
    });
    const concrete=[{box:[-bc/2,bc/2,-h/2,h/2,-bc/2,bc/2]},{box:[-bc/2,bc/2,h/2,h/2+Lc,-bc/2,bc/2],kind:'stub'},{box:[-bc/2,bc/2,-h/2-Lc,-h/2,-bc/2,bc/2],kind:'stub'},
      {box:[bc/2,bc/2+Lb,-h/2,h/2,-b/2,b/2],kind:'stub'},{box:[-b/2,b/2,-h/2,h/2,bc/2,bc/2+Lb],kind:'stub'},{box:[-b/2,b/2,-h/2,h/2,-bc/2-Lb,-bc/2],kind:'stub'}];
    if(inter) concrete.push({box:[-bc/2-Lb,-bc/2,-h/2,h/2,-b/2,b/2],kind:'stub'});
    const zones=[{box:[-bc/2-15,bc/2+15,-h/2,h/2,-bc/2-15,bc/2+15],color:COL.conf}];
    const labels=[{p:[0,h/2+Lc+80,0],t:'kolom'},{p:[bc/2+Lb*0.6,h/2+80,0],t:'balok x'},{p:[0,h/2+80,bc/2+Lb*0.6],t:'balok z'},{p:[-bc/2-60,0,bc/2+60],t:'joint',c:'conf'}];
    // pemeriksaan
    const {C,add}=checker();
    add(cover>=40,'Selimut beton',`${cover} mm ≥ 40 mm`,'Tabel 20.6.1.3.1');
    if(!inter) add(ldh<=avail,'Panjang kait tulangan balok di joint tepi',`ℓdh = ${fmt(ldh)} mm ≤ tersedia ${fmt(avail)} mm`,K?'Pasal 18.8.5.1':'Pasal 25.4.3.1');
    if(K){
      add(bc>=20*dbB,'Dimensi kolom terhadap tulangan balok',`hc = ${bc} mm ≥ 20db = ${20*dbB} mm`,'Pasal 18.8.2.3');
      const reduce=inter&&b>=0.75*bc;
      const so=Math.min(150,Math.max(100,100+(350-cg.hx)/3));
      const sMax=reduce?150:Math.min(bc/4,6*dbC,so);
      add(sj<=sMax+0.5,'Spasi sengkang joint',`s = ${sj} mm ≤ ${fmt(sMax)} mm${reduce?' (boleh 150 mm karena balok di 4 sisi ≥ 3/4 lebar kolom)':' = min(b/4; 6db; so)'}`,reduce?'Pasal 18.8.3.2':'Pasal 18.8.3.1, 18.7.5.3');
      const bcc=bc-2*cover, Ag=bc*bc, Ach=bcc*bcc, req=ashReq(sj,bcc,fc,fy,Ag,Ach)*(reduce?0.5:1), prov=(2+cg.nTieV)*AREA[ds];
      add(prov>=req,'Luas sengkang joint Ash',`${2+cg.nTieV} kaki = ${fmt(prov)} mm² ≥ ${fmt(req)} mm²${reduce?' (sudah direduksi 50%)':''}`,reduce?'Pasal 18.8.3.2':'Pasal 18.8.3.1, 18.7.5.4');
      add(b>=0.75*bc,'Lebar balok terhadap kolom',`b = ${b} mm ${b>=0.75*bc?'≥':'<'} 3/4 hc = ${fmt(0.75*bc)} mm. ${b>=0.75*bc?'Joint dianggap terkekang oleh balok.':'Joint tidak dianggap terkekang balok, tidak ada reduksi.'}`,'Pasal 18.8.3.2',{});
      C.at(-1).ok=null;
      const kj=b>=0.75*bc?(inter?'1,7':'1,2'):'1,0';
      add(null,'Koefisien kuat geser joint',`${kj}√fc' Aj untuk joint dengan balok di ${inter?'4':'3'} sisi${b>=0.75*bc?', setiap muka terkekang':', muka tidak dianggap terkekang karena b < 3/4 lebar kolom'}`,'Tabel 18.8.4.1, 18.8.4.2');
    } else {
      const sMx=h/2, nLeg=2+cg.nTieV, Av=nLeg*AREA[ds], AvReq=Math.max(0.062*Math.sqrt(fc),0.35)*bc*sj/fy;
      add(sj<=sMx+0.5,'Spasi sengkang joint',`s = ${sj} mm ≤ h/2 balok terendah = ${fmt(sMx)} mm`,'Pasal 15.4.2.2');
      add(Av>=AvReq,'Luas kaki sengkang joint',`${nLeg} kaki = ${fmt(Av)} mm² ≥ maks(0,062√fc'; 0,35)·b·s/fyt = ${fmt(AvReq)} mm²`,'Pasal 15.4.2');
      add(true,'Sebaran sengkang joint',`${jy.length} lapis disebar sepanjang tinggi balok ${fmt(h)} mm`,'Pasal 15.4.2.1');
    }
    const views=[
      {title:'Potongan vertikal melalui joint (bidang x-y)',n:'z',at:0,half:Math.max(zl,cg.av)+dbC,u:'x',v:'y',layers:['kolom','balokX','sengkangJ','sengkangK','sengkangB'],maxH:420,dims:[{a:[-bc/2,-h/2-Lc],b:[bc/2,-h/2-Lc],off:-12,t:`hc = ${bc}`},{a:[bc/2+Lb,-h/2],b:[bc/2+Lb,h/2],off:14,t:`h = ${h}`}]},
      {title:'Potongan horizontal di tengah joint',n:'y',at:jy[Math.floor(jy.length/2)]+ds*0.9,half:ds*1.6,u:'x',v:'z',maxH:340,skipStub:true,layers:['kolom','sengkangJ','ties','balokX','balokZ']}
    ];
    const derived=`ℓdh tulangan balok = <b>${fmt(ldh)}</b> mm<br>20 db balok = <b>${20*dbB}</b> mm<br>jumlah sengkang joint = <b>${jy.length}</b><br>hx kolom = <b>${fmt(cg.hx)}</b> mm`;
    return {layers:[{k:'kolom',label:'Tulangan kolom',color:COL.long,ex:[0,0,0]},{k:'balokX',label:'Tulangan balok arah x',color:COL.top,ex:[0,0,-600]},{k:'balokZ',label:'Tulangan balok arah z',color:COL.matT,ex:[600,0,0]},{k:'sengkangJ',label:'Sengkang joint',color:COL.joint,ex:[0,0,0]},{k:'ties',label:'Kait silang',color:COL.tie,ex:[0,0,0]},{k:'sengkangK',label:'Sengkang kolom',color:K?COL.conf:COL.mid,ex:[0,0,0]},{k:'sengkangB',label:'Sengkang balok',color:COL.mid,ex:[0,0,0]}],
      betonEx:[-2200,0,-2200],concrete,zones,bars,labels,views,checks:C,derived,camDir:[0.7,0.55,0.85],camK:0.92,cutAxis:'z'};
  }
};
