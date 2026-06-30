# Post-production 101 — talk the talk

A crib sheet so you can speak credibly about TV+ post-production in the interview.
The app models all of this — point at it as you explain.

## The pipeline (what the board's columns are)
1. **Editorial** — editors cut the show in **Avid Media Composer** until **picture lock** (no more story changes).
2. **Conform / Online** — the locked offline edit is rebuilt at full resolution from camera originals; titles, finishing.
3. **VFX** — visual-effects shots farmed to vendors (ILM, ILP…), tracked in **ShotGrid**, comped in **Nuke**. Delivered as EXR sequences.
4. **Color / DI** — the colorist grades the look in **DaVinci Resolve / Baselight**. HDR passes: **Dolby Vision**, HDR10.
5. **Sound** — dialogue edit, **ADR** (re-recorded lines), Foley, then the **re-recording mix** in **Pro Tools**: 5.1, 7.1, **Dolby Atmos**. Also cut the **M&E stems** (Music & Effects, no dialogue) so the show can be dubbed abroad.
6. **QC** — quality control watches for artifacts, sync, levels, caption timing. A fail means a **retake/fix**.
7. **Delivery** — everything is mastered into an **IMF** package (Interoperable Master Format) and pushed to the platform via **Aspera / Signiant**.

## Deliverables (what the cards are)
An episode isn't one file — it spawns many:
- **Picture Master** (the graded, finished video — often IMF/ProRes 4444 XQ)
- **Sound Mix** (5.1 + Atmos)
- **M&E Stems** (for international dubbing)
- **Captions (SDH)** — for the deaf/hard-of-hearing, same language (.scc)
- **Subtitles** — translated, per territory (ES/FR/DE…)
- **Textless** — shots without burned-in text, so localization can re-add it
- **QC Report**, **Key Art**

## The tools, and where this app sits
| Tool | Used for |
|---|---|
| Avid Media Composer | editorial |
| ShotGrid + Nuke | VFX tracking + comp |
| DaVinci Resolve | color / DI |
| Pro Tools | mix, ADR, stems |
| Frame.io | review & approval (notes on cuts) |
| Aspera / Signiant | moving huge files / IMF delivery |
| **Airtable** | the **tracking layer** — "where is everything?" |

**The pitch:** specialists live in their own tools; nobody has the one view of status across all of them. That tracking layer is usually a spreadsheet that goes stale. Airtable (this app) is that single source of truth — and because it's the data layer, you can put a producer Interface on it, automate the nudges, and sync a read-only view to execs.

## Vocabulary to drop naturally
picture lock · conform · DI · HDR / Dolby Vision · re-recording mix · M&E stems · ADR · IMF · SDH vs subtitles · textless · QC pass/fail · turnover · spec/deliverable list · air date vs delivery date.

## "Not an order taker" — proposing solutions (what they're testing for)
- "Status keeps going stale in the tracking sheet" → *put the board on the data layer so updates are first-class, and automate a Blocked/QC-Fail alert to the owner."*
- "Execs keep pinging us for status" → *"sync a filtered, read-only view into a reporting base — they self-serve, we keep edit control."*
- "Stakeholder can't say what they need" → *"From what you're describing, the real need is X. Here's the smallest thing that proves it — can we try it on one show?"*
