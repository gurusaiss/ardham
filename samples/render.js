const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const file = process.argv[2];
  const out = process.argv[3];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 860, height: 700 } });
  await page.goto('file://' + path.resolve(file));
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log('wrote', out);
})();
