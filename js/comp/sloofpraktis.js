import {COL,fmt,spread,turtle,hoop2D,lift3D,checker,MAT,trapesium,PU,REF_PRAKTIS,NOTE_PRAKTIS} from '../core.js';

export default {
  id:'sloofpraktis', name:'Sloof praktis', sysDependent:false, std:'Persyaratan PU',
  ref:REF_PRAKTIS, checkNote:NOTE_PRAKTIS,
  defaults:{ALL:{L:3000,b:150,h:200,db:10,ds:8,s:150,cover:40,bk:150,angS:1000,angE:300,dAng:10,a:300,B:600,hf:600}},
  schema:[
    ['Sloof',[{k:'L',label:'Jarak bersih antar kolom praktis',unit:'mm',min:1000,max:5000,step:100},{k:'b',label:'Lebar sloof',unit:'mm',min:100,max:300,step:10},{k:'h',label:'Tinggi sloof',unit:'mm',min:150,max:400,step:10},{k:'cover',label:'Selimut beton',unit:'mm',min:15,max:75,step:5}]],
    ['Tulangan',[{k:'db',label:'Diameter tulangan (4 batang)',unit:'D',opts:[10,13]},{k:'ds',label:'Diameter sengkang',unit:'D',opts:[8,10]},{k:'s',label:'Jarak sengkang',unit:'mm',min:50,max:300,step:10},{k:'bk',label:'Sisi kolom praktis',unit:'mm',min:100,max:300,step:10}]],
    ['Angkur ke fondasi',[{k:'angS',label:'Jarak angkur',unit:'mm',min:300,max:2000,step:50},{k:'angE',label:'Tertanam di fondasi',unit:'mm',min:100,max:500,step:10},{k:'dAng',label:'Diameter angkur',unit:'D',opts:[8,10,13]}]],
    ['Fondasi batu kali',[{k:'a',label:'Lebar atas',unit:'mm',min:200,max:600,step:10},{k:'B',label:'Lebar bawah',unit:'mm',min:300,max:1200,step:10},{k:'hf',label:'Tinggi pasangan',unit:'mm',min:300,max:1200,step:10}]]
  ],
  teori:{
    common:`<h3>Sloof praktis</h3><p>Sloof praktis adalah balok beton bertulang kecil di atas fondasi menerus, biasanya fondasi batu kali, tepat di bawah dinding bata. Sloof meratakan beban dinding ke fondasi, menjadi dudukan kolom praktis, dan mengikat kaki dinding agar bergerak bersama saat gempa.</p><ul><li><b>Angkur sloof</b> ditanam di pasangan batu kali dan masuk ke sloof, sehingga sloof tidak bergeser di atas fondasi.</li><li><b>Stek kolom praktis</b> dipasang saat sloof dicor. Ujung bawahnya dibengkokkan masuk ke sloof, dan bagian atasnya nanti disambung atau diteruskan menjadi tulangan kolom.</li><li>Karena bersentuhan dengan tanah, sloof memerlukan selimut yang lebih tebal dari kolom praktis.</li></ul><h4>Sloof praktis dan sloof struktur</h4><p>Sloof struktur (tie beam) mengikat fondasi telapak atau pile cap pada gedung beton bertulang, menahan gaya tarik dan tekan akibat gempa, dan detailingnya diatur SNI 2847:2019 Pasal 18.13.3. Sloof praktis tidak dihitung terhadap gaya tersebut; ukurannya mengikuti persyaratan bangunan sederhana. Bila sloof menumpu kolom struktur atau mengikat fondasi telapak, gunakan sloof struktur.</p>`,
    ALL:`<h4>Syarat utama</h4><ul><li>Ukuran paling kecil 15 × 20 cm dengan tulangan utama diameter 10 mm dan begel diameter 8 mm berjarak 15 cm <span class="pasal">${PU}</span>.</li><li>Ujung begel ditekuk 135° sepanjang paling sedikit 5 cm <span class="pasal">${PU}</span>.</li><li>Angkur besi diameter 10 mm dari fondasi ke sloof dengan jarak paling jauh 1 m <span class="pasal">${PU}</span>.</li><li>Tulangan kolom dibengkokkan ke dalam sloof sepanjang paling sedikit 40 kali diameter atau 40 cm <span class="pasal">${PU}</span>.</li><li>Selimut beton yang dicor dengan cetakan dan bersentuhan dengan tanah: 40 mm untuk tulangan D16 ke bawah <span class="pasal">SNI 2847:2019 Tabel 20.6.1.3.1</span>.</li></ul><div class="box">Bandingkan dengan Sloof struktur di kelompok yang sama: ukuran, tulangan, dan cara pengangkurannya berbeda karena perannya berbeda.</div>`
  },
  build(p){
    const {L,b,h,db,ds,s,cover,bk,angS,angE,dAng,a,B,hf}=p;
    const x0=-bk-400, x1=L+bk+400, hk=900;
    const concrete=[
      {box:[x0,x1,-h,0,-b/2,b/2]},
      {box:[-bk,0,0,hk,-bk/2,bk/2],kind:'stub'},{box:[L,L+bk,0,hk,-bk/2,bk/2],kind:'stub'},
      {prism:{axis:'x',pts:trapesium(a,B,-h,hf),x0,x1},mat:'batu',layer:'fondasi'},
      {box:[x0,x1,-h-hf-150,-h-hf,-B/2,B/2],mat:'aanstamping',layer:'fondasi'}
    ];
    const bars=[];
    const as=b/2-cover-ds-db/2, yt=-cover-ds-db/2, yb=-h+cover+ds+db/2;
    const iL={t:`Tulangan sloof 4D${db}`,b:['Menerus melewati kolom praktis. Sambungan lewatan paling sedikit 40db atau 40 cm.'],pasal:PU};
    for(const z of [-as,as]) for(const y of [yt,yb]) bars.push({pts:[[x0+30,y,z],[x1-30,y,z]],d:db,layer:'utama',color:COL.bot,info:iL});
    const ext=Math.max(50,6*ds), hp=hoop2D(b/2-cover-ds/2,h/2-cover-ds/2,2*ds,135,ext);
    const iS={t:`Sengkang sloof D${ds}-${s}`,b:[`Kait 135° dengan panjang ${fmt(ext)} mm, paling sedikit 5 cm.`],pasal:PU};
    spread(x0+50,x1-50,s).forEach(x=>bars.push({pts:lift3D(hp,(u,v,w)=>[x+w,-h/2+v,u],ds*1.05),d:ds,layer:'sengkang',color:COL.mid,info:iS}));
    // stek kolom praktis: lurus ke atas, ujung bawah dibengkokkan ke dalam sloof
    const ak=bk/2-20-8-db/2, Lb=Math.max(40*db,400), r=3*db, yS=yb+db;
    const iK={t:`Stek kolom praktis 4D${db}`,b:[`Ujung bawah dibengkokkan ke dalam sloof sepanjang maks(40db; 400) = ${fmt(Lb)} mm.`],pasal:PU};
    [[-bk/2,1],[L+bk/2,-1]].forEach(([xc,dir])=>{ for(const u of [-ak,ak]) for(const z of [-ak,ak]){
      const t=turtle(xc+u,hk-50,-Math.PI/2); t.fwd(hk-50-yS-r).turn(dir>0?90:-90,r).fwd(Lb-r);
      bars.push({pts:t.pts.map(([x,y])=>[x,y,z]),d:db,layer:'stek',color:COL.long,info:iK}); } });
    // angkur sloof ke fondasi
    const xa=spread(-bk/2,L+bk/2,angS), rA=2*dAng;
    const iA={t:`Angkur fondasi D${dAng}`,b:[`Tertanam ${angE} mm di pasangan batu kali dan masuk ke sloof sampai di bawah tulangan atas. Jarak ${fmt(xa.length>1?xa[1]-xa[0]:0)} mm.`],pasal:PU};
    xa.forEach(x=>{ const t=turtle(x-100,-h-angE,0); t.fwd(100-rA).turn(90,rA).fwd(angE+h-cover-ds-db-60-2*rA).turn(-90,rA).fwd(100-rA);
      bars.push({pts:t.pts.map(([xx,y])=>[xx,y,0]),d:dAng,layer:'angkur',color:COL.dowel,info:iA}); });
    const labels=[{p:[L/2,60,b/2],t:`sloof ${b} × ${h}`},{p:[L*0.3,-h-hf/2,B/2],t:'fondasi batu kali'},{p:[-bk/2,hk+60,0],t:'stek kolom praktis'},{p:[xa[1]??xa[0],-h-angE-60,0],t:`angkur tiap ${fmt(xa.length>1?xa[1]-xa[0]:angS)} mm`,c:'conf'}];
    const {C,add}=checker();
    const sAct=xa.length>1?xa[1]-xa[0]:0;
    add(b>=150&&h>=200,'Ukuran sloof',`${b} × ${h} mm ≥ 150 × 200 mm`,PU);
    add(db>=10,'Tulangan utama',`4D${db}, diameter ≥ 10 mm`,PU);
    add(ds>=8&&s<=150,'Sengkang',`D${ds}-${s}: diameter ≥ 8 mm dan jarak ≤ 150 mm`,PU);
    add(true,'Kait sengkang',`135° dengan panjang ${fmt(ext)} mm ≥ 50 mm`,PU);
    add(cover>=40,'Selimut beton (bersentuhan dengan tanah)',`${cover} mm ≥ 40 mm`,'Tabel 20.6.1.3.1');
    add(dAng>=10&&sAct<=1000+0.5,'Angkur sloof ke fondasi',`D${dAng} tiap ${fmt(sAct)} mm. Syarat: diameter ≥ 10 mm, jarak ≤ 1.000 mm`,PU);
    add(true,'Stek kolom praktis',`dibengkokkan ${fmt(Lb)} mm = maks(40db; 400 mm) di dalam sloof`,PU);
    add(a>=b,'Dudukan sloof di atas fondasi',`lebar atas fondasi ${a} mm ≥ lebar sloof ${b} mm`,'praktik');
    add(null,'Peran sloof','sloof praktis tidak dihitung terhadap gaya gempa. Untuk mengikat fondasi telapak atau pile cap, gunakan sloof struktur','praktik');
    const views=[
      {title:'Potongan melintang',sub:`sloof ${b} × ${h}, 4D${db}, D${ds}-${s}`,n:'x',at:L/2+5,half:s/2,u:'z',v:'y',maxH:360,w2:true,
        dims:[{a:[-b/2,0],b:[b/2,0],off:10,t:`${b}`},{a:[-B/2,-h-hf],b:[B/2,-h-hf],off:-14,t:`${B}`}]},
      {title:'Tampak memanjang',n:'z',at:0,half:Math.max(as,ak)+db,u:'x',v:'y',maxH:300,layers:['utama','stek','angkur'],
        dims:[{a:[0,hk],b:[L,hk],off:8,t:`L = ${fmt(L)}`}]}
    ];
    const derived=`selimut = <b>${cover}</b> mm<br>panjang bengkokan stek = <b>${fmt(Lb)}</b> mm<br>jumlah angkur = <b>${xa.length}</b><br>jumlah sengkang = <b>${spread(x0+50,x1-50,s).length}</b>`;
    const layers=[{k:'fondasi',label:'Fondasi batu kali',color:MAT.batu,block:true,ex:[0,-600,0]},{k:'utama',label:'Tulangan utama',color:COL.bot,ex:[0,0,0]},{k:'sengkang',label:'Sengkang',color:COL.mid,ex:[0,0,0]},
      {k:'stek',label:'Stek kolom praktis',color:COL.long,ex:[0,400,0]},{k:'angkur',label:'Angkur fondasi',color:COL.dowel,ex:[0,-300,0]}];
    return {layers,betonEx:[0,0,-700],concrete,zones:[],bars,labels,views,checks:C,derived,camDir:[0.4,0.35,0.9],camK:0.95,cutAxis:'x'};
  }
};
