#!/bin/sh
# Минифицира CSS и JS. Изпълнявай след ВСЯКА промяна в css/site.css или js/main.js.
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
