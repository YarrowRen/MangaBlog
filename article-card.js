import {categoryNames} from './articles.js';
function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;}
export function renderArticleCard(a,href=a.href){
 const link=el('a',`panel ${a.quote?'quote-card':'article-card'}`);link.href=href;
 Object.assign(link.dataset,{category:a.category,title:a.title,id:a.id});
 if(a.quote){
  const box=el('div','panel-content');box.append(el('span','eyebrow',`A NOTE TO MYSELF / ${a.id}`),el('span','quote-symbol','“'),el('h3','',a.title),el('p','',a.summary));
  const bottom=el('div','card-bottom');bottom.append(el('span','',`${categoryNames[a.category]} · ${a.date.replaceAll('-','.')}`),el('span','','↗'));box.append(bottom);link.append(box);return link;
 }
 const image=el('div',`card-image art ${a.art}`);image.setAttribute('role','img');image.setAttribute('aria-label',`${categoryNames[a.category]}的漫画场景插画`);
 const label=el('span','image-label',a.sample?`排版样稿 ${a.id}`:`第 ${a.chapter||a.id} 篇`);
 const copy=el('div','card-copy'),meta=el('div','meta'),time=el('time','',a.date.replaceAll('-','.'));time.dateTime=a.date;
 meta.append(el('span','',categoryNames[a.category]),time);
 const bottom=el('div','card-bottom');bottom.append(el('span','',a.sample?'LAYOUT SAMPLE':`${a.minutes} MIN READ`),el('span','',a.sample?'查看样稿 ↗':'阅读全文 ↗'));
 copy.append(meta,el('h3','',a.title),el('p','',a.summary),bottom);link.append(image,label,copy);return link;
}
