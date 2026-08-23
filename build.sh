#!/bin/sh
# Пълна подготовка преди публикуване. Изпълнявай след ВСЯКА промяна
# в css/site.css, js/main.js или в текста на страниците.
#
#   1. инжектира хедъра и футъра от partials/
#   2. минифицира CSS и JS
#   3. обновява <lastmod> в sitemap.xml от git
#   4. слага версия на CSS/JS в адресите, за да не се сервира кеширан стил
#
# Редът има значение: sitemap се пуска преди стъпването на версиите, за да
# вижда кои страници наистина са променени, а не кои са пипнати от стъпването.
set -e
cd "$(dirname "$0")"

python3 build/apply-partials.py

python3 - <<'PY'
import re
c=open('css/site.css').read()
c=re.sub(r'/\*.*?\*/','',c,flags=re.S)
c=re.sub(r'\s*\n\s*',' ',c)
c=re.sub(r'\s*([{}:;,>])\s*',r'\1',c)
c=re.sub(r';}','}',c)
open('css/site.min.css','w').write(re.sub(r'\s+',' ',c).strip())

j=open('js/main.js').read()
j=re.sub(r'^\s*//.*$','',j,flags=re.M)
j=re.sub(r'/\*.*?\*/','',j,flags=re.S)
j=re.sub(r'\n\s*\n','\n',j)
open('js/main.min.js','w').write(re.sub(r'^\s+','',j,flags=re.M))
print('минифицирани: css/site.min.css, js/main.min.js')
PY

python3 build/sitemap.py
python3 build/stamp-assets.py
