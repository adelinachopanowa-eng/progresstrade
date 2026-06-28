#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Единен източник за хедъра и футъра.

Редактирай само:  partials/header.html  и  partials/footer.html
После пусни:       python3 build/apply-partials.py

Скриптът инжектира двата партиала във всички .html страници (началната,
блога и вътрешните страници), така че навигацията и футърът се поддържат
на едно място вместо в ~15 файла.
"""
import re, glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
header = open(os.path.join(ROOT, "partials/header.html"), encoding="utf-8").read().strip()
footer = open(os.path.join(ROOT, "partials/footer.html"), encoding="utf-8").read().strip()

pages = [p for p in glob.glob(os.path.join(ROOT, "**/*.html"), recursive=True)
         if "/project/" not in p and "/partials/" not in p and "/build/" not in p]

n = 0
for p in pages:
    h = open(p, encoding="utf-8").read()
    o = h
    if "<header>" in h and "</header>" in h:
        h = re.sub(r"<header>.*?</header>", lambda m: header, h, count=1, flags=re.S)
    if '<footer class="footer">' in h:
        h = re.sub(r'<footer class="footer">.*?</html>', lambda m: footer, h, count=1, flags=re.S)
    if h != o:
        open(p, "w", encoding="utf-8").write(h); n += 1

print(f"Обновени страници: {n}/{len(pages)}")
