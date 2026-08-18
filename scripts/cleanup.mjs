import fs from 'fs';

const DATA_DIR = '/Users/gokul/Downloads/sadhaportal/data/zoho_export';
const data = JSON.parse(fs.readFileSync(`${DATA_DIR}/portal_data.json`, 'utf8'));
const reports = data.reports;

let removedRows = 0;

for (const [slug, report] of Object.entries(reports)) {
  const cols = report.columns || [];
  const headerKey = cols.join('\u0001');

  const cleaned = [];
  for (const rec of report.records) {
    // 1. Remove records that exactly mirror the header row (phantom header)
    const isHeaderRow =
      cols.length > 0 &&
      cols.every((c) => String(rec[c] ?? '').trim() === String(c).trim());

    // 2. Remove fully-empty records
    const isEmpty = Object.values(rec).every((v) => String(v ?? '').trim() === '');

    if (isHeaderRow || isEmpty) {
      removedRows++;
      continue;
    }

    // 3. Clean up any stray `__recordId`/`__group` that are empty (keep only meaningful)
    const out = {};
    for (const [k, v] of Object.entries(rec)) {
      out[k] = v;
    }
    cleaned.push(out);
  }

  // Dedupe by normalized JSON
  const seen = new Set();
  const deduped = [];
  for (const rec of cleaned) {
    const key = JSON.stringify(rec);
    if (seen.has(key)) {
      removedRows++;
      continue;
    }
    seen.add(key);
    deduped.push(rec);
  }

  report.records = deduped;
  report.recordCount = deduped.length;
}

// Recompute meta
data._meta.reportsExtracted = Object.keys(reports).length;
data._meta.totalRecords = Object.values(reports).reduce((s, v) => s + v.recordCount, 0);

// Rewrite JSON
fs.writeFileSync(`${DATA_DIR}/portal_data.json`, JSON.stringify(data, null, 2));

// Regenerate CSVs (without BOM issues)
for (const [slug, report] of Object.entries(reports)) {
  const cols = report.columns || [];
  if (cols.length === 0) continue;
  const header = cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
  const lines = report.records.map((r) =>
    cols.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','),
  );
  const csv = [header, ...lines].join('\n');
  fs.writeFileSync(`${DATA_DIR}/${slug}.csv`, '\ufeff' + csv);
}

console.log(`Removed ${removedRows} phantom/empty/duplicate rows.`);
console.log('=== CLEANED SUMMARY ===');
console.log('Reports:', data._meta.reportsExtracted);
console.log('Total records:', data._meta.totalRecords);
console.log();
for (const [slug, v] of Object.entries(reports)) {
  console.log(`  [${slug}] ${v.recordCount} records`);
}