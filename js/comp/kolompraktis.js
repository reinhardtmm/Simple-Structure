import {COL,fmt,spread,turtle,hoop2D,lift3D,checker,BATA,BATA_OPTS,MAT,bataWall,bentBar,PU,REF_PRAKTIS,NOTE_PRAKTIS} from '../core.js';

const CV=20; // selimut (mm)
// sisi dinding yang menempel pada kolom untuk tiap konfigurasi: [sumbu, arah]
const SIDES={ujung:[['x',1]],tengah:[['x',-1],['x',1]],sudut:[['x',1],['z',1]],T:[['x',-1],['x',1],['z',1]]};

export default {
  id:'kolompraktis', name:'Kolom praktis', sysDependent:false, std:'Persyaratan PU',
  ref:REF_PRAKTIS, checkNote:NOTE_PRAKTIS,
  defaults:{ALL:{cfg:'sudut',H:2800,bk:150,dbk:10,dsk:8,sk:150,jenis:'M-5a',ikatan:'half',joint:10,Lw:900,nAng:6,La:400,dAng:10,bs:150,hs:200,br:150,hr:150}},
  schema:[
    ['Posisi kolom',[{k:'cfg',label:'Pertemuan dinding',opts:[['ujung','Ujung dinding'],['tengah','Tengah dinding'],['sudut','Sudut (bentuk L)'],['T','Pertemuan T']]},{k:'H',label:'Tinggi dinding',unit:'mm',min:1500,max:4000,step:100},{k:'Lw',label:'Panjang dinding yang ditampilkan',unit:'mm',min:400,max:2000,step:50}]],
    ['Kolom praktis',[{k:'bk',label:'Sisi kolom',unit:'mm',min:100,max:300,step:10},{k:'dbk',label:'Diameter tulangan (4 batang)',unit:'D',opts:[10,13]},{k:'dsk',label:'Diameter sengkang',unit:'D',opts:[8,10]},{k:'sk',label:'Jarak sengkang',unit:'mm',min:50,max:300,step:10}]],
    ['Dinding bata',[{k:'jenis',label:'Jenis bata',opts:BATA_OPTS},{k:'ikatan',label:'Ikatan',opts:[['half','½ bata'],['full','1 bata (ikatan Inggris)']],show:(s,p)=>!BATA[p.jenis].ringan},{k:'joint',label:'Tebal spesi',unit:'mm',min:2,max:20,step:1}]],
    ['Angkur dinding',[{k:'nAng',label:'Angkur tiap',unit:'lapis bata',min:1,max:12},{k:'La',label:'Panjang angkur',unit:'mm',min:200,max:800,step:10},{k:'dAng',label:'Diameter angkur',unit:'D',opts:[8,10,13]}]],
    ['Sloof dan ring balok',[{k:'bs',label:'Lebar sloof',unit:'mm',min:100,max:300,step:10},{k:'hs',label:'Tinggi sloof',unit:'mm',min:150,max:400,step:10},{k:'br',label:'Lebar ring balok',unit:'mm',min:100,max:300,step:10},{k:'hr',label:'Tinggi ring balok',unit:'mm',min:100,max:400,step:10}]]
  ],
  teori:{
    common:`<h3>Kolom praktis</h3><p>Kolom praktis adalah kolom beton bertulang kecil yang mengurung pasangan bata. Kolom ini tidak dirancang memikul beban balok atau pelat seperti kolom struktur. Tugasnya mengikat dinding agar tidak runtuh keluar bidang saat gempa, bersama sloof di bawah dan ring balok di atas.</p><ul><li><b>Dicor setelah bata dipasang.</b> Ujung pasangan bata dibuat bergigi, lalu bekisting dipasang dan kolom dicor. Beton mengisi celah gigi sehingga kolom dan dinding terkunci.</li><li><b>Angkur</b> dipasang di siar datar setiap beberapa lapis dan dikaitkan ke tulangan kolom.</li><li><b>Di sudut dan pertemuan T</b>, kolom praktis wajib ada karena di titik inilah dinding yang tegak lurus saling menahan.</li><li><b>Bedanya dengan kolom struktur</b>: kolom struktur dihitung terhadap beban aksial dan momen, memakai tulangan yang lebih besar, dan detailingnya diatur SNI 2847:2019. Bila sebuah kolom menumpu balok atau pelat, kolom itu harus didesain sebagai kolom struktur.</li></ul>`,
    ALL:`<h4>Syarat utama</h4><ul><li>Ukuran 15 × 15 cm, 4 tulangan diameter 10 mm, begel diameter 8 mm berjarak 15 cm, selimut 1,5 cm <span class="pasal">${PU}</span>.</li><li>Ujung begel ditekuk 135° sepanjang paling sedikit 5 cm <span class="pasal">${PU}</span>.</li><li>Tulangan kolom diteruskan ke sloof dan ring balok dengan panjang paling pendek 40 kali diameter atau 40 cm <span class="pasal">${PU}</span>.</li><li>Angkur diameter 10 mm, panjang paling sedikit 40 cm, setiap 6 lapis bata <span class="pasal">${PU}</span>.</li><li>Jarak antar kolom paling jauh 3 m dan luas dinding di antaranya paling besar 9 m² <span class="pasal">${PU}</span>.</li></ul><div class="box">Ganti pertemuan dinding ke sudut atau T, lalu buka potongan horizontal di tab Gambar untuk melihat bagaimana angkur masuk ke tiap dinding.</div>`
  },
  build(p){
    const {H,bk,dbk,dsk,sk,joint,Lw,nAng,La,dAng,bs,hs,br,hr}=p;
    const bt=BATA[p.jenis], bond=bt.ringan?'half':p.ikatan, tooth=bt.ringan?0:50, sides=SIDES[p.cfg];
    const h2=bk/2, concrete=[{box:[-h2,h2,0,H,-h2,h2]}], bars=[];
    let wall0=null;
    // dinding, sloof, dan ring di setiap sisi
    for(const [ax,dir] of sides){
      const a0=dir>0?h2:-h2-Lw, a1=dir>0?h2+Lw:-h2;
      const w=bataWall({axis:ax,a0,a1,y0:0,y1:H,c:0,bt,joint,bond,tooth0:dir>0?tooth:0,tooth1:dir>0?0:tooth}); wall0??=w;
      concrete.push({box:w.mortar,mat:'spesi',layer:'spesi'},{boxes:w.boxes,mat:bt.ringan?'ringan':'bata',layer:'bata'});
      const e0=Math.min(a0,-h2), e1=Math.max(a1,h2);
      const bx=(y0,y1,b)=>ax==='x'?[e0,e1,y0,y1,-b/2,b/2]:[-b/2,b/2,y0,y1,e0,e1];
      concrete.push({box:bx(-hs,0,bs)},{box:bx(H,H+hr,br)});
      // tulangan sloof dan ring sepanjang sisi ini
      const beam=(yc,b,h,layer,color,nama)=>{ const as=b/2-CV-dsk-dbk/2, yy=h/2-CV-dsk-dbk/2, inf={t:`Tulangan ${nama} 4D${dbk}`,b:['Menerus melewati kolom praktis.'],pasal:PU};
        for(const s of [-as,as]) for(const y of [yc-yy,yc+yy]) bars.push({pts:ax==='x'?[[e0+20,y,s],[e1-20,y,s]]:[[s,y,e0+20],[s,y,e1-20]],d:dbk,layer,color,info:inf}); };
      beam(-hs/2,bs,hs,'sloof',COL.bot,'sloof'); beam(H+hr/2,br,hr,'ring',COL.top,'ring balok');
    }
    const T=wall0.thick;
    // tulangan kolom: dibengkokkan ke arah dinding (sloof dan ring); di sudut, batang sisi z dibengkokkan ke arah z
    const a=h2-CV-dsk-dbk/2, Lb=Math.max(40*dbk,400), r=3*dbk;
    const yB=-hs+CV+dsk+dbk/2, yT=H+hr-CV-dsk-dbk/2, hasZ=sides.some(s=>s[0]==='z'), xs=sides.filter(s=>s[0]==='x').map(s=>s[1]);
    const iK={t:`Tulangan kolom praktis 4D${dbk}`,b:[`Dibengkokkan ke sloof dan ring balok sepanjang maks(40db; 400) = ${fmt(Lb)} mm.`],pasal:PU};
    for(const u of [-a,a]) for(const z of [-a,a]){
      if(hasZ&&z>0&&(xs.length<2||u>0)){ bars.push({pts:bentBar(z,yB,yT,1,Lb,r).map(([q,y])=>[u,y,q]),d:dbk,layer:'kp',color:COL.long,info:iK}); continue; }
      const dir=xs.length===2?(u<0?-1:1):(xs[0]||1);
      bars.push({pts:bentBar(u,yB,yT,dir,Lb,r).map(([q,y])=>[q,y,z]),d:dbk,layer:'kp',color:COL.long,info:iK});
    }
    const ext=Math.max(50,6*dsk), hoopK=hoop2D(h2-CV-dsk/2,h2-CV-dsk/2,2*dsk,135,ext);
    const iS={t:`Sengkang kolom praktis D${dsk}-${sk}`,b:[`Kait 135° dengan panjang ${fmt(ext)} mm, paling sedikit 5 cm.`],pasal:PU};
    spread(50,H-50,sk).forEach(y=>bars.push({pts:lift3D(hoopK,(u,v,wv)=>[u,y+wv,v],dsk*1.05),d:dsk,layer:'kps',color:COL.mid,info:iS}));
    // angkur ke setiap dinding
    const iA={t:`Angkur D${dAng}, panjang ${fmt(La)} mm`,b:[`Di siar datar setiap ${nAng} lapis bata. Ujung dalamnya ditekuk ke bawah dan dikaitkan ke tulangan kolom di sisi seberang.`],pasal:PU};
    const ys=[]; for(let k=nAng-1;k<wall0.n;k+=nAng){ const y=wall0.courseY(k)+bt.t+joint/2; if(y<H-joint) ys.push(y); }
    const rA=2*dAng;
    ys.forEach(y=>sides.forEach(([ax,dir])=>{ const t=turtle(-dir*a,y-60,Math.PI/2); t.fwd(60-rA).turn(-90*dir,rA).fwd(La-rA);
      bars.push({pts:t.pts.map(([q,yy])=>ax==='x'?[q,yy,0]:[0,yy,q]),d:dAng,layer:'angkur',color:COL.dowel,info:iA}); }));
    const yA0=ys[0]??H/2, yPlain=wall0.courseY(1)+bt.t/2, sA=nAng*wall0.ch;
    const labels=[{p:[0,H+hr+80,0],t:`kolom praktis ${bk} × ${bk}`},...(tooth?[{p:[h2+20,wall0.courseY(1)+bt.t/2,T/2+10],t:'gigi bata',c:'lap'}]:[]),...(ys.length?[{p:[h2+La*0.5,yA0+40,0],t:`angkur tiap ${nAng} lapis`,c:'conf'}]:[])];
    // pemeriksaan
    const {C,add}=checker();
    add(bk>=150,'Ukuran kolom praktis',`${bk} × ${bk} mm ≥ 150 × 150 mm`,PU);
    add(bk>=T,'Kolom terhadap tebal dinding',`sisi kolom ${bk} mm ≥ tebal dinding ${fmt(T)} mm`,'praktik');
    add(dbk>=10,'Tulangan memanjang',`4D${dbk}, paling sedikit 4 batang diameter 10 mm`,PU);
    add(dsk>=8&&sk<=150,'Sengkang',`D${dsk}-${sk}: diameter ≥ 8 mm dan jarak ≤ 150 mm`,PU);
    add(true,'Kait sengkang',`135° dengan panjang ${fmt(ext)} mm ≥ 50 mm`,PU);
    add(true,'Tulangan ke sloof dan ring',`dibengkokkan ${fmt(Lb)} mm = maks(40db; 400 mm)`,PU);
    add(dAng>=10&&La>=400&&(bt.ringan?sA<=450:nAng<=6),'Angkur ke dinding',`D${dAng}, panjang ${La} mm, tiap ${nAng} lapis (${fmt(sA)} mm) ke ${sides.length} dinding`,PU);
    add(null,'Selimut beton',`${CV} mm. Persyaratan PU menyebut 1,5 cm; dinding biasanya diplester sehingga selimut ikut terlindung`,PU);
    add(tooth?true:null,'Gigi pasangan bata',tooth?`lapis berselang menjorok ${tooth} mm ke dalam kolom`:'bata ringan umumnya tidak dibuat bergigi; andalkan angkur','praktik');
    add(null,'Kolom praktis atau kolom struktur','kolom ini tidak boleh menumpu balok atau pelat. Bila menumpu, desain sebagai kolom struktur (SNI 2847:2019 Pasal 10 atau 18)','praktik');
    const views=[
      {title:'Potongan horizontal di lapis angkur',sub:`angkur D${dAng} panjang ${La} mm`,n:'y',at:yA0,half:Math.max(dAng,joint)/2+1,u:'x',v:'z',maxH:300,dims:[{a:[-h2,-h2],b:[h2,-h2],off:-14,t:`${bk}`}]},
      {title:'Potongan horizontal di lapis bata',sub:'gigi bata masuk ke dalam kolom pada lapis berselang',n:'y',at:yPlain,half:dsk,u:'x',v:'z',maxH:300},
      {title:'Tampak samping',n:'z',u:'x',v:'y',layers:['kp','kps','angkur','sloof','ring'],maxH:420,dims:[{a:[h2+60,0],b:[h2+60,H],off:12,t:`H = ${fmt(H)}`}]}
    ];
    const derived=`tebal dinding = <b>${fmt(T)}</b> mm<br>panjang bengkokan tulangan = <b>${fmt(Lb)}</b> mm<br>jarak vertikal angkur = <b>${fmt(sA)}</b> mm<br>jumlah angkur = <b>${ys.length*sides.length}</b> batang<br>jumlah sengkang = <b>${spread(50,H-50,sk).length}</b>`;
    const layers=[{k:'bata',label:bt.ringan?'Bata ringan':'Bata merah',color:bt.ringan?MAT.ringan:MAT.bata,block:true,ex:[0,0,0]},{k:'spesi',label:'Spesi',color:MAT.spesi,block:true,ex:[0,0,0]},
      {k:'kp',label:'Tulangan kolom praktis',color:COL.long,ex:[0,0,0]},{k:'kps',label:'Sengkang',color:COL.mid,ex:[0,0,0]},{k:'angkur',label:'Angkur dinding',color:COL.dowel,ex:[0,300,0]},
      {k:'sloof',label:'Sloof',color:COL.bot,ex:[0,-300,0]},{k:'ring',label:'Ring balok',color:COL.top,ex:[0,300,0]}];
    return {layers,betonEx:[0,0,0],concrete,zones:[],bars,labels,views,checks:C,derived,camDir:[0.75,0.45,0.8],camK:1.2,cutAxis:'y'};
  }
};
