const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(__dirname, 'icon-source.html'));
  const el = await page.$('.icon');
  await el.screenshot({ path: path.resolve(__dirname, '..', 'public/icon-512.png') });

  await page.setViewportSize({ width: 192, height: 192 });
  await page.evaluate(() => {
    document.querySelector('.icon').style.width = '192px';
    document.querySelector('.icon').style.height = '192px';
    document.querySelector('.icon').style.borderRadius = '36px';
    document.querySelector('.icon span').style.fontSize = '112px';
  });
  const el2 = await page.$('.icon');
  await el2.screenshot({ path: path.resolve(__dirname, '..', 'public/icon-192.png') });

  await browser.close();
  console.log('icons written');
})();
