#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
llms-full.txt: пълният текст на ключовите страници в един Markdown файл
за AI инструментите, до кратката карта llms.txt. Google не го ползва,
но някои асистенти го четат. Генерира се от самите страници при всяко
изграждане, затова не се редактира на ръка. Пуска се от build.sh.
"""
import html, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SITE = 'https://progresstrade.bg'
PAGES = ['', 'za-nas/', 'izkupuvane-metal/', 'kakvo-izkupuvame/', 'izkupuvane-zhelyazo/',
         'izkupuvane-cvetni-metali/', 'izkupuvane/kabeli/', 'izkupuvane/med/', 'izkupuvane/elektrouredi/',
         'izkupuvane-metal/brakuvane/', 'uslugi/', 'uslugi/demontazh/', 'uslugi/konteyneri/',
         'izkupuvane-ot-adres/', 'izkupuvane-metal/kodove-otpadaci/', 'ceni/', 'rechnik/', 'kontakti/']

def md(body):
    body = re.sub(r'(?s)<script.*?</script>|<style.*?</style>|<svg.*?</svg>|<picture.*?</picture>|<img[^>]*>|<iframe.*?</iframe>|<video.*?</video>', '', body)
    body = re.sub(r'(?s)<nav class="crumb".*?</nav>', '', body)
    body = re.sub(r'(?s)<section class="cta-band.*?</section>', '', body)
    body = re.sub(r'<h2[^>]*>', '\n\n## ', body); body = re.sub(r'<h3[^>]*>', '\n\n### ', body)
    body = re.sub(r'<summary>', '\n\n### ', body)
    body = re.sub(r'<(dt)[^>]*>', '\n- **', body); body = re.sub(r'</dt>', '**: ', body)
    body = re.sub(r'<li[^>]*>', '\n- ', body)
    body = re.sub(r'<t[hd][^>]*>', ' | ', body); body = re.sub(r'<tr[^>]*>', '\n', body)
    body = re.sub(r'<(p|div|section|details|dl|ul|ol|table|figure|figcaption)\b[^>]*>', '\n\n', body)
    body = re.sub(r'<br\s*/?>', '\n', body)
    body = re.sub(r'<[^>]+>', '', body)
    body = html.unescape(body)
    lines = [re.sub(r'[ \t]+', ' ', l).strip() for l in body.split('\n')]
    out, prev = [], ''
    for l in lines:
        if not l and not prev:
            continue
        if re.fullmatch(r'\d{2}', l):
            continue
        out.append(l); prev = l
    return '\n'.join(out).strip()

parts = ['# Прогрестрейд — пълен текст на ключовите страници',
         '',
         '> Пълният текст на основните страници на progresstrade.bg в един файл. Кратката карта на сайта е в https://progresstrade.bg/llms.txt. Файлът се генерира автоматично от страниците.',
         '']
for p in PAGES:
    f = (p or '') + 'index.html'
    if not os.path.exists(f):
        continue
    s = open(f, encoding='utf-8').read()
    title = html.unescape(re.search(r'<title>(.*?)</title>', s).group(1))
    main = s.split('<main', 1)[-1].split('</main>', 1)[0]
    main = main.split('>', 1)[-1]
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', main, re.S)
    main = main.replace(h1.group(0), '', 1) if h1 else main
    parts += ['', '---', '', f'# {title}', '', f'Адрес: {SITE}/{p}', '', md(main), '']
open('llms-full.txt', 'w', encoding='utf-8').write('\n'.join(parts).rstrip() + '\n')
print(f'llms-full.txt: {sum(1 for p in PAGES if os.path.exists((p or "")+"index.html"))} страници, {os.path.getsize("llms-full.txt") // 1024} KB')
