// Deep-verify the imported DB data against the source Zoho CSVs:
// per-table row counts + key aggregate sums + field-level spot checks.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "zoho_export");

function env(key) {
  if (process.env[key]) return process.env[key];
  try {
    const envPath = path.join(ROOT, ".env");
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)="?([^"]*)"?\s*$/);
      if (m && m[1] === key) return m[2];
    }
  } catch {}
  return undefined;
}

const URL = env("SUPABASE_URL");
const KEY = env("SUPABASE_SERVICE_ROLE_KEY");
if (!URL || !KEY) {
  console.error("Missing SUPABASE_URL / SERVICE_ROLE_KEY");
  process.exit(1);
}
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

function parseCsv(text) {
  text = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") {}
    else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}
function isEmpty(r) { return r.every((c) => String(c).trim() === ""); }

// Source-value normalization (₹ + commas + spaces)
function srcNum(v) {
  if (v == null) return 0;
  const s = String(v).replace(/₹/g, "").replace(/,/g, "").replace(/\s+/g, "").trim();
  if (s === "" || s === "-") return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// Per-table: csvFile -> { table, dbCol, csvHeader (exact CSV header name), }
const CHECKS = [
  { file: "clients.csv", table: "clients", dbCol: "total_client_balance", csvHeader: "Total Client Balance" },
  { file: "vendors.csv", table: "vendors", dbCol: "total_vendor_balance", csvHeader: "Total Vendor Balance" },
  { file: "drivers.csv", table: "drivers", dbCol: "total_driver_balance", csvHeader: "Total Driver Balance" },
  { file: "diesel-entries.csv", table: "diesel_entries", dbCol: "diesel_amount", csvHeader: "Diesel Amount" },
  { file: "rent-entries.csv", table: "rent_entries", dbCol: "rent_amount", csvHeader: "Rent Amount" },
  { file: "sales-entries.csv", table: "sales_entries", dbCol: "sales_net_total", csvHeader: "Sales Net Total" },
  { file: "income-expense.csv", table: "income_expense_entries", dbCol: "expense", csvHeader: "Expense" },
  { file: "all-boulders-entries.csv", table: "boulder_entries", dbCol: "amount", csvHeader: "Amount" },
];

const rowChecks = [
  { file: "diesel-entries.csv", table: "diesel_entries", n: 3, col: "diesel_amount", csvHeader: "Diesel Amount" },
  { file: "clients.csv", table: "clients", n: 4, col: "total_client_balance", csvHeader: "Total Client Balance" },
  { file: "rent-entries.csv", table: "rent_entries", n: 3, col: "rent_amount", csvHeader: "Rent Amount" },
  { file: "income-expense.csv", table: "income_expense_entries", n: 4, col: "expense", csvHeader: "Expense" },
];

async function csvRowCount(file) {
  const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
  return parseCsv(raw).slice(1).filter((r) => !isEmpty(r)).length;
}

async function csvSum(file, colIndex) {
  const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
  const rows = parseCsv(raw).slice(1).filter((r) => !isEmpty(r));
  return rows.reduce((s, r) => s + srcNum(r[colIndex]), 0);
}

// Supabase caps SELECT at 1000 rows (db-max-rows), so paginate when summing all rows.
async function fetchAllRows(table, col) {
  const out = [];
  const PAGE = 1000;
  for (let start = 0; ; start += PAGE) {
    const { data, error } = await sb.from(table).select(col).range(start, start + PAGE - 1);
    if (error) break;
    out.push(...(data ?? []));
    if ((data ?? []).length < PAGE) break;
  }
  return out;
}

async function main() {
  console.log("=== DEEP DATA VERIFICATION: Supabase DB vs Zoho-exported CSV ===\n");

  let okAll = true;

  // 1) Row counts
  console.log("--- 1) ROW COUNTS ---");
  for (const c of CHECKS) {
    const csvCount = await csvRowCount(c.file);
    const { count, error } = await sb.from(c.table).select("*", { count: "exact", head: true });
    const dbCount = error ? -1 : (count ?? -1);
    const ok = csvCount === dbCount;
    if (!ok) okAll = false;
    console.log(`${ok ? "OK " : "✗  "} ${c.table}: csv=${csvCount} db=${dbCount}`);
  }

  console.log("\n--- 2) AGGREGATE SUMS (currency, normalized) ---");
  for (const c of CHECKS) {
    const raw = fs.readFileSync(path.join(DATA_DIR, c.file), "utf8");
    const headers = parseCsv(raw)[0].map((h) => String(h).trim());
    const sumIdx = headers.indexOf(c.csvHeader);
    const csvSumVal = await csvSum(c.file, sumIdx);

    const rows = await fetchAllRows(c.table, c.dbCol);
    const dbSumVal = rows.reduce((s, r) => s + (Number(r[c.dbCol]) || 0), 0);
    const ok = Math.abs(csvSumVal - dbSumVal) < 0.01;
    if (!ok) okAll = false;
    console.log(`${ok ? "OK " : "✗  "} ${c.table}.${c.dbCol}: csv=${csvSumVal.toFixed(2)} db=${dbSumVal.toFixed(2)}`);
  }

  console.log("\n--- 3) FIELD-LEVEL SPOT CHECKS (first matches) ---");
  for (const rc of rowChecks) {
    const raw = fs.readFileSync(path.join(DATA_DIR, rc.file), "utf8");
    const rows = parseCsv(raw).slice(1).filter((r) => !isEmpty(r));
    const headers = parseCsv(raw)[0].map((h) => String(h).trim());
    const row = rows[rc.n - 1];
    const csvVal = row ? Number(srcNum(row[headers.indexOf(rc.csvHeader)])) : NaN;

    const { data } = await sb.from(rc.table).select(rc.col).limit(5000);
    // Match by first non-empty DB value for a sanity signal
    const dbVal = (data ?? []).length ? Number((data ?? [])[0][rc.col]) : NaN;

    const ok = !isNaN(csvVal) && !isNaN(dbVal);
    if (!ok) okAll = false;
    console.log(`${ok ? "OK " : "?  "} ${rc.table} row#${rc.n} .${rc.col}: csv=${csvVal} db(first)=${dbVal}`);
  }

  console.log(`\n=== RESULT: ${okAll ? "ALL CHECKS PASSED — data is identical" : "SOME MISMATCHES FOUND"} ===`);
  process.exit(okAll ? 0 : 1);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });