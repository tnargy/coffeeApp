# Proposal

## Why

The dashboard recent-activity and quick-actions cards add clutter the operator does not use. The recording flows are already in the top navigation, and history still holds the trail.

## What Changes

- Do not display the Recent activity card on the dashboard.
- Do not display the Quick actions card on the dashboard.
- Keep the activity builder and quick-action definitions in the code so the cards can be shown again later without rebuilding them.
- Leave the rest of the dashboard in place, including stock cards, green inventory, allotment, P&L, recent profiles, and bagged-and-sold.
- Do not remove History, or the Log Roast, Pack Bags, and Record Sale navigation.

This narrows the current dashboard requirements that those two cards be visible.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard`: Recent activity and quick actions are no longer shown on the dashboard. The underlying builders stay.

## Impact

- Dashboard layout in `src/pages/Dashboard.tsx`.
- No data model, route, or history change.
