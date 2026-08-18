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
  await page.goto(PORTAL_URL + '#Page:Dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(12000);

  // Extract all unique nav hrefs (report/form/page routes)
  const nav = await page.evaluate(() => {
    const seen = new Set();
    const routes = [];
    document.querySelectorAll('a, [onclick]').forEach((el) => {
      const href = el.getAttribute('href') || '';
      const text = (el.innerText || '').trim();
      // Only capture hash-based routes
      const m = href.match(/(#(?:Page|Report|Form):[A-Za-z0-9_\-]+)/);
      if (m) {
        const route = m[1];
        const key = route + '|' + text;
        if (!seen.has(key) && text && text.length < 40) {
          seen.add(key);
          routes.push({ route, text });
        }
      }
    });
    return routes;
  });

  console.log('Total unique routes found:', nav.length);
  fs.writeFileSync('/tmp/zoho_routes.json', JSON.stringify(nav, null, 2));

  // Print compact list
  for (const r of nav) {
    console.log(`${r.route}  ->  ${r.text}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});