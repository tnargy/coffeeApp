# Proposal

## Why

Finished green lots stay on the dashboard after their remaining weight hits zero, so the working list fills up with coffee that can no longer be roasted. The operator still needs those lots in history, and a place to look them up without cluttering the dashboard.

## What Changes

- Hide a green lot from the dashboard green-inventory list when its remaining weight is zero or less.
- Add an Inventory page that lists every green lot, including depleted ones, so a finished lot can still be found.
- Reach that page from the Green bean inventory "View all" link. Do not add Inventory to the top navigation.
- Leave history unchanged: a depleted lot and its trail stay available.
- Do not delete lots, and do not change stock math, allotment totals, or roast validation.
- A lot returns to the dashboard list if its remaining weight later rises above zero (for example after a roast is voided).

This narrows the existing inventory requirement that the dashboard display each lot's reserve. A depleted lot leaves that list, so its reserve is no longer shown there. Dashboard totals and the allotment warning still count every lot.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `inventory`: The dashboard lot list no longer includes depleted lots. A new Inventory page lists every lot, including those with no remaining weight.
- `dashboard`: The green-lot list on the dashboard shows only lots that still have remaining weight. "View all" on that card opens Inventory.

## Impact

- Dashboard green-inventory list in `src/pages/Dashboard.tsx`.
- New `/inventory` route and page, linked from the dashboard green-inventory "View all" control. No top-nav item. History and the log-roast lot picker are unchanged.
- No data model, backup, or inventory-math change.
