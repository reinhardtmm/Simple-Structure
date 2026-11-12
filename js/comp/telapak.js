import {AREA,DIAS,COL,fmt,spread,turtle,rectCage,lift3D,asPerM,ldc,ldhGen,checker} from '../core.js';

export default {
  id:'telapak', name:'Fondasi telapak', sysDependent:true,
  defaults:{
    SRPMB:{B:1500,hf:450,bc:400,nc:3,dbc:16,dsc:10,dbm:16,sm:150,topMat:false,fc:25,fy:420,cover:75},
    SRPMK:{B:1800,hf:500,bc:450,nc:4,dbc:19,dsc:13,dbm:16,sm:150,topMat:false,fc:30,fy:420,cover:75}
  },
  schema:[
    ['Geometri',[{k:'B',label:'Lebar telapak (bujur sangkar)',unit:'mm',min:800,max:4000,step:50},{k:'hf',label:'Tebal telapak',unit:'mm',min:250,max:1200,step:25},{k:'bc',label:'Sisi kolom',unit:'mm',min:250,max:900,step:25}]],
    ['Tulangan telapak',[{k:'dbm',label:'Diameter tulangan anyaman',unit:'D',opts:[13,16,19,22,25]},{k:'sm',label:'Spasi tulangan anyaman',unit:'mm',min:75,max:450,step:5},{k:'topMat',label:'Pasang anyaman atas',type:'bool'}]],
    ['Tulangan kolom (stek)',[{k:'nc',label:'Tulangan kolom per sisi',unit:'batang',min:2,max:7},{k:'dbc',label:'Diameter tulangan kolom',unit:'D',opts:DIAS},{k:'dsc',label:'Diameter sengkang kolom',unit:'D',opts:[10,13]}]],
    ['Material',[{k:'fc',label:"Mutu beton fc'",unit:'MPa',opts:[20,25,30,35]},{k:'fy',label:'Mutu baja fy',unit:'MPa',opts:[280,420]},{k:'cover',label:'Selimut beton bawah',unit:'mm',min:40,max:100,step:5}]]
  ],
  teori:{
    common:`<h3>Fondasi telapak (tapak setempat)</h3><p>Fondasi telapak menyebarkan beban kolom ke tanah dengan luasan yang lebih besar, sehingga tegangan tanah tidak melampaui daya dukungnya. Telapak bekerja seperti pelat kantilever terbalik: tanah mendorong ke atas, sehingga serat bawah tertarik dan tulangan utama dipasang di bawah dalam dua arah.</p><ul><li><b>Anyaman bawah</b> dua lapis saling tegak lurus. Ujungnya sering dibengkokkan ke atas untuk membantu penjangkaran.</li><li><b>Stek kolom</b> adalah tulangan kolom yang diteruskan ke dalam telapak. Ujung bawahnya diberi kait 90° dan diletakkan di atas anyaman bawah.</li><li><b>Sengkang kolom di dalam telapak</b> memegang posisi stek saat pengecoran.</li><li><b>Lantai kerja</b> beton tipis di bawah telapak menjaga tulangan tetap bersih dan selimut tetap terjaga.</li><li>Ukuran telapak ditentukan dari daya dukung tanah, dan tebalnya dari geser pons serta geser satu arah. Keduanya tidak dihitung di sini.</li></ul>`,
    SRPMB:`<h4>Detailing umum</h4><ul><li><b>Selimut</b> 75 mm karena beton dicor langsung di atas tanah <span class="pasal">Tabel 20.6.1.3.1</span>.</li><li><b>Tebal di atas tulangan bawah</b> minimal 150 mm <span class="pasal">13.3.1.2</span>.</li><li><b>Luas tulangan stek</b> yang melintasi bidang kontak kolom dan telapak minimal 0,005 luas kolom <span class="pasal">16.3.4.1</span>.</li><li><b>Panjang penyaluran tekan</b> stek harus muat di dalam tebal telapak. Kait tidak dihitung efektif untuk tekan <span class="pasal">25.4.9</span>.</li><li>Arah kait stek tidak diatur khusus untuk KDS B. Model ini mengarahkannya ke luar.</li></ul>`,
    SRPMK:`<h4>Detailing KDS D sampai F</h4><ul><li>Tulangan longitudinal kolom harus disalurkan penuh dalam tarik ke dalam fondasi <span class="pasal">18.13.2.1</span>.</li><li><b>Kait stek</b> dibengkokkan 90° di dekat dasar fondasi dengan ujung bebas mengarah ke pusat kolom <span class="pasal">18.13.2.3</span>. Arah ini membuat strut tekan di dalam telapak bisa bertumpu pada kait.</li><li>Bila tepi kolom berada dalam jarak setengah tebal telapak dari tepi fondasi, sengkang kolom harus diteruskan ke dalam fondasi <span class="pasal">18.13.2.4</span>.</li><li>Syarat selimut, tebal minimum, dan luas stek sama dengan sistem biasa.</li></ul>`
  },
  build(p,sys){
    const K=sys==='SRPMK';
    const {B,hf,bc,nc,dbc,dsc,dbm,sm,fc,fy,cover}=p;
    const a=B/2-cover-dbm/2, a2=a-dbm*1.2;
    const yA=cover+dbm/2, yB=cover+dbm+dbm/2;
    const rb=3*dbm, tail=12*dbm;
    const bars=[];
    const iM={t:`Anyaman bawah D${dbm}-${sm}`,b:['Tulangan utama telapak, menahan lentur akibat tekanan tanah ke atas. Ujung dibengkokkan ke atas.'],pasal:'Pasal 13.3'};
    const upPath=(L)=>{ const t=turtle(-L,rb+tail,-Math.PI/2); t.fwd(tail).turn(90,rb).fwd(2*L-2*rb).turn(90,rb).fwd(tail); return t.pts; };
    const pA=upPath(a), pB=upPath(a2);
    spread(-a,a,sm).forEach(z=>bars.push({pts:pA.map(([s,y])=>[s,yA+y,z]),d:dbm,layer:'matA',color:COL.matA,info:iM}));
    spread(-a2,a2,sm).forEach(x=>bars.push({pts:pB.map(([s,y])=>[x,yB+y,s]),d:dbm,layer:'matB',color:COL.matB,info:iM}));
    if(p.topMat){
      const iTm={t:`Anyaman atas D${dbm}-${sm}`,b:['Anyaman atas dipasang bila ada momen negatif, misalnya akibat gaya angkat atau beban eksentris, atau sebagai tulangan susut pada telapak tebal.'],pasal:'praktik'};
      const yT=hf-50-dbm/2, yT2=yT-dbm;
      spread(-a,a,sm).forEach(z=>bars.push({pts:[[-a,yT,z],[a,yT,z]],d:dbm,layer:'matT',color:COL.matT,info:iTm}));
      spread(-a2,a2,sm).forEach(x=>bars.push({pts:[[x,yT2,-a2],[x,yT2,a2]],d:dbm,layer:'matT',color:COL.matT,info:iTm}));
    }
    // stek kolom
    const cg=rectCage({B:bc,H:bc,cover:40,ds:dsc,db:dbc,nu:nc,nv:nc,hook:K?135:90,allSup:K});
    const yHook=cover+2*dbm+dbc/2, yTop=hf+900, rh=4*dbc, th=12*dbc;
    const iD={t:`Stek kolom ${cg.pos.length}D${dbc}`,b:[`Kait 90° di dasar telapak, ekor ${fmt(th)} mm ${K?'mengarah ke pusat kolom':'mengarah ke luar'}. Bagian lurus vertikal di dalam telapak harus memenuhi panjang penyaluran tekan ℓdc.`],pasal:K?'Pasal 18.13.2.3':'Pasal 16.3.4, 25.4.9'};
    cg.pos.forEach(([x,z])=>{
      let dir=Math.abs(x)>=Math.abs(z)?[Math.sign(x)||1,0]:[0,Math.sign(z)||1]; if(K) dir=[-dir[0],-dir[1]];
      const t=turtle(0,yTop,-Math.PI/2); t.fwd(yTop-yHook-rh).turn(90,rh).fwd(th);
      bars.push({pts:t.pts.map(([s,y])=>[x+dir[0]*s,y,z+dir[1]*s]),d:dbc,layer:'stek',color:COL.dowel,info:iD});
    });
    const iH={t:`Sengkang kolom D${dsc}`,b:['Sengkang di dalam telapak memegang posisi stek saat pengecoran. Di atas telapak, sengkang mengikuti detailing kolom.'],pasal:K?'Pasal 18.13.2.4':'praktik'};
    const hy=[]; for(let y=hf-75;y>yHook+rh+60;y-=150) hy.push(y); for(let y=hf+50;y<yTop-50;y+=K?100:150) hy.push(y);
    hy.forEach(y=>{ bars.push({pts:lift3D(cg.hoop,(u,v,w)=>[u,y+w,v],dsc*1.05),d:dsc,layer:'sengkang',color:y<hf?COL.mid:(K?COL.conf:COL.mid),info:iH}); cg.ties.forEach(t=>bars.push({pts:t.pts.map(([u,v])=>[u,y+dsc*1.1,v]),d:dsc,layer:'sengkang',color:COL.tie,info:iH})); });
    const concrete=[{box:[-B/2,B/2,0,hf,-B/2,B/2]},{box:[-bc/2,bc/2,hf,yTop,-bc/2,bc/2]},{box:[-B/2-100,B/2+100,-50,0,-B/2-100,B/2+100],kind:'stub'}];
    const labels=[{p:[0,-90,B/2+100],t:'lantai kerja'},{p:[0,hf+30,B/2],t:`B = ${fmt(B)} mm`},{p:[B/2+80,hf/2,0],t:`hf = ${fmt(hf)} mm`}];
    // pemeriksaan
    const dEff=hf-cover-dbm, As=asPerM(dbm,sm), Asmin=(fy>=420?0.0018:0.0020)*1000*hf;
    const Ad=cg.pos.length*AREA[dbc], Ag=bc*bc;
    const lc=ldc(fy,fc,dbc), lh=ldhGen(fy,fc,dbc), avail=hf-cover-2*dbm;
    const sMax=Math.min(2*hf,450);
    const {C,add}=checker();
    add(cover>=75,'Selimut beton bawah',`${cover} mm ≥ 75 mm (dicor langsung di atas tanah)`,'Tabel 20.6.1.3.1');
    add(dEff>=150,'Tebal di atas tulangan bawah',`${fmt(dEff)} mm ≥ 150 mm`,'Pasal 13.3.1.2');
    add(As>=Asmin,'Tulangan minimum tiap arah',`${fmt(As)} mm²/m ≥ ${fmt(Asmin)} mm²/m`,'Pasal 13.3, 8.6.1.1');
    add(sm<=sMax,'Spasi maksimum anyaman',`${sm} mm ≤ min(2h; 450) = ${fmt(sMax)} mm`,'Pasal 8.7.2.2');
    add(Ad>=0.005*Ag,'Luas stek kolom',`${fmt(Ad)} mm² ≥ 0,005 Ag kolom = ${fmt(0.005*Ag)} mm²`,'Pasal 16.3.4.1');
    add(lc<=avail,'Panjang penyaluran tekan stek',`ℓdc = ${fmt(lc)} mm ≤ tersedia ${fmt(avail)} mm`,'Pasal 25.4.9.2');
    if(K){
      add(lh<=avail,'Penyaluran tarik stek dengan kait',`ℓdh = ${fmt(lh)} mm ≤ tersedia ${fmt(avail)} mm`,'Pasal 18.13.2.1, 25.4.3');
      add(true,'Arah kait stek','ekor kait mengarah ke pusat kolom','Pasal 18.13.2.3');
      const edge=(B-bc)/2;
      add(null,'Jarak tepi kolom ke tepi telapak',`${fmt(edge)} mm ${edge<hf/2?'< hf/2, sengkang kolom wajib diteruskan ke dalam telapak':'≥ hf/2'}`,'Pasal 18.13.2.4');
    }
    add(null,'Ukuran dan tebal telapak','ditentukan dari daya dukung tanah, geser pons, dan geser satu arah. Tidak dihitung di sini','Pasal 13.2, 22.6');
    const views=[
      {title:'Denah anyaman bawah',sub:`D${dbm}-${sm} dua arah`,n:'y',u:'x',v:'z',layers:['matA','matB','stek'],skipStub:true,maxH:380,dims:[{a:[-B/2,-B/2],b:[B/2,-B/2],off:-12,t:`B = ${fmt(B)}`}]},
      {title:'Potongan melalui stek tepi',n:'z',at:cg.vs[0],half:sm/2+5,u:'x',v:'y',maxH:440,dims:[{a:[-B/2,0],b:[B/2,0],off:-16,t:`B = ${fmt(B)}`},{a:[B/2,0],b:[B/2,hf],off:14,t:`hf=${hf}`}]}
    ];
    return {layers:[{k:'matA',label:'Anyaman bawah arah x',color:COL.matA,ex:[0,-500,0]},{k:'matB',label:'Anyaman bawah arah z',color:COL.matB,ex:[0,-300,0]},...(p.topMat?[{k:'matT',label:'Anyaman atas',color:COL.matT,ex:[0,250,0]}]:[]),{k:'stek',label:'Stek kolom',color:COL.dowel,ex:[0,400,0]},{k:'sengkang',label:'Sengkang kolom',color:COL.mid,ex:[0,400,0]}],
      betonEx:[-B*1.6,0,0],concrete,zones:[],bars,labels,views,checks:C,camDir:[0.75,0.6,0.95],camK:0.92,cutAxis:'z',
      derived:`tinggi di atas tulangan = <b>${fmt(dEff)}</b> mm<br>As = <b>${fmt(As)}</b> mm²/m, As min = <b>${fmt(Asmin)}</b> mm²/m<br>luas stek = <b>${fmt(Ad)}</b> mm²<br>ℓdc = <b>${fmt(lc)}</b> mm, ℓdh = <b>${fmt(lh)}</b> mm<br>tersedia = <b>${fmt(avail)}</b> mm`};
  }
};
