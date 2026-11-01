"""Render only Mermaid blocks from the imported 20 posts; no external renderer/CDN."""
import hashlib,json,re
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'content/migration.json').read_text())
blocks={}
for article in manifest['articles']:
 for block in re.findall(r'^```mermaid\s*\n(.*?)^```\s*$',(root/article['file']).read_text(),re.S|re.M):
  code=block.strip();digest=hashlib.sha256(code.encode()).hexdigest()[:16];blocks[digest]=code
out=root/'assets/imported/diagrams';out.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1400,'height':1000})
 page.set_content('<!doctype html><html><meta charset="utf-8"><body></body></html>')
 page.add_script_tag(path=str(root/'assets/imported/slides/mermaid.min.js'))
 page.evaluate("mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'neutral',flowchart:{htmlLabels:false},fontFamily:'sans-serif'})")
 for n,(digest,code) in enumerate(blocks.items()):
  svg=page.evaluate('''async ({id,code})=> (await mermaid.render('diagram'+id,code)).svg''',{'id':n,'code':code})
  (out/(digest+'.svg')).write_text(svg)
 browser.close()
(root/'content/diagrams.json').write_text(json.dumps({code:'assets/imported/diagrams/'+digest+'.svg' for digest,code in blocks.items()},ensure_ascii=False,indent=2))
print('Rendered',len(blocks),'Mermaid diagrams.')
