#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Проверява и изправя размерите на изображенията по страниците.

Всяко <img> носи width и height. Когато те не съвпадат със самия файл,
браузърът запазва грешно място, а при object-fit:cover съотношението на
кутията се разминава със снимката и кадърът се реже без да сме искали.
Тук width/height се четат от самия файл, а не се пишат на ръка.

Пуска се от build.sh, преди картата на сайта.
"""
import glob
import os
import re
import struct
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _jpeg(fh):
    fh.read(2)
    while True:
        b = fh.read(1)
        while b and b != b"\xff":
            b = fh.read(1)
        m = fh.read(1)
        while m == b"\xff":
            m = fh.read(1)
        if not m:
            return None
        if m[0] in range(0xC0, 0xD0) and m[0] not in (0xC4, 0xC8, 0xCC):
            fh.read(3)
            h, w = struct.unpack(">HH", fh.read(4))
            return w, h
        fh.read(struct.unpack(">H", fh.read(2))[0] - 2)


def _png(fh):
    fh.read(16)
    return struct.unpack(">II", fh.read(8))


def _webp(fh):
    d = fh.read(40)
    if d[12:16] == b"VP8X":
        return (int.from_bytes(d[24:27], "little") + 1,
                int.from_bytes(d[27:30], "little") + 1)
    if d[12:16] == b"VP8L":
        b = int.from_bytes(d[21:25], "little")
        return ((b & 0x3FFF) + 1, ((b >> 14) & 0x3FFF) + 1)
    if d[12:16] == b"VP8 ":
        return (struct.unpack("<H", d[26:28])[0] & 0x3FFF,
                struct.unpack("<H", d[28:30])[0] & 0x3FFF)
    return None


CHETCI = {".jpg": _jpeg, ".jpeg": _jpeg, ".png": _png, ".webp": _webp}
_pamet = {}


def razmer(otn):
    """Размерът на файла в пиксели, или None за svg и липсващи."""
    if otn in _pamet:
        return _pamet[otn]
    put = os.path.join(ROOT, otn.lstrip("/").split("?")[0])
    e = os.path.splitext(put)[1].lower()
    r = None
    if e in CHETCI and os.path.isfile(put):
        try:
            with open(put, "rb") as fh:
                r = CHETCI[e](fh)
        except Exception:
            r = None
    _pamet[otn] = r
    return r


IMG = re.compile(r"<img\b[^>]*>")
SRCSET = re.compile(r'((?:image)?srcset=")([^"]+)(")')
ATR = re.compile(r'(\s(?:width|height)=")(\d+)(")')
SRC = re.compile(r'\ssrc="([^"]+)"')


def popravi(tag):
    m = SRC.search(tag)
    if not m:
        return tag, False
    r = razmer(m.group(1))
    if not r:
        return tag, False
    w, h = r
    if 'width="%d"' % w in tag and 'height="%d"' % h in tag:
        return tag, False
    nov = re.sub(r'\swidth="\d+"', ' width="%d"' % w, tag)
    nov = re.sub(r'\sheight="\d+"', ' height="%d"' % h, nov)
    if ' width=' not in nov:            # без размери изобщо — добавяме ги
        nov = nov[:-1].rstrip() + ' width="%d" height="%d">' % (w, h)
    return nov, nov != tag


def opravi_srcset(s):
    """Дескрипторът „800w" трябва да е истинската ширина на файла.

    При смяна на снимка старите числа остават и браузърът избира по тях:
    смята файл от 1600 px за 600 px и сваля твърде малък вариант, който
    после разтяга. Затова числата се четат от файловете, а повторените
    адреси отпадат."""
    broy = [0]

    def _z(m):
        vidyani, nov = set(), []
        for chast in m.group(2).split(","):
            chast = chast.strip()
            if not chast:
                continue
            adres = chast.split()[0]
            r = razmer(adres)
            if not r or adres in vidyani:
                if not r:
                    nov.append(chast)
                continue
            vidyani.add(adres)
            nov.append("%s %dw" % (adres, r[0]))
        rez = ", ".join(nov)
        if rez != m.group(2):
            broy[0] += 1
        return m.group(1) + rez + m.group(3)

    return SRCSET.sub(_z, s), broy[0]


def main():
    stranici = [p for p in sorted(set(glob.glob(os.path.join(ROOT, "**/*.html"), recursive=True)))
                if "/project/" not in p and "/partials/" not in p and "/social/" not in p]
    popraveni = stranici_s_promyana = bez_razmer = 0
    for p in stranici:
        s = open(p, encoding="utf-8").read()
        broy = [0]

        def _z(m):
            nov, smenen = popravi(m.group(0))
            if smenen:
                broy[0] += 1
            return nov

        nov = IMG.sub(_z, s)
        nov, n2 = opravi_srcset(nov)
        broy[0] += n2
        bez_razmer += len([t for t in IMG.findall(nov)
                           if 'width="' not in t or 'height="' not in t])
        if broy[0]:
            open(p, "w", encoding="utf-8").write(nov)
            popraveni += broy[0]
            stranici_s_promyana += 1
    print("размери на снимки: поправени %d места в %d страници" % (popraveni, stranici_s_promyana))
    if bez_razmer:
        print("  ВНИМАНИЕ: %d <img> остават без width/height" % bez_razmer)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
