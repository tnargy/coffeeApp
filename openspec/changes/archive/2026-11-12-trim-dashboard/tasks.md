# Tasks — Trim the Dashboard to a post-roast summary

## 1. Remove the two drill-down sections from the Dashboard

- [ ] 1.1 In `src/pages/Dashboard.tsx`, delete the `dash-secondary` block: the **Recent profiles** card and the **Bagged and sold** card.
- [ ] 1.2 Remove any imports left unused by 1.1 (`profileLabel`, `batchClassificationLabel`, `statusLabel`, `isVoided`, `roastTimingText` — keep only those still used elsewhere in the file). Lint must pass with no unused imports.
- [ ] 1.3 Do not touch `dashboardSummary` in `src/domain/rules.ts` and do not change History, Records, Inventory, or Profiles.

## 2. Filter the Lot margin table to active lots by default

- [ ] 2.1 In `LotMarginSection` (`src/pages/MarginSection.tsx`), keep `rows = lotBreakEvens(state)` returning every lot; filter for display with the existing `isDepletedLot` helper from `src/domain/rules.ts` (`weightRemaining <= 0`).
- [ ] 2.2 Add a local `useState<boolean>` (default `false`) holding whether finished lots are shown. No settings field, no persistence, no backup change.
- [ ] 2.3 Render a button in the Lot margin card, placed directly below the intro paragraph and above the what-if bag price field, labelled `Show finished lots (n)` / `Hide finished lots`, where `n` is the count of finished lots. When `n` is 0, do not render the button.
- [ ] 2.4 The card subtitle reads `Active lots — finished lots hidden` by default and `Every lot, including finished ones` while finished lots are shown.
- [ ] 2.5 Finished lots, when shown, render identically to active lots and in place, in the same `lotBreakEvens` order as today: same row, same forward line, same reserve what-if, same what-if price behaviour. When lots exist but the active-only list is empty, render `<p className="muted">No active lots — show finished lots to see them.</p>` instead of the table.
- [ ] 2.6 Do not change `lotBreakEvens`, `lotForward`, `costTrend`, or any margin math. Inventory and History consume the same helpers and must be unaffected.

## 3. Sync the spec and verify

- [ ] 3.1 Sync the deltas into `openspec/specs/`: `specs/dashboard/spec.md` (rewrite Purpose and the Post-Roast-Day Summary requirement, rewrite the Per-lot break-even requirement, add the Finished-lots toggle requirement, reword the Full History Trail dashboard-link scenario to lot subjects) and `specs/inventory/spec.md` (qualify "The margin list MUST include all lots" to "The Inventory and History margin lists MUST include all lots").
- [ ] 3.2 Run the full check: tests, lint, typecheck, build. All must pass. No new automated test is added: the repo has no component-render test setup (vitest only, no jsdom or testing-library), and installing a render harness is out of scope for this presentational toggle — verification is the manual check in 3.3.
- [ ] 3.3 Manual verification against the repo fixture `fixtures/nov10-export-fixture.json` (5 lots, 1 finished — lot 1 Guatemala, `weightRemaining` 0): the Dashboard ends after the Lot margin section; no `Recent profiles` or `Bagged and sold` heading is rendered; the margin table shows 4 rows by default with a `Show finished lots (1)` button; toggling shows 5 rows and the subtitle changes; with 0 finished lots the button is absent (check on a scratch copy of the fixture with lot 1's `weightRemaining` set to a positive number, or a fresh DB with a single received lot); with every lot finished and the toggle off, the "No active lots — show finished lots to see them." line is shown instead of the table. History still shows a batch's full trail and Records still shows bagging and sales.
- [ ] 3.4 Archive the change in `openspec/changes/archive/2026-11-12-trim-dashboard/` (proposal, design, tasks, REVISIONS.md, spec deltas, `.openspec.yaml`), matching the fuller 2026-11-11-lot-margin-break-even archive precedent, per the repo's OpenSpec process.
