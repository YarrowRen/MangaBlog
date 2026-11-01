import {pagePartition,pageLayouts} from './page-layouts.js';
import {bounds,inset,safeRect,partition,clamp} from './geometry.js';
const cover=document.querySelector('.manga-spread'),chapters=document.querySelector('.manga-chapters');
const caption=panel=>panel.querySelector('.card-copy,.cover-caption,.panel-content');
const rectStyle=(el,r)=>Object.assign(el.style,{left:`${r.x}px`,top:`${r.y}px`,width:`${r.w}px`,height:`${r.h}px`});
let scheduled=false;
function queue(){if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;layoutPanels();});}}
function place(panel,poly,gap){
  const shape=inset(poly,gap/2),box=bounds(shape),local=shape.map(([x,y])=>[x-box.x,y-box.y]);
  rectStyle(panel,box);
  panel.style.clipPath=`polygon(${local.map(([x,y])=>`${x}px ${y}px`).join(',')})`;
  panel.dataset.polygon=JSON.stringify(shape);
  const inner=inset(local,2);
  panel.style.setProperty('--inner-clip',`polygon(${inner.map(([x,y])=>`${x}px ${y}px`).join(',')})`);
  const safe=safeRect(local,clamp(box.w*.035,14,24));
  panel.dataset.safe=JSON.stringify(safe);
  const content=caption(panel);
  let needed=0;
  if(content){
    Object.assign(content.style,{width:`${safe.w}px`,left:`${safe.x}px`,top:'0px'});
    needed=content.getBoundingClientRect().height;
    content.style.top=`${safe.y+safe.h-needed}px`;
  }
  const label=panel.querySelector('.image-label,.panel-index');
  if(label){Object.assign(label.style,{left:`${safe.x}px`,top:`${safe.y}px`,maxWidth:`${safe.w}px`});needed+=label.getBoundingClientRect().height+18;}
  const bubble=panel.querySelector('.mini-speech');
  if(bubble){Object.assign(bubble.style,{left:`${safe.x}px`,top:`${safe.y}px`,maxWidth:`${safe.w}px`});needed=Math.max(needed,bubble.getBoundingClientRect().height+20);}
  // Content receives a hard safety rectangle; short art-only slots reserve image space.
  return Math.max(0,needed-safe.h);
}
function group(container,panels,w,mobile,seed,hero=false,pageIndex=null){
  let h=hero?(mobile?Math.max(400,w*1.1):(w<620?300:clamp(w*.48,470,620))):(mobile?Math.max(720,w*1.8):clamp(w*.39,400,540));
  if(pageIndex!==null)h=mobile?Math.max(340*panels.length,w*panels.length*.85):Math.max(900,w*.95);
  const gap=clamp(w*.016,12,20);
  let shapes, remaining=Infinity;
  for(let attempt=0;attempt<12;attempt++){
    shapes=pageIndex===null?partition(w,h,panels.length,mobile,seed):pagePartition(w,h,panels.length,pageIndex,seed);
    const deficits=panels.map((panel,i)=>place(panel,shapes[i],gap));
    const deficit=Math.max(...deficits);remaining=deficit;
    if(deficit<=.5)break;
    h+=Math.max(60,deficit*(panels.length+1));
  }
  if(remaining>.5){
    // Deterministic last resort: full-width rectangles grow to measured content.
    let y=0;
    for(const panel of panels){
      let ph=Math.max(300,h/panels.length);
      for(let i=0;i<4;i++){const d=place(panel,[[0,y],[w,y],[w,y+ph],[0,y+ph]],gap);if(d<=.5)break;ph+=d+40;}
      y+=ph;
    }
    return y;
  }
  return h;
}
export function layoutPanels(){
  if(!cover)return;
  const w=cover.clientWidth,mobile=w<620;
  const seed=cover.dataset.layoutSeed||'panel-log';
  cover.classList.add('computed-layout');chapters.classList.add('computed-layout');
  const main=cover.querySelector('.cover-main'),editor=cover.querySelector('.editor-panel'),dispatch=cover.querySelector('.dispatch');
  if(mobile){
    const h1=group(cover,[main],w,true,`${seed}-main`,true);
    const h2=group(cover,[editor,dispatch],w,w<420,`${seed}-side`,true);
    for(const panel of [editor,dispatch]){
      const y=parseFloat(panel.style.top)+h1;panel.style.top=`${y}px`;
      panel.dataset.polygon=JSON.stringify(JSON.parse(panel.dataset.polygon).map(([x,y])=>[x,y+h1]));
    }
    cover.style.height=`${h1+h2}px`;
  }else cover.style.height=`${group(cover,[main,editor,dispatch],w,false,`${seed}-hero`,true)}px`;
  const all=[...chapters.children].filter(p=>p.matches('.panel')&&!p.hidden);
  const cw=chapters.clientWidth;
  const index=Number(chapters.dataset.pageIndex||0);
  chapters.dataset.template=pageLayouts[index%pageLayouts.length].name;
  chapters.style.height=`${all.length?group(chapters,all,cw,cw<620,`${seed}-page-${chapters.dataset.category||'all'}-${chapters.dataset.page||1}`,false,index):0}px`;
  document.documentElement.dataset.layoutReady='true';
}
if(cover){
  let lastWidth=-1;
  new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(Math.abs(width-lastWidth)>.1){lastWidth=width;queue();}}).observe(cover);
  // Only width changes trigger geometry recomputation; our own height writes are ignored.
  const observer=new MutationObserver(queue);
  observer.observe(chapters,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
  observer.observe(cover,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-layout-seed']});
  const contentObserver=new ResizeObserver(queue);
  const observed=new Set();
  const observeContent=()=>{
    for(const el of observed)if(!chapters.contains(el)){contentObserver.unobserve(el);observed.delete(el);}
    chapters.querySelectorAll('.card-copy,.panel-content,.image-label').forEach(el=>{if(!observed.has(el)){observed.add(el);contentObserver.observe(el);}});
  };
  new MutationObserver(observeContent).observe(chapters,{childList:true,subtree:true});
  cover.querySelectorAll('.cover-caption,.panel-content,.mini-speech,.panel-index').forEach(el=>contentObserver.observe(el));
  observeContent();
  document.fonts.ready.then(queue);document.fonts.addEventListener('loadingdone',queue);
  window.addEventListener('resize',queue);queue();
}
