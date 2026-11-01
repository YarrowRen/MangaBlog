import {catalogue,selectPage,categoryNames} from './articles.js';
import {renderArticleCard} from './article-card.js';
import {pagePartition,pageLayouts} from './page-layouts.js';
import {bounds,inset,safeRect,partition,clamp} from './geometry.js';
const cover=document.querySelector('.manga-spread'),chapters=document.querySelector('.manga-chapters');
const caption=panel=>panel.querySelector('.card-copy,.cover-caption,.panel-content');
const rectStyle=(el,r)=>Object.assign(el.style,{left:`${r.x}px`,top:`${r.y}px`,width:`${r.w}px`,height:`${r.h}px`});
let scheduled=false,archiveDemo=false;
const desktopHeights=new Map();
export function setArchiveMode(demo){archiveDemo=demo;}
function queue(){if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;layoutPanels();});}}
function fitArtwork(panel,box,imageHeight=box.h){
 const image=panel.querySelector(':scope > .cover-art > .card-cover');
 if(image){
  panel.style.setProperty('--cover-image-height',`${imageHeight}px`);
  // Thumbnail panels fill with a uniform crop; full compositions remain in the reader/gallery.
  image.style.objectFit='cover';
  image.style.objectPosition=image.dataset.focus;
  panel.dataset.imageFit=image.style.objectFit;
 }
 const art=panel.querySelector(':scope > .art');
 if(art){
  // A 1536x1024 atlas has four 768x512 tiles. Scale both axes uniformly,
  // then offset the selected tile; percentage background sizing distorts it.
  const tileW=768,tileH=512,scale=Math.max(box.w/tileW,box.h/tileH);
  const column=art.classList.contains('portrait')||art.classList.contains('desk')?1:0;
  const row=art.classList.contains('street')||art.classList.contains('desk')?1:0;
  art.style.backgroundSize=`${1536*scale}px ${1024*scale}px`;
  art.style.backgroundPosition=`${(box.w-tileW*scale)/2-column*tileW*scale}px ${(box.h-tileH*scale)/2-row*tileH*scale}px`;
 }
}
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
  let needed=0,imageHeight=box.h;
  const hasCover=!!panel.querySelector(':scope > .cover-art');
  const minimumArt=hasCover?clamp(box.w*.25,96,160):0;
  if(content){
    Object.assign(content.style,{width:`${safe.w}px`,left:`${safe.x}px`,top:'0px'});
    needed=content.getBoundingClientRect().height;
    const contentTop=safe.y+safe.h-needed;
    content.style.top=`${contentTop}px`;
    if(hasCover)imageHeight=Math.max(20,contentTop-12);
  }
  const label=panel.querySelector('.image-label,.panel-index');
  if(label){Object.assign(label.style,{left:`${safe.x}px`,top:`${safe.y}px`,maxWidth:`${safe.w}px`});needed+=label.getBoundingClientRect().height+18;}
  const bubble=panel.querySelector('.mini-speech');
  if(bubble){Object.assign(bubble.style,{left:`${safe.x}px`,top:`${safe.y}px`,maxWidth:`${safe.w}px`});needed=Math.max(needed,bubble.getBoundingClientRect().height+20);}
  if(hasCover)needed+=minimumArt;
  fitArtwork(panel,box,imageHeight);
  // Content receives a hard safety rectangle; short art-only slots reserve image space.
  return Math.max(0,needed-safe.h);
}
function group(container,panels,w,mobile,seed,hero=false,pageIndex=null,heightFloor=0){
  let h=hero?(mobile?Math.max(400,w*1.1):(w<620?300:clamp(w*.48,470,620))):(mobile?Math.max(720,w*1.8):clamp(w*.39,400,540));
  if(pageIndex!==null)h=mobile?Math.max(340*panels.length,w*panels.length*.85):Math.max(900,w*.95);
  h=Math.max(h,heightFloor);
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
// Preflight the entire catalogue, including category pages, at one common height.
// This keeps the footer and pagination stationary across all desktop templates.
function sharedDesktopHeight(w,seed){
  const fontKey=['.card-copy h3','.card-copy p','.meta','.image-label'].map(selector=>{
    const node=chapters.querySelector(selector);if(!node)return '';
    const css=getComputedStyle(node);return [css.font,css.letterSpacing].join('/');
  }).join('|');
  const contentKey=JSON.stringify(catalogue(archiveDemo));
  const key=[w,archiveDemo,seed,fontKey,contentKey].join('|');
  if(desktopHeights.has(key))return {key,height:desktopHeights.get(key)};
  const probe=document.createElement('div');
  probe.className='manga-chapters computed-layout layout-measure';
  probe.style.width=`${w}px`;probe.setAttribute('aria-hidden','true');probe.inert=true;
  document.body.append(probe);
  let height=Math.ceil(Math.max(900,w*.95)/16)*16;
  const specs=[];
  for(const category of ['all',...Object.keys(categoryNames)]){
    const count=selectPage({demo:archiveDemo,category}).pages;
    for(let page=1;page<=count;page++){
      const {items}=selectPage({demo:archiveDemo,category,page});
      if(items.length)specs.push({items,index:(page-1)%pageLayouts.length,seed:`${seed}-page-${category}-${page}`});
    }
  }
  try{
    for(let pass=0;pass<4;pass++){
      let next=height;
      for(const spec of specs){
        const panels=spec.items.map(a=>renderArticleCard(a));probe.replaceChildren(...panels);
        next=Math.max(next,group(probe,panels,w,false,spec.seed,false,spec.index,height));
      }
      next=Math.ceil(next/16)*16;
      if(next===height)break;height=next;
    }
  }finally{probe.remove();}
  if(desktopHeights.size>=8)desktopHeights.delete(desktopHeights.keys().next().value);
  desktopHeights.set(key,height);
  return {key,height};
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
  const pageSeed=`${seed}-page-${chapters.dataset.category||'all'}-${chapters.dataset.page||1}`;
  let height=0;
  if(all.length&&cw>=620){
    const shared=sharedDesktopHeight(cw,seed);
    height=group(chapters,all,cw,false,pageSeed,false,index,shared.height);
    // Runtime content edits can raise the common budget, but never shrink it mid-session.
    if(height>shared.height){height=group(chapters,all,cw,false,pageSeed,false,index,Math.ceil(height/16)*16);desktopHeights.set(shared.key,height);}
    chapters.dataset.fixedHeight=String(height);
  }else{
    height=all.length?group(chapters,all,cw,true,pageSeed,false,index):0;
    delete chapters.dataset.fixedHeight;
  }
  chapters.style.height=`${height}px`;
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
  const fontsWereLoading=document.fonts.status!=='loaded';
  document.fonts.ready.then(()=>{if(fontsWereLoading)desktopHeights.clear();queue();});
  document.fonts.addEventListener('loadingdone',()=>{desktopHeights.clear();queue();});
  window.addEventListener('resize',queue);queue();
}
