import {COL,fmt,spread,turtle,asPerM,devLen,checker} from '../core.js';

export default {
  id:'tangga', name:'Tangga', sysDependent:false,
  defaults:{ALL:{H:1750,R:175,T:280,wd:1200,t:160,Lb:1200,tump:'1',dbm:13,sm:150,dbd:10,sd:200,fc:25,fy:420,cover:20}},
  schema:[
    ['Geometri',[{k:'H',label:'Tinggi naik sampai bordes',unit:'mm',min:900,max:2500,step:25},{k:'R',label:'Tinggi anak tangga (optrede)',unit:'mm',min:130,max:220,step:5},{k:'T',label:'Lebar injakan (antrede)',unit:'mm',min:220,max:350,step:5},{k:'wd',label:'Lebar tangga',unit:'mm',min:800,max:2000,step:50},{k:'t',label:'Tebal pelat tangga dan bordes',unit:'mm',min:100,max:300,step:10},{k:'Lb',label:'Panjang bordes',unit:'mm',min:800,max:2500,step:50},{k:'tump',label:'Kondisi tumpuan',opts:[['s','Tertumpu sederhana'],['1','Satu ujung menerus'],['2','Kedua ujung menerus']]}]],
    ['Tulangan',[{k:'dbm',label:'Diameter tulangan utama',unit:'D',opts:[10,13,16,19]},{k:'sm',label:'Spasi tulangan utama',unit:'mm',min:75,max:450,step:5},{k:'dbd',label:'Diameter tulangan bagi',unit:'D',opts:[8,10,13]},{k:'sd',label:'Spasi tulangan bagi',unit:'mm',min:100,max:450,step:5}]],
    ['Material',[{k:'fc',label:"Mutu beton fc'",unit:'MPa',opts:[20,25,30,35]},{k:'fy',label:'Mutu baja fy',unit:'MPa',opts:[280,420]},{k:'cover',label:'Selimut beton',unit:'mm',min:15,max:50,step:5}]]
  ],
  teori:{
    common:`<h3>Tangga pelat</h3><p>Tangga pelat bekerja seperti pelat satu arah yang miring. Pelat tangga dan bordes menerima beban lalu menyalurkannya ke balok atau pelat lantai di kedua ujungnya. Anak tangga hanya menjadi beban, tebal struktural dihitung tegak lurus permukaan bawah pelat.</p><ul><li><b>Tulangan utama</b> searah bentang, di bawah untuk momen positif dan di atas dekat tumpuan untuk momen negatif.</li><li><b>Tulangan bagi</b> melintang, tegak lurus tulangan utama.</li><li><b>Sudut dalam</b>, yaitu sudut yang menjorok ke dalam beton, adalah titik kritis. Di pertemuan pelat tangga dan bordes, sudut dalam ada di sisi bawah. Tulangan bawah yang dibengkokkan mengikuti sudut itu akan tertarik lurus saat bekerja, lalu menjebol selimut beton. Karena itu tulangan di sudut dalam harus <b>disilangkan</b>: masing-masing diteruskan lurus melewati sudut dan diangkur di sisi seberang.</li><li>Hal yang sama berlaku di kaki tangga, tempat sudut dalam berada di sisi atas.</li></ul>`,
    ALL:`<h4>Syarat detailing utama</h4><ul><li><b>Tebal minimum</b> mengikuti pelat satu arah: ℓ/20 tertumpu sederhana, ℓ/24 satu ujung menerus, ℓ/28 kedua ujung menerus, untuk fy = 420 MPa <span class="pasal">Tabel 7.3.1.1</span>.</li><li><b>Tulangan minimum</b> 0,0018 b h untuk tulangan utama dan tulangan bagi <span class="pasal">7.6.1.1, 24.4.3.2</span>.</li><li><b>Spasi maksimum</b> tulangan utama 3h dan 450 mm <span class="pasal">7.7.2.3</span>, tulangan bagi 5h dan 450 mm <span class="pasal">24.4.3.3</span>.</li><li><b>Kenyamanan</b>: 2R + T sekitar 600 sampai 650 mm adalah aturan praktis ukuran langkah manusia.</li></ul><div class="box">Matikan lapisan beton dan tulangan bagi, lalu putar model ke samping. Perhatikan tulangan bawah pelat tangga dan tulangan bawah bordes yang saling bersilangan di bawah bordes.</div>`
  },
  build(p){
    const {H,T,wd,t,Lb,dbm,sm,dbd,sd,fc,fy,cover}=p;
    const n=Math.max(2,Math.round(H/p.R)), R=H/n, th=Math.atan(R/T), c=Math.cos(th), s=Math.sin(th), tn=Math.tan(th), deg=th*180/Math.PI;
    const Lr=(n-1)*T, xF=Lr+Lb;
    const xk1=(t/c-t)/tn, xk2=(H-t+t/c)/tn;
    // beton
    const prof=[[0,0]]; for(let i=0;i<n;i++){ prof.push([i*T,(i+1)*R]); if(i<n-1) prof.push([(i+1)*T,(i+1)*R]); }
    prof.push([xF,H],[xF,H-t],[xk2,H-t],[xk1,-t],[0,-t]);
    const concrete=[{prism:{pts:prof,z0:0,z1:wd}},{box:[-800,0,-t,0,-150,wd+150],kind:'stub'},{box:[xF,xF+250,H-450,H,-150,wd+150],kind:'stub'}];
    const c1=cover+dbm/2, rb=3*dbm, ld=devLen(fy,fc,dbm,1);
    const yb1=x=>x*tn-t/c+c1/c, ytop=x=>x*tn-c1/c;
    const yF=-t+c1, yLT=H-c1, yLT2=yLT-dbm, yLB=H-t+c1;
    // B1: bawah pelat tangga, menembus ke atas bordes
    const x1=(yF+t/c-c1/c)/tn;
    const b1=turtle(x1-450,yF,0); b1.fwd(450-rb*Math.tan(th/2)).turn(deg,rb);
    const [bx,by]=b1.pos; b1.fwd((yLT2-by-rb*(1-c))/s).turn(-deg,rb).fwd(350);
    // B2: bawah bordes, menembus ke dalam pelat tangga
    const xi=(yLB+c1/c+dbm*1.1/c)/tn;
    const b2=turtle(xF+180,yLB,Math.PI); b2.fwd(xF+180-xi-rb*Math.tan(th/2)).turn(deg,rb).fwd(ld);
    // T1: atas, dari pelat lantai bawah sampai ujung bordes
    const xs0=(-t+c1+dbm*1.2+c1/c)/tn;
    const xt=(yLT+c1/c)/tn;
    const t1=turtle(xs0,ytop(xs0),th); t1.fwd((xt-xs0)/c-rb*Math.tan(th/2)).turn(-deg,rb).fwd(xF+200-xt-rb*Math.tan(th/2)-rb).turn(-90,rb).fwd(12*dbm);
    const zs=spread(50,wd-50,sm), bars=[];
    const iB1={t:`Tulangan bawah pelat tangga D${dbm}-${sm}`,b:['Menahan momen positif pelat tangga.','Di bawah bordes tulangan ini tidak dibengkokkan mengikuti sudut dalam, melainkan diteruskan lurus menembus bordes sampai ke sisi atas, lalu diangkur mendatar.'],pasal:'prinsip detailing sudut dalam'};
    const iB2={t:`Tulangan bawah bordes D${dbm}-${sm}`,b:[`Diteruskan menyilang ke dalam pelat tangga dan diangkur sepanjang ℓd = ${fmt(ld)} mm di sisi atas pelat tangga.`],pasal:'Pasal 25.4.2'};
    const iT1={t:`Tulangan atas D${dbm}-${sm}`,b:['Menahan momen negatif di tumpuan. Di kaki tangga, sudut dalam berada di sisi atas, sehingga tulangan atas diteruskan lurus masuk ke pelat lantai bawah.','Di pertemuan dengan bordes sisi atasnya cembung, sehingga tulangan boleh dibengkokkan menerus.'],pasal:'prinsip detailing sudut dalam'};
    zs.forEach(z=>{ bars.push({pts:b1.pts.map(([x,y])=>[x,y,z]),d:dbm,layer:'b1',color:COL.matA,info:iB1}); bars.push({pts:b2.pts.map(([x,y])=>[x,y,z+dbm*1.2]),d:dbm,layer:'b2',color:COL.dowel,info:iB2}); bars.push({pts:t1.pts.map(([x,y])=>[x,y,z]),d:dbm,layer:'t1',color:COL.matT,info:iT1}); });
    // tulangan bagi
    const iD={t:`Tulangan bagi D${dbd}-${sd}`,b:['Tegak lurus tulangan utama, di sisi dalam.'],pasal:'Pasal 24.4.3'};
    const dd=(dbm+dbd)/2;
    spread(Math.max(xk1,x1)+60,xk2-80,sd*c).forEach(x=>{ bars.push({pts:[[x,yb1(x)+dd/c,20],[x,yb1(x)+dd/c,wd-20]],d:dbd,layer:'bagi',color:COL.dist,info:iD}); });
    spread(40,xt-60,sd*c).forEach(x=>{ bars.push({pts:[[x,ytop(x)-dd/c,20],[x,ytop(x)-dd/c,wd-20]],d:dbd,layer:'bagi',color:COL.dist,info:iD}); });
    spread(xk2+60,xF-40,sd).forEach(x=>{ bars.push({pts:[[x,yLB+dd,20],[x,yLB+dd,wd-20]],d:dbd,layer:'bagi',color:COL.dist,info:iD}); bars.push({pts:[[x,yLT-dd,20],[x,yLT-dd,wd-20]],d:dbd,layer:'bagi',color:COL.dist,info:iD}); });
    const labels=[{p:[xk2,H-t-60,wd],t:'sudut dalam bawah',c:'lap'},{p:[0,60,wd],t:'sudut dalam atas',c:'lap'},{p:[Lr+Lb/2,H+80,wd/2],t:`bordes ${fmt(Lb)} mm`},{p:[Lr/2,H/2+250,wd/2],t:`${n} × ${fmt(R,1)} / ${fmt(T)} mm`}];
    // pemeriksaan
    const L=xF, kf={s:20,'1':24,'2':28}[p.tump], fyF=fy===420?1:(0.4+fy/700), hmin=L/kf*fyF;
    const Asm=asPerM(dbm,sm), Asd=asPerM(dbd,sd), Amin=(fy>=420?0.0018:0.0020)*1000*t;
    const {C,add}=checker();
    add(cover>=20,'Selimut beton',`${cover} mm ≥ 20 mm`,'Tabel 20.6.1.3.1');
    add(t>=hmin,'Tebal minimum pelat',`t = ${t} mm ≥ ℓ/${kf} = ${fmt(hmin)} mm, ℓ = ${fmt(L)} mm (proyeksi horizontal)`,'Tabel 7.3.1.1');
    add(Asm>=Amin,'Tulangan utama minimum',`${fmt(Asm)} mm²/m ≥ ${fmt(Amin)} mm²/m`,'Pasal 7.6.1.1');
    add(Asd>=Amin,'Tulangan bagi minimum',`${fmt(Asd)} mm²/m ≥ ${fmt(Amin)} mm²/m`,'Pasal 24.4.3.2');
    add(sm<=Math.min(3*t,450),'Spasi tulangan utama',`${sm} mm ≤ min(3h; 450) = ${fmt(Math.min(3*t,450))} mm`,'Pasal 7.7.2.3');
    add(sd<=Math.min(5*t,450),'Spasi tulangan bagi',`${sd} mm ≤ min(5h; 450) = ${fmt(Math.min(5*t,450))} mm`,'Pasal 24.4.3.3');
    add(true,'Tulangan di sudut dalam','disilangkan dan diangkur, tidak dibengkokkan mengikuti sudut','prinsip detailing sudut dalam');
    const step=2*R+T; add(step>=600&&step<=650,'Ukuran langkah 2R + T',`2 × ${fmt(R,1)} + ${fmt(T)} = ${fmt(step)} mm (600 sampai 650 mm)`,'praktik');
    add(Lb>=wd,'Panjang bordes',`${fmt(Lb)} mm ≥ lebar tangga ${fmt(wd)} mm`,'praktik');
    add(null,'Sudut kemiringan',`θ = ${fmt(deg,1)}°, jumlah anak tangga ${n}`,'praktik');
    const zMid=zs[Math.floor(zs.length/2)];
    const views=[{title:'Potongan memanjang tangga',sub:`utama D${dbm}-${sm}, bagi D${dbd}-${sd}`,n:'z',at:zMid+dbm*0.6,half:dbm*1.5,u:'x',v:'y',maxH:440,dims:[{a:[0,-t],b:[Lr,-t],off:-14,t:`${n-1} × ${fmt(T)}`},{a:[Lr,-t],b:[xF,-t],off:-14,t:`bordes ${fmt(Lb)}`},{a:[xF+250,0],b:[xF+250,H],off:12,t:`H = ${fmt(H)}`}]}];
    return {layers:[{k:'b1',label:'Bawah pelat tangga',color:COL.matA,ex:[0,-300,0]},{k:'b2',label:'Bawah bordes',color:COL.dowel,ex:[0,-150,0]},{k:'t1',label:'Tulangan atas',color:COL.matT,ex:[0,300,0]},{k:'bagi',label:'Tulangan bagi',color:COL.dist,ex:[0,0,-600]}],
      betonEx:[0,0,-2400],concrete,zones:[],bars,labels,views,checks:C,camDir:[0.35,0.3,1],camK:0.95,cutAxis:'z',
      derived:`jumlah anak tangga = <b>${n}</b>, R = <b>${fmt(R,1)}</b> mm<br>θ = <b>${fmt(deg,1)}°</b><br>bentang horizontal = <b>${fmt(L)}</b> mm<br>h min = <b>${fmt(hmin)}</b> mm<br>ℓd tulangan utama = <b>${fmt(ld)}</b> mm`};
  }
};
