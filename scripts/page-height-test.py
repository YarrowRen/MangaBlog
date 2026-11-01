"""Shared desktop page height, safe text and desktop/mobile diagram regressions."""
import os,runpy
from pathlib import Path
from playwright.sync_api import sync_playwright
verify=runpy.run_path(str(Path(__file__).with_name('layout-test.py')))['verify']
BASE=os.environ.get('TEST_URL','http://127.0.0.1:4321')
SHOTS=Path('/tmp/panel-log-review');SHOTS.mkdir(exist_ok=True)
def ready(page):
 page.wait_for_function('document.documentElement.dataset.layoutReady === "true" && document.querySelector("#chapter-page").getAttribute("aria-busy")==="false"')
def dimensions(page):
 return page.locator('#chapter-page').evaluate('(e)=>({height:e.getBoundingClientRect().height,pager:document.querySelector(".pagination").getBoundingClientRect().top-e.getBoundingClientRect().top})')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for width in [768,1024,1440,1920]:
  page.set_viewport_size({'width':width,'height':900});page.goto(BASE+'/index.html?trial=1')
  ready(page);expected=dimensions(page)
  for n in range(1,5):
   actual=dimensions(page)
   assert abs(actual['height']-expected['height'])<.1,(width,n,actual,expected)
   assert abs(actual['pager']-expected['pager'])<.1,(width,n,'pagination jumped')
   verify(page,f'fixed-height/{width}/{n}')
   if width==1440 and n==2:page.screenshot(path=str(SHOTS/'pagination-1440.png'),full_page=True,animations='disabled')
   if n<4:page.get_by_role('button',name='下一页',exact=True).click();ready(page)
  page.reload();ready(page)
  assert abs(dimensions(page)['height']-expected['height'])<.1,(width,'reload changes height')
  for category in ['AI','工程','算法','兴趣','all']:
   page.locator(f'[data-filter="{category}"]').click();ready(page)
   assert abs(dimensions(page)['height']-expected['height'])<.1,(width,category,'filter changes height')
 # Global font changes are preflighted across the entire catalogue, not one page at a time.
 page.set_viewport_size({'width':1440,'height':900});page.goto(BASE+'/index.html?trial=1');ready(page)
 page.add_style_tag(content='.computed-layout h3,.computed-layout p{font-size:150% !important}')
 page.wait_for_timeout(250);large=dimensions(page)
 for n in range(1,5):
  assert abs(dimensions(page)['height']-large['height'])<.1,('font change',n)
  verify(page,f'fixed-large-text/{n}')
  if n<4:page.get_by_role('button',name='下一页',exact=True).click();ready(page)
 # Mobile keeps content-driven vertical flow rather than an oversized fixed desktop canvas.
 page.set_viewport_size({'width':390,'height':900});page.goto(BASE+'/index.html?trial=1&page=4');ready(page)
 assert page.locator('#chapter-page').get_attribute('data-fixed-height') is None
 verify(page,'mobile-short-last-page')
 # The diagram generator must compute at real device widths before scaling thumbnails.
 for file,mode,width in [('page-templates.svg','desktop','1224'),('page-templates-mobile.svg','mobile','350')]:
  page.goto(BASE+'/docs/review/'+file)
  assert page.locator(f'g[data-mode="{mode}"][data-layout-width="{width}"]').count()==6
 page.set_viewport_size({'width':1040,'height':1000});page.goto(BASE+'/docs/review/page-templates-comparison.svg')
 assert page.locator('g[data-mode="desktop"]').count()==6
 assert page.locator('g[data-mode="mobile"]').count()==6
 page.goto(BASE+'/docs/review/templates.html')
 page.set_content(f'<html><body style="margin:0"><img src="{BASE}/docs/review/page-templates-comparison.svg" width="1040" height="1000"></body></html>')
 page.locator('img').evaluate('(e)=>e.decode()')
 page.screenshot(path=str(SHOTS/'page-templates-comparison.png'),full_page=True)
 page.set_viewport_size({'width':950,'height':1260});page.goto(BASE+'/docs/review/page-templates.svg')
 page.goto(BASE+'/docs/review/templates.html')
 page.set_content(f'<html><body style="margin:0"><img src="{BASE}/docs/review/page-templates.svg" width="950" height="1260"></body></html>')
 page.locator('img').evaluate('(e)=>e.decode()')
 page.screenshot(path=str(SHOTS/'page-templates.png'),full_page=True)
 assert not errors,errors
 browser.close()
print('PASS: 4 real-content desktop pages at four widths share equal canvas/pager height, including partial last pages, categories, reload and larger text; mobile stays adaptive; regenerated diagrams explicitly cover both breakpoints.')
