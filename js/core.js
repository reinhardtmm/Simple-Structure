// Atlas Tulangan: utilitas bersama, geometri tulangan, dan mesin gambar 2D
export const AREA = {8:50.3,10:78.5,13:132.7,16:201.1,19:283.5,22:380.1,25:490.9,29:660.5,32:804.2};
export const DIAS = [10,13,16,19,22,25,29,32];
export const DAGG = 20;
export const PI = Math.PI;
export const COL = {
  long:'#9a3412', top:'#9a3412', bot:'#c2410c', conf:'#0f766e', mid:'#4f6d8a', lap:'#b7791f',
  tie:'#6d28d9', dowel:'#be185d', matA:'#9a3412', matB:'#c2410c', matT:'#7c2d12', dist:'#4f6d8a',
  spiral:'#0f766e', web:'#4f6d8a', webH:'#2563eb', be:'#0f766e', joint:'#0f766e'
};
export const fmt = (v,d=0)=> Number(v).toLocaleString('id-ID',{maximumFractionDigits:d,minimumFractionDigits:d});
export const up5 = v=>Math.ceil(v/5-1e-9)*5, up50 = v=>Math.ceil(v/50-1e-9)*50, dn5 = v=>Math.floor(v/5+1e-9)*5, dn25=v=>Math.floor(v/25+1e-9)*25;
export const linspace=(a,b,n)=> n<=1?[(a+b)/2]:Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
export const beta1 = fc => fc<=28?0.85:Math.max(0.65,0.85-0.05*(fc-28)/7);
export function devLen(fy,fc,db,psiT=1){ const k=db<=19?2.1:1.7; return Math.max(300, fy*psiT/(k*Math.sqrt(fc))*db); }
export function ldhGen(fy,fc,db){ return Math.max(0.24*fy/Math.sqrt(fc)*db,8*db,150); }
export function ldhSeis(fy,fc,db){ return Math.max(fy*db/(5.4*Math.sqrt(fc)),8*db,150); }
export function ldc(fy,fc,db){ return Math.max(0.24*fy/Math.sqrt(fc)*db,0.043*fy*db,200); }
export const asPerM=(d,s)=>AREA[d]*1000/s;

// posisi merata dari a ke b dengan spasi maksimum s (termasuk kedua ujung)
export function spread(a,b,s){ const n=Math.max(1,Math.ceil((b-a)/s-1e-9)); return Array.from({length:n+1},(_,i)=>a+(b-a)*i/n); }
export function fill(a,b,sMax){ const gap=b-a; if(gap<=1) return {pos:[],s:0}; const n=Math.ceil(gap/sMax-1e-9); const st=gap/n; const pos=[]; for(let i=1;i<=n;i++) pos.push(a+st*i); return {pos,s:st}; }

/* turtle 2D */
export function turtle(x,y,heading){
  const pts=[[x,y]]; let h=heading;
  const t={pts, get pos(){return [x,y];}, get heading(){return h;},
    fwd(L){ if(L<=0) return t; x+=L*Math.cos(h); y+=L*Math.sin(h); pts.push([x,y]); return t; },
    turn(deg,r){ const a=deg*PI/180, sg=Math.sign(a);
      const cx=x+r*Math.cos(h+sg*PI/2), cy=y+r*Math.sin(h+sg*PI/2);
      const p0=Math.atan2(y-cy,x-cx), n=Math.max(4,Math.ceil(Math.abs(a)/(PI/18)));
      for(let i=1;i<=n;i++){const p=p0+a*i/n; x=cx+r*Math.cos(p); y=cy+r*Math.sin(p); pts.push([x,y]);}
      h+=a; return t; }
  };
  return t;
}
// sengkang tertutup (garis sumbu), kait di sudut kiri atas
export function hoop2D(a,b,r,hook,ext){
  const bend = hook===135?135:90;
  const f=turtle(-a+r,b,0);
  f.fwd(2*a-2*r).turn(-90,r).fwd(2*b-2*r).turn(-90,r).fwd(2*a-2*r).turn(-90,r).fwd(2*b-2*r).turn(-bend,r).fwd(ext);
  const g=turtle(-a+r,b,PI); g.turn(bend,r).fwd(ext);
  return g.pts.slice(1).reverse().concat(f.pts);
}
// kait silang sejajar sumbu v pada u=x, kait 135 di atas dan 90 di bawah (flip membalik)
export function crosstie2D(x,yb,yt,rr,ext,flip){
  const f=turtle(x-rr,yb,PI/2); f.fwd(yt-yb).turn(-135,rr).fwd(ext);
  const g=turtle(x-rr,yb,-PI/2); g.turn(90,rr).fwd(ext);
  let pts=g.pts.slice(1).reverse().concat(f.pts);
  if(flip) pts=pts.map(([u,v])=>[u,yb+yt-v]);
  return pts;
}
// helix kecil supaya kedua kait tidak saling tembus
export function lift3D(pts2,map,lift){
  const cum=[0]; for(let i=1;i<pts2.length;i++) cum.push(cum[i-1]+Math.hypot(pts2[i][0]-pts2[i-1][0],pts2[i][1]-pts2[i-1][1]));
  const L=cum.at(-1)||1;
  return pts2.map((q,i)=>map(q[0],q[1],lift*cum[i]/L));
}
// tulangan yang ditumpu lateral
export function supportedIdx(pos,db,allSupported){
  const n=pos.length; const all=pos.map((_,i)=>i);
  if(n<=2||allSupported) return all;
  const sup=[0]; let i=0;
  while(i<n-1){ const j=i+2;
    if(j<=n-1 && (pos[i+1]-pos[i]-db)<=150 && (pos[j]-pos[i+1]-db)<=150){ sup.push(j); i=j; } else { sup.push(i+1); i=i+1; } }
  const set=new Set(sup);
  return pos.every((_,k)=>set.has(k)===set.has(n-1-k))?[...set].sort((a,b)=>a-b):all;
}
// susunan tulangan persegi: kembalikan posisi tulangan, sengkang, dan kait silang (2D, sumbu u dan v)
export function rectCage({B,H,cover,ds,db,nu,nv,hook,allSup}){
  const ext=hook===135?Math.max(6*ds,75):6*ds, r=2.5*ds;
  const ha=B/2-cover-ds/2, hb=H/2-cover-ds/2;
  const au=B/2-cover-ds-db/2, av=H/2-cover-ds-db/2;
  const us=linspace(-au,au,nu), vs=linspace(-av,av,nv);
  const pos=[]; us.forEach(u=>{pos.push([u,-av]);pos.push([u,av]);}); vs.slice(1,-1).forEach(v=>{pos.push([-au,v]);pos.push([au,v]);});
  const supU=supportedIdx(us,db,allSup), supV=supportedIdx(vs,db,allSup);
  const rr=(db+ds)/2, ties=[];
  supU.filter(i=>i>0&&i<nu-1).forEach((i,k)=>ties.push({dir:'v',pts:crosstie2D(us[i],-av,av,rr,Math.max(6*ds,75),k%2===1)}));
  supV.filter(i=>i>0&&i<nv-1).forEach((i,k)=>{ const t=crosstie2D(vs[i],-au,au,rr,Math.max(6*ds,75),k%2===0); ties.push({dir:'u',pts:t.map(([a,b])=>[b,a])}); });
  const hxOf=(arr,sup)=>{let m=0; for(let k=1;k<sup.length;k++) m=Math.max(m,arr[sup[k]]-arr[sup[k-1]]); return m;};
  const hx=Math.max(hxOf(us,supU),hxOf(vs,supV));
  const hoop=hoop2D(ha,hb,r,hook,ext);
  return {pos,us,vs,ties,hx,hoop,ext,ha,hb,au,av,nTieV:ties.filter(t=>t.dir==='v').length,nTieU:ties.filter(t=>t.dir==='u').length};
}
// Ash menurut 18.7.5.4 (persegi)
export function ashReq(s,bc,fc,fyt,Ag,Ach){ return Math.max(0.3*s*bc*fc/fyt*(Ag/Ach-1),0.09*s*bc*fc/fyt); }

// pembuat daftar pemeriksaan
export function checker(){ const C=[]; const add=(ok,t,d,p,opt={})=>C.push({ok,t,d,p,...opt}); return {C,add}; }

/* ================= mesin gambar 2D ================= */
const IX={x:0,y:1,z:2};
const SV={ink:'#1c1e21',ink2:'#4a4f57',conc:'#efece4',stub:'#e2ddd1'};
export function renderView(m,v){
  const n=IX[v.n], iu=IX[v.u], iv=IX[v.v];
  const half=v.half??Infinity, cut=isFinite(half), at=v.at??0;
  const lay=v.layers?new Set(v.layers):null;
  const els=[]; let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
  const ext=(u,w)=>{x0=Math.min(x0,u);x1=Math.max(x1,u);y0=Math.min(y0,-w);y1=Math.max(y1,-w);};
  // beton
  const fillOf=c=>c.kind==='stub'?SV.stub:SV.conc;
  for(const c of m.concrete){
    if(v.skipStub&&c.kind==='stub') continue;
    if(c.box){ const b=c.box; const lo=[b[0],b[2],b[4]], hi=[b[1],b[3],b[5]];
      if(cut && (at<lo[n]||at>hi[n])) continue;
      els.push({z:0,s:`<rect x="${lo[iu]}" y="${-hi[iv]}" width="${hi[iu]-lo[iu]}" height="${hi[iv]-lo[iv]}" fill="${fillOf(c)}" stroke="${SV.ink}" stroke-width="@1.1"/>`});
      ext(lo[iu],lo[iv]); ext(hi[iu],hi[iv]); }
    else if(c.cyl){ const {x,z,r,y0:ya,y1:yb}=c.cyl;
      if(v.n==='y'){ if(cut&&(at<ya||at>yb)) continue; const cu=iu===0?x:z, cv=iv===0?x:z; els.push({z:0,s:`<circle cx="${cu}" cy="${-cv}" r="${r}" fill="${fillOf(c)}" stroke="${SV.ink}" stroke-width="@1.1"/>`}); ext(cu-r,cv-r); ext(cu+r,cv+r); }
      else { const cn=v.n==='x'?x:z, cu=v.u==='x'?x:z; let w=r; if(cut){ const d=Math.abs(at-cn); if(d>r) continue; w=Math.sqrt(r*r-d*d);}
        els.push({z:0,s:`<rect x="${cu-w}" y="${-yb}" width="${2*w}" height="${yb-ya}" fill="${fillOf(c)}" stroke="${SV.ink}" stroke-width="@1.1"/>`}); ext(cu-w,ya); ext(cu+w,yb); } }
    else if(c.prism && v.n==='z'){ const P=c.prism; if(cut&&(at<P.z0||at>P.z1)) continue;
      els.push({z:0,s:`<polygon points="${P.pts.map(([a,b])=>`${a},${-b}`).join(' ')}" fill="${fillOf(c)}" stroke="${SV.ink}" stroke-width="@1.1"/>`}); P.pts.forEach(([a,b])=>ext(a,b)); }
  }
  // tulangan
  for(const b of m.bars){
    if(lay&&!lay.has(b.layer)) continue;
    const P=b.pts, w=b.d;
    if(cut){
      let run=[];
      const flush=()=>{ if(run.length>1) els.push({z:1,s:pl(run,b.color,w)}); run=[]; };
      for(let i=0;i<P.length;i++){
        const p=P[i];
        if(Math.abs(p[n]-at)<=half) run.push([p[iu],p[iv]]); else flush();
        if(i>0){ const a=P[i-1], dn=p[n]-a[n]; const L=Math.hypot(p[0]-a[0],p[1]-a[1],p[2]-a[2])||1;
          if(Math.abs(dn)/L>0.6 && (a[n]-at)*(p[n]-at)<=0 && dn!==0){ const t=(at-a[n])/dn; const cu=a[iu]+(p[iu]-a[iu])*t, cv=a[iv]+(p[iv]-a[iv])*t;
            els.push({z:2,s:`<circle cx="${cu.toFixed(1)}" cy="${(-cv).toFixed(1)}" r="${w/2}" fill="${b.color}" stroke="#3b1406" stroke-width="@0.5"/>`}); ext(cu,cv); } }
      }
      flush();
    } else els.push({z:1,s:pl(P.map(p=>[p[iu],p[iv]]),b.color,w)});
  }
  if(!isFinite(x0)){ x0=-100;x1=100;y0=-100;y1=100; }
  const W=x1-x0, H=y1-y0; const padF=v.pad??0.16; const k=Math.max((W*(1+2*padF))/(v.w2?170:340),(H*(1+2*padF))/(v.maxH||460));
  // dimensi dan catatan
  for(const d of v.dims||[]){
    const [ua,va]=d.a,[ub,vb]=d.b, col=d.c||SV.ink2, off=(d.off||0)*k, t=4*k;
    if(Math.abs(va-vb)<1e-6){ const yy=-va-off; els.push({z:3,s:`<g stroke="${col}" stroke-width="${0.8*k}"><line x1="${ua}" y1="${yy}" x2="${ub}" y2="${yy}"/><line x1="${ua}" y1="${yy-t}" x2="${ua}" y2="${yy+t}"/><line x1="${ub}" y1="${yy-t}" x2="${ub}" y2="${yy+t}"/></g><text x="${(ua+ub)/2}" y="${yy-4*k}" font-size="${10*k}" text-anchor="middle" fill="${col}" font-family="IBM Plex Mono, monospace">${d.t}</text>`}); y0=Math.min(y0,yy-14*k); y1=Math.max(y1,yy+6*k); }
    else { const xx=ua+off; els.push({z:3,s:`<g stroke="${col}" stroke-width="${0.8*k}"><line x1="${xx}" y1="${-va}" x2="${xx}" y2="${-vb}"/><line x1="${xx-t}" y1="${-va}" x2="${xx+t}" y2="${-va}"/><line x1="${xx-t}" y1="${-vb}" x2="${xx+t}" y2="${-vb}"/></g><text x="${xx-5*k}" y="${-(va+vb)/2}" font-size="${10*k}" text-anchor="middle" fill="${col}" font-family="IBM Plex Mono, monospace" transform="rotate(-90 ${xx-5*k} ${-(va+vb)/2})">${d.t}</text>`}); x0=Math.min(x0,xx-16*k); x1=Math.max(x1,xx+6*k); }
  }
  for(const nt of v.notes||[]){ const [u,w]=nt.at; els.push({z:3,s:`<text x="${u}" y="${-w}" font-size="${10*k*(nt.s||1)}" text-anchor="${nt.a||'middle'}" fill="${nt.c||SV.ink2}" font-family="IBM Plex Mono, monospace">${nt.t}</text>`}); ext(u,w); }
  const px=(x1-x0)*0.05+4*k, py=(y1-y0)*0.05+4*k;
  const vb=[x0-px,y0-py,(x1-x0)+2*px,(y1-y0)+2*py];
  const body=els.sort((a,b)=>a.z-b.z).map(e=>e.s.replace(/@([\d.]+)/g,(_,q)=>String(+q*k)).replace(/#([\d.]+)#/g,(_,q)=>String(Math.max(+q,1.1*k)))).join('');
  return `<svg viewBox="${vb.map(q=>q.toFixed(1)).join(' ')}" xmlns="http://www.w3.org/2000/svg" style="max-height:${v.maxH||460}px">${body}</svg>`;
  function pl(pts,col,w){ return `<polyline points="${pts.map(([a,b])=>`${a.toFixed(1)},${(-b).toFixed(1)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="#${w}#" stroke-linejoin="round" stroke-linecap="round"/>`; }
}
