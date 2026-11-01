const cards = [...document.querySelectorAll('.article-card, .quote-card')];
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(item => { item.classList.toggle('selected', item === button); item.setAttribute('aria-pressed', String(item === button)); });
  cards.forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter; });
}));
const dialog = document.querySelector('#search-dialog');
if (dialog) {
  const input = document.querySelector('#search-input');
  const results = document.querySelector('#search-results');
  const search = () => {
    const query = input.value.trim().toLowerCase();
    const matches = cards.filter(card => `${card.dataset.title}${card.dataset.category}`.toLowerCase().includes(query));
    results.replaceChildren();
    for (const card of matches) {
      const a = document.createElement('a'); a.href = card.getAttribute('href');
      const small = document.createElement('small'); small.textContent = card.dataset.category;
      a.append(small, document.createTextNode(card.dataset.title + ' ↗')); results.append(a);
    }
    if (!matches.length) results.textContent = '没有找到这一格，换个关键词试试。';
  };
  document.querySelector('.search-toggle').addEventListener('click', () => { dialog.showModal(); search(); input.focus(); });
  input.addEventListener('input', search);
}
const stories = {
  code: {title:'写代码，也是一种分镜练习。',category:'技术手记 / 第 002 话',date:'2026.10.28',iso:'2026-10-28',duration:'约 4 分钟阅读',deck:'让界面有秩序，也让灵感保留一点任性。',art:'desk',headings:['先看清楚，再动手','界面的阅读顺序','让结构表达意图','继续迭代'],paragraphs:['打开编辑器之前，我会先画几个方框。用户先看到什么，接下来想做什么，完成操作以后又会得到什么反馈？这些问题，比选用哪一种动画更早出现。','漫画分镜和界面设计，都在安排注意力。大格建立场景，小格强调细节，留白让读者停一停。一张好的界面，也应该有这样的呼吸。','我习惯把信息分成三个层级：当前任务、辅助说明，以及可以稍后探索的内容。把它们全部放大，并不会让界面更清晰，只会让视线无处落脚。','代码负责让这种秩序稳定地发生。语义化结构、可见的焦点、真实的链接，都像画面背后的草稿线，平时不抢眼，却支撑着完整体验。']},
  walk: {title:'在城市的留白处，散个步。',category:'日常切片 / 第 003 话',date:'2026.10.24',iso:'2026-10-24',duration:'约 3 分钟阅读',deck:'不赶时间的下午，总能捡到一些小故事。',art:'street',headings:['把路线暂时忘掉','在街角停一停','收集普通的细节','带一个故事回家'],paragraphs:['那个下午，我比平时早一站下车。没有想去的店，也没有需要完成的清单，只想换一条回家的路。','一辆自行车停在书店门口。红色遮阳棚下面，店员正在整理旧书。风翻动了最上面那本的封面，像有人悄悄翻过一格漫画。','城市里最有趣的画面，往往没有发生什么大事。树影跨过斑马线，猫躲进椅子底下，便利店的灯比天色早一步亮起来。','我把它们记在手机里。回家以后再读，才发现这段没有目的的路，反而留下了最清楚的记忆。']},
  blank: {title:'空白页，也算是一种开始。',category:'创作现场 / 第 004 话',date:'2026.10.20',iso:'2026-10-20',duration:'约 3 分钟阅读',deck:'不必等故事完整，先画下第一格。',art:'portrait',headings:['面对空白','给不完整留个位置','一个很小的练习','下一页还在等你'],paragraphs:['新建文件以后，我盯着空白页面看了很久。总觉得应该有一个足够好的开头，才配得上按下保存键。','后来才发现，第一稿的任务并不是完美，而是出现。有了一个可以修改的对象，想法才能从脑海里走出来。','我开始做一个小练习：每天只记录一个画面，可以是一句话，也可以是一张粗糙的草图。没有发布的压力，也不要求连续打卡。','积累一段时间以后，这些零散的小格子开始互相连接。故事并不是想清楚以后才开始的，它是在一格一格往下画的时候，慢慢长出来的。']}
};
const chapter = new URLSearchParams(location.search).get('chapter');
if (stories[chapter] && document.querySelector('#article-body')) {
  const s = stories[chapter]; document.title = `${s.title} · 次元编辑室`;
  document.querySelector('#article-title').textContent = s.title;
  document.querySelector('#article-category').textContent = s.category;
  document.querySelector('#breadcrumb-title').textContent = s.category.split(' / ')[1];
  document.querySelector('#article-deck').textContent = s.deck;
  document.querySelector('#article-date').textContent = s.date;
  document.querySelector('#article-date').dateTime = s.iso;
  document.querySelector('#article-duration').textContent = s.duration;
  document.querySelector('meta[name="description"]').content = s.deck;
  const banner = document.querySelector('.article-banner'); banner.classList.remove('studio'); banner.classList.add(s.art); banner.setAttribute('aria-label', s.deck);
  document.querySelectorAll('.prose h2').forEach((h,i) => { h.replaceChildren(); const span=document.createElement('span'); span.textContent=`0${i+1}`; h.append(span,document.createTextNode(s.headings[i])); });
  document.querySelectorAll('.toc a').forEach((a,i) => { a.textContent=`0${i+1} / ${s.headings[i]}`; });
  const body=document.querySelector('#article-body');
  body.querySelectorAll('p, blockquote, figure, .table-scroll, .code-wrap').forEach(node=>node.remove());
  body.querySelectorAll('h2').forEach((h,i)=> { const p=document.createElement('p');p.textContent=s.paragraphs[i];h.after(p); });
}
document.querySelector('.reading-toggle')?.addEventListener('click', event => {
  const enabled = document.body.classList.toggle('reading-mode');
  event.currentTarget.setAttribute('aria-pressed', String(enabled)); event.currentTarget.textContent = enabled ? '退出阅读模式' : '切换阅读模式';
});
document.querySelectorAll('.copy-code').forEach(button => button.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(button.nextElementSibling.textContent); button.textContent='已复制'; }
  catch { button.textContent='请选中代码复制'; }
}));
