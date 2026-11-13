# Design — Trim the Dashboard to a post-roast summary

## Decisions

### 1. Delete, don't move

Recent profiles and Bagged and sold are not relocated to a new home. Each already has one: History is the per-batch record (list + selected-batch trail), Records is the bagging/sales ledger. Moving them would create a third copy of the same facts. The change deletes the two `dash-secondary` cards from `Dashboard.tsx` and nothing else.

Coverage mapping, verified against master `5a41554`:

| Dashboard section removed | Fact it showed | Where that fact remains |
|---|---|---|
| Recent profiles | Batch #, profile label, charge temp, DTR, loss, timing, classification, roast date (5 most recent batches) | History: batch list shows classification · loss · timing; selecting a batch shows its trail, whose roast event detail is `Profile: <label>, charge <temp>, batch size <g>, DTR <dtr>%, weight loss <loss>%. <timing>` (`batchTrail` in `src/domain/rules.ts`). Profiles page holds the reusable-profile library. |
| Bagged and sold | Per-batch bagging and sale *events* | History: the same batch's trail shows its bagging and sale events. Records: bagging entries (`Bagging from Batch #…`) and sales (`$amount · n bags · date`). |
| Bagged and sold | Per-batch *totals* ("N bagged · M sold" in one line) | **Nowhere.** No page aggregates bagged/sold counts per batch. This is a known, accepted loss for this change (see proposal); restoring the totals is a separate follow-up. |

One deliberate gap: History's batch *list* rows do not show charge temp or DTR — those appear only in the selected batch's trail. And History shows one trail at a time: the Dashboard showed all 5 recent profiles at a glance, while on History reviewing batches 2–5 costs a tap each, the list is in insertion order (oldest first, so the most recent batches sit at the bottom), and list rows show no roast date or profile label, so finding a specific recent roast requires knowing its batch number. History auto-selects the latest batch on open, which softens the first lookup, but the "one tap" cost for older batches is real and accepted: the Dashboard card showed only the 5 most recent batches anyway, and the trail is the record, not the list.

### 2. The margin filter reuses the existing definition

Active vs finished is `!isDepletedLot(lot)` / `isDepletedLot(lot)` from `src/domain/rules.ts` (`weightRemaining <= 0`) — the exact predicate the green-inventory list on the same page already uses to omit depleted lots. No new definition, no drift between the two lists on the same page.

The filter lives in `LotMarginSection` (`src/pages/MarginSection.tsx`), next to `rows = lotBreakEvens(state)`, which keeps returning every lot. The section filters for display only; `lotBreakEvens`, `lotForward`, and `costTrend` are untouched, so Inventory and History, which consume the same helpers, are unaffected.

### 3. Toggle is local, unpersisted, and absent when useless

The toggle is a `useState<boolean>` in `LotMarginSection`, default `false`. It is a button in the Lot margin card, labelled `Show finished lots (n)` / `Hide finished lots`, where `n` is the count of finished lots. When `n` is 0 the button is not rendered at all — no dead control, no "0 finished lots" noise. No settings field, no storage write, no backup-format change. Reloading resets to active-only, which is the safe default for the quick check.

The subtitle is part of the same state: `Active lots — finished lots hidden` by default, `Every lot, including finished ones` while shown. The strings are fixed in the spec so the rendered page matches the scenarios.

### 4. What stays, and why it stays

- Stat cards, green inventory, allotment alert: the "what is on hand / what is owed" half of the post-roast summary.
- P&L snapshot + monthly sales history: the money half; the monthly list is compact and is history, not a drill-down.
- Export JSON backup button and the roasted-batches footer line: unchanged, out of scope.
- `dashboardSummary` keeps computing `recentProfiles` and `trail`: `combinedPacking.test.ts` asserts on `summary.trail`, and the fields are cheap derived data. Deleting them would churn domain code and a test for zero user benefit. The Dashboard stops rendering the two cards; the domain stays as-is.

### 5. No fixture — verification uses the repo fixture

There is no new fixture for this change. Nothing numeric changes: no margin, P&L, or allotment value moves, and no new derived value is introduced. Verification is structural (which sections and rows render) against the repo fixture `fixtures/nov10-export-fixture.json`, which is the only lot data in the repo: 5 lots, 1 finished (lot 1 Guatemala, `weightRemaining` 0; lot 2 PNG 867.962 g, lot 3 Kenya 67.962 g, lots 4–5 full). Default margin table shows 4 rows; toggled, 5; the button reads `Show finished lots (1)`. The 0-finished state is reached on a scratch copy of the fixture with lot 1's `weightRemaining` set to a positive number (or a fresh DB with a single received lot): the button must be absent. No live-data counts are used in verification — the operator's live data is not in the repo and cannot be checked by an implementer.

### 6. Toggle specifics

- **Row order:** finished lots appear in place, in the same `lotBreakEvens` order as today. They are not appended at the bottom and the active rows do not reorder.
- **Button placement:** directly below the intro paragraph of the Lot margin card, above the what-if bag price field.
- **All-finished empty state:** when lots exist but the filtered (active-only) list is empty, the table is replaced by `<p className="muted">No active lots — show finished lots to see them.</p>`. The existing "No lots yet" line still covers the no-lots-at-all case.
- **Draft loss on toggle:** hiding a lot unmounts its row, discarding any typed reserve what-if draft in that row. Accepted as trivial: the draft is per-row local state and re-showing the lot resets it to the lot's reserve.
- **Test coverage is manual-only, deliberately:** the repo has no component-render test setup — vitest only, no jsdom or testing-library — so a toggle test would first require installing a render harness. That is out of scope for a presentational toggle. Verification is the manual check in task 3.3 against the fixture counts above.

## Risks

- **Operator expects a removed section on the Dashboard.** Mitigated by the coverage mapping above and by the fact that both sections link to History already (every row links to `/history?batch=…`), so the habit transfers to one tap on the History nav item.
- **Finished lots become harder to notice.** Mitigated: the toggle carries the count (`Show finished lots (3)`), Inventory already shows finished lots with the same margin lines, and History shows a finished lot's margin summary when selected. The Dashboard's green-inventory list already omits finished lots today, so this matches existing behaviour on the same page.
