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
    // DataController - likely has the records array
    if (window.DataController) {
      r.dataControllerKeys = Object.keys(window.DataController);
      try {
        const inst = window.DataController;
        // Look for data arrays
        for (const key of Object.keys(inst)) {
          const val = inst[key];
          if (Array.isArray(val) && val.length > 0) {
            r['arr_' + key] = { len: val.length, sample: JSON.stringify(val[0]).substring(0, 300) };
          }
        }
      } catch (e) { r.dataControllerErr = String(e); }
    }
    // ReportModel
    if (window.ReportModel) {
      r.reportModelKeys = Object.keys(window.ReportModel);
      try {
        const inst = window.ReportModel;
        for (const key of Object.keys(inst)) {
          const val = inst[key];
          if (Array.isArray(val) && val.length > 0) {
            r['rm_' + key] = { len: val.length, sample: JSON.stringify(val[0]).substring(0, 300) };
          }
        }
      } catch (e) { r.reportModelErr = String(e); }
    }
    // HandsOnTableContainers
    if (window.HandsOnTableContainers) {
      r.hotContainersKeys = Object.keys(window.HandsOnTableContainers);
    }
    // zcTable
    if (window.zcTable) {
      r.zcTableKeys = Object.keys(window.zcTable);
    }
    if (window.zcTable) {
      // try to find instances with data
      try {
        for (const k of Object.keys(window.zcTable)) {
          const inst = window.zcTable[k];
          if (inst && typeof inst.getData === 'function') {
            const d = inst.getData();
            r['zcTable_' + k] = { len: d.length, sample: JSON.stringify(d[0]).substring(0, 300) };
          }
        }
      } catch (e) { r.zcTableErr = String(e); }
    }
    return r;
  });

  console.log(JSON.stringify(info, null, 2));
  fs.writeFileSync('/tmp/zoho_datacontroller.json', JSON.stringify(info, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});