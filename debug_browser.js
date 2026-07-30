const puppeteer = require('puppeteer');

async function debugPage() {
    console.log("Launching browser...");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    
    console.log("Navigating to http://localhost:5000...");
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle2' });
    
    console.log("Waiting 2s...");
    await new Promise(r => setTimeout(r, 2000));
    
    const bodyText = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
    console.log("Body snippet:", bodyText);
    
    await browser.close();
}

debugPage().catch(console.error);
