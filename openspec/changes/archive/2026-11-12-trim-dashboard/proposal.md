# Trim the Dashboard to a post-roast summary

## Why

The Dashboard is titled "Post-roast summary" — green versus roasted stock, reserve, and what has been roasted, bagged, or sold — but it has grown past that job. It now ends with two drill-down sections, Recent profiles and Bagged and sold, whose underlying facts already live on pages built for them. And the Lot margin table lists every lot including finished ones, so it only gets longer as more lots are roasted, pushing the content that is checked after every roast day further down the page.

The Dashboard's job is the quick check after a roast: what is on hand, what is owed, is my personal coffee paid for. Detail belongs where it already lives.

## What changes

- The **Recent profiles** section is removed from the Dashboard. The same per-batch roast facts stay available on History: the batch list shows classification, loss, and timing, and selecting a batch shows its trail, whose roast event carries the profile label, charge temp, batch size, DTR, loss, and timing. The Profiles page remains the reusable-profile library.
- The **Bagged and sold** section is removed from the Dashboard. The underlying bagging and sale *events* stay available on History trails (bagging and sale events) and on Records (bagging entries and sales with bag counts). Known trade-off: the card's one-line per-batch *totals* ("N bagged · M sold") are not shown on any page after this change — no page aggregates bagged/sold counts per batch. Restoring those totals is a separate follow-up, not part of this change.
- The **Lot margin table shows active lots by default**. A lot is active when it still has green remaining (`weightRemaining > 0`, the same `isDepletedLot` definition the green-inventory list already uses). Finished lots are hidden until the operator taps a **Show finished lots (n)** button in the Lot margin card, which reveals them rendered exactly as active lots are; the button then reads **Hide finished lots**. When there are no finished lots, the button is not shown. The choice is local component state and resets on reload — no setting, no persistence.
- The Lot margin card subtitle reflects the filter: **"Active lots — finished lots hidden"** by default, **"Every lot, including finished ones"** while finished lots are shown.
- The inventory spec's margin-list sentence is qualified so the spec set stays consistent: "The margin list MUST include all lots" becomes "The Inventory and History margin lists MUST include all lots, including depleted ones". The Dashboard's margin table is the one list that filters; Inventory and History keep showing every lot.
- Nothing else on the Dashboard moves: stat cards, green bean inventory, personal allotment alert, P&L snapshot with monthly sales history, Export JSON backup, and the roasted-batches footer line all stay exactly where they are.

## Non-goals

No change to margin math, P&L math, backup format, routes, or any other page. No new page. No change to History, Records, Inventory, or Profiles content. No per-batch bagged/sold totals are added anywhere (see the trade-off above). No change to the recent-activity / quick-actions cards (already hidden behind `showActivityAndActions = false`). No change to `dashboardSummary` — it keeps computing `recentProfiles` and `trail` (a test covers `trail`); the Dashboard simply stops rendering those two cards. No persistence for the finished-lots toggle.

## Source

Operator request 2026-11-12: "Does everything on the Dashboard make sense or should I move some off to their own pages?" Answered: move Recent profiles and Bagged and sold off, tame the margin table. Verified against master `5a41554` (PRs #3 and #4 merged): Dashboard.tsx still renders both sections, `LotMarginSection` lists every lot with the subtitle "Every lot, including finished ones" and no toggle, History's batch trail roast event carries the full profile facts (`src/domain/rules.ts` batchTrail), Records lists bagging entries and sales.
