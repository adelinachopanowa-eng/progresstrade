#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Съобщава на Bing (и на останалите търсачки с IndexNow) кои страници са
се променили, за да ги обходят веднага, а не след дни. ChatGPT и Copilot
ползват и индекса на Bing, затова това ускорява и AI търсенето.

Ключът е файлът <ключ>.txt в корена на сайта; той трябва да е качен.
Употреба:
  python3 build/indexnow.py <git-ref>          # страниците, променени след ref
  python3 build/indexnow.py --url /адрес/ ...  # конкретни адреси
Пуска се автоматично от .github/workflows/indexnow.yml след всяко
сливане в main.
"""
import glob, json, os, re, subprocess, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://progresstrade.bg"
os.chdir(ROOT)

keys = [f for f in glob.glob("*.txt") if re.fullmatch(r"[0-9a-f]{32}\.txt", f)]
if len(keys) != 1:
    sys.exit("Няма точно един файл-ключ <32 hex>.txt в корена.")
KEY = keys[0][:-4]

sitemap = set(re.findall(r"<loc>([^<]+)</loc>", open("sitemap.xml", encoding="utf-8").read()))

def url_of(path):
    if path == "index.html":
        return SITE + "/"
    if path.endswith("/index.html"):
        return SITE + "/" + path[: -len("index.html")]
    return SITE + "/" + path

if len(sys.argv) > 1 and sys.argv[1] == "--url":
    urls = [SITE + u if u.startswith("/") else u for u in sys.argv[2:]]
else:
    ref = sys.argv[1] if len(sys.argv) > 1 else "HEAD~1"
    changed = subprocess.run(["git", "diff", "--name-only", ref, "HEAD", "--", "*.html", "llms.txt"],
                             capture_output=True, text=True, check=True).stdout.split()
    urls = sorted({url_of(p) for p in changed if p.endswith(".html")} & sitemap)
    # ако се е сменил footer-ът, всички страници са променени — IndexNow приема до 10 000

if not urls:
    print("Няма променени страници от картата на сайта.")
    sys.exit(0)

body = json.dumps({"host": "progresstrade.bg", "key": KEY,
                   "keyLocation": f"{SITE}/{KEY}.txt", "urlList": urls}).encode()
req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body,
                             headers={"Content-Type": "application/json; charset=utf-8"})
with urllib.request.urlopen(req, timeout=30) as r:
    print(f"IndexNow: {r.status} за {len(urls)} адреса")
