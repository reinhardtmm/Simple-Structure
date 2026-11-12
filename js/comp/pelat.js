import {COL,fmt,up50,spread,turtle,asPerM,checker} from '../core.js';

export default {
  id:'pelat', name:'Pelat lantai', sysDependent:false,
  defaults:{ALL:{Lx:3000,Ly:4000,h:120,bw:300,hbm:450,dbx:10,sx:150,dby:10,sy:200,dt:10,st:200,dbg:8,sg:250,cover:20,fc:25,fy:420}},
  schema:[
    ['Geometri panel',[{k:'Lx',label:'Bentang bersih arah x',unit:'mm',min:1500,max:8000,step:100},{k:'Ly',label:'Bentang bersih arah z',unit:'mm',min:1500,max:10000,step:100},{k:'h',label:'Tebal pelat h',unit:'mm',min:90,max:300,step:10},{k:'bw',label:'Lebar balok tepi',unit:'mm',min:200,max:600,step:25},{k:'hbm',label:'Tinggi balok tepi',unit:'mm',min:250,max:900,step:25}]],
    ['Tulangan bawah (lapangan)',[{k:'dbx',label:'Diameter arah x',unit:'D',opts:[8,10,13,16]},{k:'sx',label:'Spasi arah x',unit:'mm',min:75,max:450,step:5},{k:'dby',label:'Diameter arah z',unit:'D',opts:[8,10,13,16]},{k:'sy',label:'Spasi arah z',unit:'mm',min:75,max:450,step:5}]],
    ['Tulangan atas (tumpuan)',[{k:'dt',label:'Diameter tumpuan',unit:'D',opts:[8,10,13,16]},{k:'st',label:'Spasi tumpuan',unit:'mm',min:75,max:450,step:5},{k:'dbg',label:'Diameter tulangan bagi',unit:'D',opts:[8,10]},{k:'sg',label:'Spasi tulangan bagi',unit:'mm',min:100,max:450,step:5}]],
    ['Material',[{k:'fc',label:"Mutu beton fc'",unit:'MPa',opts:[20,25,30,35]},{k:'fy',label:'Mutu baja fy',unit:'MPa',opts:[280,420]},{k:'cover',label:'Selimut beton',unit:'mm',min:15,max:50,step:5}]]
  ],
  teori:{
    common:`<h3>Pelat lantai</h3><p>Pelat menerima beban langsung dari penghuni dan menyalurkannya ke balok di sekelilingnya. Perilakunya ditentukan oleh rasio bentang panjang terhadap bentang pendek, β.</p><ul><li><b>Pelat dua arah</b> (β ≤ 2) melentur ke dua arah, sehingga tulangan utama dipasang di kedua arah. Tulangan arah pendek diletakkan paling bawah karena momennya lebih besar dan butuh tinggi efektif terbesar.</li><li><b>Pelat satu arah</b> (β > 2) praktis hanya melentur ke arah pendek. Tulangan arah panjang berfungsi sebagai tulangan susut dan suhu.</li><li><b>Tulangan tumpuan</b> dipasang di sisi atas dekat balok, karena di sana momen negatif membuat serat atas tertarik. Di model ini panjangnya ℓx/4 dari muka balok, sesuai kebiasaan desain.</li><li><b>Tulangan bagi</b> dipasang tegak lurus di bawah tulangan tumpuan untuk memegang posisinya dan menahan retak susut.</li></ul>`,
    ALL:`<h4>Syarat detailing utama</h4><ul><li><b>Tebal minimum</b> pelat dua arah yang ditumpu balok kaku: h ≥ ℓn(0,8 + fy/1400)/(36 + 9β) dan tidak kurang dari 90 mm <span class="pasal">8.3.1.2</span>. Pelat satu arah dengan kedua ujung menerus: h ≥ ℓ/28 <span class="pasal">Tabel 7.3.1.1</span>.</li><li><b>Tulangan minimum</b> 0,0018 b h untuk fy = 420 MPa, atau 0,0020 b h untuk fy = 280 MPa <span class="pasal">8.6.1.1, 24.4.3.2</span>.</li><li><b>Spasi maksimum</b> pelat dua arah 2h dan 450 mm <span class="pasal">8.7.2.2</span>. Pelat satu arah: tulangan utama 3h dan 450 mm <span class="pasal">7.7.2.3</span>, tulangan susut 5h dan 450 mm <span class="pasal">24.4.3.3</span>.</li><li><b>Selimut</b> pelat yang tidak terekspos cuaca 20 mm <span class="pasal">Tabel 20.6.1.3.1</span>.</li></ul><div class="box">Coba ubah bentang z menjadi lebih dari dua kali bentang x. Pemeriksaan otomatis berganti ke aturan pelat satu arah.</div>`
  },
  build(p){
    const {Lx,Ly,h,bw,hbm,dbx,sx,dby,sy,dt,st,dbg,sg,cover,fc,fy}=p;
    const ext=up50(Lx/4);
    const y1=cover+dbx/2, y2=cover+dbx+dby/2, yt1=h-cover-dt/2, yt2=h-cover-dt-dt/2, yg=h-cover-2*dt-dbg/2;
    const bars=[];
    const iBX={t:`Tulangan bawah arah x D${dbx}-${sx}`,b:['Lapisan paling bawah, searah bentang pendek. Menahan momen positif terbesar sehingga diberi tinggi efektif terbesar.','Diteruskan masuk ke balok tumpuan.'],pasal:'Pasal 8.7.2'};
    const iBZ={t:`Tulangan bawah arah z D${dby}-${sy}`,b:['Lapisan kedua dari bawah, searah bentang panjang. Diletakkan di atas tulangan arah x.'],pasal:'Pasal 8.7.2'};
    const iT={t:`Tulangan tumpuan D${dt}-${st}`,b:[`Tulangan atas di atas balok untuk momen negatif. Ujung luar dibengkokkan 90° ke dalam balok. Panjang ke dalam pelat ℓx/4 = ${fmt(ext)} mm dari muka balok.`],pasal:'praktik'};
    const iG={t:`Tulangan bagi D${dbg}-${sg}`,b:['Tegak lurus di bawah tulangan tumpuan. Memegang posisi tulangan tumpuan dan menahan retak susut.'],pasal:'Pasal 24.4.3'};
    spread(50,Ly-50,sx).forEach(z=>bars.push({pts:[[-bw/2,y1,z],[Lx+bw/2,y1,z]],d:dbx,layer:'bx',color:COL.matA,info:iBX}));
    spread(50,Lx-50,sy).forEach(x=>bars.push({pts:[[x,y2,-bw/2],[x,y2,Ly+bw/2]],d:dby,layer:'bz',color:COL.matB,info:iBZ}));
    const rb=3*dt, tail=Math.max(12*dt,150);
    const topHook=(y,len)=>{ const t=turtle(0,y-rb-tail,Math.PI/2); t.fwd(tail).turn(-90,rb).fwd(len-rb); return t.pts; };
    const lenT=bw-40+ext;
    const tx=topHook(yt1,lenT), tz=topHook(yt2,lenT);
    spread(50,Ly-50,st).forEach(z=>{
      bars.push({pts:tx.map(([s,y])=>[-bw+40+s,y,z]),d:dt,layer:'tx',color:COL.matT,info:iT});
      bars.push({pts:tx.map(([s,y])=>[Lx+bw-40-s,y,z]),d:dt,layer:'tx',color:COL.matT,info:iT});
    });
    spread(50,Lx-50,st).forEach(x=>{
      bars.push({pts:tz.map(([s,y])=>[x,y,-bw+40+s]),d:dt,layer:'tz',color:COL.top,info:iT});
      bars.push({pts:tz.map(([s,y])=>[x,y,Ly+bw-40-s]),d:dt,layer:'tz',color:COL.top,info:iT});
    });
    spread(50,ext-50,sg).forEach(x=>{ bars.push({pts:[[x,yg,0],[x,yg,Ly]],d:dbg,layer:'bagi',color:COL.dist,info:iG}); bars.push({pts:[[Lx-x,yg,0],[Lx-x,yg,Ly]],d:dbg,layer:'bagi',color:COL.dist,info:iG}); });
    spread(50,ext-50,sg).forEach(z=>{ bars.push({pts:[[0,yg,z],[Lx,yg,z]],d:dbg,layer:'bagi',color:COL.dist,info:iG}); bars.push({pts:[[0,yg,Ly-z],[Lx,yg,Ly-z]],d:dbg,layer:'bagi',color:COL.dist,info:iG}); });
    const yb=h-hbm;
    const concrete=[{box:[0,Lx,0,h,0,Ly]},{box:[-bw,0,yb,h,-bw,Ly+bw],kind:'stub'},{box:[Lx,Lx+bw,yb,h,-bw,Ly+bw],kind:'stub'},{box:[0,Lx,yb,h,-bw,0],kind:'stub'},{box:[0,Lx,yb,h,Ly,Ly+bw],kind:'stub'}];
    const labels=[{p:[Lx/2,h+60,-bw-80],t:`ℓx = ${fmt(Lx)} mm`},{p:[Lx+bw+80,h+60,Ly/2],t:`ℓz = ${fmt(Ly)} mm`},{p:[ext/2,h+80,Ly/2],t:`ℓx/4 = ${fmt(ext)} mm`,c:'conf'}];
    // pemeriksaan
    const lmax=Math.max(Lx,Ly), lmin=Math.min(Lx,Ly), beta=lmax/lmin, two=beta<=2;
    const hmin=two?Math.max(lmax*(0.8+fy/1400)/(36+9*beta),90):lmin/28*(fy===420?1:(0.4+fy/700));
    const rmin=fy>=420?0.0018:0.0020, Asmin=rmin*1000*h;
    const AsX=asPerM(dbx,sx), AsZ=asPerM(dby,sy), AsT=asPerM(dt,st);
    const mainX=Lx<=Ly;
    const {C,add}=checker();
    add(null,'Jenis pelat',`β = ${fmt(beta,2)} → ${two?'pelat dua arah':'pelat satu arah'}`,two?'Pasal 8':'Pasal 7');
    add(cover>=20,'Selimut beton',`${cover} mm ≥ 20 mm`,'Tabel 20.6.1.3.1');
    add(h>=hmin,'Tebal minimum pelat',two?`h = ${h} ≥ ℓn(0,8+fy/1400)/(36+9β) = ${fmt(hmin)} mm (balok tepi dianggap kaku, αfm > 2)`:`h = ${h} ≥ ℓ/28 = ${fmt(hmin)} mm (kedua ujung menerus)`,two?'Pasal 8.3.1.2':'Tabel 7.3.1.1');
    add(AsX>=Asmin,'Tulangan minimum arah x',`${fmt(AsX)} mm²/m ≥ ${rmin}·b·h = ${fmt(Asmin)} mm²/m`,'Pasal 8.6.1.1, 24.4.3.2');
    add(AsZ>=Asmin,'Tulangan minimum arah z',`${fmt(AsZ)} mm²/m ≥ ${fmt(Asmin)} mm²/m`,'Pasal 8.6.1.1, 24.4.3.2');
    if(two){
      const sm=Math.min(2*h,450);
      add(Math.max(sx,sy,st)<=sm,'Spasi maksimum pelat dua arah',`x ${sx}, z ${sy}, tumpuan ${st} mm ≤ min(2h; 450) = ${fmt(sm)} mm`,'Pasal 8.7.2.2');
    } else {
      const sMain=Math.min(3*h,450), sSh=Math.min(5*h,450);
      const sM=mainX?sx:sy, sS=mainX?sy:sx;
      add(sM<=sMain&&st<=sMain,'Spasi tulangan utama',`${sM} mm dan tumpuan ${st} mm ≤ min(3h; 450) = ${fmt(sMain)} mm`,'Pasal 7.7.2.3');
      add(sS<=sSh,'Spasi tulangan susut dan suhu',`${sS} mm ≤ min(5h; 450) = ${fmt(sSh)} mm`,'Pasal 24.4.3.3');
    }
    add(AsT>=Asmin,'Tulangan tumpuan minimum',`${fmt(AsT)} mm²/m ≥ ${fmt(Asmin)} mm²/m`,'Pasal 8.6.1.1');
    add(null,'Panjang tulangan tumpuan',`ℓx/4 = ${fmt(ext)} mm dari muka balok. Nilai pasti mengikuti diagram momen hasil analisis`,'praktik');
    add(sg<=Math.min(5*h,450),'Spasi tulangan bagi',`${sg} mm ≤ min(5h; 450) = ${fmt(Math.min(5*h,450))} mm`,'Pasal 24.4.3.3');
    const zc=spread(50,Ly-50,sx); const zMid=zc[Math.floor(zc.length/2)];
    const views=[
      {title:'Denah tulangan bawah',sub:`arah x D${dbx}-${sx}, arah z D${dby}-${sy}`,n:'y',u:'x',v:'z',layers:['bx','bz'],maxH:420,dims:[{a:[0,-bw],b:[Lx,-bw],off:-12,t:`ℓx = ${fmt(Lx)}`},{a:[-bw,0],b:[-bw,Ly],off:-12,t:`ℓz = ${fmt(Ly)}`}]},
      {title:'Denah tulangan atas',sub:`tumpuan D${dt}-${st}, bagi D${dbg}-${sg}`,n:'y',u:'x',v:'z',layers:['tx','tz','bagi'],maxH:420,dims:[{a:[0,-bw],b:[ext,-bw],off:-12,t:`ℓx/4=${fmt(ext)}`,c:COL.conf}]},
      {title:'Potongan A, sejajar arah x',n:'z',at:zMid,half:dbx*1.4,u:'x',v:'y',maxH:240,dims:[{a:[0,yb],b:[Lx,yb],off:-14,t:`ℓx = ${fmt(Lx)}`},{a:[Lx+bw,0],b:[Lx+bw,h],off:12,t:`h=${h}`}]}
    ];
    const derived=`β = <b>${fmt(beta,2)}</b> (${two?'dua arah':'satu arah'})<br>h min = <b>${fmt(hmin)}</b> mm<br>As min = <b>${fmt(Asmin)}</b> mm²/m<br>As arah x = <b>${fmt(AsX)}</b>, arah z = <b>${fmt(AsZ)}</b>, tumpuan = <b>${fmt(AsT)}</b> mm²/m<br>d arah x = <b>${fmt(h-y1)}</b> mm, arah z = <b>${fmt(h-y2)}</b> mm<br>panjang tulangan tumpuan = <b>${fmt(ext)}</b> mm`;
    return {layers:[{k:'bx',label:'Bawah arah x',color:COL.matA,ex:[0,-250,0]},{k:'bz',label:'Bawah arah z',color:COL.matB,ex:[0,-120,0]},{k:'tx',label:'Tumpuan arah x',color:COL.matT,ex:[0,260,0]},{k:'tz',label:'Tumpuan arah z',color:COL.top,ex:[0,420,0]},{k:'bagi',label:'Tulangan bagi',color:COL.dist,ex:[0,140,0]}],
      betonEx:[0,-1400,0],concrete,zones:[],bars,labels,views,checks:C,derived,camDir:[0.6,0.85,1.0],camK:1.0,cutAxis:'x'};
  }
};
