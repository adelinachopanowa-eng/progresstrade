/* Изрязва всеки слайд от карусела в отделен файл.
 *
 *   node social/render.js social/karusel-kabeli.html social/izhod/kabeli [jpg]
 *
 * Преди това сайтът трябва да се сервира от корена, за да се заредят
 * шрифтовете и снимките:  python3 -m http.server 8777
 *
 * Размерът идва от самия CSS (--h: 1350px за 4:5, 1080px за квадрат),
 * затова тук нищо не се настройва.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [, , stranica, izhod, format] = process.argv;
if (!stranica || !izhod) {
  console.error('Употреба: node social/render.js <файл.html> <папка/префикс> [jpg]');
  process.exit(1);
}

const kato = (format || 'png').toLowerCase();
const url = 'http://127.0.0.1:8777/' + stranica.replace(/^\/+/, '');

(async () => {
  fs.mkdirSync(path.dirname(izhod), { recursive: true });
  const brauzar = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox'],
  });
  const stranicata = await brauzar.newPage({
    viewport: { width: 1180, height: 1500 },
    deviceScaleFactor: 1,
  });
  await stranicata.goto(url, { waitUntil: 'networkidle' });
  await stranicata.evaluate(() => document.fonts.ready);
  await stranicata.waitForTimeout(1000);          // шрифтовете да се изрисуват

  const slaydove = await stranicata.$$('section.slide');
  for (let i = 0; i < slaydove.length; i++) {
    const ime = `${izhod}-${String(i + 1).padStart(2, '0')}.${kato}`;
    await slaydove[i].screenshot(
      kato === 'jpg'
        ? { path: ime, type: 'jpeg', quality: 92 }
        : { path: ime }
    );
    console.log('  ' + ime);
  }
  console.log(`готови ${slaydove.length} слайда`);
  await brauzar.close();
})();
