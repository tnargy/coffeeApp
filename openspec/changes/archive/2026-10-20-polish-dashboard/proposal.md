# Proposal: Polish Dashboard

## Why
The bootstrap MVP delivers the core inventory, roasting, packaging, and sales flows and a functional dashboard. The original mockup shows a richer, more scannable dashboard with clearer visual hierarchy, progress indicators, a simple P&L snapshot, low-stock / reserve alerts, and quick actions. Operators need this at-a-glance view after a roast day without digging through lists.

## What Changes
- Align the main dashboard layout and visual style more closely with the existing mockup (stat cards, inventory list with progress bars, recent activity, low-stock / reserve warning, quick actions).
- Add a simple P&L snapshot (revenue, cost of goods, gross profit) derived from recorded sales and associated green costs — display only, no tax calculation or filing.
- Surface an unpaid-sales or outstanding-balance style indicator if partial payments or notes exist (or a lightweight “to-collect” note field on sales).
- Improve empty states, loading, and basic responsiveness so the dashboard remains usable on a laptop or tablet.
- Optional: add a simple JSON export of all data for backup.

## Capabilities
### New Capabilities
None

### Modified Capabilities
- dashboard

## Impact
Primarily UI and derived summary views. No changes to core inventory, roasting, or sales invariants. Data model may gain a small optional field on sales (e.g., paid status or notes) if unpaid tracking is included.
