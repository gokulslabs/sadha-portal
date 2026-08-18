import { chromium } from "playwright";
import fs from "fs";

const EMAIL = process.env.ZOHO_EMAIL;
const PASSWORD = process.env.ZOHO_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error("ZOHO_EMAIL and ZOHO_PASSWORD env vars are required");
  process.exit(1);
}
const PORTAL = "https://sadhagroups.zohocreatorportal.com/";
const OUT = "/tmp/zoho_ux";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
});
const context = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();

// ---- Login ----
await page.goto(PORTAL, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
await page.waitForTimeout(3000);
const frame = page.frame({ name: "zohoiam" });
if (frame) {
  try {
    await frame.waitForSelector("#login_id", { timeout: 20000 });
    await frame.fill("#login_id", EMAIL);
    await frame.click('button[type="submit"], #nextbtn, input[type="submit"]').catch(() => {});
    await frame.waitForSelector("#password", { timeout: 20000 }).catch(() => {});
    await frame.fill("#password", PASSWORD).catch(() => {});
    await frame.click('button[type="submit"], #nextbtn, input[type="submit"]').catch(() => {});
  } catch (e) {
    console.log("login flow (may already be logged in):", e.message);
  }
}
await page.waitForTimeout(12000);
await context.storageState({ path: "/tmp/zoho_storage_state.json" });

const routes = [
  ["Dashboard", "#Page:Dashboard"],
  ["All Reports", "#Page:Search_Statement"],
  ["Diesel Entries", "#Report:All_Diesel_Entries"],
  ["Def Oil Entries", "#Report:All_Def_Oil_Entries"],
  ["Add Sales Entry", "#Form:Add_Sales_Entry"],
  ["Sales Entries", "#Report:All_Sales_Entry"],
  ["Add Rent Entry", "#Form:Rent_Entry"],
  ["Rent Entries", "#Report:All_Rent_Entries"],
  ["Add Day Fees Entry", "#Form:Day_Fees_Entry"],
  ["Day Fees Entries", "#Report:All_Day_Fees_Entries"],
  ["Boulder Reports", "#Page:Boulder_Reports"],
  ["Add Boulders Entries", "#Form:Boulders_Entries"],
  ["All Boulders Entries", "#Report:All_Boulders_Entries"],
  ["Boulders Diesel Entries", "#Report:Boulders_Diesel_Entries"],
  ["Excavator Reports", "#Page:Excavator_Reports"],
  ["Machines", "#Report:All_Machines"],
  ["Excavators Entries", "#Report:All_Excavators_Entries"],
  ["Excavators Daily Entries", "#Report:Excavators_Daily_Entries1"],
  ["Excavators Rent Entries", "#Report:Excavators_Rent_Entries1"],
  ["Excavators Diesel Entries", "#Report:Excavators_Diesel_Entries"],
  ["Accounts", "#Report:All_Accounts"],
  ["Income Expense", "#Report:All_Income_Expense"],
  ["Materials", "#Report:All_New_Materials"],
  ["Vendors", "#Report:All_New_Vendors"],
  ["Clients", "#Report:All_New_Clients"],
  ["Drivers", "#Report:All_Drivers"],
  ["Vehicles", "#Report:All_Vehicles"],
  ["Material Rates", "#Report:All_Vendor_Material_Rates"],
  ["Units", "#Report:All_Units"],
  ["Categories", "#Report:All_Categories"],
  ["Sub Categories", "#Report:All_Sub_Categories"],
  ["Payment Categories", "#Report:All_Payment_Categories"],
  ["Company Profile", "#Report:Company_Profile"],
  ["Transporters", "#Report:All_Business_Transporters"],
];

const report = [];
for (const [label, hash] of routes) {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  await page.goto(PORTAL + hash, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(4000);

  // Screenshot
  await page.screenshot({ path: `${OUT}/${slug}.png`, fullPage: false }).catch(() => {});

  // Is it a form or a list?
  const kind = hash.startsWith("#Form:") ? "form" : hash.startsWith("#Page:") ? "page" : "report";

  let fields = [];
  if (kind === "form") {
    fields = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll(".zc-form-row, .zc-formfield, .form-group, .zc-field-wrapper, .zc-form-item").forEach((el) => {
        const labelEl = el.querySelector("label, .zc-form-label, .field-label");
        const label = (labelEl?.innerText || "").trim();
        const input = el.querySelector("input, select, textarea");
        const type = input?.getAttribute("type") || input?.tagName?.toLowerCase() || "";
        const name = input?.getAttribute("name") || input?.getAttribute("id") || "";
        if (label || name) out.push({ label, type, name });
      });
      return out.slice(0, 80);
    }).catch(() => []);
  }

  report.push({ label, hash, kind, fields, screenshot: `${slug}.png` });
  console.log(`✔ ${label} (${kind})${fields.length ? ` — ${fields.length} fields` : ""}`);
}

fs.writeFileSync(`${OUT}/_ui_audit_report.json`, JSON.stringify(report, null, 2));

// Capture theme: body/canvas fonts + colors
const theme = await page.evaluate(() => {
  const body = getComputedStyle(document.body);
  const collect = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = getComputedStyle(el);
    return { color: s.color, background: s.backgroundColor, font: s.fontFamily, fontSize: s.fontSize };
  };
  return {
    body: { font: body.fontFamily, bg: body.backgroundColor, color: body.color },
    header: collect(".zc-header, .zc-app-header, header"),
    sidebar: collect(".zc-sidebar, .zc-left-pane, .zc-app-nav, nav"),
    button: collect("button, .zc-btn, .btn"),
  };
});
fs.writeFileSync(`${OUT}/_theme.json`, JSON.stringify(theme, null, 2));

console.log("\n=== DONE ===");
console.log(`Screenshots + audit saved to ${OUT}`);
console.log(`Total routes captured: ${report.length}`);

await browser.close();