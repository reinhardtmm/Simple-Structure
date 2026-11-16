import {AREA,DIAS,COL,fmt,up50,spread,turtle,rectCage,lift3D,devLen,ldc,checker,KAIT_FIELD,hookOf} from '../core.js';

export default {
  id:'tiang', name:'Tiang bor dan pile cap', sysDependent:true,
  refExtra:', serta SNI 8460:2017 untuk perancangan geoteknik',
  defaults:{
    SRPMB:{np:4,D:400,Lp:4500,sp:1200,e:450,hcap:850,embed:100,npb:6,dbp:16,dsp:10,s1:150,s2:150,bc:400,nc:3,dbc:16,dsc:10,dbm:19,sm:150,fc:25,fy:420,cover:75,kait:90},
    SRPMK:{np:4,D:600,Lp:4500,sp:1500,e:450,hcap:900,embed:100,npb:10,dbp:16,dsp:13,s1:45,s2:150,bc:450,nc:4,dbc:19,dsc:13,dbm:19,sm:150,fc:30,fy:420,cover:75}
  },
  schema:[
    ['Tiang bor',[{k:'np',label:'Jumlah tiang',opts:[[2,'2 tiang'],[4,'4 tiang']]},{k:'D',label:'Diameter tiang',unit:'mm',opts:[300,400,500,600,800]},{k:'Lp',label:'Panjang tiang yang ditampilkan',unit:'mm',min:2000,max:12000,step:500},{k:'sp',label:'Jarak antar pusat tiang',unit:'mm',min:600,max:3000,step:50},{k:'embed',label:'Tiang masuk ke pile cap',unit:'mm',min:50,max:200,step:5}]],
    ['Tulangan tiang',[{k:'npb',label:'Jumlah tulangan tiang',unit:'batang',min:4,max:16},{k:'dbp',label:'Diameter tulangan tiang',unit:'D',opts:[13,16,19,22,25]},{k:'dsp',label:'Diameter spiral',unit:'D',opts:[8,10,13]},{k:'s1',label:'Jarak spiral daerah kekang',unit:'mm',min:40,max:200,step:5,show:s=>s==='SRPMK'},{k:'s2',label:s=>s==='SRPMK'?'Jarak spiral di bawahnya':'Jarak spiral',unit:'mm',min:50,max:300,step:5}]],
    ['Pile cap',[{k:'e',label:'Jarak pusat tiang ke tepi',unit:'mm',min:200,max:1200,step:25},{k:'hcap',label:'Tebal pile cap',unit:'mm',min:400,max:2000,step:50},{k:'dbm',label:'Diameter tulangan bawah',unit:'D',opts:[16,19,22,25]},{k:'sm',label:'Spasi tulangan bawah',unit:'mm',min:75,max:300,step:5}]],
    ['Kolom (stek)',[{k:'bc',label:'Sisi kolom',unit:'mm',min:250,max:900,step:25},{k:'nc',label:'Tulangan per sisi',unit:'batang',min:2,max:7},{k:'dbc',label:'Diameter tulangan kolom',unit:'D',opts:DIAS},{k:'dsc',label:'Diameter sengkang kolom',unit:'D',opts:[10,13]},KAIT_FIELD]],
    ['Material',[{k:'fc',label:"Mutu beton fc'",unit:'MPa',opts:[20,25,30,35]},{k:'fy',label:'Mutu baja fy',unit:'MPa',opts:[280,420]},{k:'cover',label:'Selimut beton',unit:'mm',min:50,max:100,step:5}]]
  ],
  teori:{
    common:`<h3>Tiang bor dan pile cap</h3><p>Bila tanah keras berada jauh di bawah permukaan, beban kolom diteruskan oleh tiang ke lapisan tanah yang lebih dalam. Pile cap adalah blok beton tebal yang menyatukan kepala beberapa tiang dan menerima kolom di atasnya.</p><ul><li><b>Tulangan tiang</b> longitudinal diteruskan ke dalam pile cap sepanjang panjang penyaluran, supaya tiang ikut menahan tarik dan momen.</li><li><b>Spiral</b> mengekang beton tiang dan menahan geser. Di bagian atas tiang, momen dan geser akibat gempa paling besar, sehingga spiral dibuat lebih rapat.</li><li><b>Kepala tiang</b> masuk sedikit ke dalam pile cap, umumnya 75 sampai 150 mm.</li><li><b>Tulangan bawah pile cap</b> bekerja sebagai pengikat tarik antar tiang. Model penunjang dan pengikat, atau strut and tie, sering dipakai untuk mendesainnya.</li><li>Jarak antar tiang biasanya 2,5D sampai 3D supaya zona tegangan tanah di sekitar tiang tidak saling tumpang tindih. Jumlah dan panjang tiang ditentukan oleh analisis geoteknik.</li></ul>`,
    SRPMB:`<h4>Detailing umum</h4><ul><li><b>Selimut</b> 75 mm untuk beton yang dicor langsung di atas atau di dalam tanah <span class="pasal">Tabel 20.6.1.3.1</span>.</li><li><b>Tinggi efektif pile cap</b> di atas tulangan bawah tidak kurang dari 300 mm <span class="pasal">13.4.2.1</span>.</li><li><b>Stek kolom</b> minimal 0,005 luas kolom <span class="pasal">16.3.4.1</span>.</li><li>Tulangan transversal tiang untuk KDS rendah mengikuti SNI 8460:2017 dan tidak diperiksa di sini.</li></ul>`,
    SRPMK:`<h4>Detailing KDS D sampai F</h4><ul><li><b>Daerah kekang di kepala tiang</b> sepanjang minimal 5 kali diameter tiang dan tidak kurang dari 1,8 m di bawah dasar pile cap <span class="pasal">18.13.4.3(a)</span>. Bila sebagian tiang berada di tanah yang tidak mampu memberi tumpuan lateral, daerah kekang diperpanjang sepanjang bagian itu <span class="pasal">18.13.4.3(b)</span>.</li><li><b>Spiral di daerah kekang</b> mengikuti syarat kolom SRPMK: jarak tidak lebih dari D/4, 6db, dan so <span class="pasal">18.7.5.3</span>, dan rasio spiral memenuhi Tabel 18.7.5.4 baris (d) dan (e). Baris (c) dan (f) yang bergantung pada Pu tidak diberlakukan untuk tiang <span class="pasal">18.13.4.3</span>.</li><li><b>Tulangan tiang yang menahan tarik</b> harus menerus sepanjang bagian yang mengalami tarik <span class="pasal">18.13.4.1</span>.</li><li><b>Kait stek kolom</b> mengarah ke pusat kolom <span class="pasal">18.13.2.2</span>.</li></ul>`
  },
  build(p,sys){
    const K=sys==='SRPMK';
    const {np,D,Lp,sp,e,hcap,embed,npb,dbp,dsp,dbm,sm,bc,nc,dbc,dsc,fc,fy,cover}=p;
    const Lx=sp+2*e, Lz=np==4?sp+2*e:2*e;
    const piles=np==4?[[-sp/2,-sp/2],[sp/2,-sp/2],[-sp/2,sp/2],[sp/2,sp/2]]:[[-sp/2,0],[sp/2,0]];
    const Rb=D/2-cover-dsp-dbp/2, Rs=D/2-cover-dsp/2;
    const ldp=devLen(fy,fc,dbp,1), yPileTop=embed+ldp, Lc=K?up50(Math.max(5*D,1800)):0;
    const bars=[];
    const iP={t:`Tulangan tiang ${npb}D${dbp}`,b:[`Diteruskan lurus ke dalam pile cap sepanjang ℓd = ${fmt(ldp)} mm.`],pasal:K?'Pasal 18.13.4.1':'Pasal 25.4.2'};
    const sp1=K?p.s1:p.s2;
    piles.forEach(([cx,cz])=>{
      for(let i=0;i<npb;i++){ const t=2*Math.PI*i/npb; bars.push({pts:[[cx+Rb*Math.cos(t),-Lp+100,cz+Rb*Math.sin(t)],[cx+Rb*Math.cos(t),yPileTop,cz+Rb*Math.sin(t)]],d:dbp,layer:'tiang',color:COL.long,info:iP}); }
      // spiral
      const seg=(y0,y1,pitch,col,inf)=>{ const turns=(y0-y1)/pitch, chunk=8; let start=0;
        while(start<turns-1e-6){ const tn=Math.min(chunk,turns-start); const n=Math.ceil(tn*24); const pts=[];
          for(let k=0;k<=n;k++){ const th=2*Math.PI*(start+tn*k/n); pts.push([cx+Rs*Math.cos(th),y0-(start+tn*k/n)*pitch,cz+Rs*Math.sin(th)]); }
          bars.push({pts,d:dsp,layer:'spiral',color:col,info:inf,maxSeg:n*2+8}); start+=tn; } };
      if(K){ seg(-30,-Lc,p.s1,COL.conf,{t:`Spiral D${dsp} jarak ${p.s1} mm`,b:[`Daerah kekang kepala tiang sepanjang maks(5D; 1800) = ${fmt(Lc)} mm.`],pasal:'Pasal 18.13.4.3'});
        seg(-Lc,-Lp+100,p.s2,COL.mid,{t:`Spiral D${dsp} jarak ${p.s2} mm`,b:['Di bawah daerah kekang, jarak spiral boleh lebih renggang.'],pasal:'SNI 8460:2017'}); }
      else seg(-30,-Lp+100,p.s2,COL.mid,{t:`Spiral D${dsp} jarak ${p.s2} mm`,b:['Mengekang beton tiang dan menahan geser.'],pasal:'SNI 8460:2017'});
    });
    // anyaman pile cap
    const y1=embed+10+dbm/2, y2=y1+dbm, rb=3*dbm, tail=Math.max(hcap-y1-100,12*dbm);
    const ax=Lx/2-cover-dbm/2, az=Lz/2-cover-dbm/2;
    const up=(L)=>{ const t=turtle(-L,rb+tail,-Math.PI/2); t.fwd(tail).turn(90,rb).fwd(2*L-2*rb).turn(90,rb).fwd(tail); return t.pts; };
    const iM={t:`Tulangan bawah pile cap D${dbm}-${sm}`,b:['Bekerja sebagai pengikat tarik antar kepala tiang. Diletakkan tepat di atas kepala tiang, ujungnya dibengkokkan ke atas.'],pasal:'Pasal 13.4'};
    const pA=up(ax), pB=up(ax-1.2*dbm), pBz=up(az);
    spread(-az,az,sm).forEach(z=>bars.push({pts:pA.map(([s,y])=>[s,y1+y,z]),d:dbm,layer:'matA',color:COL.matA,info:iM}));
    spread(-ax+1.2*dbm,ax-1.2*dbm,sm).forEach(x=>bars.push({pts:up(az-1.2*dbm).map(([s,y])=>[x,y2+y,s]),d:dbm,layer:'matB',color:COL.matB,info:iM}));
    const iTop={t:'Tulangan atas pile cap D13-200',b:['Tulangan susut dan suhu di muka atas pile cap yang tebal.'],pasal:'praktik'};
    const yt=hcap-cover-6.5;
    spread(-az,az,200).forEach(z=>bars.push({pts:[[-ax,yt,z],[ax,yt,z]],d:13,layer:'atas',color:COL.matT,info:iTop}));
    spread(-ax,ax,200).forEach(x=>bars.push({pts:[[x,yt-13,-az],[x,yt-13,az]],d:13,layer:'atas',color:COL.matT,info:iTop}));
    // stek kolom
    const cg=rectCage({B:bc,H:bc,cover:40,ds:dsc,db:dbc,nu:nc,nv:nc,hook:hookOf(p,K),allSup:K});
    const yHook=y2+dbm/2+dbc/2, yTop=hcap+900, rh=4*dbc, th=12*dbc;
    const iD={t:`Stek kolom ${cg.pos.length}D${dbc}`,b:[`Kait 90° di atas tulangan bawah pile cap, ekor ${K?'mengarah ke pusat kolom':'mengarah ke luar'}.`],pasal:K?'Pasal 18.13.2.2':'Pasal 16.3.4'};
    cg.pos.forEach(([x,z])=>{ let dir=Math.abs(x)>=Math.abs(z)?[Math.sign(x)||1,0]:[0,Math.sign(z)||1]; if(K) dir=[-dir[0],-dir[1]];
      const t=turtle(0,yTop,-Math.PI/2); t.fwd(yTop-yHook-rh).turn(90,rh).fwd(th); bars.push({pts:t.pts.map(([s,y])=>[x+dir[0]*s,y,z+dir[1]*s]),d:dbc,layer:'stek',color:COL.dowel,info:iD}); });
    const iH={t:`Sengkang kolom D${dsc}`,b:['Memegang posisi stek di dalam pile cap dan mengekang kolom di atasnya.'],pasal:'praktik'};
    const hy=[]; for(let y=hcap-75;y>yHook+rh+60;y-=200) hy.push(y); for(let y=hcap+50;y<yTop-50;y+=K?100:150) hy.push(y);
    hy.forEach(y=>{ bars.push({pts:lift3D(cg.hoop,(u,v,w)=>[u,y+w,v],dsc*1.05),d:dsc,layer:'sengkang',color:COL.mid,info:iH}); cg.ties.forEach(t=>bars.push({pts:t.pts.map(([u,v])=>[u,y+dsc*1.1,v]),d:dsc,layer:'sengkang',color:COL.tie,info:iH})); });
    const concrete=[{box:[-Lx/2,Lx/2,0,hcap,-Lz/2,Lz/2]},{box:[-bc/2,bc/2,hcap,yTop,-bc/2,bc/2]},...piles.map(([x,z])=>({cyl:{x,z,r:D/2,y0:-Lp,y1:embed}}))];
    const zones=K?piles.map(([x,z])=>({box:[x-D/2-15,x+D/2+15,-Lc,0,z-D/2-15,z+D/2+15],color:COL.conf})):[];
    const labels=[{p:[piles[0][0],-Lp-120,piles[0][1]],t:'tiang dipotong untuk tampilan'},{p:[0,hcap+40,Lz/2],t:`pile cap ${fmt(Lx)} × ${fmt(Lz)} × ${fmt(hcap)}`}];
    if(K) labels.push({p:[piles[1][0]+D/2+100,-Lc/2,piles[1][1]],t:`daerah kekang ${fmt(Lc)} mm`,c:'conf'});
    // pemeriksaan
    const d=hcap-(y1+y2)/2, Ad=cg.pos.length*AREA[dbc], lc=ldc(fy,fc,dbc), avail=hcap-y2-dbm/2-40;
    const {C,add}=checker();
    add(cover>=75,'Selimut beton',`${cover} mm ≥ 75 mm`,'Tabel 20.6.1.3.1');
    add(d>=300,'Tinggi efektif pile cap',`d = ${fmt(d)} mm ≥ 300 mm`,'Pasal 13.4.2.1');
    add(sp>=2.5*D,'Jarak antar tiang',`${fmt(sp)} mm ≥ 2,5D = ${fmt(2.5*D)} mm`,'praktik');
    add(e-D/2>=150,'Jarak muka tiang ke tepi pile cap',`${fmt(e-D/2)} mm ≥ 150 mm`,'praktik');
    add(embed>=75&&embed<=150,'Kepala tiang masuk ke pile cap',`${embed} mm, umumnya 75 sampai 150 mm`,'praktik');
    add(ldp<=hcap-embed-75,'Penyaluran tulangan tiang ke pile cap',`ℓd = ${fmt(ldp)} mm ≤ tersedia ${fmt(hcap-embed-75)} mm`,'Tabel 25.4.2.2');
    add(Ad>=0.005*bc*bc,'Luas stek kolom',`${fmt(Ad)} mm² ≥ 0,005 Ag kolom = ${fmt(0.005*bc*bc)} mm²`,'Pasal 16.3.4.1');
    add(lc<=avail,'Panjang penyaluran tekan stek',`ℓdc = ${fmt(lc)} mm ≤ tersedia ${fmt(avail)} mm`,'Pasal 25.4.9.2');
    const rho=npb*AREA[dbp]/(Math.PI*D*D/4);
    add(null,'Rasio tulangan tiang',`ρ = ${fmt(rho*100,2)}%. Batas minimum mengikuti SNI 8460:2017`,'SNI 8460:2017');
    if(K){
      add(null,'Panjang daerah kekang tiang',`maks(5D; 1800) = ${fmt(Lc)} mm di bawah dasar pile cap. Diperpanjang bila tanah di sekitar tiang tidak mampu memberi tumpuan lateral`,'Pasal 18.13.4.3(a), (b)');
      const hx=2*Rb*Math.sin(Math.PI/npb), so=Math.min(150,Math.max(100,100+(350-hx)/3)), sMax=Math.min(D/4,6*dbp,so);
      add(p.s1<=sMax+0.5,'Jarak spiral daerah kekang',`s = ${p.s1} mm ≤ min(D/4; 6db; so) = ${fmt(sMax)} mm`,'Pasal 18.13.4.3, 18.7.5.3');
      const Dc=D-2*cover, Ach=Math.PI*Dc*Dc/4, Ag=Math.PI*D*D/4, rs=4*AREA[dsp]/(Dc*p.s1), rq=Math.max(0.45*(Ag/Ach-1)*fc/fy,0.12*fc/fy);
      add(rs>=rq,'Rasio spiral ρs daerah kekang',`ρs = ${fmt(rs*100,2)}% ≥ maks(0,45(Ag/Ach − 1)fc'/fyt; 0,12fc'/fyt) = ${fmt(rq*100,2)}%. Baris (c) dan (f) Tabel 18.7.5.4 tidak berlaku untuk tiang`,'Pasal 18.13.4.3, Tabel 18.7.5.4');
      add(true,'Arah kait stek','ekor kait mengarah ke pusat kolom','Pasal 18.13.2.2');
    } else add(null,'Tulangan transversal tiang','mengikuti SNI 8460:2017, tidak diperiksa di sini','SNI 8460:2017');
    const views=[
      {title:'Denah pile cap',sub:`tulangan bawah D${dbm}-${sm} dua arah`,n:'y',u:'x',v:'z',layers:['matA','matB','stek'],maxH:380,dims:[{a:[-Lx/2,-Lz/2],b:[Lx/2,-Lz/2],off:-12,t:fmt(Lx)},{a:[-sp/2,Lz/2],b:[sp/2,Lz/2],off:10,t:`s = ${fmt(sp)}`}]},
      {title:'Potongan melalui baris tiang',n:'z',at:piles[0][1],half:D/2,u:'x',v:'y',layers:['tiang','spiral','matA','matB','stek','atas'],maxH:520,dims:[{a:[Lx/2,0],b:[Lx/2,hcap],off:14,t:`${hcap}`},...(K?[{a:[-Lx/2,-Lc],b:[-Lx/2,0],off:-12,t:`kekang ${fmt(Lc)}`,c:COL.conf}]:[])]},
      {title:'Potongan horizontal tiang',sub:`${npb}D${dbp}, spiral D${dsp}`,n:'y',at:-600,half:sp1*0.55,u:'x',v:'z',layers:['tiang','spiral'],maxH:260}
    ];
    return {layers:[{k:'tiang',label:'Tulangan tiang',color:COL.long,ex:[0,-400,0]},{k:'spiral',label:'Spiral tiang',color:K?COL.conf:COL.mid,ex:[0,-400,0]},{k:'matA',label:'Tulangan bawah arah x',color:COL.matA,ex:[0,250,0]},{k:'matB',label:'Tulangan bawah arah z',color:COL.matB,ex:[0,400,0]},{k:'atas',label:'Tulangan atas pile cap',color:COL.matT,ex:[0,900,0]},{k:'stek',label:'Stek kolom',color:COL.dowel,ex:[0,1300,0]},{k:'sengkang',label:'Sengkang kolom',color:COL.mid,ex:[0,1300,0]}],
      betonEx:[-Lx*1.7,0,0],concrete,zones,bars,labels,views,checks:C,camDir:[0.8,0.3,0.95],camK:1.12,cutAxis:'z',
      colorNote:K?`Spiral <b style="color:${COL.conf}">hijau</b> di daerah kekang kepala tiang, <b style="color:${COL.mid}">biru</b> di bawahnya.`:'',
      derived:`ukuran pile cap = <b>${fmt(Lx)} × ${fmt(Lz)}</b> mm<br>d pile cap = <b>${fmt(d)}</b> mm<br>ℓd tulangan tiang = <b>${fmt(ldp)}</b> mm<br>${K?`daerah kekang = <b>${fmt(Lc)}</b> mm<br>`:''}luas stek = <b>${fmt(Ad)}</b> mm²<br>ρ tiang = <b>${fmt(rho*100,2)}%</b>`};
  }
};
