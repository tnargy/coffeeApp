# Design: Polish Dashboard

## Technical Approach
Enhance the existing dashboard page and supporting components. Keep the client-side architecture (React + IndexedDB). Derive summary numbers from existing entities rather than adding heavy new models.

## Key Changes
- **Stat cards**: Four prominent cards — Green Beans Remaining, Roasted Stock, Bags Ready (with default bag size note), and a simple Outstanding / Unpaid indicator (or total recent sales if unpaid is deferred).
- **Green inventory list**: Show each lot with remaining weight and a progress bar relative to its original received weight.
- **Recent activity**: Chronological feed of recent roasts, baggings, and sales (last 5–10 items).
- **Alerts**: Non-blocking low-stock / personal-use reserve warning when green falls below the configured target. Optional suggestion area (e.g., “consider different bag size”) can be static or omitted in this change.
- **P&L snapshot**: Simple period totals (e.g., last 30 days or all-time): revenue (sum of sale amounts), COGS (sum of green cost allocated to sold bags), gross profit. No trends or charts required for this change.
- **Quick actions**: Keep Log Roast, Pack Bags, Record Sale as prominent buttons.
- **Optional export**: Button that downloads a JSON dump of all lots, batches, bags, and sales.

## Data Model Adjustments (minimal)
- Sale may gain an optional `paid: boolean` (default true) or `notes` field if unpaid tracking is desired. Prefer notes-only if simpler.
- No other schema changes required.

## UI Notes
- **Reference mockup**: Use the dashboard.jpg image in this change folder as the visual target. Match its layout hierarchy, card style, progress bars, activity feed placement, and warm coffee-themed aesthetic as closely as practical.
- Keep units consistent with the rest of the app (display lb/oz where helpful; store grams).
- Ensure the personal-use reserve warning remains non-blocking.

## Out of Scope
- Full trend charts or period comparisons beyond simple totals.
- Barcode, multi-user, or public features.
- Automated tax calculation.
