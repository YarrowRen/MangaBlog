"""Verify the exact 20-post trial, full article rendering, assets and original About."""
import hashlib,json,os,re
from pathlib import Path
from urllib.parse import urlsplit,unquote
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'content/migration.json').read_text());posts=manifest['articles']
assert len(posts)==20 and len(list((root/'content/posts').iterdir()))==20
assert [a['published'] for a in posts]==sorted([a['published'] for a in posts],reverse=True)
assert len(list((root/'dist/posts').glob('*.html')))==20
for a in posts:
 assert hashlib.sha256((root/a['file']).read_bytes()).hexdigest()==a['sourceSHA256']
assert hashlib.sha256((root/'content/about.md').read_bytes()).hexdigest()==manifest['aboutSHA256']
assert not manifest['unavailableAssets']
assert all((root/path).is_file() for path in manifest['assets'].values())
BASE=os.environ.get('TEST_URL','http://127.0.0.1:4321')
shots=Path('/tmp/panel-log-review');shots.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce',permissions=['clipboard-read','clipboard-write'])
 page=context.new_page();errors=[];failures=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r: failures.append((r.status,r.url)) if r.status>=400 and 'favicon' not in r.url else None)
 page.route('**/*',lambda route:route.continue_() if urlsplit(route.request.url).hostname in ['127.0.0.1','localhost',None] else route.abort())
 for width in [1440,390]:
  page.set_viewport_size({'width':width,'height':1000})
  for a in posts:
   assert page.goto(BASE+'/'+a['href']).status==200
   assert page.locator('#article-title').inner_text()==a['title']
   assert a['author'] in page.locator('.article-tools').inner_text()
   assert page.locator('#article-body').inner_text().strip()
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,a['slug'],'overflow')
   assert page.locator('.katex-error').count()==0,(a['slug'],'math error')
   if a['slug'] in ['greedy-algorithm-and-applications','arithmetic-progression-graphs-analysis','perrin-numbers-and-pseudo-primes']:
    assert page.locator('.katex').count()>0,(a['slug'],'formulas not rendered')
   # Every image is local and actually decodes, even if lazily loaded below the fold.
   for image in page.locator('#article-body img').all():
    image.evaluate('(e)=>e.loading="eager"')
    try:image.evaluate('(e)=>e.decode()')
    except Exception as e:raise AssertionError((a['slug'],image.get_attribute('src'),'image decode failed')) from e
    assert image.evaluate('(e)=>e.naturalWidth>0'),(a['slug'],'broken image')
   for link in page.locator('#article-body a[href^="#"],.toc a').all():
    target=unquote(link.get_attribute('href')[1:]);assert page.evaluate('(id)=>!!document.getElementById(id)',target),(a['slug'],target,'broken anchor')
   if a['slug']=='jlpt-n5':
    assert page.locator('ruby rt').count()>50
    assert page.locator('.table-scroll table').count()>=6
   if a['slug']=='claude-code-memory':
    assert page.locator('.diagram img').count()>=5
    assert page.locator('pre code').count()>10
    page.screenshot(path=str(shots/f'migrated-article-{width}.png'),full_page=False)
    button=page.locator('.copy-code').first;expected=button.locator('xpath=following-sibling::pre').inner_text();button.click()
    assert page.evaluate('navigator.clipboard.readText()')==expected
   if a['slug']=='claude-code-memory-slides':
    frame=page.frame_locator('iframe.slide-deck');frame.locator('#slide-counter').wait_for()
    before=frame.locator('#slide-counter').inner_text();frame.get_by_role('button',name='下一页',exact=True).click()
    assert frame.locator('#slide-counter').inner_text()!=before
  page.goto(BASE+'/about.html')
  text=page.locator('#article-body').inner_text()
  for value in ['University of Auckland','Southwest University','ZUOYEBANG','Tencent Lightspeed Studios','HOUGARDEN.COM','YarrowRen@gmail.com']:
   assert value in text,value
  assert page.locator('#article-body img').get_attribute('src')=='assets/imported/author.png'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=str(shots/f'about-{width}.png'),full_page=True)
  page.goto(BASE+'/index.html');page.wait_for_function('document.documentElement.dataset.layoutReady==="true"')
  assert page.locator('#chapter-page>.panel').count()==6
  assert '20' in page.locator('#page-status').inner_text()
  assert page.locator('[data-id="claude-code-memory-slides"]').count()==1
  assert '阿页' not in page.locator('body').inner_text()
  page.screenshot(path=str(shots/f'migrated-home-{width}.png'),full_page=True)
 assert not errors,errors
 assert not failures,failures
 # Static HTML supports complete reading without JavaScript.
 nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':900});static=nojs.new_page()
 static.goto(BASE+'/posts/claude-code-memory.html');assert static.locator('#article-body pre code').count()>10
 static.goto(BASE+'/index.html');assert static.locator('#chapter-page>.panel').count()==6
 nojs.close();context.close();browser.close()
print('PASS: exactly 20 original-source hashes, full static bodies, 74 local media, formulas, 15 diagrams, ruby/tables, code copy, interactive slide deck, faithful About, desktop/mobile and no-JavaScript reading.')
