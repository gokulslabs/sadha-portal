import { chromium } from 'playwright';
import fs from 'fs';

const PORTAL_URL = 'https://sadhagroups.zohocreatorportal.com/';

const BIG_REPORTS = [
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
  ['Company_Profile', 'company-profile'],
];

function stripHtml(html) {
  if (html === null || html === undefined) return '';
  const tmp = String(html).replace(/<[^>]*>/g, ' ');
  return tmp.replace(/&/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/"/g, '"').replace(/\s+/g, ' ').trim();
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
  page.setDefaultTimeout(60000);

  const out = {};

  for (const [reportName, slug] of BIG_REPORTS) {
    console.log(`\n>>> [${slug}] ${reportName}`);

    // Capture ALL data POST responses (each pagination page)
    const responses = [];
    const onResponse = async (resp) => {
      const req = resp.request();
      if (req.url().includes('/report/' + reportName) && req.method() === 'POST') {
        try {
          const text = await resp.text();
          responses.push({ post: req.postData(), text, status: resp.status() });
        } catch (e) {}
      }
    };
    page.on('response', onResponse);

    try {
      await page.goto(PORTAL_URL + '#Report:' + reportName, { waitUntil: 'domcontentloaded', timeout: 35000 }).catch(() => {});
      // wait for initial load
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(800);
        if (responses.length > 0) break;
      }

      // Aggressively scroll the grid to load all pages
      let lastTotal = -1;
      for (let round = 0; round < 80; round++) {
        await page.evaluate(() => {
          const holders = document.querySelectorAll('.wtHolder');
          holders.forEach((h) => {
            h.scrollTop = h.scrollHeight;
            h.dispatchEvent(new Event('scroll', { bubbles: true }));
          });
          window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(900);

        // Check "Showing X of Y"
        const showing = await page.evaluate(() => {
          const m = document.body.innerText.match(/Showing\s+([\d,]+)\s+of\s+([\d,]+)/);
          return m ? { shown: +m[1].replace(/,/g, ''), total: +m[2].replace(/,/g, '') } : null;
        });

        // If we've loaded all (shown >= total), stop
        if (showing && showing.shown >= showing.total) {
          console.log(`    loaded all: ${showing.shown}/${showing.total}`);
          break;
        }
        // If no progress after many rounds, break
        if (showing && showing.shown === lastTotal) {
          // maybe still need more
        }
        lastTotal = showing?.shown ?? -1;
      }

      await page.waitForTimeout(3000);
      page.off('response', onResponse);

      console.log(`    captured ${responses.length} POST pages`);

      // Merge all MODEL.DATAJSONARRAY records, dedup by record id
      const columnMap = new Map(); // displayName -> lableName ordering
      const records = new Map(); // recordId -> record object

      for (const r of responses) {
        if (r.status !== 200) continue;
        let parsed = null;
        try {
          parsed = JSON.parse(r.text);
        } catch (e) {
          const m = r.text.match(/\{"HTML":[\s\S]*"MODEL":\{[\s\S]*\}\}/);
          if (m) { try { parsed = JSON.parse(m[0]); } catch (e2) {} }
        }
        if (!parsed || !parsed.MODEL) continue;

        const model = parsed.MODEL;
        const dataArray = model.DATAJSONARRAY || [];
        const colDetails = model.COLDETAILSARRAY || [];

        for (const col of colDetails) {
          if (col.lableName && !columnMap.has(col.lableName)) {
            columnMap.set(col.lableName, col.displayName || col.lableName);
          }
        }

        for (const row of dataArray) {
          const rid = stripHtml(row.zohoRecId || row.unformattedID || row.ID);
          if (!rid) continue;
          if (records.has(rid)) continue; // dedupe
          const rec = { __recordId: rid };
          if (row.zc_RecordGroupData) rec.__group = String(row.zc_RecordGroupData);
          for (const [lbl, disp] of columnMap.entries()) {
            rec[disp] = stripHtml(row[lbl]);
          }
          records.set(rid, rec);
        }
      }

      const rows = [...records.values()];
      out[slug] = {
        reportName,
        pageCount: responses.length,
        columns: [...columnMap.values()],
        recordCount: rows.length,
        records: rows,
      };
      console.log(`    total unique records: ${rows.length}`);
    } catch (e) {
      console.log(`    !! ERROR: ${e.message}`);
      out[slug] = { error: e.message };
    }
  }

  fs.writeFileSync('/tmp/zoho_paginate_model.json', JSON.stringify(out, null, 2));
  console.log('\n\n=== PAGINATED MODEL EXTRACTION DONE ===');
  let total = 0;
  for (const [slug, v] of Object.entries(out)) {
    const n = v.recordCount || 0;
    total += n;
    console.log(`  [${slug}] pages=${v.pageCount ?? 0} records=${n} ${v.error ? 'ERR=' + v.error : ''}`);
  }
  console.log(`\nTOTAL UNIQUE RECORDS: ${total}`);
  await browser.close();
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});