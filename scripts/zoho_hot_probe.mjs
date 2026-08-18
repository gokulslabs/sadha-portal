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

  // Inspect global Handsontable, lyte, and report data structures
  const info = await page.evaluate(() => {
    const result = {
      globals: [],
      hotSources: [],
      tableInfo: [],
      reportDataKeys: [],
    };

    // Find Handsontable references
    if (window.Handsontable) {
      result.globals.push('Handsontable');
      const instances = window.Handsontable.instances || {};
      for (const [id, inst] of Object.entries(instances)) {
        let source = null;
        let dataLen = 0;
        let dataSample = null;
        try {
          if (typeof inst.getSourceData === 'function') {
            source = inst.getSourceData();
            dataLen = source.length;
            dataSample = source.slice(0, 3);
          } else if (typeof inst.getData === 'function') {
            source = inst.getData();
            dataLen = source.length;
            dataSample = source.slice(0, 3);
          }
        } catch (e) {}
        result.hotSources.push({ id: String(id).substring(0, 80), dataLen, sample: dataSample });
      }
    }

    // Look for report data in DOM
    document.querySelectorAll('.handsontable, [id*="All_Diesel"], [class*="report"]').forEach((el) => {
      result.tableInfo.push({
        tag: el.tagName,
        id: el.id,
        cls: (el.className || '').toString().substring(0, 100),
      });
    });

    // Look for window-level data stores that might hold report records
    for (const key of Object.keys(window)) {
      if (/report|record|data|view|grid|table|lyte/i.test(key)) {
        result.reportDataKeys.push(key);
      }
    }

    return result;
  });

  console.log(JSON.stringify(info, null, 2));
  fs.writeFileSync('/tmp/zoho_hot_info.json', JSON.stringify(info, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});