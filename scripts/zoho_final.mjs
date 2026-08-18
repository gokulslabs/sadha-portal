import { chromium } from 'playwright';
import fs from 'fs';

const PORTAL_URL = 'https://sadhagroups.zohocreatorportal.com/';

const BIG_REPORTS = [
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
  page.setDefaultTimeout(45000);

  const out = {};

  for (const [reportName, slug] of BIG_REPORTS) {
    console.log(`\n>>> [${slug}] ${reportName}`);

    // Capture ALL report POST responses (each page of data) for this report
    const pageResponses = [];
    const onResponse = async (resp) => {
      const req = resp.request();
      if (req.url().includes('/report/' + reportName) && req.method() === 'POST') {
        try {
          const text = await resp.text();
          pageResponses.push({ url: req.url(), post: req.postData(), status: resp.status(), text });
        } catch (e) {}
      }
    };
    page.on('response', onResponse);

    try {
      await page.goto(PORTAL_URL + '#Report:' + reportName, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(8000);

      // Scroll the .wtHolder container to bottom many times to trigger lazy page loads
      for (let i = 0; i < 40; i++) {
        const scrollInfo = await page.evaluate(async () => {
          const holders = document.querySelectorAll('.wtHolder');
          let scrolled = false;
          for (const h of holders) {
            const before = h.scrollTop;
            h.scrollTop = h.scrollHeight;
            h.dispatchEvent(new Event('scroll', { bubbles: true }));
            if (h.scrollTop !== before) scrolled = true;
          }
          // Also scroll window
          window.scrollTo(0, document.body.scrollHeight);
          await new Promise((r) => setTimeout(r, 350));
          return { scrolled, holders: holders.length };
        });
        if (!scrollInfo.scrolled && scrollInfo.holders === 0) break;
      }

      // Final wait for any late responses
      await page.waitForTimeout(4000);
      page.off('response', onResponse);

      console.log(`    captured ${pageResponses.length} POST responses`);

      // Collect all rows from all responses
      const allRows = new Set();
      for (const [idx, pr] of pageResponses.entries()) {
        if (pr.status !== 200) continue;
        try {
          const j = JSON.parse(pr.text);
          const html = j.HTML || pr.text;
          // Extract rows: each row is a <tr>
          const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
          for (const rowHtml of rows) {
            // extract cell text
            const cells = [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) =>
              m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
            );
            if (cells.some((c) => c)) {
              allRows.add(JSON.stringify(cells));
            }
          }
        } catch (e) {
          // non-json fallback: extract rows directly
          const rows = pr.text.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
          for (const rowHtml of rows) {
            const cells = [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) =>
              m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
            );
            if (cells.some((c) => c)) allRows.add(JSON.stringify(cells));
          }
        }
      }

      const rows = [...allRows].map((r) => JSON.parse(r));
      out[slug] = { reportName, responseCount: pageResponses.length, uniqueRows: rows.length, rows };
      console.log(`    unique rows: ${rows.length}`);
    } catch (e) {
      console.log(`    !! ERROR: ${e.message}`);
      out[slug] = { error: e.message };
    }
  }

  fs.writeFileSync('/tmp/zoho_final_data.json', JSON.stringify(out, null, 2));
  console.log('\n=== FINAL SUMMARY ===');
  for (const [slug, v] of Object.entries(out)) {
    console.log(`  [${slug}] responses=${v.responseCount ?? 0} uniqueRows=${v.uniqueRows ?? 0} ${v.error ? 'ERR=' + v.error : ''}`);
  }
  await browser.close();
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});