import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'https://sadhagroups.zohocreatorportal.com';

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

  // Probe candidate data endpoints with the authenticated context
  const candidates = [
    '/grcweb/sadha-groups/page/Dashboard',
    '/grcweb/sadha-groups/report/All_Diesel_Entries',
    '/grcweb/sadha-groups/view/All_Diesel_Entries',
    '/grcweb/sadha-groups/reports/All_Diesel_Entries',
    '/zcapi/sadha-groups/report/All_Diesel_Entries',
    '/grcweb/sadha-groups/appconfig',
    '/grcweb/sadha-groups/metadata',
  ];

  for (const path of candidates) {
    const url = BASE + path;
    try {
      const resp = await context.request.get(url);
      const status = resp.status();
      const ct = resp.headers()['content-type'] || '';
      let body = await resp.text();
      body = body.substring(0, 500);
      console.log(`\n=== GET ${path} -> ${status} [${ct}] ===`);
      console.log(body.replace(/\s+/g, ' ').substring(0, 500));
    } catch (e) {
      console.log(`\n=== GET ${path} -> ERROR ${e.message} ===`);
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});