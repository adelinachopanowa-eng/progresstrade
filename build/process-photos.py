#!/usr/bin/env python3
"""Обработка на снимки за progresstrade.bg:
EXIF ориентация, лек автоконтраст/цвят/острота, кроп 3:2,
експорт 1600px и 800px в JPG (q82) + WebP (q80) със SEO име.
Употреба: python3 build/process-photos.py вход.jpg изходно-име
"""
import sys
from PIL import Image, ImageOps, ImageEnhance

def process(src, slug, ypos=0.5):
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    w, h = im.size
    tw, th = w, int(w*2/3)
    if th > h:
        th = h; tw = int(h*3/2)
    x, y = (w-tw)//2, max(0, int((h-th)*ypos))
    im = im.crop((x, y, x+tw, y+th))
    im = ImageOps.autocontrast(im, cutoff=0.5)
    im = ImageEnhance.Color(im).enhance(1.06)
    im = ImageEnhance.Sharpness(im).enhance(1.12)
    for wd, suf in [(1600, ""), (800, "-800")]:
        r = im.resize((wd, int(wd*im.height/im.width)), Image.LANCZOS)
        r.save(f"images/{slug}{suf}.jpg", quality=82, optimize=True, progressive=True)
        r.save(f"images/{slug}{suf}.webp", quality=80, method=6)
    print(slug, "готово")

if __name__ == "__main__":
    process(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 0.5)
