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

  // Capture request HEADERS for the report POST
  page.on('request', (req) => {
    if (req.url().includes('/report/') && req.method() === 'POST') {
      const headers = req.headers();
      console.log('=== REPORT POST REQUEST HEADERS ===');
      for (const [k, v] of Object.entries(headers)) {
        if (!k.toLowerCase().includes('cookie')) console.log(`  ${k}: ${v}`);
      }
      console.log('=== POST DATA (decoded) ===');
      try {
        const decoded = decodeURIComponent(req.postData() || '');
        for (const pair of decoded.split('&')) console.log('  ' + pair);
      } catch (e) {}
    }
  });

  await page.goto(PORTAL_URL + '#Report:All_Diesel_Entries', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(12000);

  // Inspect scrollable containers and report DOM structure
  const domInfo = await page.evaluate(() => {
    const scrollables = [];
    document.querySelectorAll('*').forEach((el) => {
      const st = el.scrollTop;
      const style = window.getComputedStyle(el);
      if (el.scrollHeight > el.clientHeight + 10 && style.overflowY !== 'visible') {
        scrollables.push({
          tag: el.tagName,
          id: el.id,
          cls: (el.className || '').toString().substring(0, 120),
          clientHeight: el.clientHeight,
          scrollHeight: el.scrollHeight,
        });
      }
    });
    // Find all row containers and count rows
    const rowSelectors = ['tr', '[class*="row"]', '[class*="record"]', '[class*="rec"]'];
    const counts = {};
    rowSelectors.forEach((sel) => { counts[sel] = document.querySelectorAll(sel).length; });

    // Look for pagination / "Showing" element
    let showingText = '';
    const bodyText = document.body.innerText;
    const m = bodyText.match(/Showing[^\n]*/);
    if (m) showingText = m[0];

    return { scrollables, counts, showingText };
  });

  console.log(JSON.stringify(domInfo, null, 2));
  fs.writeFileSync('/tmp/zoho_dom_info.json', JSON.stringify(domInfo, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});