import { chromium } from 'playwright';
import fs from 'fs';

const PORTAL_URL = 'https://sadhagroups.zohocreatorportal.com/';

// Reports that likely have many records
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

  // First, navigate once to load session and capture a sample POST for one report
  // to learn required headers
  const capturedPosts = [];

  // Navigate to first report to warm up
  await page.goto(PORTAL_URL + '#Report:All_Diesel_Entries', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(10000);

  // Now use context.request (carries cookies) to POST to report API directly
  // Learn CSRF token from cookies
  const cookies = await context.cookies();
  const csrfCookie = cookies.find((c) => c.name === 'CT_CSRF_TOKEN');
  console.log('CSRF token:', csrfCookie?.value);

  const results = {};

  for (const [reportName, slug] of REPORTS) {
    try {
      // First fetch the report shell to get container/table info
      const shellUrl = `${PORTAL_URL}/grcweb/sadha-groups/report/${reportName}`;
      const shellResp = await context.request.get(shellUrl);
      const shellBody = await shellResp.text();
      console.log(`\n>>> [${slug}] ${reportName} shell status: ${shellResp.status()}`);

      // Now POST with large pageSize to get all records
      // Common params observed earlier
      const formParams = new URLSearchParams();
      formParams.set('isPermaOrEmbed', 'false');
      formParams.set('zc_ColMenu', 'true');
      formParams.set('zc_Export', 'true');
      formParams.set('zc_BulkDuplicate', 'true');
      formParams.set('pageSize', '1000');
      formParams.set('allowAdd', 'true');
      formParams.set('zc_SecHeader', 'true');
      formParams.set('zc_RetainChanges', 'true');
      formParams.set('viewLinkName', reportName);
      formParams.set('zc_MoreAction', 'true');
      formParams.set('isNotDateFieldInAutoFilter', 'false');
      formParams.set('zc_DelRec', 'true');
      formParams.set('zc_AddRec', 'true');
      formParams.set('zc_Search', 'true');
      formParams.set('zc_EditBulkRec', 'true');
      formParams.set('previousfromIDX', '-1');
      formParams.set('fromIDX', '1');
      formParams.set('zc_ScrollTop', '0');
      formParams.set('allowDelete', 'true');
      formParams.set('isPerma', 'false');
      formParams.set('zc_Add', 'true');
      formParams.set('isSharedAnalyticsReport', 'false');
      formParams.set('zc_ShowAs', 'true');
      formParams.set('month', '0');
      formParams.set('isLastPage', 'false');
      formParams.set('viewType', '1');
      formParams.set('baseViewType', '1');
      formParams.set('zc_Header', 'true');
      formParams.set('zc_RecPrint', 'true');
      formParams.set('zc_ReportName', 'true');

      const postUrl = `${PORTAL_URL}/grcweb/sadha-groups/report/${reportName}`;
      const resp = await context.request.post(postUrl, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': '*/*',
        },
        data: formParams.toString(),
      });

      const body = await resp.text();
      results[slug] = {
        reportName,
        status: resp.status(),
        bodyLength: body.length,
        bodySample: body.substring(0, 2000),
      };
      console.log(`    POST status: ${resp.status()}, body length: ${body.length}`);

      // Save full body for parsing later
      fs.writeFileSync(`/tmp/zoho_bulk_${slug}.html`, body);
    } catch (e) {
      console.log(`    !! ERROR: ${e.message}`);
    }
  }

  fs.writeFileSync('/tmp/zoho_bulk_results.json', JSON.stringify(results, null, 2));
  console.log('\n=== BULK FETCH SUMMARY ===');
  for (const [slug, r] of Object.entries(results)) {
    console.log(`  [${slug}] status=${r.status} len=${r.bodyLength}`);
  }
  await browser.close();
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});