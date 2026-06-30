#!/usr/bin/env node
// One-shot Airtable setup for Post Pipeline.
//
//   node scripts/setup-airtable.js <workspaceId?>
//
// - With a workspaceId (wsp...): creates the "Post Pipeline" base fully-formed.
// - Without one: finds an existing base (named "Post Pipeline" or the only base),
//   ensures the Deliverables table + fields exist.
// Then seeds sample rows (if empty) and writes AIRTABLE_BASE_ID into .env.
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env');
function readEnv() {
  const out = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
function writeEnvVar(key, value) {
  let txt = fs.readFileSync(ENV_PATH, 'utf8');
  if (new RegExp(`^${key}=.*$`, 'm').test(txt)) txt = txt.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`);
  else txt += `\n${key}=${value}\n`;
  fs.writeFileSync(ENV_PATH, txt);
}

const env = readEnv();
const PAT = process.env.AIRTABLE_PAT || env.AIRTABLE_PAT;
const TABLE = env.AIRTABLE_TABLE_NAME || 'Deliverables';
const WORKSPACE = process.argv[2] || process.env.AIRTABLE_WORKSPACE_ID;
if (!PAT) { console.error('No AIRTABLE_PAT in env/.env'); process.exit(1); }

const H = { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' };
async function at(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { ...H, ...(opts.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error?.message || JSON.stringify(data)), { status: res.status, data });
  return data;
}

const sel = (choices) => ({ type: 'singleSelect', options: { choices: choices.map((c) => ({ name: c.n, color: c.c })) } });
const FIELDS = [
  { name: 'Title', type: 'singleLineText' }, // primary
  { name: 'Show', type: 'singleLineText' },
  { name: 'Episode', type: 'singleLineText' },
  { name: 'Type', ...sel([
    { n: 'Picture Master', c: 'blueLight2' }, { n: 'VFX Shots', c: 'tealLight2' }, { n: 'Sound Mix', c: 'purpleLight2' },
    { n: 'M&E Stems', c: 'cyanLight2' }, { n: 'Captions (SDH)', c: 'yellowLight2' }, { n: 'Subtitles', c: 'orangeLight2' },
    { n: 'Textless', c: 'grayLight2' }, { n: 'QC Report', c: 'redLight2' }, { n: 'Key Art', c: 'pinkLight2' },
  ]) },
  { name: 'Stage', ...sel([
    { n: 'Editorial', c: 'purpleLight2' }, { n: 'Conform', c: 'cyanLight2' }, { n: 'VFX', c: 'tealLight2' },
    { n: 'Color', c: 'yellowLight2' }, { n: 'Sound', c: 'blueLight2' }, { n: 'QC', c: 'orangeLight2' }, { n: 'Delivery', c: 'greenLight2' },
  ]) },
  { name: 'Status', ...sel([
    { n: 'Not Started', c: 'grayLight2' }, { n: 'In Progress', c: 'blueLight2' }, { n: 'In Review', c: 'yellowLight2' },
    { n: 'Blocked', c: 'redLight2' }, { n: 'QC Fail', c: 'orangeLight2' }, { n: 'Approved', c: 'greenLight2' }, { n: 'Delivered', c: 'tealLight2' },
  ]) },
  { name: 'Priority', ...sel([
    { n: 'Low', c: 'grayLight2' }, { n: 'Medium', c: 'yellowLight2' }, { n: 'High', c: 'orangeLight2' },
  ]) },
  { name: 'Facility', type: 'singleLineText' },
  { name: 'Assignee', type: 'singleLineText' },
  { name: 'Spec', type: 'singleLineText' },
  { name: 'Due', type: 'date', options: { dateFormat: { name: 'iso' } } },
  { name: 'Air Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
  { name: 'Notes', type: 'multilineText' },
];

// Realistic episodic-post deliverables for two fictional streaming series.
// Board stages: Editorial -> VFX -> Color -> Sound -> Delivery. QC is tracked as a status.
const SEED = [
  // --- Midnight Harbor (S1, prestige drama, airing now) ---
  { Title: 'S1 E01 — Picture Master', Show: 'Midnight Harbor', Episode: 'S1 E01', Type: 'Picture Master', Stage: 'Delivery', Status: 'Delivered', Priority: 'High', Facility: 'Sim · Company 3', Assignee: 'A. Rivera', Spec: 'IMF · Dolby Vision', Due: '2026-06-26', 'Air Date': '2026-07-15', Notes: 'Delivered to platform, QC passed clean.' },
  { Title: 'S1 E02 — Final Mix', Show: 'Midnight Harbor', Episode: 'S1 E02', Type: 'Sound Mix', Stage: 'Sound', Status: 'In Review', Priority: 'High', Facility: 'Formosa Group', Assignee: 'S. Patel', Spec: '5.1 + Dolby Atmos', Due: '2026-07-04', 'Air Date': '2026-07-22', Notes: 'Platform notes back in Frame.io.' },
  { Title: 'S1 E02 — M&E Stems', Show: 'Midnight Harbor', Episode: 'S1 E02', Type: 'M&E Stems', Stage: 'Sound', Status: 'In Progress', Priority: 'Medium', Facility: 'Formosa Group', Assignee: 'S. Patel', Spec: '5.1 Music & Effects', Due: '2026-07-06', 'Air Date': '2026-07-22', Notes: 'Needed for intl dub vendors.' },
  { Title: 'S1 E03 — Color / DI', Show: 'Midnight Harbor', Episode: 'S1 E03', Type: 'Picture Master', Stage: 'Color', Status: 'In Progress', Priority: 'High', Facility: 'Company 3', Assignee: 'M. Chen', Spec: 'Dolby Vision HDR', Due: '2026-07-09', 'Air Date': '2026-07-29', Notes: 'Trim pass on reel 2 after notes.' },
  { Title: 'S1 E04 — VFX Shots', Show: 'Midnight Harbor', Episode: 'S1 E04', Type: 'VFX Shots', Stage: 'VFX', Status: 'Blocked', Priority: 'High', Facility: 'Important Looking Pirates', Assignee: 'J. Okafor', Spec: 'EXR 16-bit · 38 shots', Due: '2026-07-11', 'Air Date': '2026-08-05', Notes: 'Awaiting notes on reel 3 hero comp.' },
  { Title: 'S1 E05 — Captions (SDH)', Show: 'Midnight Harbor', Episode: 'S1 E05', Type: 'Captions (SDH)', Stage: 'Delivery', Status: 'QC Fail', Priority: 'High', Facility: 'Deluxe', Assignee: 'P. Nair', Spec: 'EN-SDH .scc', Due: '2026-07-06', 'Air Date': '2026-08-12', Notes: 'QC flagged timing drift — retake ordered.' },
  { Title: 'S1 E06 — Picture Lock', Show: 'Midnight Harbor', Episode: 'S1 E06', Type: 'Picture Master', Stage: 'Editorial', Status: 'In Progress', Priority: 'Medium', Facility: 'In-house · Avid', Assignee: 'A. Rivera', Spec: 'Avid AAF', Due: '2026-07-13', 'Air Date': '2026-08-19', Notes: "Director's cut review Friday." },
  // --- Neon Coast (S2, stylish thriller, in finishing) ---
  { Title: 'S2 E07 — Final Mix', Show: 'Neon Coast', Episode: 'S2 E07', Type: 'Sound Mix', Stage: 'Sound', Status: 'Approved', Priority: 'Medium', Facility: 'Formosa Group', Assignee: 'S. Patel', Spec: '7.1 + Dolby Atmos', Due: '2026-07-08', 'Air Date': '2026-08-02', Notes: 'Mix approved, prepping print master.' },
  { Title: 'S2 E07 — Subtitles (Intl)', Show: 'Neon Coast', Episode: 'S2 E07', Type: 'Subtitles', Stage: 'Delivery', Status: 'Approved', Priority: 'Medium', Facility: 'Deluxe', Assignee: 'P. Nair', Spec: 'ES · FR · DE', Due: '2026-07-12', 'Air Date': '2026-08-02', Notes: 'Approved, queued for delivery.' },
  { Title: 'S2 E08 — VFX Shots', Show: 'Neon Coast', Episode: 'S2 E08', Type: 'VFX Shots', Stage: 'VFX', Status: 'In Review', Priority: 'High', Facility: 'Important Looking Pirates', Assignee: 'J. Okafor', Spec: 'EXR · 12 shots', Due: '2026-07-15', 'Air Date': '2026-08-09', Notes: 'Client reviewing comp v3 in Frame.io.' },
  { Title: 'S2 E08 — Color / DI', Show: 'Neon Coast', Episode: 'S2 E08', Type: 'Picture Master', Stage: 'Color', Status: 'Not Started', Priority: 'Medium', Facility: 'Company 3', Assignee: 'M. Chen', Spec: 'HDR10', Due: '2026-07-20', 'Air Date': '2026-08-09', Notes: 'Booked after VFX final.' },
  { Title: 'S2 E09 — Textless', Show: 'Neon Coast', Episode: 'S2 E09', Type: 'Textless', Stage: 'Delivery', Status: 'In Progress', Priority: 'Low', Facility: 'Sim', Assignee: 'D. Lewis', Spec: 'ProRes 4444', Due: '2026-07-22', 'Air Date': '2026-08-16', Notes: 'Textless backs for localization.' },
];

(async () => {
  let baseId;

  if (WORKSPACE && WORKSPACE.startsWith('app')) {
    // A base id was passed directly — use the existing base, ensure schema below.
    baseId = WORKSPACE;
    console.log(`Targeting existing base by id: ${baseId}`);
    const schema = await at(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`);
    let table = schema.tables.find((t) => t.name === TABLE);
    if (!table) {
      console.log(`Creating table "${TABLE}"...`);
      await at(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
        method: 'POST', body: JSON.stringify({ name: TABLE, fields: FIELDS }),
      });
    } else {
      const have = new Set(table.fields.map((f) => f.name));
      for (const f of FIELDS) if (!have.has(f.name)) {
        console.log(`  adding missing field: ${f.name}`);
        await at(`https://api.airtable.com/v0/meta/bases/${baseId}/tables/${table.id}/fields`, { method: 'POST', body: JSON.stringify(f) });
      }
    }
  } else if (WORKSPACE) {
    console.log(`Creating base in workspace ${WORKSPACE}...`);
    const created = await at('https://api.airtable.com/v0/meta/bases', {
      method: 'POST',
      body: JSON.stringify({ workspaceId: WORKSPACE, name: 'Post Pipeline', tables: [{ name: TABLE, fields: FIELDS }] }),
    });
    baseId = created.id;
    console.log(`  base created: ${baseId}`);
  } else {
    const { bases } = await at('https://api.airtable.com/v0/meta/bases');
    const match = bases.find((b) => b.name === 'Post Pipeline') || (bases.length === 1 ? bases[0] : null);
    if (!match) {
      console.error(`\nNo workspace id given and ${bases.length} base(s) found.`);
      console.error('Either: pass a workspace id  ->  node scripts/setup-airtable.js wspXXXX');
      console.error('Or: create one empty base in the Airtable UI, then re-run with no args.');
      process.exit(2);
    }
    baseId = match.id;
    console.log(`Using existing base "${match.name}": ${baseId}`);
    const schema = await at(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`);
    let table = schema.tables.find((t) => t.name === TABLE);
    if (!table) {
      console.log(`Creating table "${TABLE}"...`);
      table = await at(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
        method: 'POST', body: JSON.stringify({ name: TABLE, fields: FIELDS }),
      });
    } else {
      const have = new Set(table.fields.map((f) => f.name));
      for (const f of FIELDS) {
        if (!have.has(f.name)) {
          console.log(`  adding missing field: ${f.name}`);
          await at(`https://api.airtable.com/v0/meta/bases/${baseId}/tables/${table.id}/fields`, {
            method: 'POST', body: JSON.stringify(f),
          });
        }
      }
    }
  }

  const RESET = process.argv.includes('--reset');
  if (RESET) {
    console.log('Reset: clearing existing rows...');
    let all = [];
    let offset;
    do {
      const page = await at(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(TABLE)}?pageSize=100${offset ? `&offset=${offset}` : ''}`);
      all = all.concat(page.records.map((r) => r.id));
      offset = page.offset;
    } while (offset);
    for (let i = 0; i < all.length; i += 10) {
      const q = all.slice(i, i + 10).map((id) => `records[]=${id}`).join('&');
      await at(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(TABLE)}?${q}`, { method: 'DELETE' });
    }
    console.log(`  deleted ${all.length} rows.`);
  }

  // Seed rows if the table is empty.
  const existing = await at(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(TABLE)}?pageSize=1`);
  if (!existing.records.length) {
    console.log('Seeding sample rows...');
    for (let i = 0; i < SEED.length; i += 10) {
      const batch = SEED.slice(i, i + 10).map((fields) => ({ fields }));
      await at(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(TABLE)}`, {
        method: 'POST', body: JSON.stringify({ records: batch, typecast: true }),
      });
    }
    console.log(`  seeded ${SEED.length} rows.`);
  } else {
    console.log('Table already has rows — skipping seed.');
  }

  writeEnvVar('AIRTABLE_BASE_ID', baseId);
  console.log(`\nDone. AIRTABLE_BASE_ID=${baseId} written to .env`);
})().catch((e) => { console.error('\nFAILED:', e.message); if (e.data) console.error(JSON.stringify(e.data)); process.exit(1); });
