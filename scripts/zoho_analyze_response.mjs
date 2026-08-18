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

  // Capture the FULL first report data POST response
  let captured = null;
  page.on('response', async (resp) => {
    const req = resp.request();
    if (req.url().includes('/report/All_Diesel_Entries') && req.method() === 'POST' && !captured) {
      const text = await resp.text();
      captured = { post: req.postData(), text, status: resp.status() };
    }
  });

  await page.goto(PORTAL_URL + '#Report:All_Diesel_Entries', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  
  // Wait for post
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(800);
    if (captured) break;
  }

  if (!captured) {
    console.log('No POST captured');
    await browser.close();
    return;
  }

  console.log('Status:', captured.status);
  console.log('Body length:', captured.text.length);
  fs.writeFileSync('/tmp/zoho_full_response.txt', captured.text);
  fs.writeFileSync('/tmp/zoho_full_post.txt', captured.post || '');

  // Parse the JSON
  try {
    const j = JSON.parse(captured.text);
    console.log('Top-level keys:', Object.keys(j));
    for (const k of Object.keys(j)) {
      const v = j[k];
      console.log(`  ${k}: type=${typeof v} len=${typeof v === 'string' ? v.length : JSON.stringify(v).length}`);
    }
    if (j.HTML) {
      const html = j.HTML;
      const trCount = (html.match(/<tr/gi) || []).length;
      const tdCount = (html.match(/<td/gi) || []).length;
      console.log('HTML length:', html.length, '| <tr> count:', trCount, '| <td> count:', tdCount);
      // Find row delimiter classes
      const rowClasses = [...new Set([...html.matchAll(/<tr[^>]*class="([^"]*)"/g)].map((m) => m[1]))];
      console.log('Row classes:', rowClasses);
      // Save HTML for inspection
      fs.writeFileSync('/tmp/zoho_full_response.html', html);
    }
  } catch (e) {
    console.log('JSON parse error:', e.message);
  }

  // Print the decoded POST params
  try {
    const decoded = decodeURIComponent(captured.post || '');
    console.log('\n=== POST KEY PARAMS ===');
    for (const pair of decoded.split('&')) {
      const [k, v] = pair.split('=');
      if (['fromIDX', 'toIDX', 'pageSize', 'dataSize', 'totalRecords', 'isFirstPage', 'isLastPage', 'viewType', 'baseViewType', 'tableName', 'parentViewID', 'viewID', 'nViewName', 'previoustoIDX', 'previousfromIDX'].includes(k)) {
        console.log(`  ${k} = ${v}`);
      }
    }
  } catch (e) {}

  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});