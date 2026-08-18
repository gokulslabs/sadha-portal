import { chromium } from 'playwright';
import fs from 'fs';

const PORTAL_URL = 'https://sadhagroups.zohocreatorportal.com/';

const REPORTS = [
  ['All_Diesel_Entries', 'diesel-entries'],
  ['All_Sales_Entry', 'sales-entries'],
  ['All_Rent_Entries', 'rent-entries'],
  ['All_Boulders_Entries', 'all-boulders-entries'],
  ['Boulders_Diesel_Entries', 'boulders-diesel-entries'],
  ['Excavators_Daily_Entries1', 'excavators-daily-entries'],
  ['Excavators_Rent_Entries1', 'excavators-rent-entries'],
  ['Excavators_Diesel_Entries', 'excavators-diesel-entries'],
  ['All_Income_Expense', 'income-expense'],
];

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

    // Capture the exact data POST body (the first one with pageSize=10)
    let capturedPost = null;
    const onRequest = (req) => {
      if (req.url().includes('/report/' + reportName) && req.method() === 'POST' && !capturedPost) {
        capturedPost = req.postData();
      }
    };
    page.on('request', onRequest);

    try {
      await page.goto(PORTAL_URL + '#Report:' + reportName, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      // Wait for the data POST to fire
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(800);
        if (capturedPost) break;
      }
      page.off('request', onRequest);

      if (!capturedPost) {
        console.log('    !! No POST captured');
        out[slug] = { error: 'no capture' };
        continue;
      }

      // Parse captured body, replace pageSize/fromIDX/toIDX with large values
      const params = new URLSearchParams(capturedPost);
      const origPageSize = params.get('pageSize');
      params.set('pageSize', '5000');
      params.set('fromIDX', '1');
      params.set('toIDX', '5000');
      params.set('dataSize', '5000');
      params.set('zc_RecordScroll', 'false');
      params.set('isLastPage', 'true');

      console.log('    captured POST params:', params.get('tableName'), '| pageSize', origPageSize, '-> 5000');
      console.log('    zccpn present:', Boolean(params.get('zccpn')));

      // Replay via in-page fetch (cookies auto-included)
      const fetched = await page.evaluate(async (arg) => {
        const resp = await fetch(arg.urlPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
          body: arg.body,
          credentials: 'include',
        });
        const text = await resp.text();
        return { status: resp.status, text };
      }, { body: params.toString(), urlPath: '/grcweb/sadha-groups/report/' + reportName });

      console.log('    replay status:', fetched.status, '| body length:', fetched.text.length);

      if (fetched.status === 200 && fetched.text.length > 0) {
        fs.writeFileSync(`/tmp/zoho_complete_${slug}.json`, fetched.text);
        // Try to parse JSON and extract HTML
        try {
          const j = JSON.parse(fetched.text);
          if (j.HTML) {
            out[slug] = { reportName, status: fetched.status, htmlLength: j.HTML.length };
            // Parse HTML to count rows
            const rowCount = (j.HTML.match(/<tr/gi) || []).length;
            out[slug].trCount = rowCount;
            console.log('    HTML length:', j.HTML.length, '| <tr> count:', rowCount);
          } else {
            out[slug] = { reportName, status: fetched.status, keys: Object.keys(j), bodyLength: fetched.text.length };
            console.log('    JSON keys:', Object.keys(j));
          }
        } catch (e) {
          out[slug] = { reportName, status: fetched.status, bodyLength: fetched.text.length, note: 'non-json' };
        }
      } else {
        out[slug] = { error: 'status ' + fetched.status, bodySample: fetched.text.substring(0, 300) };
      }
    } catch (e) {
      console.log(`    !! ERROR: ${e.message}`);
      out[slug] = { error: e.message };
    }
  }

  fs.writeFileSync('/tmp/zoho_complete_results.json', JSON.stringify(out, null, 2));
  console.log('\n=== COMPLETE EXTRACTION RESULT ===');
  for (const [slug, v] of Object.entries(out)) {
    console.log(`  [${slug}] ${JSON.stringify(v)}`);
  }
  await browser.close();
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});