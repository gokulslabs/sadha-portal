import { chromium } from 'playwright';
import fs from 'fs';

const EMAIL = process.env.ZOHO_EMAIL;
const PASSWORD = process.env.ZOHO_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error('ZOHO_EMAIL and ZOHO_PASSWORD env vars are required');
  process.exit(1);
}
const PORTAL_URL = 'https://sadhagroups.zohocreatorportal.com/';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  
  // Capture all network requests
  const apiCalls = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('sadhagroups.zohocreatorportal.com') || url.includes('creator') || url.includes('api')) {
      try {
        const ct = response.headers()['content-type'] || '';
        let body = null;
        if (ct.includes('json') || url.includes('api')) {
          body = await response.text().catch(() => null);
        }
        apiCalls.push({
          url,
          status: response.status(),
          method: response.request().method(),
          contentType: ct,
          body: body ? body.substring(0, 5000) : null,
        });
      } catch (e) {}
    }
  });

  console.log('Navigating to portal...');
  await page.goto(PORTAL_URL, { waitUntil: 'networkidle', timeout: 60000 });
  
  // Wait for the sign-in iframe to load
  console.log('Waiting for sign-in iframe...');
  await page.waitForSelector('iframe[name="zohoiam"]', { timeout: 30000 });
  
  // Get the iframe
  const frame = page.frame({ name: 'zohoiam' });
  console.log('Frame URL:', frame?.url());
  
  if (!frame) {
    throw new Error('Could not find sign-in iframe');
  }

  // Wait for login form fields
  await frame.waitForSelector('#login_id', { timeout: 30000 });
  console.log('Login form found, filling credentials...');
  
  // Fill in email
  await frame.fill('#login_id', EMAIL);
  
  // Click continue/next to go to password
  await frame.click('button[type="submit"], #nextbtn, input[type="submit"]').catch(async () => {
    // Try submitting the form
    await frame.evaluate(() => {
      const form = document.getElementById('login');
      if (form) form.submit();
    });
  });
  
  // Wait for password field
  try {
    await frame.waitForSelector('#password', { timeout: 15000 });
    console.log('Password field found, entering password...');
    await frame.fill('#password', PASSWORD);
    
    // Submit the form
    await frame.click('button[type="submit"], #nextbtn, input[type="submit"]').catch(async () => {
      await frame.evaluate(() => {
        const form = document.getElementById('login');
        if (form) form.submit();
      });
    });
  } catch (e) {
    console.log('Password field not found immediately, waiting...');
    await page.waitForTimeout(3000);
    // Try direct submission
    await frame.evaluate(() => {
      const form = document.getElementById('login');
      if (form) form.submit();
    });
  }

  console.log('Waiting for login to complete...');
  
  // Wait for navigation away from login
  await page.waitForTimeout(10000);
  
  // Check current URL
  console.log('Current URL after login attempt:', page.url());
  
  // Check if we're still on the login page
  const pageContent = await page.content();
  if (pageContent.includes('signinPage') || page.url().includes('signin')) {
    console.log('Still on login page. Checking for errors...');
    const errorText = await page.locator('.error_message, .fielderror, .Errormsg').textContent().catch(() => '');
    console.log('Error:', errorText);
    
    // Check iframe state
    const frame2 = page.frame({ name: 'zohoiam' });
    if (frame2) {
      const frameContent = await frame2.content();
      const framesErrors = await frame2.locator('.error_message, .fielderror, .Errormsg, .alert_message').allTextContents().catch(() => []);
      console.log('Frame errors:', framesErrors);
    }
  } else {
    console.log('Login successful! Navigating to Dashboard...');
    await page.waitForTimeout(5000);
    
    // Navigate to the dashboard page
    await page.goto('https://sadhagroups.zohocreatorportal.com/#Page:Dashboard', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(10000);
    
    // Get page content after navigation
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    // Take a screenshot
    await page.screenshot({ path: '/tmp/zoho_dashboard.png', fullPage: false });
    console.log('Screenshot saved to /tmp/zoho_dashboard.png');
    
    // Get all frames
    const frames = page.frames();
    console.log('Frames:', frames.map(f => f.url()));
    
    // Extract visible text from the page
    const bodyText = await page.evaluate(() => {
      return document.body.innerText.substring(0, 5000);
    });
    console.log('\n=== PAGE TEXT ===');
    console.log(bodyText);
    console.log('\n=== END PAGE TEXT ===');
    
    // Look for data tables and content
    const tables = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('table, .dataGrid, .zdt-table, .report-data, .form-data').forEach((el, i) => {
        results.push({
          index: i,
          tag: el.tagName,
          className: el.className,
          text: el.innerText.substring(0, 1000),
        });
      });
      return results;
    });
    console.log('\n=== TABLES FOUND ===');
    console.log(JSON.stringify(tables, null, 2));
  }

  // Save all API calls
  fs.writeFileSync('/tmp/zoho_api_calls.json', JSON.stringify(apiCalls, null, 2));
  console.log('\nAPI calls captured:', apiCalls.length);
  
  // Save cookies/storage state for reuse
  await context.storageState({ path: '/tmp/zoho_storage_state.json' });
  console.log('Storage state saved to /tmp/zoho_storage_state.json');

  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});