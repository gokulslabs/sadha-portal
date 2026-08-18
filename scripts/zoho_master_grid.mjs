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
  await page.goto(PORTAL_URL + '#Report:All_Diesel_Entries', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(12000);

  const info = await page.evaluate(() => {
    const r = {};
    const containers = window.HandsOnTableContainers || {};
    for (const key of Object.keys(containers)) {
      const inst = containers[key];
      r['container_' + key] = {
        type: typeof inst,
        keys: inst && typeof inst === 'object' ? Object.keys(inst).slice(0, 50) : null,
      };
      // Try common data accessors
      if (inst && typeof inst === 'object') {
        for (const m of ['getSourceData', 'getData', 'getSourceDataArray', 'getDataAtRow']) {
          if (typeof inst[m] === 'function') {
            try {
              if (m === 'getSourceData' || m === 'getData' || m === 'getSourceDataArray') {
                const d = inst[m]();
                r['container_' + key + '_' + m] = { len: d.length, sample: d[0] ? JSON.stringify(d[0]).substring(0, 400) : null };
              }
            } catch (e) { r['container_' + key + '_' + m + '_err'] = String(e); }
          }
        }
      }
    }
    return r;
  });

  console.log(JSON.stringify(info, null, 2));
  fs.writeFileSync('/tmp/zoho_master_grid.json', JSON.stringify(info, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});