# Design: Bootstrap Core App

## Technical Approach
Client-side single-page application (SPA) with no required backend. All data lives in the browser via IndexedDB (preferred) or localStorage as fallback. The app must remain fully usable offline after the initial load.

Recommended stack (adjustable):
- React (or Vue/Svelte) + TypeScript
- Vite for build
- IndexedDB via Dexie.js or idb for structured storage
- CSS modules or Tailwind for styling matching the mockup aesthetic (warm neutrals, coffee-themed icons)

## Data Model

### GreenLot
- id
- origin / name
- process (optional)
- grade (optional)
- weightReceived (grams)
- weightRemaining (grams)
- costPerKg or totalCost
- dateReceived
- notes

### RoastProfile
- id
- beansName
- chargeTemp
- batchSize
- dtr (development time ratio)
- weightLossPercent
- notes (optional)

### RoastBatch
- id
- greenLotId
- profileId
- greenWeightCharged (grams)
- roastedYield (grams)
- classification: "internal" | "for-sale"
- roastDate (supports out-of-order)
- restStartTime (nullable)
- roastedWeightRemaining (grams)
- status: "roasted" | "resting" | "ready-to-bag" | "bagged"

### BaggedUnit
- id
- batchId
- bagSizeOz (or grams)
- weight (grams)
- status: "available" | "sold"
- createdAt

### Sale
- id
- baggedUnitIds[]
- saleAmount
- taxAmount (optional, recorded only)
- date
- notes

### Settings
- personalUseReserveTargetGrams (default ≈ 453 g / 1 lb per month)
- defaultBagSizeOz (default 8)

## Architecture Decisions
- **Persistence**: IndexedDB so relationships and queries stay efficient as the operator accumulates lots and batches.
- **Units**: Store everything in grams internally; display in lb/oz where appropriate for the operator.
- **Validation**: Reject any action that would drive green, roasted, or bagged stock negative. Show shortfall message.
- **Rest rule**: Bagging UI disabled or warned until 24 h have elapsed since restStartTime; always display actual rest duration.
- **Seeding**: Provide a one-time “Load starter data” action or migration that inserts the initial 5 lb green lot and one 300 g internal roast.
- **Offline**: Service worker optional for v1; IndexedDB alone satisfies the offline requirement after first load.
- **No auth**: Single operator; optional local passphrase or just open access is acceptable.

## UI Notes (from mockup)
- Dashboard layout: four stat cards (Green Beans Remaining, Roasted Stock, Bags Ready, Unpaid Sales or equivalent), green bean inventory list with progress bars, recent activity feed, low-stock / reserve warning, quick actions (Log Roast, Pack Bags, Record Sale), simple P&L snapshot (revenue, COGS, gross profit — calculated from recorded sales and costs, no tax remittance).
- Default bag size starts at 8 oz; mockup shows 12 oz as an example — make it configurable and display the current default.
- Keep the warm, coffee-themed visual language of the mockup.

## Open Decisions (for implementer)
- Exact frontend framework (React recommended).
- Whether to include a minimal P&L calculation in v1 or defer richer trends.
- Exact wording and placement of the personal-use reserve warning.
