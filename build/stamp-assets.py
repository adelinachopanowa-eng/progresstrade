#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Слага версия на CSS и JS според съдържанието им.

Браузърът кешира /css/site.min.css и /js/main.min.js. Без версия в адреса
повторно посещаващите не виждат промените, докато кешът им не изтече.
Числото се сменя само когато файлът наистина се е променил, така че
кешът не се хвърля напразно.

Пуска се от build.sh след минификацията.
"""
import hashlib
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ASSETS = [
    ("/css/site.min.css", "css/site.min.css"),
    ("/js/main.min.js", "js/main.min.js"),
]


def digest(path):
    with open(os.path.join(ROOT, path), "rb") as fh:
        return hashlib.md5(fh.read()).hexdigest()[:8]


def main():
    stamps = {url: digest(p) for url, p in ASSETS if os.path.exists(os.path.join(ROOT, p))}

    pages = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in (".git", "build", "chats", "images", "fonts")]
        pages += [os.path.join(dirpath, f) for f in filenames if f.endswith(".html")]

    changed = 0
    for page in pages:
        with open(page, encoding="utf-8") as fh:
            before = fh.read()
        after = before
        for url, stamp in stamps.items():
            after = re.sub(
                re.escape(url) + r'(?:\?v=[^"]*)?"',
                url + "?v=" + stamp + '"',
                after,
            )
        if after != before:
            with open(page, "w", encoding="utf-8") as fh:
                fh.write(after)
            changed += 1

    for url, stamp in sorted(stamps.items()):
        print(f"  {url}?v={stamp}")
    print(f"Обновени страници: {changed}/{len(pages)}")


if __name__ == "__main__":
    main()
