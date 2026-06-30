// Post Pipeline — frontend. Talks to /api/records (Netlify Function -> Airtable).
// Option sets must match the Airtable single-select fields (see docs/AIRTABLE-BASE.md).
const STAGES = ['Editorial', 'VFX', 'Color', 'Sound', 'Delivery'];
const STAGE_INFO = {
  Editorial: { blurb: 'Cut & picture lock (Avid)' },
  VFX: { blurb: 'Effects shots (ShotGrid)' },
  Color: { blurb: 'Color grade / DI (Resolve)' },
  Sound: { blurb: 'Mix, ADR & stems (Pro Tools)' },
  Delivery: { blurb: 'QC & ship to platform' },
};
const STAGE_COLORS = {
  Editorial: '#7c5cde', VFX: '#1a7e74', Color: '#c98a1b', Sound: '#2b6fb3', Delivery: '#1c8a52',
};
const STATUSES = ['Not Started', 'In Progress', 'In Review', 'Blocked', 'QC Fail', 'Approved', 'Delivered'];
const TYPES = ['Picture Master', 'VFX Shots', 'Sound Mix', 'M&E Stems', 'Captions (SDH)', 'Subtitles', 'Textless', 'QC Report', 'Key Art'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const $ = (sel) => document.querySelector(sel);
const board = $('#board');
const banner = $('#banner');
const dialog = $('#dialog');

let records = [];
let showFilter = 'All shows';
let draggingId = null;

// --- API --------------------------------------------------------------------
async function api(method, body, id) {
  const url = id ? `/api/records?id=${encodeURIComponent(id)}` : '/api/records';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${method} failed (${res.status})`);
  return data;
}
const showError = (msg) => { banner.textContent = msg; banner.hidden = false; };
const clearError = () => { banner.hidden = true; };

// --- Helpers ----------------------------------------------------------------
function fmtDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
const slug = (s) => (s || '').replace(/[^a-z0-9]+/gi, '-');
const optionList = (values, selected) =>
  values.map((v) => `<option value="${v}"${v === selected ? ' selected' : ''}>${v}</option>`).join('');
const visible = () => records.filter((r) => showFilter === 'All shows' || r.Show === showFilter);

// --- Summary stats ----------------------------------------------------------
function renderStats() {
  const rs = visible();
  const attention = rs.filter((r) => r.Status === 'Blocked' || r.Status === 'QC Fail').length;
  const inProgress = rs.filter((r) => ['In Progress', 'In Review'].includes(r.Status)).length;
  const delivered = rs.filter((r) => r.Status === 'Delivered').length;
  const upcoming = rs
    .map((r) => r['Air Date']).filter(Boolean).sort()
    .find((d) => new Date(d + 'T00:00:00') >= new Date(new Date().toDateString()));
  const cards = [
    { n: rs.length, label: 'Deliverables tracked' },
    { n: inProgress, label: 'In progress / review', tone: 'blue' },
    { n: attention, label: 'Need attention', tone: attention ? 'red' : '' },
    { n: delivered, label: 'Delivered', tone: 'green' },
    { n: upcoming ? fmtDate(upcoming) : '—', label: 'Next air date', tone: 'plain' },
  ];
  $('#stats').innerHTML = cards.map((c) => `
    <div class="stat ${c.tone || ''}">
      <div class="stat-n">${c.n}</div>
      <div class="stat-l">${c.label}</div>
    </div>`).join('');
}

// --- Flow legend ------------------------------------------------------------
function renderFlow() {
  $('#flowSteps').innerHTML = STAGES.map((s, i) => `
    <li class="flow-step" style="--c:${STAGE_COLORS[s]}">
      <span class="flow-num">${i + 1}</span>
      <span class="flow-name">${s}</span>
      <span class="flow-blurb">${STAGE_INFO[s].blurb}</span>
    </li>`).join('<li class="flow-arrow" aria-hidden="true">→</li>');
}

// --- Filters ----------------------------------------------------------------
function renderFilters() {
  const shows = ['All shows', ...Array.from(new Set(records.map((r) => r.Show).filter(Boolean))).sort()];
  $('#filters').innerHTML = shows.map((s) =>
    `<button class="chip${s === showFilter ? ' active' : ''}" data-show="${s}">${s}</button>`).join('');
  $('#filters').querySelectorAll('.chip').forEach((b) => {
    b.onclick = () => { showFilter = b.dataset.show; renderAll(); };
  });
}

// --- Cards ------------------------------------------------------------------
function cardEl(r) {
  const el = document.createElement('div');
  el.className = 'card';
  const meta = [
    r.Facility ? `🏢 ${r.Facility}` : '',
    r.Assignee ? `👤 ${r.Assignee}` : '',
    r.Due ? `📅 ${fmtDate(r.Due)}` : '',
  ].filter(Boolean).map((m) => `<span>${m}</span>`).join('');
  el.innerHTML = `
    <div class="card-top">
      ${r.Type ? `<span class="type-tag">${r.Type}</span>` : ''}
      ${r.Priority === 'High' ? '<span class="prio-flag" title="High priority">High</span>' : ''}
    </div>
    <h3></h3>
    ${r.Episode || r.Show ? '<p class="sub"></p>' : ''}
    <span class="badge status-${slug(r.Status)}">${r.Status || '—'}</span>
    ${meta ? `<div class="meta">${meta}</div>` : ''}
    <div class="card-controls">
      <label class="ctl">Status<select class="sel-status" aria-label="Status for ${(r.Title || 'deliverable').replace(/"/g, '')}">${optionList(STATUSES, r.Status)}</select></label>
      <button class="icon-btn edit" title="Edit" aria-label="Edit ${(r.Title || 'deliverable').replace(/"/g, '')}">✎</button>
      <button class="icon-btn del" title="Delete" aria-label="Delete ${(r.Title || 'deliverable').replace(/"/g, '')}">✕</button>
    </div>`;
  // user data via textContent (XSS-safe)
  el.querySelector('h3').textContent = r.Title || '(untitled)';
  const sub = el.querySelector('.sub');
  if (sub) sub.textContent = [r.Show, r.Episode].filter(Boolean).join(' · ');
  const spec = el.querySelector('.spec');
  if (spec) spec.textContent = r.Spec;

  el.querySelector('.sel-status').onchange = (e) => update(r.id, { Status: e.target.value });
  el.querySelector('.edit').onclick = () => openForm(r);
  el.querySelector('.del').onclick = () => remove(r.id, r.Title);
  el.querySelector('h3').onclick = () => openForm(r);
  el.querySelector('h3').style.cursor = 'pointer';

  // Drag to move between stages (desktop). Editing the card covers touch/precision.
  el.draggable = true;
  el.addEventListener('dragstart', (e) => {
    draggingId = r.id;
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', r.id);
  });
  el.addEventListener('dragend', () => { el.classList.remove('dragging'); draggingId = null; });
  return el;
}

function renderBoard() {
  const rs = visible();
  board.innerHTML = '';
  for (const stage of STAGES) {
    const items = rs.filter((r) => (r.Stage || 'Editorial') === stage);
    const col = document.createElement('div');
    col.className = 'column';
    col.style.setProperty('--col', STAGE_COLORS[stage]);
    col.innerHTML = `
      <div class="col-head">
        <span class="col-name">${stage}</span>
        <span class="count">${items.length}</span>
      </div>
      <p class="col-blurb">${STAGE_INFO[stage].blurb}</p>`;
    const cards = document.createElement('div');
    cards.className = 'col-cards';
    if (!items.length) {
      const e = document.createElement('div');
      e.className = 'empty';
      e.textContent = 'Drop a card here';
      cards.appendChild(e);
    }
    items.forEach((r) => cards.appendChild(cardEl(r)));
    col.appendChild(cards);

    // Drop target — moving a card here sets its Stage to this column.
    col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('drop-target'); });
    col.addEventListener('dragleave', (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove('drop-target'); });
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drop-target');
      const id = draggingId || e.dataTransfer.getData('text/plain');
      const rec = records.find((x) => x.id === id);
      if (rec && rec.Stage !== stage) update(id, { Stage: stage });
    });
    board.appendChild(col);
  }
}

function renderAll() {
  renderStats();
  renderFilters();
  renderBoard();
}

// --- Data mutations ---------------------------------------------------------
async function load() {
  try {
    clearError();
    renderFlow();
    const { records: recs } = await api('GET');
    records = recs;
    renderAll();
  } catch (err) {
    showError(`Could not load deliverables: ${err.message}`);
  }
}
async function update(id, fields) {
  try {
    const updated = await api('PATCH', { fields }, id);
    records = records.map((r) => (r.id === id ? updated : r));
    renderAll();
  } catch (err) { showError(err.message); }
}
async function remove(id, title) {
  if (!confirm(`Delete "${title || 'this deliverable'}"?`)) return;
  try {
    await api('DELETE', null, id);
    records = records.filter((r) => r.id !== id);
    renderAll();
  } catch (err) { showError(err.message); }
}

// --- Form -------------------------------------------------------------------
$('#f-Type').innerHTML = optionList(TYPES);
$('#f-Stage').innerHTML = optionList(STAGES);
$('#f-Status').innerHTML = optionList(STATUSES);
$('#f-Priority').innerHTML = optionList(PRIORITIES);

function openForm(r) {
  $('#formTitle').textContent = r ? 'Edit deliverable' : 'Add deliverable';
  $('#recId').value = r?.id || '';
  $('#f-Title').value = r?.Title || '';
  $('#f-Type').value = r?.Type || 'Picture Master';
  $('#f-Show').value = r?.Show || '';
  $('#f-Episode').value = r?.Episode || '';
  $('#f-Stage').value = r?.Stage || 'Editorial';
  $('#f-Status').value = r?.Status || 'Not Started';
  $('#f-Priority').value = r?.Priority || 'Medium';
  $('#f-Facility').value = r?.Facility || '';
  $('#f-Assignee').value = r?.Assignee || '';
  $('#f-Spec').value = r?.Spec || '';
  $('#f-Due').value = r?.Due || '';
  $('#f-AirDate').value = r?.['Air Date'] || '';
  $('#f-Notes').value = r?.Notes || '';
  dialog.showModal();
}
$('#newBtn').onclick = () => openForm(null);
$('#cancelBtn').onclick = () => dialog.close();

$('#form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('#recId').value;
  const fields = {
    Title: $('#f-Title').value.trim(),
    Type: $('#f-Type').value,
    Show: $('#f-Show').value.trim(),
    Episode: $('#f-Episode').value.trim(),
    Stage: $('#f-Stage').value,
    Status: $('#f-Status').value,
    Priority: $('#f-Priority').value,
    Facility: $('#f-Facility').value.trim(),
    Assignee: $('#f-Assignee').value.trim(),
    Spec: $('#f-Spec').value.trim(),
    Due: $('#f-Due').value || null,
    'Air Date': $('#f-AirDate').value || null,
    Notes: $('#f-Notes').value.trim(),
  };
  try {
    if (id) {
      const updated = await api('PATCH', { fields }, id);
      records = records.map((r) => (r.id === id ? updated : r));
    } else {
      const created = await api('POST', { fields });
      records.push(created);
    }
    dialog.close();
    renderAll();
  } catch (err) { showError(err.message); }
});

load();
