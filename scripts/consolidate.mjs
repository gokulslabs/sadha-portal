import fs from 'fs';

// Load all sources
const paginateModel = JSON.parse(fs.readFileSync('/tmp/zoho_paginate_model.json', 'utf8'));
const fullData = JSON.parse(fs.readFileSync('/tmp/zoho_full_data.json', 'utf8'));
const completeModel = JSON.parse(fs.readFileSync('/tmp/zoho_complete_model.json', 'utf8'));

// Reports best sourced from MODEL (large, virtualized transactional tables)
const MODEL_REPORTS = [
  'diesel-entries', 'sales-entries', 'rent-entries', 'all-boulders-entries',
  'boulders-diesel-entries', 'excavators-daily-entries', 'excavators-rent-entries',
  'excavators-diesel-entries', 'income-expense',
];

// Parse full_data rows+headers into records
function rowsToRecords(headers, rows) {
  if (!headers || !rows || rows.length < 2) return null;
  const cleanHeaders = headers.map((h) => h.trim()).filter(Boolean);
  const records = [];
  for (const row of rows) {
    // Skip header row (first row equals headers)
    const isHeader = row.every((c, i) => (c || '').trim() === (headers[i] || '').trim());
    if (isHeader) continue;
    // Skip group-name rows (single non-empty cell)
    const nonEmptyCount = row.filter((c) => (c || '').trim()).length;
    if (nonEmptyCount <= 1) continue;
    const rec = {};
    for (let j = 0; j < headers.length; j++) {
      const h = headers[j].trim();
      if (h) rec[h] = (row[j] || '').trim();
    }
    // Only include if has meaningful data
    if (Object.values(rec).some((v) => v)) records.push(rec);
  }
  return { columns: cleanHeaders, records };
}

function dedupeRecords(records) {
  const seen = new Set();
  const out = [];
  for (const r of records) {
    const key = JSON.stringify(r);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

const final = {};

// 1. Large transactional reports from MODEL (paginate + complete fallback)
for (const slug of MODEL_REPORTS) {
  const pm = paginateModel[slug];
  const cm = completeModel[slug];
  const pmCount = pm?.recordCount || 0;
  const cmCount = cm?.recordCount || 0;
  const source = pmCount >= cmCount ? pm : cm;
  if (source && source.recordCount > 0) {
    final[slug] = {
      reportName: source.reportName,
      columns: source.columns || [],
      recordCount: source.recordCount,
      records: source.records,
    };
  }
}

// 2. All remaining reports from full_data (headers + rows)
for (const slug of Object.keys(fullData)) {
  if (final[slug]) continue;
  const entry = fullData[slug];
  const parsed = rowsToRecords(entry?.headers, entry?.rows);
  if (parsed && parsed.records.length > 0) {
    final[slug] = {
      reportName: entry?.reportName || slug,
      columns: parsed.columns,
      recordCount: parsed.records.length,
      records: parsed.records,
    };
  }
}

// 3. Categories / sub-categories / payment-categories / units / company-profile
for (const slug of ['categories', 'sub-categories', 'payment-categories', 'units', 'company-profile', 'def-oil-entries', 'day-fees-entries', 'accounts-overview']) {
  if (final[slug]) continue;
  const cm = completeModel[slug];
  if (cm && cm.recordCount > 0) {
    final[slug] = {
      reportName: cm.reportName,
      columns: cm.columns,
      recordCount: cm.recordCount,
      records: cm.records,
    };
  }
}

// Dedupe records within each report
for (const slug of Object.keys(final)) {
  final[slug].records = dedupeRecords(final[slug].records);
  final[slug].recordCount = final[slug].records.length;
}

// Add metadata
const meta = {
  source: 'https://sadhagroups.zohocreatorportal.com/',
  appName: 'sadha-groups',
  portalId: '10120530045',
  appId: '686931912',
  extractedAt: new Date().toISOString(),
  reportsExtracted: Object.keys(final).length,
  totalRecords: Object.values(final).reduce((s, v) => s + v.recordCount, 0),
};

const result = { _meta: meta, reports: final };

fs.writeFileSync('/tmp/zoho_consolidated.json', JSON.stringify(result, null, 2));

console.log('=== CONSOLIDATED SUMMARY ===');
console.log('Reports extracted:', meta.reportsExtracted);
console.log('Total records:', meta.totalRecords);
console.log();
for (const [slug, v] of Object.entries(final)) {
  console.log(`  [${slug}] ${v.recordCount} records (${v.columns.length} cols)`);
}