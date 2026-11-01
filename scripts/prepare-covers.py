"""Encode generated PNGs as WebP without resizing, cropping or changing aspect ratio."""
import json
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent.parent
source=root/'docs/artwork/covers';target=root/'assets/covers';target.mkdir(exist_ok=True)
text=(root/'content/covers.js').read_text();covers=json.loads(text.split('=',1)[1].strip().removesuffix(';'))
for slug,cover in covers.items():
 image=Image.open(source/(slug+'.png'))
 image.save(root/cover['src'],format='WEBP',quality=93,method=6)
 cover['width'],cover['height']=image.size
 print(slug,image.size,(root/cover['src']).stat().st_size)
(root/'content/covers.js').write_text('export const articleCovers = '+json.dumps(covers,ensure_ascii=False,indent=2)+';\n')
