"""100+ catalogue coverage, history, races, animation and real polygon constraints."""
import os,runpy
from pathlib import Path
from playwright.sync_api import sync_playwright
verify=runpy.run_path(str(Path(__file__).with_name('layout-test.py')))['verify']
BASE=os.environ.get('TEST_URL','http://127.0.0.1:4321')
SHOTS=Path('/tmp/panel-log-review');SHOTS.mkdir(exist_ok=True)
def ready(page):
    page.wait_for_function('document.documentElement.dataset.layoutReady === "true" && document.querySelector("#chapter-page").getAttribute("aria-busy") === "false"')
def visit(page,n,width=1440,extra=''):
    page.set_viewport_size({'width':width,'height':900})
    assert page.goto(f'{BASE}/index.html?demo=1&page={n}{extra}').status==200
    ready(page)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    seen=set();names=set();shapes=set()
    for n in range(1,19):
        visit(page,n)
        cards=page.locator('#chapter-page>.panel')
        ids=cards.evaluate_all('(cards)=>cards.map(c=>c.dataset.id)')
        assert len(ids)==(6 if n<18 else 2),(n,ids)
        assert not seen.intersection(ids),(n,'duplicate articles');seen.update(ids)
        assert page.locator('[aria-current="page"]').last.inner_text()==f'{n:02}'
        verify(page,f'all-pages/{n}')
        if n<=6:
            names.add(page.locator('#template-name').inner_text())
            shapes.add(page.locator('#chapter-page').evaluate('(e)=>JSON.stringify([...e.children].map(c=>JSON.parse(c.dataset.polygon)))'))
        if n==2: page.screenshot(path=str(SHOTS/'pagination-1440.png'),full_page=True,animations='disabled')
    assert len(seen)==104 and len(names)==6 and len(shapes)==6
    for width in [320,390,768]:
        for n in [1,2,3,4,5,6,18]:
            visit(page,n,width);verify(page,f'template/{n}/{width}')
            if width==390 and n==3:page.screenshot(path=str(SHOTS/'pagination-390.png'),full_page=True,animations='disabled')
    for n in range(1,7):
        visit(page,n,768)
        page.evaluate('''() => {
          document.querySelectorAll('#chapter-page h3').forEach(e=>e.textContent='这是一段必须完整显示的长标题'.repeat(8));
          document.querySelectorAll('#chapter-page .card-copy p').forEach(e=>e.textContent='LongUnbrokenEnglishSummary'.repeat(10));
        }''')
        page.wait_for_timeout(180);verify(page,f'long-template/{n}')
    visit(page,5,390)
    page.add_style_tag(content='#chapter-page h3,#chapter-page p{font-size:200% !important}')
    page.wait_for_timeout(180);verify(page,'six-panels-large-text')
    for category,total in [('技术',35),('生活',34),('创作',35)]:
        visit(page,99,390,f'&category={category}')
        assert '第 6 / 6 页' in page.locator('#page-status').inner_text()
        assert page.locator('#chapter-page>.panel').count()==total-30
        assert set(page.locator('#chapter-page>.panel').evaluate_all('(cs)=>cs.map(c=>c.dataset.category)'))=={category}
        verify(page,f'filtered/{category}/last')
    visit(page,1,1440)
    page.get_by_role('button',name='下一页',exact=True).click();ready(page)
    assert 'page=2' in page.url
    page.get_by_role('button',name='下一页',exact=True).click();ready(page)
    assert 'page=3' in page.url
    page.go_back();ready(page);assert page.locator('#chapter-page').get_attribute('data-page')=='2'
    page.go_forward();ready(page);assert page.locator('#chapter-page').get_attribute('data-page')=='3'
    page.reload();ready(page);assert page.locator('#chapter-page').get_attribute('data-page')=='3'
    page.locator('.page-jump input').fill('18');page.get_by_role('button',name='前往',exact=True).click();ready(page)
    assert page.locator('#chapter-page>.panel').count()==2
    assert page.get_by_role('button',name='下一页',exact=True).is_disabled()
    page.locator('[data-filter="技术"]').click();ready(page)
    assert page.locator('#chapter-page').get_attribute('data-page')=='1'
    assert 'page=' not in page.url and 'category=' in page.url
    # Search must include entries beyond the current page and category.
    page.get_by_role('button',name='打开搜索').click();page.locator('#search-input').fill('排版样稿 104')
    assert page.locator('#search-results a').count()==1
    page.locator('#search-results a').click();page.wait_for_selector('#article-title')
    assert '排版样稿 104' in page.locator('#article-title').inner_text()
    assert '正文复用栏目示例' in page.locator('.colophon').inner_text()
    page.locator('.back-link').click();ready(page)
    assert 'category=' in page.url and 'demo=1' in page.url
    visit(page,1,390)
    page.get_by_role('button',name='退出百篇演示').click();ready(page)
    assert page.locator('#chapter-page>.panel').count()==4
    assert '共 4 篇' in page.locator('#page-status').inner_text()
    # Reduced motion has no active page animations; motion-enabled transitions don't overlap generations.
    assert page.locator('#chapter-page').evaluate('(e)=>e.getAnimations({subtree:true}).length')==0
    page.emulate_media(reduced_motion='no-preference')
    page.get_by_role('button',name='体验百篇分页').click();ready(page)
    page.evaluate('''() => {
      const next=document.querySelector('.pagination [data-delta="1"]');
      next.click();next.click();next.click();
    }''');ready(page)
    assert page.locator('#chapter-page').get_attribute('data-page')=='4','Rapid clicks lost latest intent'
    assert page.locator('#chapter-page>.panel').count()==6
    verify(page,'rapid-clicks')
    page.get_by_role('button',name='下一页',exact=True).click()
    for delay in [20,60,90,160]:
        page.wait_for_timeout(delay)
        assert page.locator('#chapter-page>.panel').count()==6
        verify(page,'in-flight transition')
    ready(page)
    # Interrupt an animation with history, then finish with a stable non-busy page.
    page.get_by_role('button',name='下一页',exact=True).click()
    page.go_back();ready(page)
    assert page.locator('#chapter-page').get_attribute('data-page')=='4'
    assert page.locator('#chapter-page').evaluate('(e)=>!e.inert && e.getAnimations({subtree:true}).length===0')
    assert not errors,errors
    browser.close()
print('PASS: 104 unique articles, 18 pages, six templates across four screen sizes, partial last pages, category pagination, search across pages, sample detail, URL/history/reload/jump, rapid input, interrupted animations and reduced motion.')
