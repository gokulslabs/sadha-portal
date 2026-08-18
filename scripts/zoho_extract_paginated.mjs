import { chromium } from 'playwright';
import fs from 'fs';

const PORTAL_URL = 'https://sadhagroups.zohocreatorportal.com/';

// Master data reports that need complete extraction (may be paginated)
const MASTER_ROUTES = [
  ['Report:All_Drivers', 'drivers'],
  ['Report:All_New_Clients', 'clients'],
  ['Report:All_New_Vendors', 'vendors'],
  ['Report:All_Vehicles', 'vehicles'],
  ['Report:All_New_Materials', 'materials'],
  ['Report:All_Machines', 'machines'],
  ['Report:All_Diesel_Entries', 'diesel-entries'],
  ['Report:All_Def_Oil_Entries', 'def-oil-entries'],
  ['Report:All_Sales_Entry', 'sales-entries'],
  ['Report:All_Rent_Entries', 'rent-entries'],
  ['Report:All_Day_Fees_Entries', 'day-fees-entries'],
  ['Report:All_Boulders_Entries', 'all-boulders-entries'],
  ['Report:Boulders_Diesel_Entries', 'boulders-diesel-entries'],
  ['Report:All_Excavators_Entries', 'excavators-entries'],
  ['Report:Excavators_Daily_Entries1', 'excavators-daily-entries'],
  ['Report:Excavators_Rent_Entries1', 'excavators-rent-entries'],
  ['Report:Excavators_Diesel_Entries', 'excavators-diesel-entries'],
  ['Report:All_Accounts', 'accounts-overview'],
  ['Report:All_Income_Expense', 'income-expense'],
  ['Report:All_Business_Transporters', 'transporters'],
];

async function extractTable(page) {
  return await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll('table'));
    const result = [];
    for (const t of tables) {
      const rows = Array.from(t.querySelectorAll('tr'));
      if (rows.length === 0) continue;
      const tableData = [];
      for (const r of rows) {
        const cells = Array.from(r.querySelectorAll('th, td')).map((c) =>
          (c.innerText || '').trim().replace(/\n+/g, ' | '),
        );
        if (cells.length > 0) tableData.push(cells);
      }
      if (tableData.length > 0) result.push(tableData);
    }
    return result;
  });
}

// Get "Showing X of Y" info
async function getShowingInfo(page) {
  return await page.evaluate(() => {
    const body = document.body.innerText;
    const m = body.match(/Showing\s+([\d,]+)\s+of\s+([\d,]+)/);
    if (m) return { shown: parseInt(m[1].replace(/,/g, ''), 10), total: parseInt(m[2].replace(/,/g, ''), 10) };
    return null;
  });
}

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
  page.setDefaultTimeout(20000);

  const output = {};

  for (const [route, slug] of MASTER_ROUTES) {
    try {
      console.log(`\n>>> [${slug}] ${route}`);
      const target = PORTAL_URL + '#' + route;
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});

      // Initial load: wait for table
      let lastRowCount = 0;
      let stable = 0;
      let showing = null;

      for (let attempt = 0; attempt < 10; attempt++) {
        await page.waitForTimeout(1500);
        const tablesData = await extractTable(page);
        const rowCount = tablesData.reduce((s, t) => s + t.length, 0);
        showing = await getShowingInfo(page);
        if (rowCount === lastRowCount) {
          stable++;
          if (stable >= 3) break;
        } else {
          lastRowCount = rowCount;
          stable = 0;
        }
      }

      // Scroll to trigger lazy loading if needed
      for (let scroll = 0; scroll < 15; scroll++) {
        const before = lastRowCount;
        await page.evaluate(() => {
          // Scroll report containers and window to bottom
          const scrollers = document.querySelectorAll('[class*="scroll"], [class*="report"] .zc-scroll, [class*="view"] [class*="scroll"], .zc-report-wrapper, #reportScrollDiv');
          window.scrollTo(0, document.body.scrollHeight);
          scrollers.forEach((el) => { el.scrollTop = el.scrollHeight; });
        });
        await page.waitForTimeout(1200);
        const tablesData = await extractTable(page);
        const rowCount = tablesData.reduce((s, t) => s + t.length, 0);
        showing = await getShowingInfo(page);
        if (rowCount === before) {
          // No growth; try clicking "load more" / "show all" if present
          const clicked = await page.evaluate(() => {
            const labels = ['Load More', 'Show More', 'View All', 'Show All'];
            const els = Array.from(document.querySelectorAll('a, button, span, div')).filter((e) =>
              labels.some((l) => (e.innerText || '').trim().toLowerCase() === l.toLowerCase()),
            );
            for (const el of els) {
              if (el.offsetParent !== null) { el.click(); return true; }
            }
            return false;
          });
          if (!clicked) break;
        } else {
          lastRowCount = rowCount;
        }
      }

      const tablesData = await extractTable(page);
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 400000));
      const rowCount = tablesData.reduce((s, t) => s + t.length, 0);

      output[slug] = {
        route,
        tables: tablesData,
        bodyText,
        rowCount,
        showing,
      };
      console.log(`    -> rows: ${rowCount}, showing: ${JSON.stringify(showing)}`);
    } catch (e) {
      console.log(`    !! ERROR: ${e.message}`);
    }
  }

  fs.writeFileSync('/tmp/zoho_paginated.json', JSON.stringify(output, null, 2));
  console.log('\n\n=== PAGINATED EXTRACTION COMPLETE ===');
  for (const [slug, v] of Object.entries(output)) {
    console.log(`  [${slug}] rows=${v.rowCount} showing=${JSON.stringify(v.showing)}`);
  }
  await browser.close();
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});