# Post Pipeline — Requirements (PO-style)

**Problem:** Post-production stakeholders (editorial, VFX, color, mix, QC) lack one shared view of where each deliverable is. Status lives in email and chat.

**Goal:** A single board, backed by Airtable, where anyone can see and update what stage every deliverable is in.

## User stories
- **US1 — See the pipeline.** As a producer, I can see all deliverables grouped by post stage so I know the state of the slate at a glance.
  - *AC:* board shows columns Editorial→VFX→Color→Mix→QC→Delivery; each card shows title, show, status, priority, due, assignee.
- **US2 — Advance a deliverable.** As a coordinator, I can change a deliverable's stage/status from the board and it persists.
  - *AC:* changing the dropdown writes to Airtable; reload reflects the change; Airtable row updates.
- **US3 — Add a deliverable.** As a coordinator, I can add a new deliverable with all its details.
  - *AC:* form requires Title; new record appears in the right column and in Airtable.
- **US4 — Edit / remove.** As a coordinator, I can edit a deliverable's details or delete it.
  - *AC:* edit updates the record; delete asks for confirmation then removes it.
- **US5 — Secrets stay safe.** As the owner, the Airtable token is never exposed to the browser.
  - *AC:* all Airtable calls go through the Netlify Function; no PAT in client code.

## Out of scope (v1)
Auth, multi-base sync, attachments, comments, real-time updates. (Listed as Airtable-native stretch in `docs/AIRTABLE-BASE.md`.)

## UAT checklist
- [ ] Board loads seeded records from Airtable.
- [ ] Create → appears on board + in Airtable.
- [ ] Stage dropdown moves card to new column + updates Airtable.
- [ ] Status/priority edits persist.
- [ ] Delete removes from board + Airtable.
- [ ] No PAT visible in browser devtools network/source.
