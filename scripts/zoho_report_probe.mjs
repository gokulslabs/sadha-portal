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

  // Capture ALL requests/responses in detail
  const net = [];
  page.on('request', (req) => {
    if (['xhr', 'fetch', 'document', 'script'].includes(req.resourceType())) {
      net.push({ type: 'req', method: req.method(), url: req.url(), rt: req.resourceType(), post: req.postData()?.substring(0, 3000) || null });
    }
  });
  page.on('response', async (resp) => {
    const req = resp.request();
    if (['xhr', 'fetch', 'document'].includes(req.resourceType())) {
      let body = null;
      try {
        const ct = resp.headers()['content-type'] || '';
        if (ct.includes('json') || ct.includes('html')) {
          body = await resp.text();
        }
      } catch (e) {}
      net.push({ type: 'res', url: resp.url(), status: resp.status(), body: body ? body.substring(0, 200000) : null });
    }
  });

  // Navigate to Dashboard first
  await page.goto(PORTAL_URL + '#Page:Dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(12000);

  const route = process.argv[2] || '#Report:All_Diesel_Entries';
  console.log('Navigating to', route, '...');
  await page.goto(PORTAL_URL + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(15000);

  // Extract report content
  const reportHtml = await page.evaluate(() => {
    // Find the report container
    const containers = document.querySelectorAll('[class*="report"], [class*="zrpt"], [class*="zc-report"], [id*="report"], [class*="listData"], [class*="dataTable"]');
    const results = [];
    containers.forEach((el) => {
      results.push({
        tag: el.tagName,
        id: el.id,
        className: el.className,
        html: el.outerHTML.substring(0, 50000),
      });
    });
    // Also grab tables
    const tables = [];
    document.querySelectorAll('table').forEach((t) => {
      tables.push(t.outerHTML.substring(0, 50000));
    });
    return { containers: results, tables, bodyText: document.body.innerText.substring(0, 30000) };
  });

  fs.writeFileSync('/tmp/zoho_report_content.json', JSON.stringify(reportHtml, null, 2));
  fs.writeFileSync('/tmp/zoho_report_network.json', JSON.stringify(net, null, 2));

  // Print data API requests (the ones that fetch records)
  console.log('\n=== DATA-RELATED API CALLS ===');
  for (const n of net) {
    if (n.type === 'req' && (n.url.includes('grcweb') || n.url.includes('/report/') || n.url.includes('/data') || n.url.includes('/record') || n.url.includes('/zcapi') || n.url.includes('/component') || n.url.includes('/page'))) {
      console.log(n.method, n.rt, n.url.substring(0, 180));
      if (n.post) console.log('  POST:', n.post.substring(0, 500));
    }
  }

  console.log('\n=== REPORT BODY TEXT (first 3000) ===');
  console.log(reportHtml.bodyText.substring(0, 3000));

  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});