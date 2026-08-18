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

// In-page function to extract all metadata needed for the POST, then fetch all rows via fetch()
async function fetchReportRows(page, reportName) {
  return await page.evaluate(async (reportName) => {
    const self = window;
    // Try to find the report's required metadata from the page
    // The initial report POST needs: tableName, viewLinkName, viewID, parentViewID, viewFormName, formDisplayName, baseViewLinkName, nViewName, viewFormID

    // First trigger the report view load to populate metadata, by POSTing with pageSize large
    // We need to find the tableName etc from the handsontable instance or a global
    const meta = {};

    // Look for handsontable instance to get metadata
    if (self.Handsontable && self.Handsontable.instances) {
      // no-op
    }

    // Search for view metadata in the DOM
    const viewComp = document.querySelector('[id*="_ZC_"], [class*="view-outer"]');
    const outlook = {};

    // Attempt to find metadata from the page's JS globals or the report header
    // Fallback: read from the first data grid's data attributes
    const dataTable = document.querySelector('.handsontable');
    if (dataTable) {
      const parent = dataTable.closest('[id]');
      if (parent) outlook.viewContainerId = parent.id;
    }

    // We try a fetch POST with the params we know and large pageSize
    const params = new URLSearchParams();
    params.set('isPermaOrEmbed', 'false');
    params.set('zc_ColMenu', 'true');
    params.set('zc_Export', 'true');
    params.set('zc_BulkDuplicate', 'true');
    params.set('pageSize', '1000');
    params.set('allowAdd', 'true');
    params.set('zc_SecHeader', 'true');
    params.set('zc_RetainChanges', 'true');
    params.set('viewLinkName', reportName);
    params.set('zc_MoreAction', 'true');
    params.set('isNotDateFieldInAutoFilter', 'false');
    params.set('zc_DelRec', 'true');
    params.set('aggrColSize', '4');
    params.set('zc_AddRec', 'true');
    params.set('zc_Search', 'true');
    params.set('zc_EditBulkRec', 'true');
    params.set('previousfromIDX', '-1');
    params.set('fromIDX', '1');
    params.set('zc_ScrollTop', '0');
    params.set('allowDelete', 'true');
    params.set('isPerma', 'false');
    params.set('zc_Add', 'true');
    params.set('isSharedAnalyticsReport', 'false');
    params.set('zc_ShowAs', 'true');
    params.set('month', '0');
    params.set('isLastPage', 'false');
    params.set('viewType', '1');
    params.set('baseViewType', '1');
    params.set('zc_Header', 'true');
    params.set('zc_RecPrint', 'true');
    params.set('zc_ReportName', 'true');
    params.set('isGroup', 'true');
    params.set('isDetailedView', 'false');
    params.set('baseViewLinkName', reportName);
    params.set('toIDX', '2000');
    params.set('allowEdit', 'true');
    params.set('zc_RecordScroll', 'true');
    params.set('zc_Filter', 'true');
    params.set('zc_SumRow', 'true');
    params.set('allowDuplicate', 'true');
    params.set('isCreatorFive', 'true');
    params.set('isEmbed', 'false');
    params.set('zc_Print', 'true');
    params.set('dataSize', '2000');
    params.set('isPrint', 'false');
    params.set('zc_BulkDelete', 'true');
    params.set('allowBulkEdit', 'true');
    params.set('zc_Footer', 'true');
    params.set('isHTML', 'false');
    params.set('zc_Import', 'false');
    params.set('zc_RecSelect', 'true');
    params.set('zc_DuplRec', 'true');
    params.set('isFirstPage', 'true');
    params.set('isThirdpartyReport', 'false');
    params.set('openSearch', 'false');
    params.set('filterVal', 'All');
    params.set('isPreviousRecord', 'false');
    params.set('isAjaxSend', 'true');
    params.set('isSelectAllRecord', 'false');

    const url = '/grcweb/sadha-groups/report/' + reportName;
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
        body: params.toString(),
        credentials: 'include',
      });
      const text = await resp.text();
      return { status: resp.status, len: text.length, text: text.substring(0, 3000000) };
    } catch (e) {
      return { status: -1, len: 0, error: String(e.message || e) };
    }
  }, reportName);
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

  // Warm up: load the first report to establish session + get CSRF cookie
  await page.goto(PORTAL_URL + '#Report:All_Diesel_Entries', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(12000);

  const results = {};

  for (const [reportName, slug] of REPORTS) {
    console.log(`\n>>> [${slug}] ${reportName}`);
    try {
      // Navigate to the report first to load its context
      await page.goto(PORTAL_URL + '#Report:' + reportName, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(10000);

      const r = await fetchReportRows(page, reportName);
      console.log(`    fetch status: ${r.status}, length: ${r.len}`);
      if (r.text) {
        fs.writeFileSync(`/tmp/zoho_rows_${slug}.html`, r.text);
        results[slug] = { status: r.status, len: r.len };
      } else {
        results[slug] = { status: r.status, len: 0, error: r.error };
      }
    } catch (e) {
      console.log(`    !! ERROR: ${e.message}`);
      results[slug] = { error: e.message };
    }
  }

  fs.writeFileSync('/tmp/zoho_rows_results.json', JSON.stringify(results, null, 2));
  console.log('\n=== ROWS SUMMARY ===');
  for (const [slug, r] of Object.entries(results)) {
    console.log(`  [${slug}] ${JSON.stringify(r)}`);
  }
  await browser.close();
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});