import {articleCovers} from './content/covers.js';
import {importedArticles} from './content/catalogue.js';
export const PAGE_SIZE=6;
export const categoryNames={AI:'AI / Agent',工程:'工程手记',算法:'算法与安全',兴趣:'兴趣手记'};
export const articles=importedArticles.map(article=>({...article,cover:articleCovers[article.slug]}));
export const catalogue=()=>[...articles].sort((a,b)=>b.published.localeCompare(a.published)||a.id.localeCompare(b.id));
export function selectPage({category='all',page=1}={}){
 const filtered=catalogue().filter(a=>category==='all'||a.category===category);
 const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
 const current=Math.max(1,Math.min(pages,Number.isSafeInteger(page)?page:1));
 return {items:filtered.slice((current-1)*PAGE_SIZE,current*PAGE_SIZE),page:current,pages,total:filtered.length};
}
