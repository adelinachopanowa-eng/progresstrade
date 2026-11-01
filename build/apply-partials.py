#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Единен източник за хедъра и футъра.

Редактирай само:  partials/header.html     и  partials/footer.html      (български)
                  partials/header-en.html  и  partials/footer-en.html   (английски)
После пусни:      python3 build/apply-partials.py

Скриптът инжектира двата партиала във всички .html страници (началната,
блога и вътрешните страници), така че навигацията и футърът се поддържат
на едно място вместо в ~15 файла.

Страниците под /en/ получават английските партиали. Всички останали —
българските. Разделението е по пътя на файла, не по съдържанието му.
"""
import re, glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def chete(ime):
    return open(os.path.join(ROOT, "partials", ime), encoding="utf-8").read().strip()


PARTIALI = {
    "bg": (chete("header.html"), chete("footer.html")),
    "en": (chete("header-en.html"), chete("footer-en.html")),
}

pages = [p for p in glob.glob(os.path.join(ROOT, "**/*.html"), recursive=True)
         if "/project/" not in p and "/partials/" not in p and "/build/" not in p]


def ezik(path):
    """Езикът на страницата се познава по пътя: /en/... е английска."""
    otn = os.path.relpath(path, ROOT).replace(os.sep, "/")
    return "en" if otn == "en" or otn.startswith("en/") else "bg"


n = 0
broyach = {"bg": 0, "en": 0}
for p in pages:
    header, footer = PARTIALI[ezik(p)]
    h = open(p, encoding="utf-8").read()
    o = h
    if "<header>" in h and "</header>" in h:
        h = re.sub(r"<header>.*?</header>", lambda m: header, h, count=1, flags=re.S)
    if '<footer class="footer">' in h:
        h = re.sub(r'<footer class="footer">.*?</html>', lambda m: footer, h, count=1, flags=re.S)
    if h != o:
        open(p, "w", encoding="utf-8").write(h)
        n += 1
        broyach[ezik(p)] += 1

print(f"Обновени страници: {n}/{len(pages)} "
      f"(български {broyach['bg']}, английски {broyach['en']})")
