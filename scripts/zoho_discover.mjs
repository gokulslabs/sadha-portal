import { chromium } from 'playwright';
import fs from 'fs';

const PORTAL_URL = 'https://sadhagroups.zohocreatorportal.com/';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    storageState: '/tmp/zoho_storage_state.json',
  });

  const page = await context.newPage();

  // Capture ALL XHR/fetch requests and responses (the data API)
  const networkLog = [];
  page.on('request', (req) => {
    const url = req.url();
    const type = req.resourceType();
    if (type === 'xhr' || type === 'fetch') {
      networkLog.push({
        type: 'request',
        method: req.method(),
        url,
        postData: req.postData() ? req.postData().substring(0, 2000) : null,
      });
    }
  });
  page.on('response', async (resp) => {
    const req = resp.request();
    const type = req.resourceType();
    if (type === 'xhr' || type === 'fetch') {
      let body = null;
      try {
        const ct = resp.headers()['content-type'] || '';
        if (ct.includes('json')) {
          body = await resp.text();
        }
      } catch (e) {}
      if (body) {
        networkLog.push({
          type: 'response',
          url: resp.url(),
          status: resp.status(),
          body: body.substring(0, 500000),
        });
      }
    }
  });

  console.log('Navigating to portal with saved session...');
  await page.goto(PORTAL_URL + '#Page:Dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(12000);

  // Discover all navigation links and menu items
  console.log('\n=== DISCOVERING NAVIGATION ===');
  const navInfo = await page.evaluate(() => {
    const results = { menuItems: [], links: [], buttons: [] };
    // Main menu items
    document.querySelectorAll('[class*="menu"], [class*="nav"], [id*="menu"], [id*="nav"], ul li').forEach((el) => {
      const text = (el.innerText || '').trim();
      const href = el.querySelector('a')?.getAttribute('href') || '';
      const onclick = el.getAttribute('onclick') || '';
      if (text && text.length < 60) {
        results.menuItems.push({ text, href, onclick });
      }
    });
    return results;
  });
  console.log(JSON.stringify(navInfo, null, 2));

  // Save network log
  fs.writeFileSync('/tmp/zoho_network_discovery.json', JSON.stringify(networkLog, null, 2));
  console.log('\nNetwork log saved. XHR/fetch requests:', networkLog.filter(l => l.type === 'request').length);
  
  // Print the interesting data API requests
  const dataRequests = networkLog.filter(l => l.type === 'request' && 
    (l.url.includes('/report/') || l.url.includes('/view/') || l.url.includes('/data') || 
     l.url.includes('/records') || l.url.includes('/api') || l.url.includes('/grc') ||
     l.url.includes('/zcapi') || l.url.includes('/component')));
  
  console.log('\n=== POTENTIAL DATA API REQUESTS ===');
  for (const r of dataRequests) {
    console.log(r.method, r.url.substring(0, 200));
  }

  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});