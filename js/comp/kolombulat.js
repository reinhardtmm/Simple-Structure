import {AREA,DIAS,COL,fmt,up50,devLen,checker,DAGG} from '../core.js';

/* Kolom bulat dengan spiral.
   Rujukan SNI 2847:2019: 10.6.1.1, 10.7.3.1(c), 10.7.6.3, 25.7.3 (spiral), dan untuk SRPMK 18.7.2.1, 18.7.4, 18.7.5 serta
   Tabel 18.7.5.4 baris (d) dan (e). Spiral digambar sebagai satu heliks menerus dengan jarak lilitan yang berubah per zona,
   ditambah 1,5 lilitan rapat di setiap ujung sebagai angkur (25.7.3.4). */
export default {
  id:'kolombulat', name:'Kolom bulat dengan spiral', sysDependent:true, noCombo:true,
  defaults:{
    SRPMB:{D:450,H:3500,hb:500,n:8,db:19,ds:10,sLo:50,sMid:50,fc:30,fy:420,cover:40,lap:true},
    SRPMK:{D:500,H:3500,hb:500,n:8,db:22,ds:13,sLo:75,sMid:85,fc:30,fy:420,cover:40,lap:true}
  },
  schema:[
    ['Penampang',[{k:'D',label:'Diameter kolom',unit:'mm',min:250,max:1200,step:25},{k:'H',label:'Tinggi bersih ℓu',unit:'mm',min:2000,max:6000,step:100},{k:'hb',label:'Tinggi balok di HBK',unit:'mm',min:300,max:1000,step:25}]],
    ['Tulangan',[{k:'n',label:'Jumlah tulangan longitudinal',unit:'batang',min:4,max:20},{k:'db',label:'Diameter longitudinal',unit:'D',opts:DIAS},{k:'ds',label:'Diameter spiral',unit:'D',opts:[8,10,13,16]},
      {k:'sLo',label:'Jarak lilitan spiral di ℓo',unit:'mm',min:35,max:150,step:5,show:s=>s==='SRPMK'},{k:'sMid',label:s=>s==='SRPMK'?'Jarak lilitan spiral lainnya':'Jarak lilitan spiral',unit:'mm',min:35,max:150,step:5}]],
    ['Material',[{k:'fc',label:"Mutu beton fc'",unit:'MPa',opts:[20,25,30,35,40]},{k:'fy',label:'Mutu baja fy',unit:'MPa',opts:[280,420]},{k:'cover',label:'Selimut beton',unit:'mm',min:20,max:75,step:5},{k:'lap',label:'Tampilkan sambungan lewatan',type:'bool'}]]
  ],
  teori:{
    common:`<h3>Kolom bulat dengan spiral</h3><p>Pada kolom bulat, tulangan longitudinal disusun melingkar dan diikat oleh satu batang yang dililitkan menerus, yaitu spiral. Karena melingkar tanpa putus, spiral mengekang inti beton dari semua arah secara merata. Saat selimut beton terkelupas, inti yang terkekang masih mampu memikul beban, sehingga kolom spiral lebih daktail daripada kolom bersengkang biasa.</p><ul><li><b>Tulangan longitudinal</b> paling sedikit enam batang supaya spiral membentuk lingkaran yang stabil <span class="pasal">10.7.3.1(c)</span>.</li><li><b>Jarak lilitan</b> (pitch) diukur dari sumbu ke sumbu lilitan. Yang dibatasi standar adalah jarak bersihnya, yaitu jarak lilitan dikurangi diameter spiral.</li><li><b>Rasio volumetrik ρs</b> adalah volume spiral dibagi volume inti beton. Untuk satu lilitan, ρs = 4 Asp / (Dc s), dengan Dc diameter inti diukur sampai tepi luar spiral.</li><li><b>Ujung spiral</b> diangkur dengan 1,5 lilitan tambahan, bukan dengan kait <span class="pasal">25.7.3.4</span>.</li></ul>`,
    SRPMB:`<h4>Detailing spiral umum</h4><ul><li><b>Rasio tulangan</b> longitudinal 1% sampai 8% <span class="pasal">10.6.1.1</span>.</li><li><b>Jarak bersih lilitan</b> tidak kurang dari 25 mm dan (4/3) ukuran agregat, serta tidak lebih dari 75 mm <span class="pasal">25.7.3.1</span>.</li><li><b>Diameter spiral</b> paling kecil 9,5 mm untuk konstruksi cor di tempat <span class="pasal">25.7.3.2</span>.</li><li><b>Rasio spiral</b> ρs ≥ 0,45 (Ag/Ach − 1) fc'/fyt, dengan fyt tidak lebih dari 700 MPa <span class="pasal">25.7.3.3</span>.</li><li><b>Batas spiral</b>: mulai dari muka atas fondasi atau pelat <span class="pasal">10.7.6.3.1</span>, dan di atas diteruskan sampai tulangan horizontal terendah dari komponen yang ditumpu <span class="pasal">Tabel 10.7.6.3.2</span>.</li><li><b>Sambungan spiral</b> dengan lewatan 48db dan tidak kurang dari 300 mm untuk batang ulir tanpa lapisan, hanya untuk fyt sampai 420 MPa <span class="pasal">25.7.3.5, Tabel 25.7.3.6</span>.</li></ul><div class="box">Ubah ke SRPMK. Spiral diteruskan ke dalam hubungan balok-kolom, lewatan pindah ke tengah tinggi kolom, dan muncul daerah ℓo.</div>`,
    SRPMK:`<h4>Detailing SRPMK</h4><ul><li><b>Dimensi</b> penampang terkecil paling sedikit 300 mm <span class="pasal">18.7.2.1</span>, dan rasio tulangan 1% sampai 6% <span class="pasal">18.7.4.1</span>.</li><li><b>Daerah ℓo</b> dari tiap muka joint sepanjang maks(D; ℓu/6; 450 mm) <span class="pasal">18.7.5.1</span>.</li><li><b>Jarak lilitan di ℓo</b> tidak lebih dari D/4, 6db, dan so <span class="pasal">18.7.5.3</span>, dan jarak bersihnya tetap tidak lebih dari 75 mm <span class="pasal">25.7.3.1</span>.</li><li><b>Rasio spiral di ℓo</b> ρs ≥ maks(0,45 (Ag/Ach − 1) fc'/fyt; 0,12 fc'/fyt). Bila Pu > 0,3 Ag fc' atau fc' > 70 MPa, ada syarat tambahan 0,35 kf Pu/(fyt Ach) <span class="pasal">Tabel 18.7.5.4</span>.</li><li><b>Di luar ℓo</b> dipasang spiral yang memenuhi 25.7.3 dengan jarak tidak lebih dari 6db dan 150 mm <span class="pasal">18.7.5.5</span>.</li><li><b>Sambungan lewatan</b> hanya di setengah tinggi bagian tengah kolom, dihitung sebagai lewatan tarik, dan dilingkupi spiral dengan jarak seperti di ℓo <span class="pasal">18.7.4.3</span>.</li><li><b>Spiral di dalam joint</b> tetap dipasang <span class="pasal">18.8.3.1</span>.</li></ul>`
  },
  build(p,sys){
    const K=sys==='SRPMK';
    const {D,H,hb,n,db,ds,fc,fy,cover}=p, sMid=p.sMid, sLo=K?p.sLo:p.sMid;
    const Rb=D/2-cover-ds-db/2, Rs=D/2-cover-ds/2, Dc=D-2*cover;
    const lo=K?up50(Math.max(D,H/6,450)):0;
    const ld=devLen(fy,fc,db,1.0);
    const lapLen=K?up50(1.3*ld):up50(Math.max(0.071*fy*db,300));
    const lapS=K?H/2-lapLen/2:0, lapE=lapS+lapLen;
    const lapOn=p.lap&&(K?(lapS>lo&&lapE<H-lo):true);
    const yBot=-hb-350, yTop=H+hb+350;
    const Ag=Math.PI*D*D/4, Ach=Math.PI*Dc*Dc/4, rho=n*AREA[db]/Ag;
    const bars=[];
    const iL={t:`Tulangan longitudinal ${n}D${db}`,b:[`ρg = ${fmt(rho*100,2)}%. Disusun melingkar di dalam spiral.`,p.lap?(K?`Disambung lewatan ${fmt(lapLen)} mm di setengah tinggi tengah kolom.`:`Disambung lewatan ${fmt(lapLen)} mm tepat di atas lantai (praktik umum).`):''],pasal:K?'Pasal 18.7.4':'Pasal 10.6, 10.7'};
    for(let i=0;i<n;i++){ const t=2*Math.PI*i/n, c=Math.cos(t), s=Math.sin(t), x=Rb*c, z=Rb*s;
      if(p.lap){ const xi=(Rb-db)*c, zi=(Rb-db)*s;
        bars.push({pts:[[x,yBot,z],[x,lapE,z]],d:db,layer:'long',color:COL.long,info:iL});
        bars.push({pts:[[xi,lapS,zi],[xi,yTop,zi]],d:db,layer:'long',color:COL.long,info:{...iL,b:[...iL.b,'Batang atas dikrep ke dalam agar bisa bersebelahan dengan batang bawah.']}});
      } else bars.push({pts:[[x,yBot,z],[x,yTop,z]],d:db,layer:'long',color:COL.long,info:iL}); }
    // zona spiral dari bawah ke atas: [y0, y1, jarak lilitan, kunci zona]
    const y0s=K?-hb+50:0, y1s=K?H+hb-50:H;
    const Z=[];
    if(K){ Z.push([y0s,0,sLo,'joint'],[0,lo,sLo,'conf']);
      if(lapOn) Z.push([lo,lapS,sMid,'mid'],[lapS,lapE,sLo,'lap'],[lapE,H-lo,sMid,'mid']); else Z.push([lo,H-lo,sMid,'mid']);
      Z.push([H-lo,H,sLo,'conf'],[H,y1s,sLo,'joint']); }
    else Z.push([0,H,sMid,'mid']);
    const infoOf=(z,s)=>({t:`Spiral D${ds}, jarak lilitan ${fmt(s)} mm`,b:[z==='conf'?`Daerah ℓo = ${fmt(lo)} mm dari muka joint. Mengekang inti beton tempat sendi plastis dapat terbentuk.`:z==='lap'?'Daerah sambungan lewatan, jarak lilitan sama dengan di ℓo.':z==='joint'?'Diteruskan di dalam hubungan balok-kolom.':z==='angkur'?'Angkur ujung spiral: 1,5 lilitan tambahan.':'Mengekang inti beton dan menahan tekuk tulangan longitudinal.',`Jarak bersih lilitan ${fmt(s-ds)} mm.`],
      pasal:z==='angkur'?'Pasal 25.7.3.4':K?(z==='joint'?'Pasal 18.8.3.1':z==='lap'?'Pasal 18.7.4.3':z==='conf'?'Pasal 18.7.5':'Pasal 18.7.5.5'):'Pasal 25.7.3'});
    // heliks menerus: sudut berlanjut dari satu zona ke zona berikutnya; dipecah per 6 lilitan supaya tabung tidak terlalu panjang
    const N=24; let th=0;
    const emit=(pts,z,s)=>{ for(let i=0;i<pts.length-1;i+=N*6){ const seg=pts.slice(i,i+N*6+1); if(seg.length>1) bars.push({pts:seg,d:ds,layer:'spiral',color:z==='angkur'?COL.tie:COL[z]||COL.mid,info:infoOf(z,s),maxSeg:seg.length+4}); } };
    // 1,5 lilitan rapat (jarak lilitan = diameter spiral) mulai dari ketinggian y
    const flat=y=>{ const pts=[]; for(let k=0;k<=N*1.5;k++){ pts.push([Rs*Math.cos(th),y+ds*1.05*k/N,Rs*Math.sin(th)]); th+=2*Math.PI/N; } th-=2*Math.PI/N; return pts; };
    emit(flat(y0s-1.5*ds*1.05),'angkur',ds);
    for(const [a,b,s,z] of Z){ const turns=(b-a)/s, m=Math.max(2,Math.ceil(turns*N)), pts=[]; const t0=th;
      for(let k=0;k<=m;k++){ const f=k/m; pts.push([Rs*Math.cos(t0+2*Math.PI*turns*f),a+(b-a)*f,Rs*Math.sin(t0+2*Math.PI*turns*f)]); }
      th=t0+2*Math.PI*turns; emit(pts,z,s); }
    emit(flat(y1s),'angkur',ds);
    const jw=D+300;
    const concrete=[{cyl:{x:0,z:0,r:D/2,y0:0,y1:H}},{box:[-jw/2,jw/2,-hb,0,-jw/2,jw/2],kind:'stub'},{box:[-jw/2,jw/2,H,H+hb,-jw/2,jw/2],kind:'stub'}];
    const zb=(a,b,c)=>({box:[-D/2-15,D/2+15,a,b,-D/2-15,D/2+15],color:c});
    const zones=[]; if(K) zones.push(zb(0,lo,COL.conf),zb(H-lo,H,COL.conf)); if(lapOn) zones.push(zb(lapS,lapE,COL.lap));
    const labels=[{p:[D/2+160,H/2,0],t:`ℓu = ${fmt(H)} mm`},{p:[D/2+60,y1s+10,0],t:'angkur 1,5 lilitan',follow:'spiral'}];
    if(K) labels.push({p:[D/2+120,lo/2,0],t:`ℓo = ${fmt(lo)} mm`,c:'conf'},{p:[D/2+120,H-lo/2,0],t:`ℓo = ${fmt(lo)} mm`,c:'conf'},{p:[jw/2+60,-hb/2,0],t:'HBK'});
    if(lapOn) labels.push({p:[-D/2-120,lapS+lapLen/2,0],t:`lewatan ${fmt(lapLen)} mm`,c:'lap'});
    // pemeriksaan
    const chord=2*Rb*Math.sin(Math.PI/n), clr=chord-db, clrReq=Math.max(40,1.5*db,4/3*DAGG);
    const fyt=Math.min(fy,700), rs=s=>4*AREA[ds]/(Dc*s), rq1=0.45*(Ag/Ach-1)*fc/fyt, rq2=0.12*fc/fyt;
    const cMin=Math.max(25,4/3*DAGG);
    const {C,add}=checker();
    add(cover>=40,'Selimut beton',`${cover} mm ≥ 40 mm (kolom: tulangan utama, sengkang, spiral)`,'Tabel 20.6.1.3.1');
    add(n>=6,'Jumlah tulangan longitudinal',`${n} batang ≥ 6 (dilingkupi spiral)`,'Pasal 10.7.3.1(c)');
    add(clr>=clrReq,'Spasi bersih tulangan longitudinal',`${fmt(clr)} mm ≥ maks(40; 1,5db; 4/3·dagg) = ${fmt(clrReq,1)} mm`,'Pasal 25.2.3');
    add(ds>=10,'Diameter spiral',`D${ds}, paling kecil 9,5 mm untuk cor di tempat`,'Pasal 25.7.3.2');
    add(null,'Angkur ujung spiral','1,5 lilitan tambahan di setiap ujung spiral','Pasal 25.7.3.4');
    add(fy<=420?null:false,'Sambungan spiral',`lewatan 48db = ${fmt(Math.max(48*ds,300))} mm (tidak kurang dari 300 mm) untuk batang ulir tanpa lapisan${fy<=420?'':'; lewatan hanya untuk fyt ≤ 420 MPa, selebihnya pakai sambungan mekanis atau las'}`,'Pasal 25.7.3.5, Tabel 25.7.3.6');
    if(K){
      add(D>=300,'Dimensi penampang terkecil',`${D} mm ≥ 300 mm`,'Pasal 18.7.2.1(a)');
      add(rho>=0.01&&rho<=0.06,'Rasio tulangan ρg',`${fmt(rho*100,2)}% (batas 1% sampai 6%)`,'Pasal 18.7.4.1');
      add(null,'Panjang daerah ℓo',`ℓo = maks(D; ℓu/6; 450) = ${fmt(lo)} mm dari tiap muka HBK`,'Pasal 18.7.5.1');
      const so=Math.min(150,Math.max(100,100+(350-chord)/3)), sMax=Math.min(D/4,6*db,so);
      add(sLo<=sMax+0.5,'Jarak lilitan spiral di ℓo',`s = ${fmt(sLo)} mm ≤ min(D/4; 6db; so) = ${fmt(sMax)} mm, so = ${fmt(so)} mm`,'Pasal 18.7.5.3');
      add(sLo-ds>=cMin&&sLo-ds<=75,'Jarak bersih lilitan di ℓo',`${fmt(sLo-ds)} mm, batas ${fmt(cMin,1)} sampai 75 mm`,'Pasal 25.7.3.1');
      add(rs(sLo)>=Math.max(rq1,rq2),'Rasio spiral ρs di ℓo',`ρs = ${fmt(rs(sLo)*100,2)}% ≥ maks(0,45(Ag/Ach − 1)fc'/fyt; 0,12fc'/fyt) = ${fmt(Math.max(rq1,rq2)*100,2)}%. Memakai baris (d) dan (e), dengan anggapan Pu ≤ 0,3Ag fc' dan fc' ≤ 70 MPa`,'Tabel 18.7.5.4');
      add(sMid<=Math.min(6*db,150)+0.5,'Jarak lilitan di luar ℓo',`s = ${fmt(sMid)} mm ≤ min(6db; 150) = ${fmt(Math.min(6*db,150))} mm`,'Pasal 18.7.5.5');
      add(sMid-ds>=cMin&&sMid-ds<=75&&rs(sMid)>=rq1,'Spiral di luar ℓo memenuhi 25.7.3',`jarak bersih ${fmt(sMid-ds)} mm (batas ${fmt(cMin,1)} sampai 75 mm); ρs = ${fmt(rs(sMid)*100,2)}% ≥ ${fmt(rq1*100,2)}%`,'Pasal 18.7.5.5, 25.7.3');
      if(p.lap) add(lapOn,'Sambungan lewatan di setengah tinggi tengah',`lewatan tarik 1,3ℓd = ${fmt(lapLen)} mm pada ${fmt(lapS)} s.d. ${fmt(lapE)} mm, jarak lilitan mengikuti ℓo`,'Pasal 18.7.4.3');
      add(null,'Spiral di HBK',`spiral diteruskan di dalam joint dengan jarak lilitan ${fmt(sLo)} mm`,'Pasal 18.8.3.1');
    } else {
      add(rho>=0.01&&rho<=0.08,'Rasio tulangan ρg',`${fmt(rho*100,2)}% (batas 1% sampai 8%)`,'Pasal 10.6.1.1');
      add(sMid-ds>=cMin&&sMid-ds<=75,'Jarak bersih lilitan spiral',`${fmt(sMid-ds)} mm, batas maks(25; 4/3·dagg) = ${fmt(cMin,1)} sampai 75 mm`,'Pasal 25.7.3.1');
      add(rs(sMid)>=rq1,'Rasio spiral ρs',`ρs = 4Asp/(Dc s) = ${fmt(rs(sMid)*100,2)}% ≥ 0,45(Ag/Ach − 1)fc'/fyt = ${fmt(rq1*100,2)}%`,'Pasal 25.7.3.3');
      add(null,'Batas spiral','mulai dari muka atas pelat atau fondasi, sampai tulangan horizontal terendah balok di atasnya (balok di semua sisi kolom)','Pasal 10.7.6.3.1, Tabel 10.7.6.3.2');
      if(p.lap) add(null,'Sambungan lewatan tekan',`ℓ = maks(0,071 fy db; 300) = ${fmt(lapLen)} mm, tepat di atas lantai (praktik umum)`,'Pasal 25.5.5.1');
    }
    const ySec=K?lo/2:H/2;
    const sec=(t,y,s)=>({title:t,sub:`${n}D${db} / spiral D${ds}, jarak lilitan ${fmt(s)}`,n:'y',at:y,half:s*0.55,u:'x',v:'z',w2:K,maxH:300,dims:[{a:[-D/2,-D/2],b:[D/2,-D/2],off:-16,t:`D = ${fmt(D)}`}]});
    const views=K?[sec('Potongan A, daerah ℓo',ySec,sLo),sec('Potongan B, luar ℓo',lapOn?(lo+lapS)/2:H/2,sMid)]:[sec('Potongan tipikal',ySec,sMid)];
    views.push({title:'Tampak memanjang',n:'z',at:0,half:D,u:'x',v:'y',maxH:520,
      dims:[{a:[jw/2,0],b:[jw/2,H],off:44,t:`ℓu = ${fmt(H)}`},...(K?[{a:[jw/2,0],b:[jw/2,lo],off:20,t:`ℓo=${fmt(lo)}`,c:COL.conf},{a:[jw/2,H-lo],b:[jw/2,H],off:20,t:`ℓo=${fmt(lo)}`,c:COL.conf}]:[]),...(lapOn?[{a:[-jw/2,lapS],b:[-jw/2,lapE],off:-12,t:`lewatan ${fmt(lapLen)}`,c:COL.lap}]:[])]});
    const derived=`jumlah tulangan = <b>${n}D${db}</b>, ρg = <b>${fmt(rho*100,2)}%</b><br>diameter inti Dc = <b>${fmt(Dc)}</b> mm, Ag/Ach = <b>${fmt(Ag/Ach,3)}</b><br>ρs perlu = <b>${fmt((K?Math.max(rq1,rq2):rq1)*100,2)}%</b><br>${K?`ρs di ℓo = <b>${fmt(rs(sLo)*100,2)}%</b>, di luar ℓo = <b>${fmt(rs(sMid)*100,2)}%</b><br>ℓo = <b>${fmt(lo)}</b> mm<br>`:`ρs terpasang = <b>${fmt(rs(sMid)*100,2)}%</b><br>`}panjang lewatan = <b>${fmt(lapLen)}</b> mm`;
    const layers=[{k:'long',label:'Tulangan longitudinal',color:COL.long,ex:[0,0,0]},{k:'spiral',label:'Spiral',color:K?COL.conf:COL.mid,ex:[0,0,D*1.6]}];
    return {layers,betonEx:[-D*2.6,0,0],concrete,zones,bars,labels,views,checks:C,derived,camDir:[0.62,0.25,0.75],camK:1.05,cutAxis:'y',
      colorNote:K?`Warna spiral: <b style="color:${COL.conf}">hijau</b> ℓo dan HBK, <b style="color:${COL.mid}">biru</b> daerah biasa, <b style="color:${COL.lap}">kuning</b> lewatan, <b style="color:${COL.tie}">ungu</b> angkur ujung.`:`<b style="color:${COL.tie}">Ungu</b>: 1,5 lilitan angkur di ujung spiral.`};
  }
};
