import {articleCovers} from '../content/covers.js';
import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as yaml from 'js-yaml';
import MarkdownIt from 'markdown-it';
import texmath from 'markdown-it-texmath';
import katex from 'katex';
import hljs from 'highlight.js';
import sanitize from 'sanitize-html';
const migration=JSON.parse(await readFile('content/migration.json','utf8'));
const diagrams=JSON.parse(await readFile('content/diagrams.json','utf8'));
export const imported=migration.articles.map(article=>({...article,cover:articleCovers[article.slug]}));
const assetPaths=new Map(Object.entries(migration.assets).flatMap(([url,path])=>[[url,path],[decodeURI(url),path]]));
const escape=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function content(source){return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,'');}
function slug(s){return s.replace(/[`*_]/g,'').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu,'').trim().replace(/\s+/g,'-');}
function rewrite(url,article,prefix){
 if(!url||url.startsWith('#')||/^(mailto:|data:)/.test(url))return url;
 if(url.startsWith(prefix+'assets/')||url.startsWith('assets/imported/'))return url;
 const localAsset=assetPaths.get(url)||assetPaths.get(decodeURI(url));
 if(localAsset)return prefix+localAsset;
 if(url==='/title.png')return prefix+'assets/imported/author.png';
 if(url==='/slides/powerpoint-report/index.html')return prefix+'assets/imported/slides/index.html';
 const resolved=new URL(url,article?.originalURL||'https://yarrow.ren/about/');
 if(['yarrow.ren','www.yarrow.ren'].includes(resolved.hostname)){
  if(/^\/about\/?$/.test(resolved.pathname))return prefix+'about.html'+resolved.hash;
  const last=decodeURIComponent(resolved.pathname).replace(/\/$/,'').split('/').at(-1);
  const match=imported.find(a=>[a.slug,a.source.split('/').at(-1).replace(/\.(md|mdx)$/,'')].includes(last));
  if(match)return prefix+match.href+resolved.hash;
  return resolved.href; // Articles outside this 20-post trial stay on the original site.
 }
 return url;
}
const mathTags=['math','semantics','annotation','mrow','mi','mo','mn','msup','msub','mfrac','mtext','mspace','msubsup','mtable','mtr','mtd','mover','munder','munderover','msqrt','mroot','menclose','mpadded','mstyle','mprescripts','none','eq','eqn'];
function render(source,article,prefix){
 let body=content(source).replace(/<style>\{`[\s\S]*?`\}<\/style>/g,'');
 if(article?.slug==='claude-code-memory-slides')body=`<p>使用键盘 ← / → 或底部导航切换幻灯片，右下角图标切换备注面板。</p><p><a class="deck-open" href="/slides/powerpoint-report/index.html" target="_blank" rel="noopener noreferrer">全屏打开演示稿 ↗</a></p><iframe class="slide-deck" src="/slides/powerpoint-report/index.html" title="Claude Code Memory 系统与 AutoDream 深度解析" loading="eager"></iframe>`;
 const headings=[],seen=new Map();
 const md=new MarkdownIt({html:true,linkify:true,highlight:(code,lang)=>{
  if(lang&&hljs.getLanguage(lang))return hljs.highlight(code,{language:lang}).value;
  return escape(code);
 }}).use(texmath,{engine:katex,delimiters:['dollars','brackets'],katexOptions:{strict:false,throwOnError:false,trust:false}});
 const fence=md.renderer.rules.fence;
 md.renderer.rules.fence=(tokens,index,options,env,self)=>{
  const token=tokens[index],language=token.info.trim().split(/\s/)[0];
  if(language==='mermaid'){
   const code=token.content.trim(),path=diagrams[code];
   if(!path)throw new Error('Missing pre-rendered Mermaid: '+createHash('sha256').update(code).digest('hex').slice(0,16));
   return `<figure class="diagram"><div class="diagram-scroll"><a href="${prefix+path}" target="_blank" rel="noopener noreferrer"><img src="${prefix+path}" alt="${escape(article?.title||'')}：流程图" loading="lazy"></a></div><figcaption>流程图 · 点击查看原尺寸</figcaption><details><summary>查看图表源码</summary><pre><code>${escape(code)}</code></pre></details></figure>`;
  }
  return `<div class="code-wrap"><button class="copy-code" type="button">复制代码</button>${fence(tokens,index,options,env,self)}</div>`;
 };
 const heading=md.renderer.rules.heading_open;
 md.renderer.rules.heading_open=(tokens,index,options,env,self)=>{
  const title=tokens[index+1].content.replace(/[`*_]/g,''),base=slug(title)||'section',n=seen.get(base)||0,id=n?`${base}-${n}`:base;
  seen.set(base,n+1);tokens[index].attrSet('id',id);
  if(['h1','h2','h3'].includes(tokens[index].tag))headings.push({id,title,level:tokens[index].tag});
  return heading?heading(tokens,index,options,env,self):self.renderToken(tokens,index,options);
 };
 let html=md.render(body);
 html=sanitize(html,{
  allowedTags:[...sanitize.defaults.allowedTags,...mathTags,'img','figure','figcaption','details','summary','ruby','rt','rp','iframe','button','svg','path','line','g'],
  allowedAttributes:{'*':['id','class','style','title','role','aria-label','aria-hidden'],a:['href','target','rel'],img:['src','alt','width','height','loading'],iframe:['src','title','loading','class','sandbox'],button:['class','type'],td:['rowspan','colspan'],th:['rowspan','colspan','scope'],details:['open'],math:['xmlns','display'],annotation:['encoding'],svg:['xmlns','width','height','viewBox','viewbox','preserveAspectRatio','preserveaspectratio'],path:['d'],line:['x1','y1','x2','y2'],...Object.fromEntries(mathTags.map(tag=>[tag,['class','style','aria-hidden','display','xmlns','encoding','columnalign','columnspacing','rowspacing','mathvariant','stretchy','accent','fence','separator','linethickness']]))},
  allowedSchemes:['http','https','mailto','data'],allowedSchemesByTag:{img:['http','https','data'],iframe:[]},allowProtocolRelative:false,
  transformTags:{'*':(tag,attrs)=>{
   if(attrs.style&&/position\s*:\s*(fixed|sticky)|url\s*\(|expression\s*\(/i.test(attrs.style))delete attrs.style;
   if(tag==='a'){
    attrs.href=rewrite(attrs.href,article,prefix);if(attrs.target==='_blank')attrs.rel='noopener noreferrer';
   }
   if(tag==='img'){attrs.src=rewrite(attrs.src,article,prefix);attrs.loading='lazy';if(!attrs.alt)attrs.alt='原文插图';}
   if(tag==='iframe'){
    if(attrs.src==='/slides/powerpoint-report/index.html')attrs.src=rewrite(attrs.src,article,prefix);
    else if(!attrs.src?.includes('assets/imported/slides/'))return {tagName:'a',attribs:{href:attrs.src,target:'_blank',rel:'noopener noreferrer',class:'map-link'},text:'在 Google Maps 中查看秋叶原地图 ↗'};
    attrs.sandbox='allow-scripts allow-same-origin allow-popups';
   }
   return {tagName:tag,attribs:attrs};
  }},
 });
 html=html.replace(/<table\b[\s\S]*?<\/table>/g,table=>`<div class="table-scroll" tabindex="0" role="region" aria-label="原文表格，可横向滚动">${table}</div>`);
 if(article?.slug==='jlpt-n5'){
  for(const match of html.matchAll(/<div id="([^"]+)" class="jlpt-section-title">([^<]+)<\/div>/g))headings.push({id:match[1],title:match[2],level:'h2'});
 }
 return {html,headings};
}
function header(prefix){return `<a class="skip" href="#article-body">跳到正文</a><header class="site-header"><a class="brand" href="${prefix}index.html"><span class="brand-mark">Y<span>!</span></span><span>Yarrow 的次元编辑室<small>BOYU REN / NOTES & RESEARCH</small></span></a><nav aria-label="主导航"><a href="${prefix}index.html">放映首页</a><a href="${prefix}index.html#latest">全部文章</a><a href="${prefix}about.html">关于 Yarrow</a></nav><a class="header-note" href="${prefix}index.html#latest">← 返回目录</a></header>`;}
function footer(prefix){return `<footer><a class="footer-brand" href="${prefix}index.html">Boyu(Yarrow) Ren <span>© ${new Date().getFullYear()} YARROW REN</span></a><a href="mailto:YarrowRen@gmail.com">联系 Yarrow ↗</a><a href="#main">回到页首 ↑</a></footer>`;}
function document(title,description,prefix,main){return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escape(description)}"><meta name="theme-color" content="#f3f0e7"><title>${escape(title)} · Yarrow 的次元编辑室</title><link rel="stylesheet" href="${prefix}styles.css"><link rel="stylesheet" href="${prefix}assets/vendor/katex/katex.min.css"><link rel="stylesheet" href="${prefix}assets/vendor/highlight.css"><script type="module" src="${prefix}app.js"></script></head><body>${header(prefix)}${main}${footer(prefix)}</body></html>`;}
export async function buildContent(){
 await mkdir('dist/posts',{recursive:true});await mkdir('dist/assets/vendor',{recursive:true});
 await cp('node_modules/katex/dist','dist/assets/vendor/katex',{recursive:true,filter:path=>!path.endsWith('.js')&&!path.endsWith('.mjs')});
 await cp('node_modules/highlight.js/styles/github-dark.css','dist/assets/vendor/highlight.css');
 await cp('node_modules/katex/LICENSE','dist/assets/vendor/katex/LICENSE');
 await cp('node_modules/highlight.js/LICENSE','dist/assets/vendor/highlight-LICENSE');
 const rendered=[];
 for(const a of imported){
  const original=await readFile(a.file,'utf8');
  const metadata=yaml.load(original.split('---')[1]);
  if(metadata.title!==a.title)throw new Error('Metadata/source mismatch: '+a.slug);
  const {html,headings}=render(original,a,'../');
  const toc=headings.map(h=>`<a href="#${escape(h.id)}" class="toc-${h.level}">${escape(h.title)}</a>`).join('');
  const tags=a.tags.map(tag=>`<span>${escape(tag)}</span>`).join('');
  const cover=a.cover?`<figure class="article-cover-panel"><a href="../${a.cover.src}" target="_blank" rel="noopener noreferrer" aria-label="查看完整漫画封面"><img src="../${a.cover.src}" alt="${escape(a.cover.alt)}" width="${a.cover.width}" height="${a.cover.height}" decoding="async"></a><figcaption>本篇黑白漫画封面 · 点击查看原图</figcaption></figure>`:'';
  const main=`<main class="reader-shell" id="main"><div class="breadcrumb"><a href="../index.html">放映首页</a> / <a href="../index.html#latest">文章目录</a> / ${escape(a.category)}</div><header class="article-heading"><span class="tag red">${escape(a.category)} / 原博客试迁移</span><h1 id="article-title">${escape(a.title)}</h1><p class="deck">${escape(a.summary)}</p><div class="article-tools"><div class="meta"><span>${escape(a.author)}</span><time datetime="${escape(a.published)}">${a.date.replaceAll('-','.')}</time><span>约 ${a.minutes} 分钟阅读</span></div><button class="reading-toggle" aria-pressed="false">切换阅读模式</button></div><div class="article-tags">${tags}</div></header>${cover}<div class="reading-layout ${a.hideToc?'without-toc':''}">${a.hideToc?'':`<aside class="toc" aria-label="文章目录"><strong>IN THIS CHAPTER</strong>${toc}</aside>`}<article class="prose migrated-post" id="article-body">${html}<div class="colophon">作者：${escape(a.author)} · <a href="${escape(a.originalURL)}" target="_blank" rel="noopener noreferrer">原站文章 ↗</a> · <a href="https://github.com/YarrowRen/YarrowRen.github.io/blob/${migration.sourceCommit}/${encodeURI(a.source)}" target="_blank" rel="noopener noreferrer">原始 Markdown ↗</a></div></article></div><a class="back-link" href="../index.html#latest">← 返回文章目录</a></main>`;
  await writeFile('dist/'+a.href,document(a.title,a.summary,'../',main));
  rendered.push({slug:a.slug,headings:headings.length,bodyLength:html.length});
 }
 const about=render(await readFile('content/about.md','utf8'),null,'');
 const socials=`<div class="profile-links"><a href="https://github.com/YarrowRen">GitHub ↗</a><a href="https://www.linkedin.com/in/boyu-ren/">LinkedIn ↗</a><a href="https://space.bilibili.com/353923033">Bilibili ↗</a><a href="mailto:YarrowRen@gmail.com">Email ↗</a><a href="https://yarrow.ren">原博客 ↗</a></div>`;
 const aboutMain=`<main class="reader-shell" id="main"><header class="article-heading about-title"><p class="eyebrow">BEHIND THE PANELS / ABOUT</p><h1>Boyu(Yarrow) Ren</h1><p class="deck">NLP Algorithm Engineer · NLP / RAG / LLMs / Multi-Agent Systems</p>${socials}</header><div class="about-reading"><article class="prose migrated-post" id="article-body">${about.html}</article></div><a class="back-link" href="index.html#latest">← 阅读 Yarrow 的文章</a></main>`;
 await writeFile('dist/about.html',document('About · Boyu(Yarrow) Ren','NLP 算法工程师，专注 NLP、RAG、LLMs 与多智能体系统。','',aboutMain));
 await writeFile('dist/content-report.json',JSON.stringify({count:rendered.length,posts:rendered,sourceCommit:migration.sourceCommit},null,2));
 // Legacy prototype URLs no longer lead to fictitious articles.
 await writeFile('dist/article.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${imported[0].href}"><title>文章已迁移</title><a href="${imported[0].href}">阅读最新文章</a></html>`);
 return imported;
}
