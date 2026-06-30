#!/usr/bin/env node
// API-based "sync": mirror Project/Deliverables -> Reporting base, read-only copy.
// Stands in for native Airtable Sync (which needs a paid Team plan). Idempotent:
// matches by a "Source ID" field, then creates/updates/deletes to mirror exactly.
//
//   node scripts/sync-to-reporting.js
const fs = require('fs');
const path = require('path');

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2];
}
const PAT = process.env.AIRTABLE_PAT || env.AIRTABLE_PAT;
const SRC_BASE = env.AIRTABLE_BASE_ID;
const SRC_TABLE = env.AIRTABLE_TABLE_NAME || 'Deliverables';
const DST_BASE = env.REPORTING_BASE_ID;
const DST_TABLE = 'Deliverables';
if (!PAT || !SRC_BASE || !DST_BASE) { console.error('Need AIRTABLE_PAT, AIRTABLE_BASE_ID, REPORTING_BASE_ID in .env'); process.exit(1); }

const H = { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' };
async function at(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { ...H, ...(opts.headers || {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d?.error?.message || JSON.stringify(d)), { status: r.status });
  return d;
}
const data = (base, table, q = '') => at(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}${q}`);

// Fields copied into the reporting base (kept simple: text + dates, no selects to manage).
const MIRROR = ['Title', 'Show', 'Episode', 'Type', 'Stage', 'Status', 'Priority', 'Facility', 'Assignee', 'Due', 'Air Date'];
const REPORT_FIELDS = [
  { name: 'Title', type: 'singleLineText' },
  { name: 'Source ID', type: 'singleLineText' },
  { name: 'Show', type: 'singleLineText' }, { name: 'Episode', type: 'singleLineText' },
  { name: 'Type', type: 'singleLineText' }, { name: 'Stage', type: 'singleLineText' },
  { name: 'Status', type: 'singleLineText' }, { name: 'Priority', type: 'singleLineText' },
  { name: 'Facility', type: 'singleLineText' }, { name: 'Assignee', type: 'singleLineText' },
  { name: 'Due', type: 'date', options: { dateFormat: { name: 'iso' } } },
  { name: 'Air Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
  { name: 'Synced At', type: 'singleLineText' },
];

async function ensureTable() {
  const schema = await at(`https://api.airtable.com/v0/meta/bases/${DST_BASE}/tables`);
  let t = schema.tables.find((x) => x.name === DST_TABLE);
  if (!t) {
    console.log('Creating Deliverables table in reporting base...');
    t = await at(`https://api.airtable.com/v0/meta/bases/${DST_BASE}/tables`, { method: 'POST', body: JSON.stringify({ name: DST_TABLE, fields: REPORT_FIELDS }) });
  } else {
    const have = new Set(t.fields.map((f) => f.name));
    for (const f of REPORT_FIELDS) if (!have.has(f.name)) await at(`https://api.airtable.com/v0/meta/bases/${DST_BASE}/tables/${t.id}/fields`, { method: 'POST', body: JSON.stringify(f) });
  }
}

async function allRecords(base, table) {
  let out = [], offset;
  do {
    const page = await data(base, table, `?pageSize=100${offset ? `&offset=${offset}` : ''}`);
    out = out.concat(page.records); offset = page.offset;
  } while (offset);
  return out;
}

(async () => {
  await ensureTable();
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

  const src = await allRecords(SRC_BASE, SRC_TABLE);
  const dst = await allRecords(DST_BASE, DST_TABLE);
  const dstBySource = new Map(dst.map((r) => [r.fields['Source ID'], r]));

  const toCreate = [], toUpdate = [];
  const seen = new Set();
  for (const r of src) {
    seen.add(r.id);
    const fields = { 'Source ID': r.id, 'Synced At': stamp };
    for (const k of MIRROR) if (r.fields[k] !== undefined) fields[k] = r.fields[k];
    const existing = dstBySource.get(r.id);
    if (existing) toUpdate.push({ id: existing.id, fields });
    else toCreate.push({ fields });
  }
  const toDelete = dst.filter((r) => !seen.has(r.fields['Source ID'])).map((r) => r.id);

  const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
  for (const b of chunk(toCreate, 10)) await at(`https://api.airtable.com/v0/${DST_BASE}/${encodeURIComponent(DST_TABLE)}`, { method: 'POST', body: JSON.stringify({ records: b, typecast: true }) });
  for (const b of chunk(toUpdate, 10)) await at(`https://api.airtable.com/v0/${DST_BASE}/${encodeURIComponent(DST_TABLE)}`, { method: 'PATCH', body: JSON.stringify({ records: b, typecast: true }) });
  for (const b of chunk(toDelete, 10)) await at(`https://api.airtable.com/v0/${DST_BASE}/${encodeURIComponent(DST_TABLE)}?${b.map((id) => `records[]=${id}`).join('&')}`, { method: 'DELETE' });

  console.log(`Synced. +${toCreate.length} created, ~${toUpdate.length} updated, -${toDelete.length} removed. Reporting now mirrors ${src.length} records.`);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
