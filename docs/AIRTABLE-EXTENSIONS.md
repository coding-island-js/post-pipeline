# Airtable extensions — Automation · Sync · Interface

These three are **configured in the Airtable UI, not the API** (the API is for data + schema — that's how the base, tables, seed data, and the `Delivered On` field were built in code). Each takes ~5 minutes. Together they cover the exact items the job description grills on. Build them in the "Project" base (id `appnMDFp9Wv4DsrXI`).

> **Interview line:** "The Airtable API is the data layer — records and schema. Automations, syncs, and interfaces are no-code config in the Airtable app. Knowing which is which is half the job."

---

## 1) Automation — "Flag blocked work to its owner"
**Goal:** when a deliverable goes **Blocked** or **QC Fail**, the owner gets pinged automatically. This is the bread-and-butter post-coordinator automation.

**Build it:**
1. Open the base → top bar → **Automations** → **Create automation** → name it `Notify owner — blocked / QC fail`.
2. **Trigger** → *When a record matches conditions* → Table: **Deliverables** → Condition: **Status** is any of → **Blocked**, **QC Fail**.
3. **Action** → *Send email* (or *Send Slack message* if you wire Slack):
   - **To:** your email (or add a `Stakeholders` email field and use it)
   - **Subject:** `⚠️ {Title} is {Status}`
   - **Body:** include `{Show}`, `{Episode}`, owner `{Assignee}`, facility `{Facility}`, `{Notes}`
4. Click **Test** (it runs against a matching record), then toggle **On** (top-right).

**Bonus automation — stamp the delivery date** (uses the `Delivered On` field I added):
- Trigger: *When record updated* → Field: **Status** → Condition **Status is Delivered**
- Action: *Update record* → set **Delivered On** = (insert) **Today / Now**

**Talking points:** trigger types (record matches / created / updated / **scheduled** / form submitted / button click), conditions, and action library (email, Slack, create/update record, find records, **run a script** for anything custom). The script step is your escape hatch for logic Airtable can't do natively.

---

## 2) Sync — "Read-only reporting copy in a second base"
**Goal:** producers/execs see live status **without edit access** to the production base. Airtable **Sync** = a one-way copy of a *source view* into another base; the synced table is **read-only** in the target and refreshes on a schedule.

**Build it:**
1. **Source view:** in the "Project" base, on the **Deliverables** table, create a grid view named `Sync — Reporting` (optionally filter, e.g. hide a "Scratch" status or limit to current season). The view defines exactly what syncs.
2. **Target base:** you need a second base — `Post Pipeline — Reporting` (see note below).
3. In the **target** base → **+ Add or import** (top of the tables bar) → **Airtable base** (the sync option) → pick **Project** → table **Deliverables** → view **Sync — Reporting** → **Next** → **Create table**.
4. Done — the target base now has a synced **Deliverables** table that's read-only and tracks the source. Add an Interface or charts on top for the exec view.

**Talking points:** the **source is a view** (so you control exactly what's shared); target is **read-only**; **one-way** by default (two-way is a paid add-on); **refresh frequency** (auto/manual); you can sync across **workspaces/orgs** so an external partner sees only what you expose; Airtable can also sync **external** sources (Google Sheets, Salesforce, Jira). This is the JD's "sync data from another base / how data is saved from one base to another."

---

## 3) Interface (page) — "Producer dashboard"
**Goal:** a no-code **app page** on top of the base for non-technical stakeholders — they interact safely without seeing the raw grid.

**Build it:**
1. Top bar → **Interfaces** → **Start building** / **Create** → choose a layout (start with **Blank** or **Dashboard**).
2. Name the page **Producer View** and add elements (left panel → **+ Element**):
   - **Kanban** grouped by **Stage** (mirrors the web app — instant familiarity).
   - **Grid/List** element filtered to **Status is Blocked or QC Fail** → label it "Needs attention".
   - Three **Number** elements: total deliverables, # blocked, next **Air Date**.
   - A **Filter** control by **Show** so they can switch between productions.
3. **Publish** (top-right) → share **view-only** with stakeholders.

**Talking points:** Interfaces are built from **elements** (grid, kanban, gallery, calendar, charts, number, filters, record detail/review); they can be **permissioned separately** from the base, so execs get a clean app while the data stays locked down. This is the JD's "know the interfaces (pages)."

---

## Note — creating the second base for Sync
The target "Reporting" base must exist before step 2.3. Two options:
- **I create it for you:** send me your **workspace id** (open Airtable, click your workspace — the URL shows `airtable.com/wspXXXXXXXX`), and I'll create `Post Pipeline — Reporting` via API.
- **You create it:** Airtable home → **Create** → **Start from scratch** → rename it `Post Pipeline — Reporting`. (Sync builds the table for you, so it can start empty.)

## How this maps to the job description
| JD line | Built here |
|---|---|
| "How Automation within AT works" | §1 — trigger → condition → action, + script escape hatch |
| "Sync data from another base / how data is saved from one base to another" | §2 — view-as-source, read-only target, one-way refresh |
| "Know the interfaces (pages)" | §3 — element-based no-code app page, separately permissioned |
| "The Base / how things are connected" | the whole base + `docs/AIRTABLE-BASE.md` |
| "Don't have to be a config engineer" | you can *describe and build* all of the above — exactly the bar |
