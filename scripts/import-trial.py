"""Import only the newest 20 published posts and About from a local read-only checkout.
Usage: python3 scripts/import-trial.py /path/to/YarrowRen.github.io
"""
import concurrent.futures,datetime,hashlib,json,re,shutil,subprocess,sys,urllib.parse,urllib.request
from pathlib import Path
import yaml
source=Path(sys.argv[1]).resolve(); root=Path(__file__).resolve().parent.parent
posts=source/'src/data/blog'; selected=[]
now=datetime.datetime.now(datetime.timezone.utc)
for p in posts.rglob('*'):
 if p.suffix not in ['.md','.mdx'] or any(part.startswith('_') for part in p.relative_to(posts).parts):continue
 text=p.read_text();meta=yaml.safe_load(text.split('---',2)[1]);published=meta['pubDatetime']
 if published.tzinfo is None:published=published.replace(tzinfo=datetime.timezone.utc)
 if meta.get('draft') or published>now:continue
 selected.append((published,p,meta))
available=len(selected)
selected.sort(key=lambda row:(row[0],str(row[1])),reverse=True);selected=selected[:20]
(root/'content/posts').mkdir(parents=True,exist_ok=True)
(root/'assets/imported').mkdir(parents=True,exist_ok=True)
assets={}; entries=[]
for n,(published,p,meta) in enumerate(selected,1):
 slug=meta.get('slug') or p.stem
 shutil.copy2(p,root/'content/posts'/f'{slug}{p.suffix}')
 text=p.read_text(); body=text.split('---',2)[2]
 image_urls=set(re.findall(r'!\[[^\]]*\]\(([^)\s]+)',body))
 image_urls.update(re.findall(r'<img\b[^>]*?\bsrc=["\']([^"\']+)',body,re.S))
 for u in image_urls:
  if u.startswith('http'):assets[u]=None
  elif u.startswith('/'):
   asset=source/'public'/u.lstrip('/')
   if asset.is_file():
    target='assets/imported/'+hashlib.sha256(u.encode()).hexdigest()[:16]+asset.suffix
    shutil.copy2(asset,root/target);assets[u]=target
 category='AI' if n<=4 or n in [6,8] else '兴趣' if n in [5,7] else '工程' if n<=13 else '算法'
 # Preserve the original URL separately; legacy filenames can differ from frontmatter slugs.
 original_path='/posts/'+('/'.join(part.replace('_','-') for part in p.relative_to(posts).parts[:-1])+'/' if p.parent!=posts else '')+slug+'/'
 entries.append({'id':slug,'chapter':str(n).zfill(3),'slug':slug,'title':meta['title'],'summary':meta['description'],'category':category,'tags':meta.get('tags',[]),'author':meta.get('author','Boyu Ren'),
  'date':published.astimezone(datetime.timezone(datetime.timedelta(hours=8))).date().isoformat(),'published':published.isoformat(),'updated':str(meta.get('modDatetime') or published),
  'minutes':max(1,round(len(re.sub(r'```[\s\S]*?```','',body))/650)), 'art':{'AI':'desk','工程':'studio','算法':'desk','兴趣':'street'}[category],
  'href':f'posts/{slug}.html','source':str(p.relative_to(source)), 'file':f'content/posts/{slug}{p.suffix}', 'sourceSHA256':hashlib.sha256(p.read_bytes()).hexdigest(),'originalURL':'https://yarrow.ren'+original_path,'hideToc':meta.get('hideToc',False)})
# Download only media referenced by these 20 posts. Respect inherited HTTPS proxy and CA trust.
def download(url):
 parsed=urllib.parse.urlsplit(url); ext=Path(parsed.path).suffix.lower()
 if ext not in ['.png','.jpg','.jpeg','.webp','.gif','.svg','.avif']:ext='.bin'
 target='assets/imported/'+hashlib.sha256(url.encode()).hexdigest()[:16]+ext
 safe_url=urllib.parse.urlunsplit((parsed.scheme,parsed.netloc,urllib.parse.quote(urllib.parse.unquote(parsed.path),safe='/&:@'),parsed.query,parsed.fragment))
 try:
  req=urllib.request.Request(safe_url,headers={'User-Agent':'MangaBlog-content-migration/1.0'})
  with urllib.request.urlopen(req,timeout=50) as response:data=response.read()
  if len(data)<32:raise ValueError('empty media')
  (root/target).write_bytes(data);return url,target,None
 except Exception as e:return url,None,str(e)
missing=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
 for url,target,error in pool.map(download,[u for u,p in assets.items() if p is None]):
  if error:missing.append({'url':url,'error':error})
  else:assets[url]=target
shutil.copy2(source/'src/pages/about.md',root/'content/about.md')
shutil.copy2(source/'public/title.png',root/'assets/imported/author.png')
shutil.copytree(source/'public/slides/powerpoint-report',root/'assets/imported/slides',dirs_exist_ok=True)
deck=root/'assets/imported/slides/app.js'
deck_text=deck.read_text()
for entry in entries:deck_text=deck_text.replace('https://yarrow.ren/posts/'+entry['slug']+'/', '../../../'+entry['href'])
deck.write_text(deck_text)
# Keep the slide deck self-contained; only the font CDN is optional in the source.
p=root/'assets/imported/slides/index.html';s=p.read_text();s=re.sub(r'<link[^>]+href="https://fonts[^>]+>','',s);p.write_text(s)
sha=subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()
manifest={'sourceRepository':'https://github.com/YarrowRen/YarrowRen.github.io','sourceCommit':sha,'aboutSHA256':hashlib.sha256((root/'content/about.md').read_bytes()).hexdigest(),'selection':'newest 20 published posts, pubDatetime descending; drafts and future posts excluded','availablePublished':available,'count':len(entries),'articles':entries,'assets':assets,'unavailableAssets':missing}
(root/'content/migration.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(root/'content/catalogue.js').write_text('export const importedArticles = '+json.dumps(entries,ensure_ascii=False,indent=2)+';\n')
print(json.dumps({'posts':len(entries),'downloaded':sum(bool(v) for v in assets.values()),'missing':missing,'sourceCommit':sha},ensure_ascii=False,indent=2))
