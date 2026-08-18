import fs from 'fs';

// Load consolidated + normalized sources
const consolidated = JSON.parse(fs.readFileSync('/tmp/zoho_consolidated.json', 'utf8'));
const normalized = JSON.parse(fs.readFileSync('/tmp/zoho_normalized.json', 'utf8'));

const final = consolidated.reports;

// Add the small lookup reports from normalized.json that were missed
for (const slug of ['categories', 'units', 'payment-categories', 'company-profile']) {
  if (final[slug]) continue;
  const n = normalized[slug];
  if (n && n.row_count > 0) {
    const columns = (n.columns || []).filter((c) => c && c.trim());
    final[slug] = {
      reportName: n.route || slug,
      columns,
      recordCount: n.rows.length,
      records: n.rows,
    };
  }
}

// Recompute meta
const reports = final;
const meta = {
  source: 'https://sadhagroups.zohocreatorportal.com/',
  appName: 'sadha-groups',
  portalId: '10120530045',
  appId: '686931912',
  extractedAt: new Date().toISOString(),
  reportsExtracted: Object.keys(reports).length,
  totalRecords: Object.values(reports).reduce((s, v) => s + v.recordCount, 0),
  reportList: Object.entries(reports).map(([slug, v]) => ({
    slug,
    reportName: v.reportName,
    recordCount: v.recordCount,
    columns: v.columns,
  })),
};

const result = { _meta: meta, reports };

// Write to /tmp and to project directory
fs.writeFileSync('/tmp/zoho_consolidated.json', JSON.stringify(result, null, 2));
const outDir = '/Users/gokul/Downloads/sadhaportal/data/zoho_export';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(`${outDir}/portal_data.json`, JSON.stringify(result, null, 2));

// Also write individual report CSVs for easy review
for (const [slug, v] of Object.entries(reports)) {
  if (!v.columns || v.columns.length === 0) continue;
  const header = v.columns.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
  const lines = v.records.map((r) =>
    v.columns.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','),
  );
  const csv = [header, ...lines].join('\n');
  fs.writeFileSync(`${outDir}/${slug}.csv`, '\ufeff' + csv); // BOM for Excel
}

console.log('=== FINAL DATA ===');
console.log('Reports:', meta.reportsExtracted);
console.log('Total records:', meta.totalRecords);
console.log();
for (const [slug, v] of Object.entries(reports)) {
  console.log(`  [${slug}] ${v.recordCount} records`);
}
console.log('\nWritten to:', outDir);