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
  ['All_Categories', 'categories'],
  ['All_Sub_Categories', 'sub-categories'],
  ['All_Payment_Categories', 'payment-categories'],
  ['All_Units', 'units'],
  ['Company_Profile', 'company-profile'],
];

// Strip HTML tags to get clean text value
function stripHtml(html) {
  if (html === null || html === undefined) return '';
  const s = String(html);
  // Handle lookup links: take text content
  const tmp = s.replace(/<[^>]*>/g, ' ');
  return tmp
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  page.setDefaultTimeout(45000);

  const out = {};

  for (const [reportName, slug] of REPORTS) {
    console.log(`\n>>> [${slug}] ${reportName}`);

    // Capture the full report data POST response (single request holds all records)
    let captured = null;
    const onResponse = async (resp) => {
      const req = resp.request();
      if (req.url().includes('/report/' + reportName) && req.method() === 'POST' && !captured) {
        try {
          const text = await resp.text();
          captured = { post: req.postData(), text, status: resp.status() };
        } catch (e) {}
      }
    };
    page.on('response', onResponse);

    try {
      await page.goto(PORTAL_URL + '#Report:' + reportName, { waitUntil: 'domcontentloaded', timeout: 35000 }).catch(() => {});
      for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(800);
        if (captured) break;
      }
      page.off('response', onResponse);

      if (!captured) {
        console.log('    !! No POST captured');
        out[slug] = { error: 'no capture' };
        continue;
      }

      // Parse the response
      let parsed = null;
      try {
        const j = JSON.parse(captured.text);
        parsed = j;
      } catch (e) {
        // Try to find a JSON object in the text
        const m = captured.text.match(/\{"HTML":[\s\S]*"MODEL":\{[\s\S]*\}\}/);
        if (m) {
          try { parsed = JSON.parse(m[0]); } catch (e2) {}
        }
      }

      if (!parsed || !parsed.MODEL) {
        console.log('    !! No MODEL in response, body length:', captured.text.length);
        out[slug] = { error: 'no model', bodyLength: captured.text.length };
        continue;
      }

      const model = parsed.MODEL;
      const dataArray = model.DATAJSONARRAY || [];
      const colDetails = model.COLDETAILSARRAY || [];

      // Build the column -> displayName mapping
      const columns = [];
      for (const col of colDetails) {
        if (col.lableName) {
          columns.push({ lableName: col.lableName, displayName: col.displayName || col.lableName });
        }
      }

      // Extract records
      const records = [];
      for (const row of dataArray) {
        const rec = {};
        rec.__recordId = String(row.zohoRecId || row.unformattedID || row.ID || '').replace(/<[^>]*>/g, '').trim();
        for (const col of columns) {
          const raw = row[col.lableName];
          rec[col.displayName] = stripHtml(raw);
        }
        // also capture group
        if (row.zc_RecordGroupData) {
          rec.__group = String(row.zc_RecordGroupData);
        }
        records.push(rec);
      }

      out[slug] = {
        reportName,
        columns: columns.map((c) => c.displayName),
        recordCount: records.length,
        records,
      };
      console.log(`    records: ${records.length}`);
      if (columns.length > 0) console.log('    columns:', columns.map((c) => c.displayName).join(' | ').substring(0, 300));
    } catch (e) {
      console.log(`    !! ERROR: ${e.message}`);
      out[slug] = { error: e.message };
    }
  }

  fs.writeFileSync('/tmp/zoho_complete_model.json', JSON.stringify(out, null, 2));
  console.log('\n\n=== COMPLETE MODEL EXTRACTION DONE ===');
  let total = 0;
  for (const [slug, v] of Object.entries(out)) {
    const n = v.recordCount || 0;
    total += n;
    console.log(`  [${slug}] records=${n} ${v.error ? 'ERR=' + v.error : ''}`);
  }
  console.log(`\nTOTAL RECORDS: ${total}`);
  await browser.close();
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});