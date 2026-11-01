import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pagePartition,pageLayouts} from '../page-layouts.js';
import {inset,bounds} from '../geometry.js';
// Layout viewport and thumbnail dimensions are separate. 280px must never be
// passed as a desktop viewport: it deliberately selects the mobile stack.
const modes={desktop:{w:1224,h:2224,label:'桌面端'},mobile:{w:350,h:2040,label:'手机端'}};
function shapes(mode,index){
 const {w,h}=modes[mode];
 return pagePartition(w,h,6,index,`panel-log-page-all-${index+1}`);
}
for(let i=0;i<6;i++){
 assert(shapes('desktop',i).some(poly=>bounds(poly).w<modes.desktop.w*.85),'Desktop thumbnail accidentally uses mobile stacking');
 assert(shapes('mobile',i).every(poly=>bounds(poly).w>modes.mobile.w*.98),'Mobile flow no longer uses readable full-width rows');
}
function drawing(mode,index,x,y,width){
 const {w,h}=modes[mode],scale=width/w;
 const polygons=shapes(mode,index).map((poly,n)=>{
  const shape=inset(poly,5/scale);
  const cx=shape.reduce((sum,p)=>sum+p[0],0)/shape.length,cy=shape.reduce((sum,p)=>sum+p[1],0)/shape.length;
  return `<polygon points="${shape.map(p=>p.join(',')).join(' ')}" fill="${n===0?'#edb5a5':'#fffdf7'}" stroke="#20211f" stroke-width="${2/scale}"/><text x="${cx}" y="${cy}" dominant-baseline="middle" text-anchor="middle" font-size="${16/scale}">${n+1}</text>`;
 }).join('');
 return `<g data-mode="${mode}" data-layout-width="${w}" transform="translate(${x} ${y}) scale(${scale})">${polygons}</g>`;
}
function svg(w,h,title,description,content){return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc"><title id="title">${title}</title><desc id="desc">${description}</desc><rect width="${w}" height="${h}" fill="#f3f0e7"/><g font-family="sans-serif" fill="#20211f"><text x="26" y="38" font-size="24" font-weight="700">${title}</text><text x="26" y="65" font-size="12" fill="#75746e">${description}</text>${content}</g></svg>`;}
for(const mode of ['desktop','mobile']){
 const outputWidth=mode==='desktop'?280:84;
 const rows=pageLayouts.map((template,i)=>{
  const x=22+(i%3)*310+(280-outputWidth)/2,y=90+Math.floor(i/3)*580;
  return drawing(mode,i,x,y,outputWidth)+`<text x="${22+(i%3)*310}" y="${y+540}" font-size="17" font-weight="700">0${i+1} / ${template.name}</text>`;
 }).join('');
 const name=mode==='desktop'?'page-templates.svg':'page-templates-mobile.svg';
 await writeFile(`docs/review/${name}`,svg(950,1260,`${modes[mode].label} · 六套漫画页结构`,`${modes[mode].w}px 布局宽度先计算，再等比缩放；数字表示阅读顺序。`,rows));
}
const comparison=pageLayouts.map((template,i)=>{
 const x=24+(i%3)*340,y=110+Math.floor(i/3)*460;
 const desktopWidth=200,mobileWidth=200/modes.desktop.w*modes.desktop.h/modes.mobile.h*modes.mobile.w;
 return `<text x="${x}" y="${y-12}" font-size="11">桌面 · 1224px</text><text x="${x+222}" y="${y-12}" font-size="11">手机 · 350px</text>`+
  drawing('desktop',i,x,y,desktopWidth)+drawing('mobile',i,x+222,y,mobileWidth)+
  `<text x="${x}" y="${y+400}" font-size="17" font-weight="700">0${i+1} / ${template.name}</text>`;
}).join('');
await writeFile('docs/review/page-templates-comparison.svg',svg(1040,1000,'桌面与手机 · 分镜结构对照','按真实设备宽度计算，再缩小展示。文字安全区与画布高度由运行时预排版决定。',comparison));
console.log('Generated desktop, mobile and comparison diagrams; desktop breakpoint regression checks passed.');
await writeFile('docs/review/templates.html','<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>分镜模板对照</title><body style="margin:0"><img src="page-templates-comparison.svg" width="1040" height="1000" alt="桌面与手机六套分镜结构对照"></body></html>');
