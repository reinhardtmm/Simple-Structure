import {COL,fmt,spread,turtle,hoop2D,lift3D,checker,BATA,MAT,SPESI,SPESI_TABEL,bataWall,trapesium,PU,REF_PRAKTIS,NOTE_PRAKTIS} from '../core.js';

export default {
  id:'batukali', name:'Fondasi batu kali', sysDependent:false, std:'Persyaratan PU',
  ref:REF_PRAKTIS, checkNote:NOTE_PRAKTIS,
  defaults:{ALL:{a:300,B:600,hf:600,ta:150,tp:50,Lf:1800,campuran:'1:4',bs:150,hs:200,db:10,ds:8,s:150,angS:1000,dAng:10,dinding:true}},
  schema:[
    ['Penampang fondasi',[{k:'a',label:'Lebar atas',unit:'mm',min:200,max:600,step:10},{k:'B',label:'Lebar bawah',unit:'mm',min:300,max:1200,step:10},{k:'hf',label:'Tinggi pasangan batu kali',unit:'mm',min:300,max:1200,step:10},
      {k:'ta',label:'Tebal aanstamping',unit:'mm',min:0,max:300,step:10},{k:'tp',label:'Tebal pasir urug',unit:'mm',min:0,max:200,step:10},{k:'campuran',label:'Campuran spesi',opts:Object.keys(SPESI).map(k=>[k,`1 PC : ${k.split(':')[1]} Ps`])}]],
    ['Sloof praktis di atasnya',[{k:'bs',label:'Lebar sloof',unit:'mm',min:100,max:300,step:10},{k:'hs',label:'Tinggi sloof',unit:'mm',min:150,max:400,step:10},{k:'db',label:'Diameter tulangan (4 batang)',unit:'D',opts:[10,13]},{k:'ds',label:'Diameter sengkang',unit:'D',opts:[8,10]},{k:'s',label:'Jarak sengkang',unit:'mm',min:50,max:300,step:10}]],
    ['Angkur dan tampilan',[{k:'angS',label:'Jarak angkur',unit:'mm',min:300,max:2000,step:50},{k:'dAng',label:'Diameter angkur',unit:'D',opts:[8,10,13]},{k:'Lf',label:'Panjang fondasi yang ditampilkan',unit:'mm',min:800,max:4000,step:100},{k:'dinding',label:'Tampilkan dinding bata di atasnya',type:'bool'}]]
  ],
  teori:{
    common:`<h3>Fondasi batu kali</h3><p>Fondasi batu kali, atau fondasi batu belah, adalah fondasi menerus dari batu yang direkatkan dengan spesi. Fondasi ini dipakai di bawah dinding bata pada rumah satu atau dua lantai dengan tanah keras yang tidak terlalu dalam. Bentuknya trapesium: lebar di bawah untuk menyebarkan beban ke tanah, menyempit di atas sesuai lebar sloof.</p><ul><li><b>Pasir urug</b> di dasar galian meratakan dasar dan menjadi alas.</li><li><b>Aanstamping</b> adalah batu kosong yang dipasang berdiri dan dikunci tanpa spesi. Lapisan ini membantu drainase dan menjadi lantai kerja bagi pasangan di atasnya.</li><li><b>Pasangan batu kali</b> disusun dengan spesi, batu besar di bawah, dan rongga diisi penuh agar tidak ada batu yang saling bersentuhan tanpa spesi.</li><li><b>Sloof praktis</b> di atasnya diikat ke fondasi dengan angkur.</li><li>Batu kali bukan beton bertulang, sehingga fondasi ini tidak diatur SNI 2847:2019. Untuk gedung bertingkat, tanah lunak, atau beban kolom besar, gunakan fondasi beton bertulang seperti fondasi telapak atau tiang.</li></ul>`,
    ALL:`<h4>Ukuran yang lazim</h4><ul><li>Kedalaman pasangan 60 cm, lebar atas 30 cm, dan lebar bawah 60 cm, menurut buku saku PU untuk rumah sederhana. Angka ini diambil dari ringkasan sekunder.</li><li>Angkur besi diameter 10 mm dari fondasi ke sloof dengan jarak paling jauh 1 m <span class="pasal">${PU}</span>.</li><li>Kemiringan sisi fondasi umumnya tidak lebih landai dari sekitar 60° terhadap horizontal, agar beban menyebar ke seluruh lebar dasar.</li></ul><h4>Campuran spesi</h4>${SPESI_TABEL}`
  },
  build(p){
    const {a,B,hf,ta,tp,Lf,bs,hs,db,ds,s,angS,dAng}=p;
    const z0=-Lf/2, z1=Lf/2, cover=40;
    const concrete=[
      {prism:{pts:trapesium(a,B,0,hf),z0,z1},mat:'batu',layer:'batu'},
      ...(ta>0?[{box:[-B/2,B/2,-hf-ta,-hf,z0,z1],mat:'aanstamping',layer:'alas'}]:[]),
      ...(tp>0?[{box:[-B/2-75,B/2+75,-hf-ta-tp,-hf-ta,z0,z1],mat:'pasir',layer:'alas'}]:[]),
      {box:[-bs/2,bs/2,0,hs,z0,z1]}
    ];
    if(p.dinding){ const w=bataWall({axis:'z',a0:z0,a1:z1,y0:hs,y1:hs+620,c:0,bt:BATA['M-5a'],joint:10});
      concrete.push({box:w.mortar,mat:'spesi',layer:'bata'},{boxes:w.boxes,mat:'bata',layer:'bata'}); }
    const bars=[];
    const as=bs/2-cover-ds-db/2, yt=hs-cover-ds-db/2, yb=cover+ds+db/2;
    const iL={t:`Tulangan sloof 4D${db}`,b:['Sloof praktis di atas fondasi batu kali.'],pasal:PU};
    for(const x of [-as,as]) for(const y of [yt,yb]) bars.push({pts:[[x,y,z0+30],[x,y,z1-30]],d:db,layer:'sloof',color:COL.bot,info:iL});
    const ext=Math.max(50,6*ds), hp=hoop2D(bs/2-cover-ds/2,hs/2-cover-ds/2,2*ds,135,ext);
    spread(z0+50,z1-50,s).forEach(z=>bars.push({pts:lift3D(hp,(u,v,w)=>[u,hs/2+v,z+w],ds*1.05),d:ds,layer:'sloof',color:COL.mid,info:{t:`Sengkang sloof D${ds}-${s}`,b:['Kait 135°.'],pasal:PU}}));
    const za=spread(z0+150,z1-150,angS), rA=2*dAng, emb=Math.min(300,hf-100);
    const iA={t:`Angkur fondasi D${dAng}`,b:[`Ditanam ${emb} mm di pasangan batu kali saat fondasi dipasang, lalu masuk ke sloof.`],pasal:PU};
    za.forEach(z=>{ const t=turtle(-100,-emb,0); t.fwd(100-rA).turn(90,rA).fwd(emb+hs-cover-ds-db-60-2*rA).turn(-90,rA).fwd(100-rA); bars.push({pts:t.pts.map(([x,y])=>[x,y,z]),d:dAng,layer:'angkur',color:COL.dowel,info:iA}); });
    const area=(a+B)/2*hf, deep=hf+ta+tp, slope=Math.atan2(hf,(B-a)/2)*180/Math.PI;
    const labels=[{p:[0,-hf/2,z1+20],t:'pasangan batu kali'},...(ta>0?[{p:[0,-hf-ta/2,z1+20],t:'aanstamping'}]:[]),...(tp>0?[{p:[B/2+40,-hf-ta-tp/2,z1],t:'pasir urug'}]:[]),{p:[0,hs+40,z1],t:'sloof praktis'}];
    const {C,add}=checker();
    const sAct=za.length>1?za[1]-za[0]:0;
    add(hf>=600,'Kedalaman pasangan',`${hf} mm ≥ 600 mm`,'Buku saku PU rumah sederhana');
    add(a>=300,'Lebar atas',`${a} mm ≥ 300 mm`,'Buku saku PU rumah sederhana');
    add(B>=600,'Lebar bawah',`${B} mm ≥ 600 mm`,'Buku saku PU rumah sederhana');
    add(a>=bs,'Dudukan sloof',`lebar atas ${a} mm ≥ lebar sloof ${bs} mm`,'praktik');
    add(slope>=60,'Kemiringan sisi fondasi',`${fmt(slope,1)}° terhadap horizontal, lazimnya ≥ 60°`,'praktik');
    add(ta>=100&&ta<=200,'Tebal aanstamping',`${ta} mm, lazimnya 100 sampai 200 mm`,'praktik');
    add(tp>=50,'Pasir urug',`${tp} mm, lazimnya ≥ 50 mm`,'praktik');
    add(dAng>=10&&sAct<=1000+0.5,'Angkur sloof ke fondasi',`D${dAng} tiap ${fmt(sAct)} mm. Syarat: diameter ≥ 10 mm, jarak ≤ 1.000 mm`,PU);
    add(null,'Campuran spesi',`1 PC : ${p.campuran.split(':')[1]} Ps, ${SPESI[p.campuran]}`,'praktik');
    add(null,'Batas penggunaan','fondasi batu kali tidak diatur SNI 2847:2019. Untuk gedung bertingkat atau tanah lunak gunakan fondasi beton bertulang','praktik');
    const views=[{title:'Potongan melintang fondasi',sub:`batu kali 1 PC : ${p.campuran.split(':')[1]} Ps, sloof ${bs} × ${hs}`,n:'z',at:(za[0]??0)+2,half:dAng*2,u:'x',v:'y',maxH:520,
      dims:[{a:[-a/2,0],b:[a/2,0],off:-22,t:`a = ${a}`},{a:[-B/2,-hf],b:[B/2,-hf],off:-10,t:`B = ${B}`},{a:[B/2+120,-hf],b:[B/2+120,0],off:14,t:`${hf}`},
        ...(ta+tp>0?[{a:[B/2+120,-deep],b:[B/2+120,-hf],off:14,t:`${ta+tp}`}]:[])]}];
    const derived=`luas penampang batu kali = <b>${fmt(area/1e6,3)}</b> m²<br>volume pasangan per meter = <b>${fmt(area/1e6,3)}</b> m³/m<br>kedalaman galian dari bawah sloof = <b>${fmt(deep)}</b> mm<br>kemiringan sisi = <b>${fmt(slope,1)}°</b><br>jumlah angkur yang ditampilkan = <b>${za.length}</b>`;
    const layers=[{k:'batu',label:'Pasangan batu kali',color:MAT.batu,block:true,ex:[0,0,0]},{k:'alas',label:'Aanstamping dan pasir',color:MAT.aanstamping,block:true,ex:[0,-400,0]},
      {k:'bata',label:'Dinding bata',color:MAT.bata,block:true,ex:[0,700,0]},{k:'sloof',label:'Tulangan sloof',color:COL.bot,ex:[0,450,0]},{k:'angkur',label:'Angkur fondasi',color:COL.dowel,ex:[0,200,0]}];
    return {layers,betonEx:[0,450,0],concrete,zones:[],bars,labels,views,checks:C,derived,camDir:[0.85,0.3,0.75],camK:0.95,cutAxis:'z'};
  }
};
