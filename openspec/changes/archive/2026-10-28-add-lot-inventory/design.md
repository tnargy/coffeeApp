# Design

## Context

See proposal.md for why. The dashboard green-inventory list in `src/pages/Dashboard.tsx` renders every lot from one `allotments` array that also feeds the personal-allotment warning. History lists every lot. Log Roast lists every lot in its picker. There is no Inventory route. Navigation is `APP_ROUTES` in `src/routes.ts`, rendered by `Layout`.

## Goals / Non-Goals

**Goals:**

- Omit lots with `weightRemaining <= 0` from the dashboard green-lot list only.
- Add a read-only `/inventory` page that lists every lot, including depleted ones, opened from the dashboard "View all" link.
- Keep history, the log-roast picker, stock totals, and allotment math unchanged.

**Non-Goals:**

- Deleting or archiving lots.
- Hiding depleted lots from History or Log Roast.
- Editing reserves or weights on the new page.
- Changing backup, Dexie, or roast validation.
- Adding Inventory to the top navigation.

## Decisions

### Filter the list, not the stored lots

A lot is depleted when `weightRemaining <= 0`. The dashboard list uses a filtered copy of the existing allotment rows. The allotment warning and green-remaining total keep using every lot, so a hidden lot with an unmet reserve still counts.

Alternative: delete the lot at zero. Rejected because history and later voids need the record.

Alternative: filter inside `lotAllotment` or `dashboardSummary`. Rejected because those values also drive the warning and fair-to-sell math.

### New page, not a Records section

Add `src/pages/Inventory.tsx` and register `/inventory` in the router only. Do not add it to `APP_ROUTES`, so the top nav stays unchanged. The existing Green bean inventory "View all" link, which currently goes to `/history`, points at `/inventory` instead. The page is read-only: name, origin, remaining weight, received weight, and a link to `/history?lot=`. Depleted rows stay visible and show zero remaining. If every lot is depleted, the page still lists them. If there are no lots, it says so.

Alternative: add an Inventory nav item. Rejected because the operator wants it only from that card.

Alternative: put the full list on Records. Rejected because Records is the edit/void log, and the operator asked for an inventory page.

### Empty dashboard list is not "no lots"

If lots exist but all are depleted, the dashboard list shows a short note that finished lots are on Inventory, not the existing "No lots yet" message. The total line can stay; it will be zero.

### No new persistence helper

Display-only. A tiny `isDepletedLot` predicate may live next to the other lot helpers so the dashboard filter and a unit test share one rule. It must not change `greenRemaining` or `lotAllotment`.

## Risks / Trade-offs

- [Hidden lot still has an unmet reserve] → The allotment card still sums every lot. The lot itself is on Inventory and History.
- [Operator looks for a finished lot on the dashboard] → Empty-state note points at Inventory. History still lists it.
- [Voiding a roast restores green weight] → The same `weightRemaining <= 0` check puts the lot back on the dashboard. No separate flag to clear.

## Migration Plan

None. Existing lots stay as stored. Rollback is removing the route and the list filter.
