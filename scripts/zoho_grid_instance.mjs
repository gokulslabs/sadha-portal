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
    // Show actual string values of HandsOnTableContainers
    r.handsOnTableContainers = window.HandsOnTableContainers;

    // Try to find HT instance via jQuery data on the master container
    const jq = window.jQuery || window.$;
    r.hasJQuery = Boolean(jq);

    // The listReportMainContainer likely holds the handsontable
    const masterEl = document.getElementById('listReportMainContainer');
    if (masterEl) {
      r.masterEl = { id: masterEl.id, cls: masterEl.className.substring(0, 120), children: masterEl.children.length };
    }

    // Try to access handsontable instance from the element
    // Zoho grid wrapper
    const zcGrid = window.zcGrid || window.gridController || window.GridController;
    if (zcGrid) r.zcGridFound = typeof zcGrid;

    // Try searching window for anything with getSourceData
    for (const key of Object.keys(window)) {
      try {
        const v = window[key];
        if (v && typeof v === 'object' && typeof v.getSourceData === 'function') {
          const d = v.getSourceData();
          r['sourceData_' + key] = { len: d.length };
        }
      } catch (e) {}
    }

    // Check the .ht_master element's jQuery data
    if (jq) {
      const htMaster = document.querySelector('.ht_master');
      if (htMaster) {
        try {
          const data = jq(htMaster).data();
          r.htMasterJQData = Object.keys(data || {});
        } catch (e) { r.htMasterJQErr = String(e); }
      }
    }
    return r;
  });

  console.log(JSON.stringify(info, null, 2));
  fs.writeFileSync('/tmp/zoho_grid_instance.json', JSON.stringify(info, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});