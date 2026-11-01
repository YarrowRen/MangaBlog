// Convex partitioning: every cut belongs to both neighbours before inset.
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rectangle = (w,h) => [[0,0],[w,0],[w,h],[0,h]];
export function clip(poly, a, b, c) {
  const out=[];
  for(let i=0;i<poly.length;i++) {
    const p=poly[i], q=poly[(i+1)%poly.length];
    const dp=a*p[0]+b*p[1]+c, dq=a*q[0]+b*q[1]+c;
    if(dp>=-1e-7) out.push(p);
    if((dp>0 && dq<0)||(dp<0 && dq>0)) {
      const t=dp/(dp-dq);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);
    }
  }
  return out;
}
export function split(poly,a,b,c) {return [clip(poly,a,b,c),clip(poly,-a,-b,-c)];}
export function inset(poly,distance) {
  let result=poly;
  for(let i=0;i<poly.length;i++) {
    const [x,y]=poly[i], [u,v]=poly[(i+1)%poly.length];
    const dx=u-x,dy=v-y;
    result=clip(result,-dy,dx,dy*x-dx*y-distance*Math.hypot(dx,dy));
  }
  return result;
}
export function bounds(poly) {
  const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);
  const x=Math.min(...xs),y=Math.min(...ys);
  return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};
}
function span(poly,y) {
  const xs=[];
  for(let i=0;i<poly.length;i++) {
    const p=poly[i],q=poly[(i+1)%poly.length];
    if(y>=Math.min(p[1],q[1])-1e-6 && y<=Math.max(p[1],q[1])+1e-6) {
      if(Math.abs(q[1]-p[1])<1e-7) xs.push(p[0],q[0]);
      else xs.push(p[0]+(q[0]-p[0])*(y-p[1])/(q[1]-p[1]));
    }
  }
  return [Math.min(...xs),Math.max(...xs)];
}
// Largest sampled axis-aligned rectangle. Convexity guarantees all its interior is safe.
export function safeRect(poly,padding=16) {
  const inner=inset(poly,padding),box=bounds(inner);let best=null;
  for(let top=0;top<19;top++) for(let bottom=top+1;bottom<=20;bottom++) {
    const y=box.y+box.h*top/20,end=box.y+box.h*bottom/20;
    const p=span(inner,y),q=span(inner,end);
    const x=Math.max(p[0],q[0]),r=Math.min(p[1],q[1]);
    const candidate={x,y,w:r-x,h:end-y};
    if(candidate.w>0 && (!best || candidate.w*candidate.h>best.w*best.h))best=candidate;
  }
  return best;
}
export function seeded(seed) {
  let n=2166136261;
  for(const ch of seed) n=Math.imul(n^ch.charCodeAt(0),16777619);
  return ()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return (n>>>0)/4294967296;};
}
export function partition(w,h,count,mobile,seed='panel-log') {
  const random=seeded(seed), drift=(random()-.5)*.10;
  const root=rectangle(w,h);
  if(count===1)return [root];
  if(mobile) {
    // One shared horizontal line; slope is bounded by container width and row height.
    const slope=clamp((random()-.5)*.16,-h*.05/w,h*.05/w);
    const [upper,lower]=split(root,slope,-1,h*.5-slope*w*.5);
    if(count===2)return [upper,lower];
    const [middle,last]=split(lower,-slope,-1,h*.75+slope*w*.5);
    return [upper,middle,last];
  }
  const fraction=count===3?.66+random()*.05:.54+random()*.06;
  const slope=-Math.min(.13-drift,w*.08/h);
  const [left,right]=split(root,-1,slope,w*fraction-slope*h*.5);
  if(count===2)return [left,right];
  const [top,bottom]=split(right,.035,-1,h*.56-.035*w*.83);
  return [left,top,bottom];
}
