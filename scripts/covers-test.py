"""Check six unique cover assets and proportional image fitting in real panels."""
import json,os,runpy
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
verify=runpy.run_path(str(Path(__file__).with_name('layout-test.py')))['verify']
covers=json.loads((root/'content/covers.js').read_text().split('=',1)[1].strip().removesuffix(';'))
posts=json.loads((root/'content/migration.json').read_text())['articles'][:6]
assert set(covers)=={a['slug'] for a in posts}
assert len({c['src'] for c in covers.values()})==6
for slug,c in covers.items():
 with Image.open(root/c['src']) as im:assert im.size==(c['width'],c['height'])
 with Image.open(root/'docs/artwork/covers'/f'{slug}.png') as im:assert im.size==(c['width'],c['height']), 'Encoding changed dimensions'
BASE=os.environ.get('TEST_URL','http://127.0.0.1:4321')
shots=Path('/tmp/panel-log-review');shots.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for w in [320,390,768,1024,1440,1920]:
  page.set_viewport_size({'width':w,'height':1000});page.goto(BASE+'/index.html')
  page.wait_for_function('document.documentElement.dataset.layoutReady==="true"')
  assert page.locator('#chapter-page>.panel>.cover-art>.card-cover').count()==6
  for image in page.locator('.card-cover').all():
   image.evaluate('(e)=>e.loading="eager"');image.evaluate('(e)=>e.decode()')
   state=image.evaluate('''e=>{const s=getComputedStyle(e);return {fit:s.objectFit,transform:s.transform,filter:s.filter,w:e.naturalWidth,h:e.naturalHeight,declaredW:Number(e.getAttribute('width')),declaredH:Number(e.getAttribute('height'))}}''')
   assert state['fit'] in ['cover','contain'] and state['transform']=='none',state
   assert 'grayscale(1)' in state['filter'],state
   assert (state['w'],state['h'])==(state['declaredW'],state['declaredH'])
  for panel in page.locator('#chapter-page>.panel').all():
   reserve=panel.evaluate("p=>{const image=p.querySelector('.card-cover').getBoundingClientRect(),copy=p.querySelector('.card-copy').getBoundingClientRect();return copy.top-image.bottom}")
   assert reserve>=11.5,('Caption obscures illustration',w,reserve)
  verify(page,f'cover panels/{w}')
  if w in [1440,390]:page.screenshot(path=str(shots/f'covers-home-{w}.png'),full_page=True,animations='disabled')
  # Sprite backgrounds elsewhere also use a single scale for both source axes.
  page.goto(BASE+'/index.html?page=2');page.wait_for_function('document.documentElement.dataset.layoutReady==="true"')
  for art in page.locator('.computed-layout .panel>.art').all():
   fit=art.evaluate('''e=>{const s=getComputedStyle(e),b=e.getBoundingClientRect();return {size:s.backgroundSize.split(' ').map(parseFloat),pos:s.backgroundPosition.split(' ').map(parseFloat),w:b.width,h:b.height,col:e.classList.contains('portrait')||e.classList.contains('desk')?1:0,row:e.classList.contains('street')||e.classList.contains('desk')?1:0}}''')
   sx,sy=fit['size'][0]/1536,fit['size'][1]/1024
   assert abs(sx-sy)<.00001,('Sprite stretched',fit)
   x=fit['pos'][0]+fit['col']*768*sx;y=fit['pos'][1]+fit['row']*512*sy
   assert x<=1 and y<=1 and x+768*sx>=fit['w']-1 and y+512*sy>=fit['h']-1,('Wrong atlas tile visible',fit)
 for a in posts:
  page.goto(BASE+'/'+a['href'])
  image=page.locator('.article-cover-panel img');image.evaluate('(e)=>e.decode()')
  dims=image.evaluate('(e)=>{const b=e.getBoundingClientRect();return [b.width,b.height,e.naturalWidth,e.naturalHeight]}')
  assert abs(dims[0]/dims[1]-dims[2]/dims[3])<.001,('Reader cover distorted',a['slug'])
  page.get_by_role('button',name='切换阅读模式').click()
  assert not page.locator('.article-cover-panel').is_visible()
 page.set_viewport_size({'width':1600,'height':1400});page.goto(BASE+'/covers.html')
 for image in page.locator('.cover-gallery img').all():image.evaluate('(e)=>e.decode()')
 assert page.locator('.cover-gallery img').count()==6
 page.screenshot(path=str(shots/'covers-gallery.png'),full_page=True)
 assert not errors,errors
 b.close()
print('PASS: six individual originals/WebPs, natural aspect ratios, six viewports, safe panel geometry, uniform atlas scaling, reader covers and reading mode.')
