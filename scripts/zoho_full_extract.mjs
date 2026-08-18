import { chromium } from 'playwright';
import fs from 'fs';

const PORTAL_URL = 'https://sadhagroups.zohocreatorportal.com/';

const REPORTS = [
  ['All_Diesel_Entries', 'diesel-entries'],
  ['All_Def_Oil_Entries', 'def-oil-entries'],
  ['All_Sales_Entry', 'sales-entries'],
  ['All_Rent_Entries', 'rent-entries'],
  ['All_Day_Fees_Entries', 'day-fees-entries'],
  ['All_Boulders_Entries', 'all-boulders-entries'],
  ['Boulders_Diesel_Entries', 'boulders-diesel-entries'],
  ['All_Excavators_Entries', 'excavators-entries'],
  ['Excavators_Daily_Entries1', 'excavators-daily-entries'],
  ['Excavators_Rent_Entries1', 'excavators-rent-entries'],
  ['Excavators_Diesel_Entries', 'excavators-diesel-entries'],
  ['All_Accounts', 'accounts-overview'],
  ['All_Income_Expense', 'income-expense'],
  ['All_Drivers', 'drivers'],
  ['All_New_Clients', 'clients'],
  ['All_New_Vendors', 'vendors'],
  ['All_Vehicles', 'vehicles'],
  ['All_New_Materials', 'materials'],
  ['All_Machines', 'machines'],
  ['All_Business_Transporters', 'transporters'],
];

async function readTable(page) {
  return await page.evaluate(() => {
    const result = { headers: null, rows: [], showing: null };
    // Find the data table (Handsontable renders a <table class="htCore"> inside .wtHolder)
    const tables = Array.from(document.querySelectorAll('table'));
    for (const t of tables) {
      const rows = Array.from(t.querySelectorAll('tr'));
      if (rows.length === 0) continue;
      const parsed = [];
      for (const r of rows) {
        const cells = Array.from(r.querySelectorAll('th, td')).map((c) =>
          (c.innerText || '').trim().replace(/\n+/g, ' '),
        );
        parsed.push(cells);
      }
      // recognize header table (contains column names)
      const joined = parsed.map((r) => r.join(' ')).join(' ');
      if (/Date|ID|Name|Amount|Driver|Vehicle|Client|Vendor/i.test(joined)) {
        // This is the primary data table
        result.rows = parsed;
        result.headers = parsed[0] || null;
        break;
      }
    }
    // showing text
    const m = document.body.innerText.match(/Showing\s+([\d,]+)\s+of\s+([\d,]+)/);
    if (m) result.showing = { shown: +m[1].replace(/,/g, ''), total: +m[2].replace(/,/g, '') };
    return result;
  });
}

async function scrollTableToBottom(page) {
  return await page.evaluate(async () => {
    // Find the .wtHolder scroll container
    const holder = document.querySelector('.wtHolder');
    if (!holder) return { done: true, scroll: 0, height: 0 };
    const target = holder;
    // Scroll progressively
    const step = 1500;
    for (let y = 0; y <= target.scrollHeight; y += step) {
      target.scrollTop = y;
      await new Promise((r) => setTimeout(r, 150));
    }
    target.scrollTop = target.scrollHeight;
    await new Promise((r) => setTimeout(r, 500));
    return { done: false, scroll: target.scrollTop, height: target.scrollHeight };
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
  page.setDefaultTimeout(30000);

  const out = {};

  for (const [reportName, slug] of REPORTS) {
    console.log(`\n>>> [${slug}] ${reportName}`);
    try {
      await page.goto(PORTAL_URL + '#Report:' + reportName, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      // wait for initial render
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(1000);
        const r = await readTable(page);
        if (r.rows.length > 1) break;
      }

      // continuously scroll to load all rows
      let prevRows = 0;
      for (let round = 0; round < 60; round++) {
        await scrollTableToBottom(page);
        await page.waitForTimeout(500);
        const r = await readTable(page);
        // Also scroll the second scrollable (horizontal clones) as needed
        if (r.rows.length === prevRows && round > 3) {
          // one more attempt with window scroll
          await page.evaluate(() => {
            const h = document.querySelector('.wtHolder');
            if (h) { h.scrollTop = h.scrollHeight; }
            window.scrollTo(0, document.body.scrollHeight);
          });
          await page.waitForTimeout(800);
          const r2 = await readTable(page);
          if (r2.rows.length === prevRows) break;
          prevRows = r2.rows.length;
        } else {
          prevRows = r.rows.length;
        }
      }

      const r = await readTable(page);
      out[slug] = { reportName, headers: r.headers, rows: r.rows, showing: r.showing, rowCount: r.rows.length };
      console.log(`    rows collected: ${r.rows.length}, showing: ${JSON.stringify(r.showing)}`);
      if (r.headers) console.log('    HEADER:', r.headers.join(' | ').substring(0, 200));
    } catch (e) {
      console.log(`    !! ERROR: ${e.message}`);
      out[slug] = { error: e.message };
    }
  }

  fs.writeFileSync('/tmp/zoho_full_data.json', JSON.stringify(out, null, 2));
  console.log('\n=== FULL EXTRACTION COMPLETE ===');
  for (const [slug, v] of Object.entries(out)) {
    console.log(`  [${slug}] rows=${v.rowCount ?? 0} showing=${JSON.stringify(v.showing ?? null)} ${v.error ? 'ERR=' + v.error : ''}`);
  }
  await browser.close();
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});