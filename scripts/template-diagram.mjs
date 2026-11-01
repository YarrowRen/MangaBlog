import {writeFile} from 'node:fs/promises';
import {pagePartition,pageLayouts} from '../page-layouts.js';
import {inset} from '../geometry.js';
const rows=pageLayouts.map((template,i)=>{
 const x=22+(i%3)*310,y=26+Math.floor(i/3)*430;
 const polygons=pagePartition(280,350,6,i,'panel-log-page').map((p,n)=>{
  const shape=inset(p,5),cx=shape.reduce((s,p)=>s+p[0],0)/shape.length,cy=shape.reduce((s,p)=>s+p[1],0)/shape.length;
  return `<polygon points="${shape.map(p=>p.join(',')).join(' ')}" fill="${n===0?'#edb5a5':'#fffdf7'}" stroke="#20211f" stroke-width="2"/><text x="${cx}" y="${cy}" dominant-baseline="middle" text-anchor="middle" font-size="18">${n+1}</text>`;
 }).join('');
 return `<g transform="translate(${x} ${y})">${polygons}<text x="5" y="380" font-size="18" font-weight="700">0${i+1} / ${template.name}</text></g>`;
}).join('');
await writeFile('docs/review/page-templates.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="950" height="880" viewBox="0 0 950 880"><rect width="950" height="880" fill="#f3f0e7"/><g font-family="sans-serif" fill="#20211f">${rows}</g></svg>`);
