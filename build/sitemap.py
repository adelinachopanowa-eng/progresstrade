#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Обновява <lastmod> в sitemap.xml от историята на git.

Датите се въвеждаха на ръка и спряха да отговарят на файловете — Google
ползва lastmod, за да реши кога да преобходи страницата, така че остарели
дати я бавят. Тук датата идва от последния commit по съответния файл; ако
файлът има непубликувани промени в работната директория, се взима днешната.

Редът, priority и changefreq се пазят непокътнати — те са редакторско
решение и не се пипат.

Пуска се от build.sh.
"""
import os
import re
import subprocess
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://progresstrade.bg"


def path_for(loc):
    rel = loc[len(SITE):].lstrip("/")
    if rel == "" or rel.endswith("/"):
        rel += "index.html"
    return rel


STAMP = re.compile(r"\?v=[0-9A-Za-z._-]{1,32}")


def only_asset_stamp(rel):
    """Вярно, ако единствената разлика по файла е версията на CSS/JS.

    build/stamp-assets.py пипа всяка страница, щом стилът се промени. Това
    не е промяна по съдържанието и не бива да вдига lastmod — иначе датите
    пак спират да означават нещо, само че в другата посока.
    """
    diff = subprocess.run(
        ["git", "diff", "--unified=0", "--", rel], cwd=ROOT,
        capture_output=True, text=True,
    ).stdout
    changed = [
        l[1:] for l in diff.splitlines()
        if l[:1] in "+-" and not l.startswith(("+++", "---"))
    ]
    if not changed:
        return False
    return len({STAMP.sub("", l) for l in changed}) == len(changed) // 2


def dirty_files():
    out = subprocess.run(
        ["git", "status", "--porcelain"], cwd=ROOT, capture_output=True, text=True
    ).stdout
    dirty = set()
    for line in out.splitlines():
        if not line.strip():
            continue
        status, rel = line[:2], line[3:].strip()
        if status != "??" and only_asset_stamp(rel):
            continue
        dirty.add(rel)
    return dirty


def last_commit(rel):
    out = subprocess.run(
        ["git", "log", "-1", "--format=%ad", "--date=short", "--", rel],
        cwd=ROOT, capture_output=True, text=True,
    ).stdout.strip()
    return out or None


def main():
    smpath = os.path.join(ROOT, "sitemap.xml")
    with open(smpath, encoding="utf-8") as fh:
        xml = fh.read()

    dirty = dirty_files()
    today = date.today().isoformat()
    updated, missing = 0, []

    def replace(m):
        nonlocal updated
        loc, old = m.group(1), m.group(2)
        rel = path_for(loc)
        if not os.path.exists(os.path.join(ROOT, rel)):
            missing.append(loc)
            return m.group(0)
        new = today if rel in dirty else (last_commit(rel) or old)
        if new != old:
            updated += 1
        return m.group(0).replace(f"<lastmod>{old}</lastmod>", f"<lastmod>{new}</lastmod>")

    xml = re.sub(
        r"<loc>([^<]+)</loc>\s*<lastmod>([\d-]{10})</lastmod>",
        replace, xml,
    )

    with open(smpath, "w", encoding="utf-8") as fh:
        fh.write(xml)

    print(f"sitemap.xml: обновени дати {updated}")
    for loc in missing:
        print(f"  ВНИМАНИЕ: няма файл за {loc}")


if __name__ == "__main__":
    main()
