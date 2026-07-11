const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
    }
  });
  page.on('pageerror', exception => {
    console.log('BROWSER UNCAUGHT EXCEPTION:', exception);
  });
  
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
