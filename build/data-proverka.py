#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Видима дата „Проверено на …“ под въпросите на всяка страница.

Източникът е dateModified в схемата WebPage — той се сменя на ръка при
всяка промяна по текста. Скриптът само пренася датата във видимия ред,
за да не се разминават. AI търсачките предпочитат текст с явна дата.
Блогът има свои дати и не се пипа. Пуска се от build.sh.
"""
import glob, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
MES = ['януари','февруари','март','април','май','юни','юли','август','септември','октомври','ноември','декември']
MON = ['January','February','March','April','May','June','July','August','September','October','November','December']
LINE = re.compile(r'\s*<p class="page-checked">.*?</p>', re.S)

def faq_end(s):
    """Индексът след затварящия </div> на .faq-list (вложените div-ове се броят)."""
    i = s.find('<div class="faq-list"')
    if i < 0:
        return -1
    depth, pos = 0, i
    for m in re.finditer(r'<div\b|</div>', s[i:]):
        depth += 1 if m.group(0) == '<div' else -1
        if depth == 0:
            return i + m.end()
    return -1

n = 0
for f in sorted(glob.glob('**/index.html', recursive=True)):
    if f.startswith(('chats/', 'social/', 'partials/', 'build/', 'blog/')):
        continue
    s = open(f, encoding='utf-8').read()
    m = re.search(r'"@type":\s*"WebPage".*?"dateModified":\s*"(\d{4})-(\d{2})-(\d{2})"', s, re.S)
    if not m:
        continue
    y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
    iso = f'{y:04d}-{mo:02d}-{d:02d}'
    if f.startswith('en/'):
        line = f'<p class="page-checked">Last checked on <time datetime="{iso}">{d} {MON[mo-1]} {y}</time>.</p>'
    else:
        line = f'<p class="page-checked">Страницата е проверена на <time datetime="{iso}">{d} {MES[mo-1]} {y} г.</time></p>'
    t = LINE.sub('', s)
    e = faq_end(t)
    if e < 0:
        continue
    t = t[:e] + '\n    ' + line + t[e:]
    if t != s:
        open(f, 'w', encoding='utf-8').write(t); n += 1
print(f'видима дата: обновени {n} страници')
