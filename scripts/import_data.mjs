// Import extracted Zoho data (data/zoho_export/*.csv) into the new Supabase DB.
//
// Usage:
//   bun run scripts/import_data.mjs              → dry-run (validate + count, no writes)
//   bun run scripts/import_data.mjs --execute    → clear target tables + insert
//
// Credentials are read from env vars (or the project .env file). No secrets are
// hardcoded in this file.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "zoho_export");

const EXECUTE = process.argv.includes("--execute");

// ---- Load env (process env wins; otherwise read .env) ----
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
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (from .env or env vars)");
  process.exit(1);
}

// ---- Value coercion ----
function txt(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function num(v) {
  if (v == null) return 0;
  const s = String(v)
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (s === "" || s === "-") return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function coerce(type, v) {
  if (type === "number" || type === "currency") return num(v);
  return txt(v);
}

// ---- RFC 4180 CSV parser (handles quotes, commas-in-quotes, CRLF, BOM) ----
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
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // skip
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function isEmptyRow(row) {
  return row.every((c) => String(c).trim() === "");
}

// ---- Column mappings (source header -> { dest, type }) ----
const IMPORTS = [
  {
    file: "accounts-overview.csv",
    table: "accounts",
    columns: [
      ["Date", "entry_date", "text"],
      ["Account Type", "account_type", "text"],
      ["Bank Name", "bank_name", "text"],
      ["Display Name", "display_name", "text"],
      ["Holder", "holder", "text"],
      ["Cash Adjustment", "cash_adjustment", "currency"],
      ["Money Transfer", "money_transfer", "currency"],
      ["Current Balance", "current_balance", "currency"],
    ],
  },
  {
    file: "all-boulders-entries.csv",
    table: "boulder_entries",
    columns: [
      ["ID", "zoho_id", "text"],
      ["Date", "entry_date", "text"],
      ["Boulder Shift", "boulder_shift", "text"],
      ["Business Transporters", "business_transporters", "text"],
      ["Client Name", "client_name", "text"],
      ["Unit", "unit", "text"],
      ["Boulders Source", "boulders_source", "text"],
      ["Total Loads", "total_loads", "number"],
      ["Total Tons", "total_tons", "number"],
      ["Ton Per Rate", "ton_per_rate", "number"],
      ["Amount", "amount", "currency"],
      ["GST", "gst", "number"],
      ["GST Amount", "gst_amount", "currency"],
      ["Amount with GST", "amount_with_gst", "currency"],
      ["Vehicle Number", "vehicle_number", "text"],
      ["Driver Name", "driver_name", "text"],
      ["Driver Padi", "driver_padi", "currency"],
      ["Driver Food Amount", "driver_food_amount", "currency"],
      ["Driver Advance", "driver_advance", "currency"],
      ["Choose Account", "choose_account", "text"],
      ["Driver Net Total", "driver_net_total", "currency"],
      ["Total Vehicle Expense", "total_vehicle_expense", "currency"],
      ["Diesel Source", "diesel_source", "text"],
      ["Diesel Liters", "diesel_liters", "number"],
      ["Diesel Amount", "diesel_amount", "currency"],
      ["Bunk Reference", "bunk_reference", "text"],
      ["Total Trip Expense", "total_trip_expense", "currency"],
      ["Profit", "profit", "currency"],
    ],
  },
  {
    file: "boulders-diesel-entries.csv",
    table: "boulder_diesel_entries",
    columns: [
      ["ID", "zoho_id", "text"],
      ["Source", "source", "text"],
      ["Date", "entry_date", "text"],
      ["Vehicle", "vehicle", "text"],
      ["Driver", "driver", "text"],
      ["Diesel Rate Per Liter", "diesel_rate_per_liter", "currency"],
      ["Diesel Liters", "diesel_liters", "number"],
      ["Mileage", "mileage", "text"],
      ["Diesel Amount", "diesel_amount", "currency"],
      ["Bunk Reference", "bunk_reference", "text"],
      ["Tank Status", "tank_status", "text"],
      ["Rec From", "rec_from", "text"],
      ["Boulders Entries", "boulders_entries", "text"],
      ["DC Number", "dc_number", "text"],
      ["Added User", "added_user", "text"],
    ],
  },
  {
    file: "categories.csv",
    table: "categories",
    columns: [["Category Name", "category_name", "text"]],
  },
  {
    file: "clients.csv",
    table: "clients",
    columns: [
      ["Client ID", "client_id", "text"],
      ["Added Time", "added_time", "text"],
      ["Client Name", "client_name", "text"],
      ["Address", "address", "text"],
      ["Email", "email", "text"],
      ["Phone", "phone", "text"],
      ["GSTIN", "gstin", "text"],
      ["Opening Balance", "opening_balance", "currency"],
      ["Old Balance", "old_balance", "currency"],
      ["Current Balance", "current_balance", "currency"],
      ["Diesel Balance", "diesel_balance", "currency"],
      ["Total Client Balance", "total_client_balance", "currency"],
    ],
  },
  {
    file: "company-profile.csv",
    table: "company_profile",
    columns: [
      ["Company Name", "company_name", "text"],
      ["Contact Person", "contact_person", "text"],
      ["Email", "email", "text"],
      ["Phone", "phone", "text"],
      ["Address", "address", "text"],
    ],
  },
  {
    file: "day-fees-entries.csv",
    table: "day_fees_entries",
    columns: [
      ["ID", "zoho_id", "text"],
      ["DC Number", "dc_number", "text"],
      ["Date", "entry_date", "text"],
      ["Purchase From", "purchase_from", "text"],
      ["Client Name", "client_name", "text"],
      ["Delivery Location", "delivery_location", "text"],
      ["Material", "material", "text"],
      ["Unit", "unit", "text"],
      ["Quantity", "quantity", "number"],
      ["Total load", "total_load", "number"],
      ["Vehicle Number", "vehicle_number", "text"],
      ["Driver Name", "driver_name", "text"],
      ["Per Day amount", "per_day_amount", "currency"],
      ["Amount with GST", "amount_with_gst", "currency"],
      ["Driver Padi", "driver_padi", "currency"],
      ["Driver Food Amount", "driver_food_amount", "currency"],
      ["Shed Work Amount", "shed_work_amount", "currency"],
      ["Driver Advance", "driver_advance", "currency"],
      ["Driver Net Total", "driver_net_total", "currency"],
      ["Diesel Source", "diesel_source", "text"],
      ["Diesel Liters", "diesel_liters", "number"],
      ["Diesel Amount", "diesel_amount", "currency"],
      ["Bunk Reference", "bunk_reference", "text"],
      ["Total Vehicle Expense", "total_vehicle_expense", "currency"],
      ["Total Trip Expense", "total_trip_expense", "currency"],
      ["Profit", "profit", "currency"],
    ],
  },
  {
    file: "def-oil-entries.csv",
    table: "def_oil_entries",
    columns: [
      ["ID", "zoho_id", "text"],
      ["Date-Time", "date_time", "text"],
      ["Transporters", "transporters", "text"],
      ["Vehicle", "vehicle", "text"],
      ["Driver", "driver", "text"],
      ["Source", "source", "text"],
      ["Def Oil Per Liter", "def_oil_per_liter", "currency"],
      ["Def Oil Liters", "def_oil_liters", "number"],
      ["Def Oil Amount", "def_oil_amount", "currency"],
      ["Rec From", "rec_from", "text"],
      ["Mileage", "mileage", "text"],
      ["From KM", "from_km", "number"],
      ["To KM", "to_km", "number"],
      ["Total KM", "total_km", "number"],
      ["Bunk Reference", "bunk_reference", "text"],
      ["Tank Status", "tank_status", "text"],
    ],
  },
  {
    file: "diesel-entries.csv",
    table: "diesel_entries",
    columns: [
      ["ID", "zoho_id", "text"],
      ["Source", "source", "text"],
      ["Date", "entry_date", "text"],
      ["Driver", "driver", "text"],
      ["Vehicle", "vehicle", "text"],
      ["Diesel Liters", "diesel_liters", "number"],
      ["Diesel Rate Per Liter", "diesel_rate_per_liter", "currency"],
      ["Diesel Amount", "diesel_amount", "currency"],
      ["Mileage", "mileage", "text"],
      ["Tank Status", "tank_status", "text"],
      ["Rec From", "rec_from", "text"],
      ["From KM", "from_km", "number"],
      ["To KM", "to_km", "number"],
      ["Total KM", "total_km", "number"],
      ["DC Number", "dc_number", "text"],
      ["Added User", "added_user", "text"],
      ["Added Time", "added_time", "text"],
    ],
  },
  {
    file: "drivers.csv",
    table: "drivers",
    columns: [
      ["Driver ID", "driver_id", "text"],
      ["Driver Name", "driver_name", "text"],
      ["Driver Image", "driver_image", "text"],
      ["Phone", "phone", "text"],
      ["License Number", "license_number", "text"],
      ["Opening Balance", "opening_balance", "currency"],
      ["Old Balance", "old_balance", "currency"],
      ["Driver Balance", "driver_balance", "currency"],
      ["Total Driver Balance", "total_driver_balance", "currency"],
    ],
  },
  {
    file: "excavators-daily-entries.csv",
    table: "excavator_daily_entries",
    columns: [
      ["ID", "zoho_id", "text"],
      ["Date", "entry_date", "text"],
      ["Client", "client", "text"],
      ["Loads /Day", "loads_per_day", "number"],
      ["Ton / Day", "ton_per_day", "number"],
      ["Ton Per Rate", "ton_per_rate", "number"],
      ["Amount", "amount", "currency"],
      ["GST", "gst", "number"],
      ["Gst Amount", "gst_amount", "currency"],
      ["Amount With GST", "amount_with_gst", "currency"],
      ["Diesel Source", "diesel_source", "text"],
      ["Bunk Reference", "bunk_reference", "text"],
      ["Diesel Liters", "diesel_liters", "number"],
      ["Diesel Rate", "diesel_rate", "currency"],
      ["Diesel Amount", "diesel_amount", "currency"],
      ["Profit", "profit", "currency"],
      ["Added Time", "added_time", "text"],
    ],
  },
  {
    file: "excavators-diesel-entries.csv",
    table: "excavator_diesel_entries",
    columns: [
      ["ID", "zoho_id", "text"],
      ["Date", "entry_date", "text"],
      ["Source", "source", "text"],
      ["Machine", "machine", "text"],
      ["Driver", "driver", "text"],
      ["Diesel Liters", "diesel_liters", "number"],
      ["Diesel Rate Per Liter", "diesel_rate_per_liter", "currency"],
      ["Diesel Amount", "diesel_amount", "currency"],
      ["Mileage", "mileage", "text"],
      ["Tank Status", "tank_status", "text"],
      ["Rec From", "rec_from", "text"],
      ["Bunk Reference", "bunk_reference", "text"],
      ["Added User", "added_user", "text"],
      ["DC Number", "dc_number", "text"],
      ["Excavators Rent Entries", "excavator_rent_entry_id", "text"],
      ["Excavators", "excavator_id", "text"],
      ["Excavators Daily Entries", "excavator_daily_entry_id", "text"],
    ],
  },
  {
    file: "excavators-rent-entries.csv",
    table: "excavator_rent_entries",
    columns: [
      ["Rent ID", "rent_id", "text"],
      ["Date", "entry_date", "text"],
      ["Machine", "machine", "text"],
      ["Driver", "driver", "text"],
      ["Client", "client", "text"],
      ["Start Hour", "start_hour", "number"],
      ["End Hour", "end_hour", "number"],
      ["Total Hour", "total_hour", "number"],
      ["Rate Per Hour", "rate_per_hour", "currency"],
      ["Amount", "amount", "currency"],
      ["GST", "gst", "number"],
      ["Gst Amount", "gst_amount", "currency"],
      ["Amount With GST", "amount_with_gst", "currency"],
      ["Diesel Source", "diesel_source", "text"],
      ["Diesel Filling (L)", "diesel_filling_l", "number"],
      ["Diesel Rate Per Liter", "diesel_rate_per_liter", "currency"],
      ["Diesel Amount", "diesel_amount", "currency"],
      ["Tank Status", "tank_status", "text"],
      ["Bunk Reference", "bunk_reference", "text"],
      ["Mileage", "mileage", "text"],
      ["Remarks", "remarks", "text"],
    ],
  },
  {
    file: "income-expense.csv",
    table: "income_expense_entries",
    columns: [
      ["Payment ID", "payment_id", "text"],
      ["Type", "type", "text"],
      ["Date-Time", "date_time", "text"],
      ["Account", "account", "text"],
      ["Payment For", "payment_for", "text"],
      ["Category", "category", "text"],
      ["Remarks", "remarks", "text"],
      ["Income", "income", "currency"],
      ["Expense", "expense", "currency"],
    ],
  },
  {
    file: "machines.csv",
    table: "machines",
    columns: [
      ["Machine ID", "machine_id", "text"],
      ["Machine Name", "machine_name", "text"],
      ["Machine Number", "machine_number", "text"],
      ["Machine Category", "machine_category", "text"],
    ],
  },
  {
    file: "materials.csv",
    table: "materials",
    columns: [
      ["Material ID", "material_id", "text"],
      ["Material Name", "material_name", "text"],
      ["Material Category", "material_category", "text"],
      ["Material Unit", "material_unit", "text"],
      ["Description", "description", "text"],
      ["Default Sale Rate", "default_sale_rate", "text"],
    ],
  },
  {
    file: "payment-categories.csv",
    table: "payment_categories",
    columns: [["Category Name", "category_name", "text"]],
  },
  {
    file: "rent-entries.csv",
    table: "rent_entries",
    columns: [
      ["Rent Entry ID", "rent_entry_id", "text"],
      ["Date", "entry_date", "text"],
      ["DC No", "dc_no", "text"],
      ["Transporters", "transporters", "text"],
      ["Purchase From", "purchase_from", "text"],
      ["Material", "material", "text"],
      ["Quantity", "quantity", "number"],
      ["Unit", "unit", "text"],
      ["Client Name", "client_name", "text"],
      ["Delivery Location", "delivery_location", "text"],
      ["Rent Quantity", "rent_quantity", "number"],
      ["Rent Price (Per Unit/Ton)", "rent_price", "currency"],
      ["Rent Amount", "rent_amount", "currency"],
      ["Rent Amount with GST", "rent_amount_with_gst", "currency"],
      ["Vehicle Number", "vehicle_number", "text"],
      ["Driver Name", "driver_name", "text"],
      ["Driver Padi", "driver_padi", "currency"],
      ["Driver Food Amount", "driver_food_amount", "currency"],
      ["Shed Work Amount", "shed_work_amount", "currency"],
      ["Total Vehicle Expense", "total_vehicle_expense", "currency"],
      ["Driver Advance", "driver_advance", "currency"],
      ["Driver Net Total", "driver_net_total", "currency"],
      ["Diesel Source", "diesel_source", "text"],
      ["Diesel Liters", "diesel_liters", "number"],
      ["From KM", "from_km", "number"],
      ["To KM", "to_km", "number"],
      ["Total KM", "total_km", "number"],
      ["Mileage", "mileage", "text"],
      ["Tank Status", "tank_status", "text"],
      ["Bunk Reference", "bunk_reference", "text"],
      ["Diesel Rate Per Liter", "diesel_rate_per_liter", "currency"],
      ["Diesel Amount", "diesel_amount", "currency"],
      ["Total Trip Expense", "total_trip_expense", "currency"],
      ["Profit", "profit", "currency"],
      ["ID", "zoho_id", "text"],
      ["Modified User", "modified_user", "text"],
    ],
  },
  {
    file: "sales-entries.csv",
    table: "sales_entries",
    columns: [
      ["Sales ID", "sales_id", "text"],
      ["DC No", "dc_no", "text"],
      ["Date", "entry_date", "text"],
      ["Transporters", "transporters", "text"],
      ["Purchase From", "purchase_from", "text"],
      ["Client Name", "client_name", "text"],
      ["Delivery Location", "delivery_location", "text"],
      ["Vehicle", "vehicle", "text"],
      ["Driver", "driver", "text"],
      ["Purchase Quantity", "purchase_quantity", "number"],
      ["Materials", "materials", "text"],
      ["Purchase Unit", "purchase_unit", "text"],
      ["Purchase Net Total", "purchase_net_total", "currency"],
      ["Sales Quantity", "sales_quantity", "number"],
      ["Sales Unit", "sales_unit", "text"],
      ["Sales Net Total", "sales_net_total", "currency"],
      ["Driver Padi", "driver_padi", "currency"],
      ["Driver Food Amount", "driver_food_amount", "currency"],
      ["Shed Work Amount", "shed_work_amount", "currency"],
      ["Total Vehicle Expense", "total_vehicle_expense", "currency"],
      ["Driver Advance", "driver_advance", "currency"],
      ["Driver Net Total", "driver_net_total", "currency"],
      ["Diesel Amount", "diesel_amount", "currency"],
      ["Profit", "profit", "currency"],
    ],
  },
  {
    file: "sub-categories.csv",
    table: "sub_categories",
    columns: [["Sub Category Name", "sub_category_name", "text"]],
  },
  {
    file: "transporters.csv",
    table: "transporters",
    columns: [
      ["Transporters ID", "transporter_id", "text"],
      ["Transporters Name", "transporter_name", "text"],
      ["Contact Person", "contact_person", "text"],
      ["Phone", "phone", "text"],
      ["Email", "email", "text"],
      ["Transporters Balance", "transporter_balance", "currency"],
      ["Portal Status", "portal_status", "text"],
    ],
  },
  {
    file: "units.csv",
    table: "units",
    columns: [
      ["Unit Name", "unit_name", "text"],
      ["Short Name", "short_name", "text"],
      ["ID", "zoho_id", "text"],
    ],
  },
  {
    file: "vehicles.csv",
    table: "fleet_vehicles",
    columns: [
      ["Vehicle ID", "vehicle_id", "text"],
      ["Vehicle Name", "vehicle_name", "text"],
      ["ID", "zoho_id", "text"],
      ["Vehicle Number", "vehicle_number", "text"],
      ["Vehicle Category", "vehicle_category", "text"],
      ["Engine Number", "engine_number", "text"],
      ["Chassis Number", "chassis_number", "text"],
      ["Insurance Expiry Date", "insurance_expiry_date", "text"],
      ["FC Valid Till", "fc_valid_till", "text"],
      ["PUC Valid Till", "puc_valid_till", "text"],
      ["Road Tax Expiry", "road_tax_expiry", "text"],
    ],
  },
  {
    file: "vendors.csv",
    table: "vendors",
    columns: [
      ["Vendor ID", "vendor_id", "text"],
      ["Added Time", "added_time", "text"],
      ["Vendor Name", "vendor_name", "text"],
      ["Phone", "phone", "text"],
      ["Email", "email", "text"],
      ["GSTIN", "gstin", "text"],
      ["Address", "address", "text"],
      ["Opening Balance", "opening_balance", "currency"],
      ["Old Balance", "old_balance", "currency"],
      ["Current Balance", "current_balance", "currency"],
      ["Total Vendor Balance", "total_vendor_balance", "currency"],
    ],
  },
];

function readRows(file) {
  const full = path.join(DATA_DIR, file);
  if (!fs.existsSync(full)) {
    console.error(`MISSING file: ${file}`);
    return null;
  }
  const raw = fs.readFileSync(full, "utf8");
  const rows = parseCsv(raw);
  if (rows.length === 0) return { headers: [], data: [] };
  const headers = rows[0].map((h) => String(h).trim());
  const data = rows.slice(1).filter((r) => !isEmptyRow(r));
  return { headers, data };
}

function buildPayload(im, headers, row) {
  const idx = new Map(headers.map((h, i) => [h, i]));
  const payload = {};
  for (const [src, dest, type] of im.columns) {
    const i = idx.get(src);
    const raw = i === undefined ? undefined : row[i];
    payload[dest] = coerce(type, raw);
  }
  return payload;
}

async function main() {
  console.log(`Mode: ${EXECUTE ? "EXECUTE (writes)" : "DRY-RUN (no writes)"}`);
  console.log(`Supabase: ${URL}\n`);

  const sb = createClient(URL, KEY, { auth: { persistSession: false } });

  let total = 0;
  const summary = [];

  for (const im of IMPORTS) {
    const parsed = readRows(im.file);
    if (!parsed) continue;
    const { headers, data } = parsed;
    const payloads = data.map((row) => buildPayload(im, headers, row));

    if (EXECUTE) {
      // Clear existing rows first (idempotent, clean import)
      const { error: delErr } = await sb.from(im.table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (delErr) {
        console.log(`✗ ${im.table}: clear failed ${delErr.message}`);
        continue;
      }

      // Insert in batches of 400
      let inserted = 0;
      for (let i = 0; i < payloads.length; i += 400) {
        const batch = payloads.slice(i, i + 400);
        const { error } = await sb.from(im.table).insert(batch);
        if (error) {
          console.log(`✗ ${im.table}: insert failed (batch ${i}) ${error.message}`);
          break;
        }
        inserted += batch.length;
      }
      summary.push({ table: im.table, csv: data.length, inserted });
      console.log(`✓ ${im.table}: ${inserted}/${data.length}`);
    } else {
      summary.push({ table: im.table, csv: data.length });
      const sample = payloads[0];
      const sampleStr = sample
        ? Object.entries(sample)
            .slice(0, 6)
            .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
            .join(" ")
        : "(none)";
      console.log(`→ ${im.table}: ${data.length} rows   sample: ${sampleStr}`);
    }
    total += data.length;
  }

  console.log(`\n=== TOTAL source rows: ${total} ===`);

  if (!EXECUTE) {
    console.log("\nDry-run complete. Run with --execute to clear + import.");
  } else {
    console.log("\n=== INSERT SUMMARY ===");
    for (const s of summary) {
      const ok = s.inserted === s.csv ? "OK" : "MISMATCH";
      console.log(`${s.table}: csv=${s.csv} inserted=${s.inserted} ${ok}`);
    }
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});