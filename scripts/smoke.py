"""Browser smoke checks against a running local static server."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
base = os.environ.get('TEST_URL', 'http://127.0.0.1:4321')
shots = Path('/tmp/panel-log-review')
shots.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1440,'height':1000}, device_scale_factor=1)
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    for width in [1440,768,390,320]:
        page.set_viewport_size({'width':width,'height':900})
        assert page.goto(base+'/index.html').status == 200
        page.wait_for_function('document.fonts.status === "loaded"')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Overflow at {width}'
        if width <= 700:
            for card in page.locator('.article-card,.quote-card').all():
                assert card.bounding_box()['width'] >= width - 50, 'Mobile panel unexpectedly narrow'
        # The clipped-away corner must not remain part of the article link.
        page.locator('.cover-main').scroll_into_view_if_needed()
        assert page.locator('.cover-main').evaluate("""el => {
          const r = el.getBoundingClientRect();
          const hit = document.elementFromPoint(r.right - 2, r.bottom - 2);
          return hit !== null && !el.contains(hit);
        }"""), 'Clipped corner captures clicks'
        if width in [1440,390]: page.screenshot(path=str(shots/f'home-{width}.png'),full_page=True,animations='disabled')
        page.get_by_role('button', name='技术手记',exact=True).click()
        assert page.locator('.article-card:visible,.quote-card:visible').count()==1
        page.locator('[data-filter="all"]').click()
        assert page.locator('.article-card:visible,.quote-card:visible').count()==4
        page.get_by_role('button',name='打开搜索').click()
        page.locator('#search-input').fill('代码')
        assert page.locator('#search-results a').count()==1
        page.locator('#search-input').fill('不存在的关键词')
        assert '没有找到' in page.locator('#search-results').inner_text()
        page.get_by_role('button',name='关闭搜索').click()
        page.locator('dialog').wait_for(state='hidden')
        page.goto(base+'/article.html')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Article overflow {width}'
        assert page.locator('.prose h2').count()==4
        if width in [1440,390]: page.screenshot(path=str(shots/f'article-{width}.png'),full_page=True,animations='disabled')
        page.get_by_role('button',name='切换阅读模式').click()
        assert not page.locator('.article-banner').is_visible()
        assert page.get_by_role('button',name='退出阅读模式').get_attribute('aria-pressed')=='true'
        page.get_by_role('button',name='退出阅读模式').click()
    for key,title in [('code','写代码'),('walk','在城市'),('blank','空白页')]:
        page.goto(base+f'/article.html?chapter={key}')
        assert title in page.locator('h1').inner_text()
        assert page.locator('.prose p').count()==4
    response=page.request.get(base+'/assets/manga-sheet.webp')
    assert response.status==200 and len(response.body())>10000, 'Artwork missing'
    page.emulate_media(reduced_motion='reduce')
    page.goto(base+'/index.html')
    assert page.locator('.cover-grid').evaluate('(el)=>getComputedStyle(el).animationName')=='none'
    assert not errors, errors
    browser.close()
print('PASS: 4 viewport sizes, filters, search, reader mode, 4 articles, artwork and reduced motion. Screenshots:',shots)
