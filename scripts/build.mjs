import {mkdir,copyFile,cp,rm,readFile,writeFile} from 'node:fs/promises';
import {buildContent,imported} from './content-pages.mjs';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const file of ['styles.css','app.js','layout.js','geometry.js','articles.js','archive.js','page-layouts.js','article-card.js','.nojekyll'])await copyFile(file,`dist/${file}`);
await cp('assets','dist/assets',{recursive:true});
await mkdir('dist/content',{recursive:true});await copyFile('content/catalogue.js','dist/content/catalogue.js');await copyFile('content/covers.js','dist/content/covers.js');
let index=await readFile('index.html','utf8');
index=index.replace('<!-- INITIAL_ARTICLES -->',imported.slice(0,6).map(a=>`<a class="panel article-card" href="${a.href}" data-category="${escape(a.category)}" data-title="${escape(a.title)}" data-id="${a.id}">${a.cover?`<div class="card-image cover-art"><img class="card-cover" src="${a.cover.src}" alt="${escape(a.cover.alt)}" width="${a.cover.width}" height="${a.cover.height}" data-focus="${a.cover.position}" loading="lazy" decoding="async"></div>`:`<div class="card-image art ${a.art}" role="img" aria-label="漫画场景"></div>`}<span class="image-label">第 ${a.chapter} 篇</span><div class="card-copy"><div class="meta"><span>${escape(a.author)}</span><time datetime="${escape(a.published)}">${a.date}</time></div><h3>${escape(a.title)}</h3><p>${escape(a.summary)}</p><div class="card-bottom"><span>${a.minutes} MIN READ</span><span>阅读全文 ↗</span></div></div></a>`).join(''));
await writeFile('dist/index.html',index);await buildContent();
await mkdir('dist/docs/review',{recursive:true});
for(const file of ['page-templates.svg','page-templates-mobile.svg','page-templates-comparison.svg','templates.html'])await copyFile('docs/review/'+file,'dist/docs/review/'+file);
console.log(`Built ${imported.length} complete articles + About, with local media and static HTML.`);

const gallery=imported.filter(a=>a.cover).map(a=>`<article class="panel"><a href="${a.cover.src}" target="_blank" rel="noopener noreferrer"><img src="${a.cover.src}" alt="${escape(a.cover.alt)}" width="${a.cover.width}" height="${a.cover.height}"></a><div><small>第 ${a.chapter} 篇</small><h2><a href="${a.href}">${escape(a.title)}</a></h2></div></article>`).join('');
await writeFile('dist/covers.html',`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>本期封面集 · Yarrow 的次元编辑室</title><link rel="stylesheet" href="styles.css"></head><body><main class="cover-gallery-page"><a class="back-link" href="index.html#latest">← 返回文章目录</a><p class="eyebrow">MONOCHROME STORIES / 001 — 006</p><h1>本期封面集</h1><p class="gallery-note">六段故事，六页黑白漫画。点击图片查看完整原图。</p><section class="cover-gallery">${gallery}</section></main></body></html>`);
