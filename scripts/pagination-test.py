"""Real 20-post trial pagination, history, search and transition safety."""
import json,os,runpy
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
verify=runpy.run_path(str(Path(__file__).with_name('layout-test.py')))['verify']
posts=json.loads((root/'content/migration.json').read_text())['articles']
BASE=os.environ.get('TEST_URL','http://127.0.0.1:4321')
def ready(page):page.wait_for_function('document.documentElement.dataset.layoutReady==="true" && document.querySelector("#chapter-page").getAttribute("aria-busy")==="false"')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for width in [320,390,768,1440]:
  page.set_viewport_size({'width':width,'height':900});seen=[]
  for n in range(1,5):
   page.goto(BASE+f'/index.html?page={n}');ready(page)
   ids=page.locator('#chapter-page>.panel').evaluate_all('(cs)=>cs.map(c=>c.dataset.id)')
   assert ids==[a['id'] for a in posts[(n-1)*6:n*6]]
   seen+=ids;verify(page,f'real-trial/{width}/{n}')
  assert len(seen)==len(set(seen))==20
 for category,total in [('AI',6),('工程',5),('算法',7),('兴趣',2)]:
  page.goto(BASE+f'/index.html?category={category}&page=999');ready(page)
  expected=(total-1)%6+1
  assert page.locator('#chapter-page>.panel').count()==expected
  assert set(page.locator('#chapter-page>.panel').evaluate_all('(cs)=>cs.map(c=>c.dataset.category)'))=={category}
  verify(page,f'category/{category}')
 page.goto(BASE+'/index.html');ready(page)
 page.get_by_role('button',name='下一页',exact=True).click();ready(page);assert 'page=2' in page.url
 page.get_by_role('button',name='下一页',exact=True).click();ready(page);assert 'page=3' in page.url
 page.go_back();ready(page);assert page.locator('#chapter-page').get_attribute('data-page')=='2'
 page.go_forward();ready(page);assert page.locator('#chapter-page').get_attribute('data-page')=='3'
 page.reload();ready(page);assert page.locator('#chapter-page').get_attribute('data-page')=='3'
 page.locator('.page-jump input').fill('4');page.get_by_role('button',name='前往',exact=True).click();ready(page)
 assert page.locator('#chapter-page>.panel').count()==2
 assert page.get_by_role('button',name='下一页',exact=True).is_disabled()
 page.locator('[data-filter="算法"]').click();ready(page)
 assert page.locator('#chapter-page').get_attribute('data-page')=='1'
 page.get_by_role('button',name='下一页',exact=True).click();ready(page)
 page.get_by_role('button',name='打开搜索').click();page.locator('#search-input').fill('JLPT')
 assert page.locator('#search-results a').count()==1
 page.locator('#search-results a').click();page.wait_for_selector('#article-title')
 assert 'JLPT-N5' in page.locator('#article-title').inner_text()
 page.locator('.back-link').click();ready(page)
 assert page.locator('#chapter-page').get_attribute('data-page')=='2' and 'category=' in page.url
 page.goto(BASE+'/index.html');ready(page);page.emulate_media(reduced_motion='no-preference')
 page.evaluate('''()=>{const next=document.querySelector('[data-delta="1"]');next.click();next.click();}''');ready(page)
 assert page.locator('#chapter-page').get_attribute('data-page')=='3'
 page.get_by_role('button',name='下一页',exact=True).click()
 for delay in [20,60,100,150]:
  page.wait_for_timeout(delay)
  assert page.locator('#chapter-page>.panel').count() in [2,6]
  verify(page,'in-flight transition')
 ready(page)
 page.get_by_role('button',name='上一页',exact=True).click();page.go_back();ready(page)
 assert page.locator('#chapter-page').get_attribute('data-page')=='3'
 assert page.locator('#chapter-page').evaluate('(e)=>!e.inert && e.getAnimations({subtree:true}).length===0')
 assert not errors,errors
 b.close()
print('PASS: 20 real articles, 4 pages with no duplicates/omissions, categories, four widths, cross-page/tag search, history, reload, jump, return context, rapid clicks and transition geometry.')
