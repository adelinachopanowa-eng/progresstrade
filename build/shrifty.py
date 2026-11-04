#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Зарежда предварително шрифтовете, които се виждат на първия екран.

Шрифтовете са самостоятелно хоствани и са с font-display:swap. Без
preload браузърът ги иска чак когато разполага текста, затова първо
изрисува резервния системен шрифт и после го сменя — видимото
„подскачане" на буквите при зареждане.

Preload-ват се само лицата, с които наистина е написан първият екран —
измерено с браузър, не на око. Останалите тегла се дърпат нормално,
по-надолу в страницата, където смяната не се забелязва.

Пуска се от build.sh.
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Списъците не са на око: измерени са с браузър — за всеки текстов възел в
# първите 900 px се взима използваното семейство, тегло и писменост. Затова
# българските страници теглят и латински лица: логото, телефонът и годините
# са на латиница.
PODMNOZHESTVA = {
    "bg": ["Geologica-600-cyrillic", "Geologica-600-latin",
           "Commissioner-400-cyrillic", "Commissioner-400-latin",
           "Commissioner-500-cyrillic", "Commissioner-600-cyrillic",
           "Commissioner-600-latin", "Commissioner-700-cyrillic",
           "Commissioner-700-latin"],
    "en": ["Geologica-600-latin", "Commissioner-400-latin",
           "Commissioner-500-latin", "Commissioner-600-latin",
           "Commissioner-700-latin"],
}

NACHALO = "<!-- шрифтове за първия екран -->"
KRAI = "<!-- /шрифтове -->"
BLOK = re.compile(re.escape(NACHALO) + r".*?" + re.escape(KRAI) + r"\n?", re.S)


def blok_za(ezik):
    redove = [NACHALO]
    for ime in PODMNOZHESTVA[ezik]:
        redove.append('<link rel="preload" as="font" type="font/woff2" '
                      'href="/fonts/%s.woff2" crossorigin>' % ime)
    redove.append(KRAI)
    return "\n".join(redove) + "\n"


def ezik_na(put):
    otn = os.path.relpath(put, ROOT).replace(os.sep, "/")
    return "en" if otn == "en/index.html" or otn.startswith("en/") else "bg"


def main():
    stranici = [p for p in sorted(set(glob.glob(os.path.join(ROOT, "**/*.html"), recursive=True)))
                if "/project/" not in p and "/partials/" not in p and "/social/" not in p]
    n = propusnati = 0
    for p in stranici:
        s = open(p, encoding="utf-8").read()
        if "<head>" not in s or "site.min.css" not in s:
            propusnati += 1          # пренасочвания и подобни — нямат стил
            continue
        nov = BLOK.sub("", s)
        # След стила, не преди него: стилът и hero снимката тръгват първи,
        # иначе предзареждането им отнема лентата и първото рисуване се бави.
        kotva = '<link rel="stylesheet" href="/css/site.min.css'
        i = nov.find(kotva)
        if i < 0:
            propusnati += 1
            continue
        i = nov.find(">", i) + 1
        nov = nov[:i] + "\n" + blok_za(ezik_na(p)).rstrip() + nov[i:]
        if nov != s:
            open(p, "w", encoding="utf-8").write(nov)
            n += 1
    print("предзареждане на шрифтове: %d страници (%d пропуснати)" % (n, propusnati))
    return 0


if __name__ == "__main__":
    sys.exit(main())
