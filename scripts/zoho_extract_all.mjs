import { chromium } from 'playwright';
import fs from 'fs';

const PORTAL_URL = 'https://sadhagroups.zohocreatorportal.com/';

// All routes discovered from the portal navigation
const ROUTES = [
  ['Page:Dashboard', 'dashboard'],
  ['Page:Search_Statement', 'all-reports'],
  ['Report:All_Diesel_Entries', 'diesel-entries'],
  ['Report:All_Def_Oil_Entries', 'def-oil-entries'],
  ['Form:Add_Sales_Entry', 'add-sales-entry'],
  ['Report:All_Sales_Entry', 'sales-entries'],
  ['Form:Rent_Entry', 'add-rent-entry'],
  ['Report:All_Rent_Entries', 'rent-entries'],
  ['Form:Day_Fees_Entry', 'add-day-fees-entry'],
  ['Report:All_Day_Fees_Entries', 'day-fees-entries'],
  ['Page:Boulder_Reports', 'boulder-reports'],
  ['Form:Boulders_Entries', 'add-boulders-entries'],
  ['Report:All_Boulders_Entries', 'all-boulders-entries'],
  ['Report:Boulders_Diesel_Entries', 'boulders-diesel-entries'],
  ['Page:Excavator_Reports', 'excavator-reports'],
  ['Report:All_Machines', 'machines'],
  ['Report:All_Excavators_Entries', 'excavators-entries'],
  ['Report:Excavators_Daily_Entries1', 'excavators-daily-entries'],
  ['Report:Excavators_Rent_Entries1', 'excavators-rent-entries'],
  ['Report:Excavators_Diesel_Entries', 'excavators-diesel-entries'],
  ['Report:All_Accounts', 'accounts-overview'],
  ['Report:All_Income_Expense', 'income-expense'],
  ['Report:All_New_Materials', 'materials'],
  ['Report:All_New_Vendors', 'vendors'],
  ['Report:All_New_Clients', 'clients'],
  ['Report:All_Drivers', 'drivers'],
  ['Report:All_Vehicles', 'vehicles'],
  ['Report:All_Vendor_Material_Rates', 'material-rates'],
  ['Report:All_Units', 'units'],
  ['Report:All_Categories', 'categories'],
  ['Report:All_Sub_Categories', 'sub-categories'],
  ['Report:All_Payment_Categories', 'payment-categories'],
  ['Report:Company_Profile', 'company-profile'],
  ['Report:All_Business_Transporters', 'transporters'],
];

async function extractTable(page) {
  // Wait for a data table to render
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
  const skipped = [];

  for (const [route, slug] of ROUTES) {
    try {
      console.log(`\n>>> [${slug}] ${route}`);
      const target = PORTAL_URL + '#' + route;
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});

      // Wait for the view to render (poll for table rows)
      let tablesData = [];
      for (let attempt = 0; attempt < 20; attempt++) {
        await page.waitForTimeout(1500);
        tablesData = await extractTable(page);
        const totalRows = tablesData.reduce((s, t) => s + t.length, 0);
        if (totalRows > 0) break;
      }

      // Gather all body text as fallback
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 200000));

      const totalRows = tablesData.reduce((s, t) => s + t.length, 0);
      output[slug] = {
        route,
        tables: tablesData,
        bodyText,
        rowCount: totalRows,
      };
      console.log(`    -> tables: ${tablesData.length}, rows: ${totalRows}`);

      if (tablesData.length > 0) {
        // Print first table header + 2 rows sample
        const first = tablesData[0];
        if (first.length > 0) {
          console.log('    HEADER:', first[0].join(' | '));
          if (first.length > 1) console.log('    ROW1:  ', first[1].join(' | '));
        }
      }
    } catch (e) {
      console.log(`    !! ERROR: ${e.message}`);
      skipped.push({ route, slug, error: e.message });
    }
  }

  fs.writeFileSync('/tmp/zoho_extracted_data.json', JSON.stringify({ output, skipped }, null, 2));
  console.log('\n\n=== EXTRACTION COMPLETE ===');
  console.log('Slugs extracted:', Object.keys(output).length);
  console.log('Skipped:', skipped.length);
  for (const s of skipped) console.log('  -', s.slug, s.error);

  await browser.close();
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});