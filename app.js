import {currentCatalogue,articleHref} from './archive.js';
import {categoryNames} from './articles.js';
const dialog=document.querySelector('#search-dialog');
if(dialog){
 const input=document.querySelector('#search-input'),results=document.querySelector('#search-results');
 function search(){
  const query=input.value.trim().toLowerCase();
  const matches=currentCatalogue().filter(a=>`${a.title} ${a.summary} ${a.tags.join(' ')} ${categoryNames[a.category]}`.toLowerCase().includes(query));
  results.replaceChildren();
  for(const card of matches){
   const link=document.createElement('a');link.href=articleHref(card);
   const small=document.createElement('small');small.textContent=categoryNames[card.category];
   link.append(small,document.createTextNode(card.title+' ↗'));results.append(link);
  }
  if(!matches.length)results.textContent='没有找到相关文章，换个关键词试试。';
 }
 document.querySelector('.search-toggle')?.addEventListener('click',()=>{dialog.showModal();search();input.focus();});
 input.addEventListener('input',search);document.addEventListener('cataloguechange',()=>{if(dialog.open)search();});
}
const params=new URLSearchParams(location.search);
if(document.querySelector('#article-body')){
 const home=document.querySelector('.brand');const back=new URL(home.href,location.href);
 const page=params.get('fromPage');if(page&&/^\d{1,8}$/.test(page))back.searchParams.set('page',page);
 const category=params.get('fromCategory');if(categoryNames[category])back.searchParams.set('category',category);
 back.hash='latest';
 document.querySelectorAll('.back-link,.header-note,.breadcrumb a').forEach(a=>{if(a.href.includes('index.html#latest'))a.href=back.href;});
}
document.querySelector('.reading-toggle')?.addEventListener('click',event=>{
 const enabled=document.body.classList.toggle('reading-mode');event.currentTarget.setAttribute('aria-pressed',String(enabled));event.currentTarget.textContent=enabled?'退出阅读模式':'切换阅读模式';
});
document.querySelectorAll('.copy-code').forEach(button=>button.addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(button.nextElementSibling.textContent);button.textContent='已复制';}
 catch{button.textContent='请选中代码复制';}
}));
