// A small real demo catalogue plus an explicitly opt-in 100-entry layout fixture.
export const PAGE_SIZE=6;
export const categoryNames={创作:'创作现场',技术:'技术手记',生活:'日常切片'};
export const articles=[
  {id:'001',title:'把日常，画成自己的宇宙。',category:'创作',date:'2026-11-01',minutes:6,art:'studio',summary:'从一张空白画纸开始，搭建属于自己的小小编辑室。',href:'article.html'},
  {id:'002',title:'写代码，也是一种分镜练习。',category:'技术',date:'2026-10-28',minutes:4,art:'desk',summary:'让界面有秩序，也让灵感保留一点任性。',href:'article.html?chapter=code'},
  {id:'003',title:'在城市的留白处，散个步。',category:'生活',date:'2026-10-24',minutes:3,art:'street',summary:'不赶时间的下午，总能捡到一些小故事。',href:'article.html?chapter=walk'},
  {id:'004',title:'空白页，也算是一种开始。',category:'创作',date:'2026-10-20',minutes:3,art:'portrait',summary:'不必等故事完整，先画下第一格。',href:'article.html?chapter=blank',quote:true},
];
const topics={
 技术:['给界面留一点呼吸的空间','从草稿到组件，整理一次设计思路','写给未来自己的代码笔记','让键盘也能顺利翻阅每一格','字体加载之后，画面该如何重新排列'],
 生活:['在书店等一场雨停','收集傍晚的光和街角的声音','把回家的路，走成新的故事','在普通日子里发现一个很小的惊喜','咖啡凉了，故事还没有讲完'],
 创作:['从一条线开始画出新的世界','给没有完成的画稿留一个位置','关于角色、场景与留白的练习','这一格，想试试不一样的构图','把零散的灵感整理成一页完整的漫画'],
};
export const layoutSamples=Array.from({length:100},(_,i)=>{
 const category=['技术','生活','创作'][i%3],id=String(i+5).padStart(3,'0');
 return {id,title:`排版样稿 ${id}｜${topics[category][Math.floor(i/3)%5]}`,category,
  date:new Date(Date.UTC(2026,9,19-i)).toISOString().slice(0,10),minutes:3+i%5,
  art:({技术:'desk',生活:'street',创作:i%2?'portrait':'studio'})[category],
  summary:'分页演示内容，用于检查多篇文章在不同漫画分镜中的排列。'+(i%7===0?'这一篇还保留了更长的摘要，验证画格会根据真实文字高度增长，并保持边界之间的安全距离。':''),
  href:`article.html?sample=${id}`,sample:true};
});
export const catalogue=demo=>(demo?[...articles,...layoutSamples]:[...articles]).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
export function selectPage({demo=false,category='all',page=1}={}) {
 const filtered=catalogue(demo).filter(a=>category==='all'||a.category===category);
 const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
 const current=Math.max(1,Math.min(pages,Number.isSafeInteger(page)?page:1));
 return {items:filtered.slice((current-1)*PAGE_SIZE,current*PAGE_SIZE),page:current,pages,total:filtered.length};
}
