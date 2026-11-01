"""Independent geometry checks against real rendered browser coordinates."""
import itertools, math, os
from playwright.sync_api import sync_playwright
BASE=os.environ.get('TEST_URL','http://127.0.0.1:4321')
def cross(a,b,p): return (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])
def inside(p,poly): return all(cross(a,b,p)>=-0.6 for a,b in zip(poly,poly[1:]+poly[:1]))
def distance(p,a,b):
    dx,dy=b[0]-a[0],b[1]-a[1]
    t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)))
    return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
def separated(a,b):
    # Separating axis theorem is independent of the production clipping code.
    for poly in [a,b]:
        for p,q in zip(poly,poly[1:]+poly[:1]):
            nx,ny=-(q[1]-p[1]),q[0]-p[0]
            aa=[x*nx+y*ny for x,y in a];bb=[x*nx+y*ny for x,y in b]
            if max(aa)<=min(bb) or max(bb)<=min(aa):return True
    return False
def verify(page,label):
    data=page.evaluate('''() => [...document.querySelectorAll('.computed-layout')].map(root=> {
      const base=root.getBoundingClientRect();
      return [...root.querySelectorAll('.panel')].filter(p=>!p.hidden).map(p=>({
        name:p.className,poly:JSON.parse(p.dataset.polygon),
        items:[...p.querySelectorAll('.card-copy,.cover-caption,.panel-content,.image-label,.panel-index,.mini-speech')].map(e=>{
          const b=e.getBoundingClientRect();return {name:e.className,x:b.x-base.x,y:b.y-base.y,w:b.width,h:b.height,overflow:e.scrollWidth>e.clientWidth+1};
        })
      }));
    })''')
    for group in data:
        for p in group:
            for item in p['items']:
                x,y,w,h=[item[k] for k in ['x','y','w','h']]
                assert all(inside(c,p['poly']) for c in [(x,y),(x+w,y),(x+w,y+h),(x,y+h)]),(label,p['name'],item,'outside')
                assert not item['overflow'],(label,item,'text overflow')
            for a,b in itertools.combinations(p['items'],2):
                overlap=min(a['x']+a['w'],b['x']+b['w'])-max(a['x'],b['x'])>1 and min(a['y']+a['h'],b['y']+b['h'])-max(a['y'],b['y'])>1
                assert not overlap,(label,a,b,'captions overlap')
        for a,b in itertools.combinations(group,2):
            assert separated(a['poly'],b['poly']),(label,'panels collide')
            distances=[distance(p,u,v) for p in a['poly'] for u,v in zip(b['poly'],b['poly'][1:]+b['poly'][:1])]
            distances += [distance(p,u,v) for p in b['poly'] for u,v in zip(a['poly'],a['poly'][1:]+a['poly'][:1])]
            assert min(distances)>=11.8,(label,'gutter too narrow',min(distances))
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(label,'page overflow')
if __name__ == '__main__':
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        page=browser.new_page(reduced_motion='reduce')
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        widths=[280,320,360,390,419,420,459,460,600,619,620,659,660,699,700,701,768,820,1024,1050,1051,1280,1440,1920,2560]
        for w in widths:
            page.set_viewport_size({'width':w,'height':900});page.goto(BASE+'/index.html')
            page.wait_for_function('document.documentElement.dataset.layoutReady === "true"')
            verify(page,f'width={w}')
        for seed in ['daily-issue-1','daily-issue-2','quiet-street','studio-night','seed-999']:
            page.evaluate('(s)=>document.querySelector(".manga-spread").dataset.layoutSeed=s',seed)
            page.wait_for_timeout(80)
            verify(page,f'seed={seed}')
        # Live resizing of the same DOM, filtering, and mutation-driven growth.
        for w in [320,660,1440,390]:
            page.set_viewport_size({'width':w,'height':800});page.wait_for_timeout(80)
            for category in ['AI','工程','all']:
                page.locator(f'[data-filter="{category}"]').click();page.wait_for_timeout(80)
                verify(page,f'live={w},filter={category}')
        page.evaluate('''() => {
          document.querySelectorAll('.card-copy h3,.cover-caption h2').forEach(e=>e.textContent='这是一个需要完整显示并且不能被斜边裁切的很长的文章标题'.repeat(4));
          document.querySelectorAll('.card-copy p').forEach(e=>e.textContent='AReallyLongUnbrokenEnglishTokenWithoutSpaces'.repeat(8)+'这段摘要应该让画格自然增高，而不是缩成难读的小字。'.repeat(6));
        }''')
        for w in [320,390,768,1440]:
            page.set_viewport_size({'width':w,'height':900});page.wait_for_timeout(150)
            verify(page,f'long-content={w}')
        page.add_style_tag(content='.computed-layout h2,.computed-layout h3,.computed-layout p,.computed-layout .eyebrow,.computed-layout .meta,.computed-layout .card-bottom{font-size:200% !important}')
        # A font change can be user-driven without a viewport resize.
        page.wait_for_timeout(250)
        verify(page,'200% text')
        assert not errors,errors
        browser.close()
    print(f'PASS: {len(widths)} viewport widths, live resize/filtering, long Chinese titles, unbroken English summaries, 200% text, polygon separation, >=12px gutters and caption containment.')
