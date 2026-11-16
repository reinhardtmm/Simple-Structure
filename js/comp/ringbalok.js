import {COL,fmt,spread,turtle,hoop2D,lift3D,bentBar,bataWall,BATA,BATA_OPTS,MAT,checker,PU,REF_PRAKTIS,NOTE_PRAKTIS} from '../core.js';

/* Ring balok dan balok lintel (latei) praktis.
   Satu bidang dinding bata di antara dua kolom praktis, dengan satu bukaan pintu atau jendela.
   Sumber dan statusnya:
   - Ring balok (balok keliling): persyaratan PU bangunan sederhana. Yang terbaca langsung dari lampiran peraturan yang dirujuk
     proyek ini: begel ditekuk 135° paling sedikit 5 cm, tulangan kolom dibengkokkan ke dalam ring paling pendek 40 × diameter
     atau 40 cm, dan selimut 1,5 cm pada gambar dimensi tulangan ring. Ukuran 12 × 15 cm, tulangan utama 10 mm, dan begel 8 mm
     berjarak 15 cm berasal dari kutipan sekunder persyaratan yang sama.
   - Balok lintel: persyaratan PU yang dirujuk tidak memuat ukuran lintel. Pedoman teknis rumah tahan gempa (Ditjen Cipta Karya,
     2006, dari kutipan sekunder) hanya meminta lintel dipasang di atas kusen dan ujungnya menyatu dengan kolom terdekat.
     Ukuran, tulangan, dan panjang tumpuan di sini adalah praktik umum, sehingga ditandai 'praktik' dan tidak dinilai lolos/gagal. */
const CV=15, PED='Pedoman teknis rumah tahan gempa 2006 (kutipan sekunder)';
export default {
  id:'ringbalok', name:'Ring balok dan lintel', sysDependent:false, noCombo:true, std:'Persyaratan PU',
  ref:REF_PRAKTIS+' Ketentuan balok lintel di atas bukaan diambil dari Pedoman Teknis Rumah dan Bangunan Gedung Tahan Gempa (Ditjen Cipta Karya, 2006) lewat kutipan sekunder; ukurannya praktik umum.', checkNote:NOTE_PRAKTIS,
  defaults:{ALL:{L:3000,Hd:3000,bk:150,jenis:'M-5a',br:120,hr:150,db:10,ds:8,s:150,wo:900,sill:0,ho:2100,xo:1050,hl:150,ujung:'kolom',tum:200}},
  schema:[
    ['Dinding',[{k:'L',label:'Jarak bersih antar kolom praktis',unit:'mm',min:1500,max:4000,step:50},{k:'Hd',label:'Tinggi dinding sampai bawah ring',unit:'mm',min:2400,max:4000,step:50},{k:'bk',label:'Sisi kolom praktis',unit:'mm',min:100,max:250,step:10},{k:'jenis',label:'Jenis bata',opts:BATA_OPTS}]],
    ['Ring balok',[{k:'br',label:'Lebar ring balok',unit:'mm',min:80,max:250,step:10},{k:'hr',label:'Tinggi ring balok',unit:'mm',min:100,max:300,step:10},{k:'db',label:'Diameter tulangan utama (4 batang)',unit:'D',opts:[8,10,13]},{k:'ds',label:'Diameter begel',unit:'D',opts:[6,8,10]},{k:'s',label:'Jarak begel',unit:'mm',min:50,max:300,step:10}]],
    ['Bukaan',[{k:'wo',label:'Lebar bukaan',unit:'mm',min:400,max:2400,step:50},{k:'sill',label:'Tinggi ambang bawah (0 = pintu)',unit:'mm',min:0,max:1500,step:50},{k:'ho',label:'Tinggi sisi atas bukaan',unit:'mm',min:1500,max:2600,step:50},{k:'xo',label:'Jarak bukaan dari kolom kiri',unit:'mm',min:0,max:3000,step:50}]],
    ['Balok lintel',[{k:'hl',label:'Tinggi lintel',unit:'mm',min:100,max:250,step:10},{k:'ujung',label:'Ujung lintel',opts:[['kolom','Diteruskan sampai kolom praktis'],['tumpu','Menumpu di pasangan bata']]},{k:'tum',label:'Panjang tumpuan di tiap sisi',unit:'mm',min:100,max:400,step:10,show:(s,p)=>p.ujung==='tumpu'}]]
  ],
  teori:{
    common:`<h3>Ring balok dan balok lintel</h3><p>Dinding bata kuat menahan beban tegak, tetapi mudah retak dan roboh saat digoyang gempa. Karena itu dinding dibingkai beton bertulang di semua sisinya: sloof di bawah, kolom praktis di kiri dan kanan, dan <b>ring balok</b> (balok keliling) di atas. Bingkai ini membuat seluruh dinding bergerak sebagai satu kesatuan.</p><ul><li><b>Ring balok</b> dicor di atas pasangan bata, menerus mengelilingi bangunan, dan menjadi dudukan kuda-kuda atap.</li><li><b>Tulangan kolom praktis</b> diteruskan dan dibengkokkan masuk ke ring balok, sehingga kolom dan ring terikat di sudutnya.</li><li><b>Balok lintel</b> (latei) dipasang tepat di atas kusen pintu atau jendela. Lintel memikul bata di atas bukaan supaya kusen tidak ikut menahan beban, dan mengikat tepi bukaan yang merupakan titik lemah dinding.</li><li>Lintel paling baik bila ujungnya menyatu dengan kolom di kiri dan kanannya, bukan hanya menumpang di atas bata.</li></ul>`,
    ALL:`<h4>Ring balok</h4><ul><li>Ukuran 12 × 15 cm dengan tulangan utama diameter 10 mm dan begel diameter 8 mm berjarak 15 cm <span class="pasal">${PU}</span>.</li><li>Ujung begel ditekuk 135° sepanjang paling sedikit 5 cm <span class="pasal">${PU}</span>.</li><li>Tulangan kolom diteruskan dan dibengkokkan ke dalam ring balok dengan panjang lewatan paling pendek 40 kali diameter atau 40 cm <span class="pasal">${PU}</span>.</li><li>Selimut beton 1,5 cm pada gambar dimensi tulangan ring <span class="pasal">${PU}</span>.</li><li>Luas bidang dinding di antara pengikatnya paling besar 9 m² dan jarak kolom paling jauh 3 m <span class="pasal">${PU}</span>.</li></ul><h4>Balok lintel</h4><ul><li>Dipasang tepat di atas kusen, dan ujungnya menyatu dengan kolom terdekat <span class="pasal">${PED}</span>.</li><li>Persyaratan PU yang dirujuk tidak memuat ukuran lintel. Di lapangan lintel umumnya dibuat selebar dinding dengan tinggi 10 sampai 15 cm, tulangan dan begel seperti ring balok. Bila lintel hanya menumpu di atas bata, panjang tumpuannya umumnya paling sedikit 20 cm di setiap sisi. Angka-angka ini praktik umum, bukan ketentuan standar.</li></ul><div class="box">Ubah ujung lintel menjadi menumpu di pasangan bata, lalu bandingkan dengan lintel yang diteruskan sampai kolom praktis.</div>`
  },
  build(p){
    const {L,Hd,bk,br,hr,db,ds,s,hl,tum}=p, bt=BATA[p.jenis], joint=bt.ringan?3:10;
    const T=bt.w, toCol=p.ujung==='kolom';
    // bukaan dijaga di dalam bidang dinding dan di bawah ring
    const wo=Math.min(p.wo,L-400), xo=Math.min(Math.max(p.xo,200),L-wo-200), x1o=xo+wo;
    const ho=Math.min(p.ho,Hd-hl-2*(bt.t+joint)), sill=Math.min(p.sill,ho-600);
    const xl0=toCol?0:Math.max(0,xo-tum), xl1=toCol?L:Math.min(L,x1o+tum);
    const xa=-bk-250, xb=L+bk+250, hs=200;
    const concrete=[{box:[xa,xb,-hs,0,-75,75],kind:'stub'},{box:[-bk,0,0,Hd,-bk/2,bk/2]},{box:[L,L+bk,0,Hd,-bk/2,bk/2]},{box:[xa,xb,Hd,Hd+hr,-br/2,br/2]},{box:[xl0,xl1,ho,ho+hl,-T/2,T/2]}];
    // pasangan bata disusun per bidang di sekeliling bukaan dan lintel; spesi didaftarkan lebih dulu supaya tergambar di bawah bata
    const ch=bt.t+joint, mort=[], bricks=[]; let nB=0;
    const wall=(a0,a1,y0,y1)=>{ if(a1-a0<60||y1-y0<ch) return; const w=bataWall({axis:'x',a0,a1,y0,y1,c:0,bt,joint,bond:'half'}); mort.push(w.mortar); bricks.push(...w.boxes); nB+=w.nBata; };
    wall(0,xo,0,ho); wall(x1o,L,0,ho); if(sill>0) wall(xo,x1o,0,sill);
    if(!toCol){ wall(0,xl0,ho,ho+hl); wall(xl1,L,ho,ho+hl); }
    wall(0,L,ho+hl,Hd);
    // spesi dimundurkan 5 mm dari muka bata supaya kedua permukaan tidak berebut kedalaman saat dilihat dari jauh
    concrete.push({boxes:mort.map(b=>[b[0],b[1],b[2],b[3],b[4]+4,b[5]-4]),mat:'spesi',layer:'spesi'});
    concrete.push({boxes:bricks,mat:bt.ringan?'ringan':'bata',layer:'bata'});
    const bars=[], ext=Math.max(50,6*ds), Lb=Math.max(40*db,400), r=3*db;
    // ring balok
    const as=br/2-CV-ds-db/2, yy=hr/2-CV-ds-db/2, yR=Hd+hr/2;
    const iR={t:`Tulangan ring balok 4D${db}`,b:['Menerus di atas dinding dan melewati kolom praktis. Sambungan lewatan paling sedikit 40db atau 40 cm.'],pasal:PU};
    for(const z of [-as,as]) for(const y of [yR-yy,yR+yy]) bars.push({pts:[[xa+20,y,z],[xb-20,y,z]],d:db,layer:'ring',color:COL.top,info:iR});
    const hpR=hoop2D(br/2-CV-ds/2,hr/2-CV-ds/2,2*ds,135,ext), xsR=spread(xa+50,xb-50,s);
    const iRS={t:`Begel ring balok D${ds}-${s}`,b:[`Kait 135° dengan panjang ${fmt(ext)} mm, paling sedikit 5 cm.`],pasal:PU};
    xsR.forEach(x=>bars.push({pts:lift3D(hpR,(u,v,w)=>[x+w,yR+v,u],ds*1.05),d:ds,layer:'ringS',color:COL.mid,info:iRS}));
    // kolom praktis: tulangan dibengkokkan ke sloof dan ke ring balok, ke arah dinding
    const a=bk/2-CV-ds-db/2, yB=-hs+40, yT=yR+yy-db*1.2;
    const iK={t:`Tulangan kolom praktis 4D${db}`,b:[`Diteruskan dan dibengkokkan ke dalam ring balok sepanjang maks(40db; 400) = ${fmt(Lb)} mm.`],pasal:PU};
    [[-bk/2,1],[L+bk/2,-1]].forEach(([xc,dir])=>{ for(const u of [-a,a]) for(const z of [-a,a]) bars.push({pts:bentBar(xc+u,yB,yT-(u*dir>0?0:db*1.1),dir,Lb,r).map(([x,y])=>[x,y,z]),d:db,layer:'kp',color:COL.long,info:iK}); });
    const hpK=hoop2D(bk/2-CV-ds/2,bk/2-CV-ds/2,2*ds,135,ext), iKS={t:`Begel kolom praktis D${ds}-150`,b:['Kait 135° paling sedikit 5 cm.'],pasal:PU};
    for(const xc of [-bk/2,L+bk/2]) spread(50,Hd-50,150).forEach(y=>bars.push({pts:lift3D(hpK,(u,v,w)=>[xc+u,y+w,v],ds*1.05),d:ds,layer:'kp',color:COL.mid,info:iKS}));
    // balok lintel: 4 batang dan begel; bila diteruskan ke kolom, ujungnya dibengkokkan di dalam kolom
    const zl=Math.max(T/2-CV-ds-db/2,db/2+6), yl=hl/2-CV-ds-db/2, yL=ho+hl/2, inCol=bk-CV-ds, tail=Math.max(Lb-inCol,12*db);
    const iLn={t:`Tulangan lintel 4D${db}`,b:[toCol?`Diteruskan sampai kolom praktis dan dibengkokkan di dalamnya; panjang di dalam kolom ${fmt(inCol+tail)} mm, mengikuti kebiasaan 40db.`:`Lurus, menumpu ${fmt(Math.min(xo-xl0,xl1-x1o))} mm di atas pasangan bata di setiap sisi bukaan.`],pasal:toCol?PED:'praktik'};
    for(const z of [-zl,zl]) for(const sg of [1,-1]){ const y=yL+sg*yl;
      if(toCol){ const t=turtle(-inCol,y-sg*(tail+r),sg*Math.PI/2); t.fwd(tail).turn(-90*sg,r).fwd(L+2*inCol-2*r).turn(-90*sg,r).fwd(tail); bars.push({pts:t.pts.map(([x,yv])=>[x,yv,z]),d:db,layer:'lintel',color:COL.bot,info:iLn}); }
      else bars.push({pts:[[xl0+20,y,z],[xl1-20,y,z]],d:db,layer:'lintel',color:COL.bot,info:iLn}); }
    const hpL=hoop2D(zl+db/2+ds/2,hl/2-CV-ds/2,Math.min(2*ds,zl),135,ext), xsL=spread(xl0+50,xl1-50,150);
    const iLS={t:`Begel lintel D${ds}-150`,b:['Seperti begel ring balok, dengan kait 135°.'],pasal:'praktik'};
    xsL.forEach(x=>bars.push({pts:lift3D(hpL,(u,v,w)=>[x+w,yL+v,u],ds*1.05),d:ds,layer:'lintelS',color:COL.conf,info:iLS}));
    const labels=[{p:[L/2,Hd+hr+70,br/2],t:`ring balok ${br} × ${hr}`,follow:'ring'},{p:[xo+wo/2,ho+hl+60,T/2+20],t:`lintel ${fmt(T)} × ${hl}`,c:'conf',follow:'lintel'},
      {p:[xo+wo/2,(sill+ho)/2,0],t:sill>0?`jendela ${fmt(wo)} × ${fmt(ho-sill)}`:`pintu ${fmt(wo)} × ${fmt(ho)}`,follow:null},{p:[-bk/2,Hd*0.45,bk/2+30],t:'kolom praktis'},{p:[-bk/2+Lb*0.5,Hd+hr+70,-br/2],t:`bengkokan ${fmt(Lb)} mm`,c:'lap',follow:'kp'}];
    // pemeriksaan
    const area=L*Hd/1e6, sAct=xsR.length>1?xsR[1]-xsR[0]:s, bear=Math.min(xo-xl0,xl1-x1o);
    const {C,add}=checker();
    add(br>=120&&hr>=150,'Ukuran ring balok',`${br} × ${hr} mm ≥ 120 × 150 mm`,PU);
    add(db>=10,'Tulangan utama ring balok',`4D${db}, diameter ≥ 10 mm`,PU);
    add(ds>=8&&sAct<=150.5,'Begel ring balok',`D${ds}-${fmt(sAct)}: diameter ≥ 8 mm dan jarak ≤ 150 mm`,PU);
    add(true,'Kait begel',`135° dengan panjang ${fmt(ext)} mm ≥ 50 mm`,PU);
    add(true,'Tulangan kolom ke ring balok',`dibengkokkan ${fmt(Lb)} mm = maks(40db; 400 mm) di dalam ring balok`,PU);
    add(null,'Selimut beton ring balok',`${CV} mm, sesuai gambar dimensi tulangan ring pada persyaratan PU. Dinding biasanya diplester sehingga selimut ikut terlindung`,PU);
    add(br<=T+60,'Lebar ring terhadap tebal dinding',`ring ${br} mm di atas dinding setebal ${fmt(T)} mm (belum termasuk plester)`,'praktik');
    add(area<=9+1e-6&&L<=3000,'Luas bidang dinding dan jarak kolom',`${fmt(area,2)} m² ≤ 9 m²; jarak bersih kolom ${fmt(L)} mm ≤ 3.000 mm`,PU);
    add(null,'Ring balok menerus','ring balok tidak boleh terputus dan mengelilingi seluruh dinding, sehingga bangunan menjadi satu kesatuan','praktik');
    add(toCol?true:null,'Ujung balok lintel',toCol?'diteruskan sampai kedua kolom praktis dan tulangannya diangkur di dalam kolom':'hanya menumpu di pasangan bata. Pedoman meminta ujung lintel menyatu dengan kolom terdekat',PED);
    add(null,'Ukuran dan tulangan lintel',`${fmt(T)} × ${hl} mm, 4D${db}, begel D${ds}-150. Persyaratan PU yang dirujuk tidak memuat ukuran lintel; ini praktik umum`,'praktik');
    if(!toCol) add(null,'Panjang tumpuan lintel',`${fmt(bear)} mm di setiap sisi; umumnya paling sedikit 200 mm`,'praktik');
    add(null,'Bata di atas lintel',`${fmt(Hd-ho-hl)} mm pasangan bata di antara lintel dan ring balok`,'praktik');
    const views=[
      {title:'Tampak depan',sub:`ring 4D${db} D${ds}-${s}, lintel 4D${db} D${ds}-150`,n:'z',u:'x',v:'y',layers:['ring','ringS','kp','lintel','lintelS'],maxH:460,
        dims:[{a:[0,-hs],b:[L,-hs],off:-12,t:`L = ${fmt(L)}`},{a:[xb,0],b:[xb,Hd],off:14,t:`${fmt(Hd)}`},{a:[xo,sill],b:[x1o,sill],off:-10,t:`${fmt(wo)}`,c:COL.conf}]},
      {title:'Potongan melalui bukaan',sub:'ring balok di atas, lintel di atas bukaan',n:'x',at:xo+wo/2,half:80,u:'z',v:'y',skipStub:true,maxH:460,w2:true,layers:['ring','ringS','lintel','lintelS'],
        dims:[{a:[-br/2,Hd+hr],b:[br/2,Hd+hr],off:10,t:`${br}`},{a:[br/2+20,Hd],b:[br/2+20,Hd+hr],off:12,t:`${hr}`},{a:[T/2+20,ho],b:[T/2+20,ho+hl],off:12,t:`${hl}`,c:COL.conf}]}
    ];
    const derived=`tebal dinding = <b>${fmt(T)}</b> mm<br>luas bidang dinding = <b>${fmt(area,2)}</b> m²<br>panjang bengkokan tulangan kolom = <b>${fmt(Lb)}</b> mm<br>panjang lintel = <b>${fmt(xl1-xl0)}</b> mm${toCol?'':`, tumpuan <b>${fmt(bear)}</b> mm per sisi`}<br>jumlah begel ring = <b>${xsR.length}</b>, begel lintel = <b>${xsL.length}</b><br>jumlah bata = <b>${fmt(nB)}</b>`;
    const layers=[{k:'bata',label:bt.ringan?'Bata ringan':'Bata merah',color:bt.ringan?MAT.ringan:MAT.bata,block:true,ex:[0,0,-600]},{k:'spesi',label:'Spesi',color:MAT.spesi,block:true,ex:[0,0,-600]},
      {k:'ring',label:'Tulangan ring balok',color:COL.top,ex:[0,350,0]},{k:'ringS',label:'Begel ring balok',color:COL.mid,ex:[0,350,0]},{k:'kp',label:'Tulangan kolom praktis',color:COL.long,ex:[0,0,0]},
      {k:'lintel',label:'Tulangan lintel',color:COL.bot,ex:[0,0,500]},{k:'lintelS',label:'Begel lintel',color:COL.conf,ex:[0,0,500]}];
    return {layers,betonEx:[0,0,700],concrete,zones:[],bars,labels,views,checks:C,derived,camDir:[0.4,0.3,0.9],camK:0.95,cutAxis:'x'};
  }
};
