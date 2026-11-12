import {AREA,DIAS,COL,fmt,up50,dn5,linspace,beta1,devLen,ldhGen,ldhSeis,turtle,hoop2D,lift3D,fill,checker,DAGG} from '../core.js';

export default {
  id:'balok', name:'Balok', sysDependent:true,
  defaults:{
    SRPMB:{b:300,h:500,ln:5000,hc:500,nTop:3,nBot:3,db:19,ds:10,sT:150,sL:200,fc:30,fy:420,cover:40,lap:true},
    SRPMK:{b:300,h:500,ln:5000,hc:500,nTop:3,nBot:3,db:19,ds:10,sT:100,sL:200,fc:30,fy:420,cover:40,lap:true}
  },
  schema:[
    ['Penampang',[{k:'b',label:'Lebar b',unit:'mm',min:200,max:800,step:25},{k:'h',label:'Tinggi h',unit:'mm',min:250,max:1200,step:25},{k:'ln',label:'Bentang bersih ℓn',unit:'mm',min:2000,max:12000,step:100},{k:'hc',label:'Dimensi kolom hc',unit:'mm',min:250,max:1000,step:25}]],
    ['Tulangan',[{k:'nTop',label:'Jumlah tulangan atas',unit:'batang',min:1,max:8},{k:'nBot',label:'Jumlah tulangan bawah',unit:'batang',min:1,max:8},{k:'db',label:'Diameter longitudinal',unit:'D',opts:DIAS},{k:'ds',label:'Diameter sengkang',unit:'D',opts:[10,13,16]},
      {k:'sT',label:s=>s==='SRPMK'?'Spasi sengkang daerah 2h':'Spasi sengkang tumpuan ℓn/4',unit:'mm',min:50,max:300,step:5},{k:'sL',label:'Spasi sengkang lapangan',unit:'mm',min:50,max:400,step:5}]],
    ['Material',[{k:'fc',label:"Mutu beton fc'",unit:'MPa',opts:[20,25,30,35,40]},{k:'fy',label:'Mutu baja fy',unit:'MPa',opts:[280,420]},{k:'cover',label:'Selimut beton',unit:'mm',min:20,max:75,step:5},{k:'lap',label:'Tampilkan sambungan lewatan',type:'bool'}]]
  ],
  teori:{
    common:`<h3>Balok beton bertulang</h3><p>Balok memikul beban dari pelat lalu menyalurkannya ke kolom. Beban itu menimbulkan momen lentur dan gaya geser. Beton kuat menahan tekan tetapi lemah menahan tarik, sehingga sisi yang tertarik diberi tulangan longitudinal. Gaya geser ditahan bersama oleh beton dan sengkang.</p><ul><li><b>Tulangan atas</b> bekerja di daerah tumpuan, tempat momen negatif membuat serat atas tertarik.</li><li><b>Tulangan bawah</b> bekerja di lapangan, tempat momen positif membuat serat bawah tertarik.</li><li><b>Sengkang</b> menahan geser, memegang posisi tulangan longitudinal, dan pada SRPMK juga mengekang beton.</li></ul>`,
    SRPMB:`<h4>Detailing SRPMB</h4><p>SRPMB dipakai di wilayah dengan risiko gempa rendah, yaitu KDS B. Struktur tidak diharapkan berdeformasi inelastis besar, sehingga syarat detailingnya hampir sama dengan balok biasa di Pasal 9.</p><ul><li>Minimal dua batang tulangan menerus di sisi atas dan bawah <span class="pasal">18.3.2</span>.</li><li>Spasi sengkang maksimum d/2 dan tidak lebih dari 600 mm <span class="pasal">9.7.6.2.2</span>.</li><li>Kait sengkang 90° diizinkan untuk diameter sampai D16 <span class="pasal">25.3.2</span>.</li><li>Sengkang yang lebih rapat di ℓn/4 dekat tumpuan adalah kebiasaan desain, karena geser terbesar terjadi di sana. Ini bukan syarat detailing khusus dari SNI.</li></ul><div class="box">Coba ubah ke SRPMK dengan parameter yang sama. Perhatikan daerah 2h, kait 135°, dan spasi sengkang di sepanjang lewatan.</div>`,
    SRPMK:`<h4>Detailing SRPMK</h4><p>SRPMK wajib dipakai untuk KDS D sampai F. Saat gempa kuat, struktur sengaja dibuat meleleh di ujung balok, bukan di kolom. Prinsip ini disebut kolom kuat balok lemah. Daerah sepanjang 2h dari muka kolom disiapkan menjadi sendi plastis.</p><ul><li><b>Sengkang tertutup sepanjang 2h</b> dengan sengkang pertama maksimal 50 mm dari muka kolom <span class="pasal">18.6.4.1</span> <span class="pasal">18.6.4.4</span>.</li><li><b>Spasi di daerah 2h</b> tidak lebih dari d/4, 6db, dan 150 mm. Spasi rapat ini mencegah tulangan tekan menekuk setelah selimut beton terkelupas <span class="pasal">18.6.4.4</span>.</li><li><b>Kait gempa 135°</b> dengan perpanjangan minimal 6db dan 75 mm. Kait 90° bisa terbuka saat selimut lepas, sedangkan kait 135° tetap tertanam di inti beton <span class="pasal">25.3.4</span>.</li><li><b>Sambungan lewatan</b> dilarang di dalam joint dan dalam jarak 2h dari muka kolom. Di sepanjang lewatan spasi sengkang maksimal d/4 dan 100 mm <span class="pasal">18.6.3.3</span>.</li><li><b>Tulangan bawah di muka kolom</b> harus memberi kuat momen positif minimal setengah dari kuat momen negatif, karena arah gempa berbalik <span class="pasal">18.6.3.2</span>.</li><li><b>Dimensi</b> ℓn ≥ 4d dan bw ≥ min(0,3h; 250 mm) <span class="pasal">18.6.2.1</span>.</li></ul>`
  },
  build(p,sys){
    const K=sys==='SRPMK';
    const {b,h,ln,hc,nTop,nBot,db,ds,fc,fy,cover}=p;
    const d=h-cover-ds-db/2, hook=K?135:90, ext=K?Math.max(6*ds,75):6*ds, r=2.5*ds;
    const ha=b/2-cover-ds/2, hb=h/2-cover-ds/2, zl=b/2-cover-ds-db/2, yl=h/2-cover-ds-db/2;
    const zsT=linspace(-zl,zl,nTop), zsB=linspace(-zl,zl,nBot);
    const psiT=(h-(cover+ds+db/2))>300?1.3:1.0;
    const ldTop=devLen(fy,fc,db,psiT), lapLen=up50(1.3*ldTop);
    const ldh=K?ldhSeis(fy,fc,db):ldhGen(fy,fc,db), ldhAvail=hc-50;
    const zoneLen=K?2*h:up50(ln/4);
    const sLapReq=K?dn5(Math.min(d/4,100)):p.sL;
    const mid=ln/2, lapS=mid-lapLen/2, lapE=mid+lapLen/2;
    const sMaxT=K?Math.min(d/4,6*db,150):Math.min(d/2,600), sMaxL=Math.min(d/2,600);
    // posisi sengkang
    const st=[], L=[], R=[];
    for(let x=50;x<=zoneLen+1e-6;x+=p.sT) L.push(x);
    for(let x=ln-50;x>=ln-zoneLen-1e-6;x-=p.sT) R.push(x);
    L.forEach(x=>st.push({x,z:'conf'}));
    const Ll=L.at(-1)??0, Rf=R.at(-1)??ln;
    const lapOn=p.lap && lapS>Ll && lapE<Rf;
    const segs=lapOn?[[Ll,lapS,p.sL,'mid'],[lapS,lapE,sLapReq,'lap'],[lapE,Rf,p.sL,'mid']]:[[Ll,Rf,p.sL,'mid']];
    segs.forEach(([a,c,s,z],i)=>{ let pos=fill(a,c,s).pos; if(i===segs.length-1) pos=pos.slice(0,-1); pos.forEach(x=>st.push({x,z})); });
    R.slice().reverse().forEach(x=>st.push({x,z:'conf'}));
    st.sort((a,c)=>a.x-c.x);
    // tulangan longitudinal
    const rb=3.5*db, tail=12*db, xA=-hc+50+db/2, xB=ln+hc-50-db/2;
    const topPath=(x0,x1,hl,hr)=>{ const pts=[]; if(hl){ const t=turtle(x0,yl-rb-tail,Math.PI/2); t.fwd(tail).turn(-90,rb); pts.push(...t.pts);} else pts.push([x0,yl]);
      if(hr){ const last=pts.at(-1); const t=turtle(last[0],yl,0); t.fwd(x1-rb-last[0]).turn(-90,rb).fwd(tail); pts.push(...t.pts.slice(1)); } else pts.push([x1,yl]); return pts; };
    const botPath=(x0,x1)=>{ const t=turtle(x0,-yl+rb+tail,-Math.PI/2); t.fwd(tail).turn(90,rb).fwd(x1-x0-2*rb).turn(90,rb).fwd(tail); return t.pts; };
    const iTop={t:`Tulangan atas ${nTop}D${db}`,b:[`Menahan momen negatif di tumpuan. Ujung dibengkokkan 90° ke bawah di dalam kolom dengan ekor 12db = ${fmt(12*db)} mm. ℓdh perlu ${fmt(ldh)} mm.`,lapOn?`Disambung lewatan ${fmt(lapLen)} mm di tengah bentang, tempat momen negatif kecil.`:''],pasal:K?'Pasal 18.6.3, 18.8.5':'Pasal 9.7, 25.4.3'};
    const iBot={t:`Tulangan bawah ${nBot}D${db}`,b:['Menahan momen positif di lapangan. Pada SRPMK juga menahan momen positif di muka kolom akibat gempa bolak-balik.','Ujung dibengkokkan 90° ke atas di dalam kolom.'],pasal:K?'Pasal 18.6.3.2':'Pasal 18.3.2'};
    const bars=[];
    const P3=(path,z)=>path.map(([x,y])=>[x,y,z]);
    zsT.forEach(z=>{
      if(lapOn){ const zo=z+(nTop===1?db:(z>0?-db:db));
        bars.push({pts:P3(topPath(xA,lapE,true,false),z),d:db,layer:'atas',color:COL.top,info:iTop});
        bars.push({pts:P3(topPath(lapS,xB,false,true),zo),d:db,layer:'atas',color:COL.top,info:iTop});
      } else bars.push({pts:P3(topPath(xA,xB,true,true),z),d:db,layer:'atas',color:COL.top,info:iTop});
    });
    zsB.forEach(z=>bars.push({pts:P3(botPath(xA+2.5*db,xB-2.5*db),z),d:db,layer:'bawah',color:COL.bot,info:iBot}));
    const hoop=hoop2D(ha,hb,r,hook,ext);
    st.forEach(s=>{
      const zt=s.z==='conf'?(K?`daerah 2h (sendi plastis), s = ${fmt(p.sT)} mm`:`zona tumpuan ℓn/4, s = ${fmt(p.sT)} mm`):s.z==='lap'?`daerah sambungan lewatan, s = ${fmt(sLapReq)} mm`:`daerah lapangan, s ≤ ${fmt(p.sL)} mm`;
      bars.push({pts:lift3D(hoop,(u,v,w)=>[s.x+w,v,u],ds*1.05),d:ds,layer:'sengkang',color:COL[s.z],
        info:{t:`Sengkang D${ds}`,b:[`Posisi x = ${fmt(s.x)} mm dari muka kolom kiri, ${zt}.`,hook===135?`Sengkang tertutup dengan kait gempa 135°, perpanjangan ${fmt(ext)} mm masuk ke inti beton.`:`Kait 90° dengan perpanjangan ${fmt(ext)} mm.`],pasal:K?(s.z==='conf'?'Pasal 18.6.4.1, 18.6.4.4':s.z==='lap'?'Pasal 18.6.3.3':'Pasal 18.6.4.6'):'Pasal 9.7.6, 25.3.2'}});
    });
    const stubH=h+600, stubW=b+200;
    const concrete=[{box:[0,ln,-h/2,h/2,-b/2,b/2]},{box:[-hc,0,-stubH/2,stubH/2,-stubW/2,stubW/2],kind:'stub'},{box:[ln,ln+hc,-stubH/2,stubH/2,-stubW/2,stubW/2],kind:'stub'}];
    const zb=(x0,x1,c)=>({box:[x0,x1,-h/2-15,h/2+15,-b/2-15,b/2+15],color:c});
    const zones=[zb(0,zoneLen,COL.conf),zb(ln-zoneLen,ln,COL.conf)]; if(lapOn) zones.push(zb(lapS,lapE,COL.lap));
    const yL=h/2+90, zN=K?'2h':'ℓn/4';
    const labels=[{p:[zoneLen/2,yL,0],t:`${zN} = ${fmt(zoneLen)} mm`,c:'conf'},{p:[ln-zoneLen/2,yL,0],t:`${zN} = ${fmt(zoneLen)} mm`,c:'conf'},{p:[-hc/2,stubH/2+60,0],t:'kolom'},{p:[ln+hc/2,stubH/2+60,0],t:'kolom'},{p:[ln/2,-h/2-40,b/2],t:`ℓn = ${fmt(ln)} mm`}];
    if(lapOn) labels.push({p:[ln/2,yL,0],t:`lewatan ${fmt(lapLen)} mm`,c:'lap'});
    // gambar
    const sA=st.filter(s=>s.z==='conf')[2]||st[0], sB=st.find(s=>s.z==='mid')||st[0];
    const secDims=[{a:[-b/2,-h/2],b:[b/2,-h/2],off:-16,t:fmt(b)},{a:[-b/2,-h/2],b:[-b/2,h/2],off:-16,t:fmt(h)}];
    const views=[
      {title:K?'Potongan A, daerah 2h':'Potongan A, tumpuan',sub:`${nTop}D${db} / ${nBot}D${db} / D${ds}-${fmt(p.sT)}`,n:'x',at:sA.x+ds*0.5,half:ds*1.2,u:'z',v:'y',dims:secDims,w2:true,maxH:300},
      {title:'Potongan B, lapangan',sub:`${nTop}D${db} / ${nBot}D${db} / D${ds}-${fmt(p.sL)}`,n:'x',at:sB.x+ds*0.5,half:ds*1.2,u:'z',v:'y',dims:secDims,w2:true,maxH:300},
      {title:'Tampak memanjang (potongan di tulangan sudut)',n:'z',at:-zl,half:db*1.6,u:'x',v:'y',maxH:280,
        dims:[{a:[0,-stubH/2],b:[zoneLen,-stubH/2],off:-14,t:`${zN}=${fmt(zoneLen)}, D${ds}-${fmt(p.sT)}`,c:COL.conf},{a:[ln-zoneLen,-stubH/2],b:[ln,-stubH/2],off:-14,t:`${zN}=${fmt(zoneLen)}`,c:COL.conf},{a:[0,-stubH/2],b:[ln,-stubH/2],off:-36,t:`ℓn = ${fmt(ln)}`},...(lapOn?[{a:[lapS,stubH/2],b:[lapE,stubH/2],off:8,t:`lewatan ${fmt(lapLen)}, D${ds}-${fmt(sLapReq)}`,c:COL.lap}]:[])]}
    ];
    // pemeriksaan
    const As=n=>n*AREA[db], AsT=As(nTop), AsB=As(nBot);
    const rhoMin=Math.max(0.25*Math.sqrt(fc)/fy,1.4/fy);
    const clrT=nTop>1?(2*zl)/(nTop-1)-db:Infinity, clrB=nBot>1?(2*zl)/(nBot-1)-db:Infinity, clrReq=Math.max(25,db,4/3*DAGG);
    const a_=AsB*fy/(0.85*fc*b), c_=a_/beta1(fc), et=0.003*(d-c_)/c_;
    const maxSt=z=>{let m=0; for(let i=1;i<st.length;i++) if(st[i].z===z&&st[i-1].z===z) m=Math.max(m,st[i].x-st[i-1].x); return m;};
    const sTact=maxSt('conf'), sLact=maxSt('mid'), sLapAct=maxSt('lap');
    const {C,add}=checker();
    add(cover>=40,'Selimut beton',`${cover} mm ≥ 40 mm (balok tidak terekspos cuaca)`,'Tabel 20.6.1.3.1');
    add(Math.min(clrT,clrB)>=clrReq,'Spasi bersih tulangan longitudinal',`atas ${isFinite(clrT)?fmt(clrT):'-'} mm, bawah ${isFinite(clrB)?fmt(clrB):'-'} mm ≥ maks(25; db; 4/3·dagg) = ${fmt(clrReq,1)} mm`,'Pasal 25.2.1');
    add(AsB>=rhoMin*b*d&&AsT>=rhoMin*b*d,'Luas tulangan minimum',`As,min = ${fmt(rhoMin*b*d)} mm²; atas ${fmt(AsT)} mm², bawah ${fmt(AsB)} mm²`,'Pasal 9.6.1.2');
    add(et>=0.004,'Regangan tarik tulangan bawah',`εt = ${fmt(et,4)} ≥ 0,004 (c = ${fmt(c_,1)} mm)`,'Pasal 9.3.3.1');
    add(ldh<=ldhAvail,'Panjang penyaluran kait di kolom',`ℓdh = ${fmt(ldh)} mm ≤ tersedia ${fmt(ldhAvail)} mm`,K?'Pasal 18.8.5.1':'Pasal 25.4.3.1');
    add(nTop>=2&&nBot>=2,'Minimal 2 tulangan menerus atas dan bawah',`atas ${nTop}, bawah ${nBot}`,K?'Pasal 18.6.3.1':'Pasal 18.3.2');
    if(K){
      add(ln>=4*d,'Bentang bersih ℓn ≥ 4d',`${fmt(ln)} mm ≥ ${fmt(4*d)} mm`,'Pasal 18.6.2.1(a)');
      add(b>=Math.min(0.3*h,250),'Lebar balok',`bw = ${b} mm ≥ min(0,3h; 250) = ${fmt(Math.min(0.3*h,250))} mm`,'Pasal 18.6.2.1(b)');
      add(Math.max(AsT,AsB)/(b*d)<=0.025,'Rasio tulangan maksimum',`ρ = ${fmt(Math.max(AsT,AsB)/(b*d)*100,2)}% ≤ 2,5%`,'Pasal 18.6.3.1');
      add(AsB>=0.5*AsT,'Kuat lentur positif di muka kolom',`pendekatan As,bawah ≥ 0,5 As,atas: ${fmt(AsB)} ≥ ${fmt(0.5*AsT)} mm²`,'Pasal 18.6.3.2');
      add(hc>=20*db,'Dimensi kolom sejajar tulangan balok',`hc = ${hc} mm ≥ 20db = ${20*db} mm`,'Pasal 18.8.2.3');
      add(null,'Sengkang tertutup sepanjang 2h',`2h = ${fmt(2*h)} mm dari tiap muka kolom, sengkang pertama 50 mm dari muka kolom`,'Pasal 18.6.4.1 dan 18.6.4.4');
      add(sTact<=sMaxT+0.5,'Spasi sengkang daerah 2h',`s = ${fmt(sTact)} mm ≤ min(d/4; 6db; 150) = ${fmt(sMaxT)} mm`,'Pasal 18.6.4.4');
      add(sLact<=sMaxL+0.5,'Spasi sengkang di luar 2h',`s = ${fmt(sLact)} mm ≤ d/2 = ${fmt(sMaxL)} mm, kait gempa di kedua ujung`,'Pasal 18.6.4.6');
      if(p.lap){
        add(lapOn,'Lokasi sambungan lewatan',lapOn?`lewatan ${fmt(lapS)} s.d. ${fmt(lapE)} mm, di luar 2h dari muka kolom`:`lewatan ${fmt(lapLen)} mm tidak muat di luar daerah 2h`,'Pasal 18.6.3.3');
        add(lapOn?sLapAct<=Math.min(d/4,100)+0.5:false,'Sengkang di sepanjang lewatan',`s = ${fmt(sLapAct)} mm ≤ min(d/4; 100) = ${fmt(Math.min(d/4,100))} mm`,'Pasal 18.6.3.3');
      }
      add(null,'Kait gempa 135°',`perpanjangan maks(6db; 75) = ${fmt(ext)} mm`,'Pasal 25.3.4');
    } else {
      add(sTact<=sMaxL+0.5&&sLact<=sMaxL+0.5,'Spasi sengkang',`maks s = ${fmt(Math.max(sTact,sLact))} mm ≤ min(d/2; 600) = ${fmt(sMaxL)} mm`,'Pasal 9.7.6.2.2');
      add(null,'Zona tumpuan ℓn/4','rapat di ℓn/4 adalah praktik umum untuk geser, bukan syarat detailing SNI','praktik');
      add(null,'Kait sengkang 90°',`perpanjangan 6db = ${fmt(ext)} mm, diizinkan untuk D ≤ 16. Kait 135° tetap lebih baik`,'Pasal 25.3.2');
      if(p.lap) add(null,'Sambungan lewatan tulangan atas',`kelas B 1,3ℓd = ${fmt(lapLen)} mm, ditempatkan di tengah bentang (momen negatif kecil)`,'Pasal 25.5.2');
    }
    const derived=`d = <b>${fmt(d,1)}</b> mm<br>As atas = <b>${fmt(AsT)}</b> mm², As bawah = <b>${fmt(AsB)}</b> mm²<br>ℓd tulangan atas = <b>${fmt(ldTop)}</b> mm, lewatan = <b>${fmt(lapLen)}</b> mm<br>ℓdh = <b>${fmt(ldh)}</b> mm<br>${K?`s maks daerah 2h = <b>${fmt(sMaxT)}</b> mm<br>`:''}s maks lapangan = <b>${fmt(sMaxL)}</b> mm<br>jumlah sengkang = <b>${st.length}</b>`;
    return {layers:[{k:'atas',label:'Tulangan atas',color:COL.top,ex:[0,0.9*h,0]},{k:'bawah',label:'Tulangan bawah',color:COL.bot,ex:[0,-0.5*h,0]},{k:'sengkang',label:'Sengkang',color:COL.conf,ex:[0,0,0]}],
      betonEx:[0,-2.6*h,0],concrete,zones,bars,labels,views,checks:C,derived,camDir:[0.38,0.36,0.85],camK:0.95,cutAxis:'x',
      colorNote:`Warna sengkang: <b style="color:${COL.conf}">hijau</b> ${K?'daerah 2h':'tumpuan'}, <b style="color:${COL.mid}">biru</b> lapangan, <b style="color:${COL.lap}">kuning</b> lewatan.`};
  }
};
