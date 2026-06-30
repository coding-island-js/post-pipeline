# Airtable base — "Post Pipeline"

The base + schema were created via the Airtable API (`scripts/setup-airtable.js`).
Base id lives in `.env` as `AIRTABLE_BASE_ID`. This doc is the reference + how to talk to it.

## Table: `Deliverables`
A row = one **deliverable** for an episode (not the whole episode — an episode has many).

| Field | Type | Notes |
|---|---|---|
| **Title** | Single line text (primary) | e.g. "S1 E04 — Final Mix" |
| **Show** | Single line text | series name |
| **Episode** | Single line text | e.g. "S1 E04" |
| **Type** | Single select | Picture Master · VFX Shots · Sound Mix · M&E Stems · Captions (SDH) · Subtitles · Textless · QC Report · Key Art |
| **Stage** | Single select | Editorial · VFX · Color · Sound · Delivery (the board's columns, in order). The field also retains Conform & QC options, but the app keeps the board to 5 columns and tracks QC as a *status* — a common real-world pattern. |
| **Status** | Single select | Not Started · In Progress · In Review · Blocked · QC Fail · Approved · Delivered |
| **Priority** | Single select | Low · Medium · High |
| **Facility** | Single line text | vendor/house doing the work (Company 3, Formosa, ILP…) |
| **Assignee** | Single line text | internal owner |
| **Spec** | Single line text | delivery spec — IMF, 5.1+Atmos, EN-SDH .scc, EXR 16-bit… |
| **Due** | Date (ISO) | when the deliverable is due |
| **Air Date** | Date (ISO) | when the episode streams (the hard deadline) |
| **Notes** | Long text | free notes |

> The app's single-select option lists (in `public/app.js`) must match the Stage/Status/Type
> names above. Writes use `typecast: true`, so a new option string is created on the fly if needed.

## Re-running the setup script
```
node scripts/setup-airtable.js <baseId>           # ensure schema + seed if empty
node scripts/setup-airtable.js <baseId> --reset   # wipe rows + reseed sample data
node scripts/setup-airtable.js wspXXXXXXXX         # create a brand-new base in a workspace
```

## Stretch features (build OR be ready to describe — these mirror the JD)
- **Linked records:** split `Show` into a `Shows` table and link it; add an `Episodes` table linked to Deliverables. Talk to how records connect across tables.
- **Interface (page):** Interfaces tab → a "Producer View" Kanban grouped by Stage + a filtered "Needs attention" list (Blocked / QC Fail). This is the JD's "interfaces (pages)."
- **Automation:** Status → Blocked or QC Fail ⇒ notify the Assignee (Slack/email). Or Stage → Delivery ⇒ tick a `Delivered` box + timestamp. This is "how Automation within AT works."
- **Cross-base sync:** sync the `Deliverables` table (a filtered view) into a separate **Reporting** base so execs see read-only status without edit access. This is "sync data from another base / how data is saved from one base to another."
