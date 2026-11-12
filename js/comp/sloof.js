import {AREA,COL,fmt,linspace,turtle,hoop2D,lift3D,spread,ldhGen,checker,DAGG} from '../core.js';

export default {
  id:'sloof', name:'Sloof (tie beam)', sysDependent:true,
  defaults:{
    SRPMB:{b:250,h:400,L:4000,cap:1200,capH:600,n:3,db:16,ds:10,s:150,fc:25,fy:420,cover:40},
    SRPMK:{b:300,h:400,L:4000,cap:1200,capH:700,n:3,db:16,ds:10,s:150,fc:30,fy:420,cover:40}
  },
  schema:[
    ['Geometri',[{k:'b',label:'Lebar b',unit:'mm',min:150,max:600,step:25},{k:'h',label:'Tinggi h',unit:'mm',min:200,max:900,step:25},{k:'L',label:'Jarak bersih antar fondasi',unit:'mm',min:2000,max:10000,step:100},{k:'cap',label:'Ukuran fondasi atau pile cap',unit:'mm',min:600,max:2500,step:50},{k:'capH',label:'Tebal fondasi atau pile cap',unit:'mm',min:300,max:1500,step:50}]],
    ['Tulangan',[{k:'n',label:'Tulangan atas dan bawah (simetris)',unit:'batang',min:2,max:6},{k:'db',label:'Diameter longitudinal',unit:'D',opts:[13,16,19,22,25]},{k:'ds',label:'Diameter sengkang',unit:'D',opts:[8,10,13]},{k:'s',label:'Spasi sengkang',unit:'mm',min:50,max:400,step:5}]],
    ['Material',[{k:'fc',label:"Mutu beton fc'",unit:'MPa',opts:[20,25,30,35]},{k:'fy',label:'Mutu baja fy',unit:'MPa',opts:[280,420]},{k:'cover',label:'Selimut beton',unit:'mm',min:25,max:75,step:5}]]
  ],
  teori:{
    common:`<h3>Sloof (balok pengikat fondasi)</h3><p>Sloof menghubungkan fondasi atau pile cap satu dengan yang lain. Fungsinya bukan hanya menopang dinding di atasnya. Saat gempa, tanah di bawah tiap fondasi bisa bergerak berbeda. Sloof mengikat fondasi agar bergerak bersama dan tidak saling menjauh atau mendekat.</p><ul><li>Karena gayanya bisa tarik atau tekan, tulangan sloof umumnya dipasang simetris atas dan bawah.</li><li>Tulangan harus menerus dan diangkur ke dalam fondasi atau pile cap, bukan berhenti di muka fondasi.</li><li>Sloof bersentuhan dengan tanah, sehingga selimutnya lebih tebal daripada balok di atas tanah.</li></ul>`,
    SRPMB:`<h4>Detailing SRPMB (KDS B)</h4><ul><li>Pasal pengikat fondasi seismik 18.13.3 hanya berlaku untuk KDS D sampai F. Pada KDS B, sloof didesain sebagai balok biasa: spasi sengkang maksimal d/2 <span class="pasal">9.7.6.2.2</span> dan luas tulangan minimum balok <span class="pasal">9.6.1.2</span>.</li><li>Selimut 40 mm untuk D16 ke bawah dan 50 mm untuk D19 ke atas bila beton dicetak dengan bekisting lalu bersentuhan dengan tanah <span class="pasal">Tabel 20.6.1.3.1</span>.</li></ul>`,
    SRPMK:`<h4>Detailing KDS D sampai F</h4><ul><li><b>Dimensi terkecil</b> sloof minimal jarak bersih antar kolom dibagi 20, tetapi tidak perlu lebih dari 450 mm <span class="pasal">18.13.3.3</span>.</li><li><b>Sengkang tertutup</b> dengan spasi tidak lebih dari setengah dimensi terkecil penampang dan 300 mm <span class="pasal">18.13.3.3</span>.</li><li><b>Tulangan longitudinal menerus</b> dan disalurkan di dalam fondasi atau pile cap di setiap diskontinuitas <span class="pasal">18.13.3.2</span>.</li><li>Gaya aksial rencana sloof ditentukan dari SNI 1726:2019, umumnya sebagai fraksi dari beban kolom terbesar yang diikat. Gaya ini tidak dihitung di sini.</li></ul>`
  },
  build(p,sys){
    const K=sys==='SRPMK';
    const {b,h,L,cap,capH,n,db,ds,s,fc,fy,cover}=p;
    const hook=K?135:90, ext=K?Math.max(6*ds,75):6*ds, r=2.5*ds;
    const yc=-h/2, zl=b/2-cover-ds-db/2, yl=h/2-cover-ds-db/2;
    const zs=linspace(-zl,zl,n);
    const rb=3.5*db, tail=12*db, xA=-cap+75+db/2, xB=L+cap-75-db/2;
    const ldh=ldhGen(fy,fc,db), avail=cap-75;
    const bars=[];
    const iT={t:`Tulangan sloof ${n}D${db} atas dan bawah`,b:['Simetris karena gaya gempa pada sloof bisa tarik atau tekan.',`Menerus dan diangkur ke dalam fondasi dengan kait 90°. ℓdh perlu ${fmt(ldh)} mm, tersedia ${fmt(avail)} mm.`],pasal:K?'Pasal 18.13.3.2':'Pasal 25.4.3'};
    const top=(()=>{ const t=turtle(xA,yc+yl-rb-tail,Math.PI/2); t.fwd(tail).turn(-90,rb).fwd(xB-xA-2*rb).turn(-90,rb).fwd(tail); return t.pts; })();
    const bot=(()=>{ const t=turtle(xA+2.5*db,yc-yl+rb+tail,-Math.PI/2); t.fwd(tail).turn(90,rb).fwd(xB-xA-5*db-2*rb).turn(90,rb).fwd(tail); return t.pts; })();
    zs.forEach(z=>{ bars.push({pts:top.map(([x,y])=>[x,y,z]),d:db,layer:'atas',color:COL.top,info:iT}); bars.push({pts:bot.map(([x,y])=>[x,y,z]),d:db,layer:'bawah',color:COL.bot,info:iT}); });
    const hp=hoop2D(b/2-cover-ds/2,h/2-cover-ds/2,r,hook,ext);
    const xs=spread(50,L-50,s);
    const iS={t:`Sengkang tertutup D${ds}-${s}`,b:[K?`Kait 135° dengan perpanjangan ${fmt(ext)} mm.`:`Kait 90° dengan perpanjangan ${fmt(ext)} mm.`],pasal:K?'Pasal 18.13.3.3':'Pasal 9.7.6'};
    xs.forEach(x=>bars.push({pts:lift3D(hp,(u,v,w)=>[x+w,yc+v,u],ds*1.05),d:ds,layer:'sengkang',color:COL.mid,info:iS}));
    const concrete=[{box:[0,L,-h,0,-b/2,b/2]},{box:[-cap,0,-capH,0,-cap/2,cap/2],kind:'stub'},{box:[L,L+cap,-capH,0,-cap/2,cap/2],kind:'stub'},{box:[-cap/2-200,-cap/2+200,0,700,-200,200],kind:'stub'},{box:[L+cap/2-200,L+cap/2+200,0,700,-200,200],kind:'stub'}];
    const labels=[{p:[-cap/2,-capH-80,cap/2],t:'fondasi atau pile cap'},{p:[L/2,80,0],t:`L = ${fmt(L)} mm`},{p:[L/2,-h-60,b/2],t:`D${ds}-${s}`,c:'mid'}];
    const d=h-cover-ds-db/2, As=n*AREA[db], rhoMin=Math.max(0.25*Math.sqrt(fc)/fy,1.4/fy);
    const covReq=db>=19?50:40, clr=n>1?2*zl/(n-1)-db:Infinity, clrReq=Math.max(25,db,4/3*DAGG);
    const {C,add}=checker();
    add(cover>=covReq,'Selimut beton (bersentuhan dengan tanah)',`${cover} mm ≥ ${covReq} mm untuk D${db}`,'Tabel 20.6.1.3.1');
    add(clr>=clrReq,'Spasi bersih tulangan',`${fmt(clr)} mm ≥ ${fmt(clrReq,1)} mm`,'Pasal 25.2.1');
    add(As>=rhoMin*b*d,'Luas tulangan minimum tiap sisi',`${fmt(As)} mm² ≥ ${fmt(rhoMin*b*d)} mm²`,'Pasal 9.6.1.2');
    add(ldh<=avail,'Angkur tulangan di dalam fondasi',`ℓdh = ${fmt(ldh)} mm ≤ ${fmt(avail)} mm`,K?'Pasal 18.13.3.2, 25.4.3':'Pasal 25.4.3');
    if(K){
      const dmin=Math.min(L/20,450);
      add(Math.min(b,h)>=dmin,'Dimensi terkecil sloof',`${Math.min(b,h)} mm ≥ min(L/20; 450) = ${fmt(dmin)} mm`,'Pasal 18.13.3.3');
      const sm=Math.min(Math.min(b,h)/2,300);
      add(s<=sm,'Spasi sengkang tertutup',`${s} mm ≤ min(dimensi terkecil/2; 300) = ${fmt(sm)} mm`,'Pasal 18.13.3.3');
      add(null,'Gaya aksial rencana','ditentukan dari SNI 1726:2019, tidak dihitung di sini','SNI 1726:2019');
    } else {
      add(s<=Math.min(d/2,600),'Spasi sengkang',`${s} mm ≤ d/2 = ${fmt(d/2)} mm`,'Pasal 9.7.6.2.2');
      add(null,'Pasal pengikat seismik','18.13.3 tidak wajib untuk KDS B','Pasal 18.13.1');
    }
    const views=[
      {title:'Potongan sloof',sub:`${n}D${db} atas, ${n}D${db} bawah, D${ds}-${s}`,n:'x',at:xs[2]+ds*0.5,half:ds*1.2,u:'z',v:'y',skipStub:true,maxH:300,dims:[{a:[-b/2,-h],b:[b/2,-h],off:-14,t:fmt(b)},{a:[-b/2,-h],b:[-b/2,0],off:-14,t:fmt(h)}]},
      {title:'Tampak memanjang (potongan di tulangan tepi)',n:'z',at:-zl,half:db*1.6,u:'x',v:'y',maxH:260,dims:[{a:[0,-capH],b:[L,-capH],off:-14,t:`L = ${fmt(L)}`}]}
    ];
    return {layers:[{k:'atas',label:'Tulangan atas',color:COL.top,ex:[0,500,0]},{k:'bawah',label:'Tulangan bawah',color:COL.bot,ex:[0,-300,0]},{k:'sengkang',label:'Sengkang',color:COL.mid,ex:[0,0,0]}],
      betonEx:[0,-1600,0],concrete,zones:[],bars,labels,views,checks:C,camDir:[0.38,0.4,0.85],camK:0.95,cutAxis:'x',
      derived:`d = <b>${fmt(d)}</b> mm<br>As tiap sisi = <b>${fmt(As)}</b> mm²<br>ℓdh = <b>${fmt(ldh)}</b> mm<br>jumlah sengkang = <b>${xs.length}</b>`};
  }
};
