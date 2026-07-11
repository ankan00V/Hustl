const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('http://localhost:8083');
  
  await page.waitForTimeout(3000);
  
  const bodyHandle = await page.$('body');
  const html = await page.evaluate(body => body.innerHTML, bodyHandle);
  
  // Extract error overlay if it exists
  const errorFrames = await page.evaluate(() => {
    const errorText = document.body.innerText;
    return errorText;
  });
  console.log("BODY TEXT:\n", errorFrames.substring(0, 2000));
  
  await browser.close();
})();
