import {catalogue,categoryNames,selectPage} from './articles.js';
import {pageLayouts} from './page-layouts.js';
import {layoutPanels,setArchiveMode} from './layout.js';
import {renderArticleCard} from './article-card.js';
const grid=document.querySelector('#chapter-page');
const filters=[...document.querySelectorAll('[data-filter]')];
const pager=document.querySelector('.pagination');
const demoButton=document.querySelector('#demo-toggle');
let requested,version=0,animations=[];
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function readState(){
 const q=new URLSearchParams(location.search),raw=q.get('page')||'1';
 return normalize({demo:false,category:categoryNames[q.get('category')]?q.get('category'):'all',page:/^\d{1,8}$/.test(raw)?Number(raw):1});
}
function normalize(s){return {...s,page:selectPage(s).page};}
function storeState(s,replace=false){
 const url=new URL(location.href);
 for(const [key,value] of Object.entries({page:s.page===1?null:String(s.page),category:s.category==='all'?null:s.category,demo:s.demo?'1':null})){
  if(value===null)url.searchParams.delete(key);else url.searchParams.set(key,value);
 }
 if(!replace)url.hash='latest';
 if(url.href!==location.href)history[replace?'replaceState':'pushState']({},'',url);
}
function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;}
function pagination(page,pages){
 const fragment=document.createDocumentFragment();
 function button(text,target,label,disabled=false,current=false){
  const b=el('button','page-button',text);b.type='button';b.dataset.page=String(target);b.disabled=disabled;b.setAttribute('aria-label',label);b.setAttribute('aria-controls','chapter-page');
  if(current)b.setAttribute('aria-current','page');fragment.append(b);
 }
 button('← 上一页',page-1,'上一页',page===1);fragment.lastChild.dataset.delta='-1';
 const numbers=[...new Set([1,pages,page-1,page,page+1].filter(n=>n>=1&&n<=pages))].sort((a,b)=>a-b);
 for(let i=0;i<numbers.length;i++){
  if(i&&numbers[i]-numbers[i-1]>1)fragment.append(el('span','page-ellipsis','…'));
  const n=numbers[i];button(String(n).padStart(2,'0'),n,`第 ${n} 页`,false,n===page);
 }
 button('下一页 →',page+1,'下一页',page===pages);fragment.lastChild.dataset.delta='1';
 const jump=el('form','page-jump'),label=el('label','','跳至'),input=el('input');
 input.type='number';input.name='page';input.min='1';input.max=String(pages);input.value=String(page);input.required=true;input.setAttribute('aria-label',`跳转页码，1 至 ${pages}`);
 const go=el('button','','前往');go.type='submit';label.append(input);jump.append(label,go);fragment.append(jump);
 pager.replaceChildren(fragment);
}
function render(){
 const {items,page,pages,total}=selectPage(requested);const index=(page-1)%pageLayouts.length;
 grid.dataset.pageIndex=String(index);grid.dataset.page=String(page);grid.dataset.category=requested.category;
 setArchiveMode(requested.demo);
 grid.replaceChildren(...items.map(a=>renderArticleCard(a,articleHref(a))));
 filters.forEach(b=>{const active=b.dataset.filter===requested.category;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
 const count=catalogue(requested.demo).length;
 document.querySelector('.section-heading .count').textContent=` / ${count}`;
 document.querySelector('[data-filter="all"] span').textContent=String(count).padStart(2,'0');
 if(demoButton){demoButton.hidden=true;}
 document.querySelector('.demo-label').textContent='试迁移 · 最新 20 篇原站文章';
 document.querySelector('#page-status').textContent=`共 ${total} 篇 · 第 ${page} / ${pages} 页 · 本页 ${items.length} 篇`;
 document.querySelector('#template-name').textContent=pageLayouts[index].name;
 document.querySelector('.empty').hidden=total!==0;
 pagination(page,pages);layoutPanels();
 document.dispatchEvent(new Event('cataloguechange'));
}
export const currentCatalogue=()=>catalogue(requested?.demo||false);
export function articleHref(a){
 const url=new URL(a.href,location.href);
 if(requested){
  url.searchParams.set('fromPage',String(requested.page));
  if(requested.category!=='all')url.searchParams.set('fromCategory',requested.category);
  if(requested.demo)url.searchParams.set('demo','1');
 }
 return url.pathname+url.search;
}
async function navigate(next,{historyMode='push',source='page',animate=true}={}){
 const token=++version;requested=normalize(next);
 animations.forEach(a=>a.cancel());animations=[];
 grid.setAttribute('aria-busy','true');grid.inert=true;
 const motion=animate&&!reduced()&&typeof grid.animate==='function';
 try{
  // Exit the old sheet completely before laying out the new one: no overlapping grids.
  if(motion){const out=grid.animate([{opacity:1},{opacity:0}],{duration:110,fill:'forwards'});animations.push(out);await out.finished.catch(()=>{});}
  if(token!==version)return;
  render();
  animations.forEach(a=>a.cancel());animations=[];
  if(historyMode!=='none')storeState(requested,historyMode==='replace');
  if(source==='page'){
   document.querySelector('#page-status').focus({preventScroll:true});
   document.querySelector('.archive-toolbar').scrollIntoView({block:'start',behavior:'instant'});
  }
  if(motion&&!reduced()){
   const active=[...grid.querySelectorAll('.panel')];
   animations=active.map((panel,i)=>panel.animate([{opacity:0},{opacity:1}],{duration:210,delay:i*25,fill:'backwards',easing:'ease-out'}));
   await Promise.all(animations.map(a=>a.finished.catch(()=>{})));
  }
 }finally{
  if(token===version){animations.forEach(a=>a.cancel());animations=[];grid.setAttribute('aria-busy','false');grid.inert=false;}
 }
}
if(grid){
 document.documentElement.classList.add('archive-ready');
 requested=readState();render();storeState(requested,true);
 filters.forEach(button=>button.addEventListener('click',()=>navigate({...requested,category:button.dataset.filter,page:1},{source:'filter'})));
 demoButton?.addEventListener('click',()=>navigate({...requested,demo:!requested.demo,page:1},{source:'demo'}));
 pager.addEventListener('click',e=>{const button=e.target.closest('[data-page]');if(button&&!button.disabled){const target=button.dataset.delta?requested.page+Number(button.dataset.delta):Number(button.dataset.page);if(target!==requested.page)navigate({...requested,page:target});};});
 pager.addEventListener('submit',e=>{e.preventDefault();const form=e.target;if(form.reportValidity())navigate({...requested,page:Number(new FormData(form).get('page'))});});
 window.addEventListener('popstate',()=>navigate(readState(),{historyMode:'none',source:'history',animate:false}));
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{if(reduced())animations.forEach(a=>a.cancel());});
}
