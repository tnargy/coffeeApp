# Design

## Context

See proposal.md for why, and `REVISIONS.md` for what changed after
the Goldfish review (v1 -> v2). Today `pnl(state)` in
`src/domain/rules.ts` returns only `{ revenue, cogs, grossProfit }`
for all non-voided sales, using `costOfBag` per sold bag.
`Dashboard.tsx` renders those three numbers plus a margin % derived
from them. There is no per-lot, per-bean, per-month, forward, or
break-even view, and no standard price anywhere in the app.
`Settings` in `src/types.ts` has only
`personalUseReserveTargetGrams` (default 453.59237 g, i.e. 1 lb),
`defaultBagSizeOz` (8), and `theme`.

Verified numbers from the 2026-11-10 export
(`coffee-backup-2026-11-11_0_fyr7.json`, 14 sales, 15 batches),
recomputed with the v2 definitions in this file. Money is rounded
with `roundMoney` (to cents) at the lot level, after summing
source-weighted amounts. Bags sold is a decimal to one place.
Tolerance for money in acceptance criteria is ±$0.02, to allow
per-bag rounding.

| Lot | Cost | Bags sold | Revenue | Standard revenue | COGS (sold bags) | Whole-lot profit left (actual) | Break-even bags (fresh) | Bags to break even |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Guatemala, Oct 14 | $39.35 | 6.0 | $72.00 | $72.00 | $27.24 | $32.65 | 4 | 0 |
| 2 Colombian, Oct 26 | $23.87 | 4.0 | $48.00 | $48.00 | $18.70 | $24.13 | 2 | 0 |
| 3 Papua New Guinea, Oct 26 | $23.87 | 4.0 | $66.00 | $48.00 | $18.44 | $42.13 | 2 | 0 |
| 4 Nicaraguan sample | $0.00 | 0.0 | $0 | $0 | $0 | $0 | — | — |
| 5 Costa Rican sample | $0.00 | 0.0 | $0 | $0 | $0 | $0 | — | — |
| 6 Guatemala, Nov 9 | $50.00 | 0.0 | $0 | $0 | $0 | -$50.00 | 5 | 5 |
| 7 Peru, Nov 9 | $50.00 | 0.0 | $0 | $0 | $0 | -$50.00 | 5 | 5 |

Monthly sales, grouped by UTC month of `sale.date`, empty months
omitted: Oct 2026 — 6.0 bags, $72. Nov 2026 (to Nov 9) — 8.0 bags,
$114. Both months are partial / lumpy, which is why v1 shows monthly
history and does not forecast.

Weight loss: loss = 1 − (sum roastedYield / sum greenWeightCharged),
green-weighted across batches. Overall in the export:
1 − (4,178.6 / 4,842.3) = 13.71% (rounded to two decimal places;
use the exact ratio in calculations, not the rounded %).

Forward margin for a new 5-lb lot at 13.71% loss: 2,268 g green ->
1,957 g roasted -> 8.62 bags total at a packed bag weight of 227 g
(see "Forward bag weight" below). With the usual 1-lb (453.6 g)
green reserve kept, 6.9 bags for sale, $82.77 expected revenue at
$12, $32.77 whole-lot profit left. With reserve 0, 8.6 bags,
$103.46 revenue, $53.46 profit. Selling the 1-lb reserve instead
of keeping it adds 1.7 bags and $20.69 revenue (and $20.69 profit
left, since the lot cost is already counted). At the old $17.35/kg
the same lot would cost $4.56 per bag and earn $7.44 per bag; at
$22.05/kg it costs $5.80 and earns $6.20.

Personal stock on hand in the export: 1,000.6 g roasted in 6 live
internal bags, about 2.2 lb; unpacked personal remaining is 0 g.
Green cost consumed so far is $82.51; $64.39 went into sold bags
and $18.13 into live personal roasted stock (see "Personal cost"
below). $64.39 + $18.13 = $82.52, which is $82.51 within the ±$0.02
rounding tolerance.

## Goals / Non-Goals

**Goals:**

- Answer, per lot: is the lot paid for on a standard-price basis,
  how many bags are left to break even, and what profit is left
  after the lot cost is covered.
- Make bean-price changes visible at receipt time and in forward
  margin, not only after sales.
- Keep the personal reserve flexible: a target that can be changed
  per lot, with the margin view showing what selling it would add.
- Keep the existing all-time P&L totals unchanged and correct.

**Non-Goals:**

- Time tracking or profit per hour. Show profit left after the lot
  cost; do not invent hours, and do not label that profit as
  compensation for time.
- Tracking bags, labels, shipping beyond `totalCost`, electricity, or
  other costs. Bean cost only in v1.
- Demand forecasting, reorder suggestions, or price changes to past
  sales.
- Changing the standard price of past sales, tax handling, voids, or
  the backup format.

## Definitions (v2 — these are the normative definitions)

### Standard price, stored at sale time

- `Settings.standardBagPrice?: number`, default $12, editable in
  `src/pages/SettingsPage.tsx`, must be > $0 (see Validation).
  Missing means $12.
- `Sale.standardPriceAtSale?: number`, set at record time in
  `recordSale` to the current `Settings.standardBagPrice` (or $12
  if missing). It is never changed afterwards.
- For sales recorded before this change, which have no
  `standardPriceAtSale` field, treat it as $12.
- Changing `Settings.standardBagPrice` does NOT recompute past
  sales' standard revenue, overpay, shortfall, or monthly history.
  It affects only future sales and forward margin / break-even
  calculations that use the *current* standard price.
- The standard price is $12 for every 8oz bag, regardless of bean,
  unless and until Grant changes it in Settings.

### Revenue, standard revenue, overpay, shortfall (per sale, per lot)

For each non-voided sale, for each source batch in its bags
(source-weighted, as `costOfBag` already does):

- `bagsSold` for a lot = sum over sold bags of
  (source weight / bag weight), displayed to one decimal place.
  In the fixture every lot is a whole number (6.0, 4.0, 4.0), but
  a combined bag split across lots contributes fractional bags.
- `standardRevenue` for a sale = sum over its bags of
  (bag weight fraction × that sale's `standardPriceAtSale`),
  where the bag weight fraction is the bag's weight divided by
  the packed bag weight for the default bag size
  (`round(defaultBagSizeOz × 28.349523125)` = 227 g for 8 oz).
  For a whole 8oz bag at $12 that is $12; for a whole 4oz bag
  it is $6. Per lot, standard revenue is source-weighted:
  sum over sources of (source weight / bagWeight) ×
  `standardPriceAtSale`.
- `overpay` for a sale = max(0, actual sale amount − standard
  revenue for that sale), computed per sale on exact (unrounded)
  amounts, then summed per lot / per month. For a sale spanning
  two lots, the sale's overpay is split between the lots in
  proportion to each lot's standard-revenue share of that sale.
- `shortfall` for a sale = max(0, standard revenue for that sale
  − actual sale amount), computed per sale on exact amounts, then
  summed per lot / per month, split between lots the same way as
  overpay. Money is rounded per lot with `roundMoney` after
  summing; the per-sale floor is applied before that rounding.
- Identity (per lot, per month, and overall):
  `actual revenue = standardRevenue + overpay − shortfall`.
- A voided sale contributes nothing to revenue, standard revenue,
  overpay, shortfall, bags sold, or monthly history.

### Whole-lot break-even, on the standard-price basis

For each lot with `totalCost > 0`:

- `wholeLotProfitLeft` = actual revenue to date − `totalCost`.
  Label it "profit left after the lot cost", not "profit for my time".
- `standardRevenue` as defined above.
- `covered` means `standardRevenue >= totalCost`, otherwise
  `not covered`. Both the status and the remaining-bags figure
  use the standard-price basis, so they cannot contradict each
  other.
- `breakEvenBags` (fresh lot) = `ceil(totalCost / currentStandardPrice)`.
- `bagsToBreakEven` = `ceil(max(0, totalCost − standardRevenue) / currentStandardPrice)`.
  Example (the Goldfish's mixed case): a $50 lot with 4 bags sold
  at $20 each has actual revenue $80, standard revenue $48, so it
  is *not* covered, and `bagsToBreakEven` = ceil(2 / 12) = 1.
- Accepted consequence of the stored-price decision: after the
  standard price changes, `bagsSold + bagsToBreakEven` need not
  equal `breakEvenBags`, because the first uses historical
  standard revenue (stored per-sale prices) and the second uses
  the current price. Example: a $50 lot, price $12 → $13, 3 bags
  sold at the $12-era standard: `breakEvenBags` = ceil(50/13) = 4,
  but `bagsToBreakEven` = ceil(14/13) = 2, so 3 + 2 = 5 ≠ 4.
  That is expected, not a bug.
- Lots with `totalCost = 0` (the Nicaraguan and Costa Rican samples)
  are excluded from the break-even table and shown with status
  `no cost`, not `covered`.

Alternative considered and rejected: defining `covered` on actual
revenue while break-even bags use standard price. Rejected — it
produces the contradiction above.

### Personal cost (v2 definition)

`personalCost` for a lot is the green-equivalent cost of **live
personal roasted stock**, computed exactly like `costOfBag`:

- For each live (non-voided) internal bag: sum over its sources of
  `source weight × (batch.greenWeightCharged / batch.roastedYield)
  × (lot.totalCost / lot.weightReceived)`.
- Plus, for each batch of the lot, its unpacked personal remaining
  weight (`personalRemaining`), converted the same way:
  `personalRemaining × (greenWeightCharged / roastedYield)
  × (totalCost / weightReceived)`.
- It is shown on the lot as "personal cost" and is NOT added to
  COGS and NOT subtracted from gross profit a second time.
- It is NOT the green cost of `personalYield` alone. In the
  fixture, `personalYield` cost is $10.13, while live personal
  stock cost is $18.13 — the difference is that `packBags` draws
  the opposite pool first when packing internal bags, so
  `personalYield` ≠ internal bagged weight.
- Reconciliation, within ±$0.02: sold COGS + personal cost =
  green cost consumed so far. Remaining-green cost is stated
  separately and is not part of that sum.

### Forward margin (v2 formula, with units)

Let, for a lot:

- `remainingGreen` = `lot.weightRemaining` (g, green)
- `unmetReserve` = `lotAllotment(state, lot).unmet` (g, green) —
  the part of the lot's stored reserve not yet covered by roasted
  personal stock. Use the existing `lotAllotment` helper; do not
  subtract the full stored reserve when part of it is already
  covered.
- `loss` = the lot's own green-weighted loss if it has roasts
  (1 − sum roastedYield / sum greenWeightCharged across its
  batches), otherwise the overall green-weighted loss across all
  batches (13.71% in the fixture).
- `bagWeight` = packed bag weight for the default bag size:
  `round(settings.defaultBagSizeOz × 28.349523125)` grams.
  For 8 oz that is 227 g. It is NOT hard-coded to 227 g; if the
  default bag size changes, it recomputes.
- `forSaleRoastedRemaining` = sum of `forSaleRemaining` across the
  lot's batches (g, roasted, unpacked).
- `availableForSaleBagWeight` = sum over live available
  for-sale bags of the **source-weighted portion from this lot's
  batches** — sum of source weights from this lot's batches, not
  the full bag weight. A combined bag spanning two lots is
  counted for each lot only by its source weight from that lot,
  so its forward revenue is never double-counted.

Then:

```
forwardGreen = max(0, remainingGreen − unmetReserve)
forwardRoastedFromGreen = forwardGreen × (1 − loss)
forwardRoasted = forwardRoastedFromGreen + forSaleRoastedRemaining
                 + availableForSaleBagWeight
forwardBags = forwardRoasted / bagWeight
forwardRevenue = forwardBags × currentStandardPrice
forwardWholeLotProfitLeft = forwardRevenue + actualRevenueToDate − totalCost
```

`forwardBags` is shown to one decimal place, but forward revenue,
forward profit left, and the reserve what-if line are computed
from the exact (unrounded) forward bags; the 1-decimal figure is
display only. Rounding bags first would give the wrong answer:
6.9 × $12 = $82.80, not the correct $82.77 (6.8972 × $12).

- Forward figures are labelled "expected", not guaranteed.
- The reserve what-if line uses the same formula with
  `unmetReserve = 0` and with the reserve's green weight converted
  at the same loss: extra bags = `(unmetReserve × (1 − loss)) / bagWeight`,
  extra revenue = extra bags × currentStandardPrice, extra profit
  left = extra revenue (the lot cost is already counted).
- Changing a lot's reserve recalculates forward margin only; past
  revenue, standard revenue, and bags sold do not change.

### Forward bag weight

See the formula above. The packed weight in the export is 227 g
for every 8oz bag, which is `round(8 × 28.349523125)`. Do not use
226.8 g (the unrounded conversion) and do not hard-code 227 g.

### Cost trend (v2 comparator)

- List lots in receipt order (`dateReceived`, then `id`) with
  $/kg and total cost.
- Comparator for a lot: the most recent earlier **paid** lot
  (`totalCost > 0`) whose `dateReceived` falls on an **earlier UTC
  calendar day** than this lot's `dateReceived`. Ties (two paid
  lots on that most recent earlier day) are broken by latest
  `dateReceived`, then highest `id`. Lots received on the same
  UTC day share the same comparator. If there is no such
  lot, the lot is never flagged.
- Flag a lot when its $/kg is at least 10% higher than its
  comparator's $/kg. The flag is a label, not a block.
- In the fixture: Lot 1 (Oct 14, $17.35) has no comparator, no
  flag. Lot 2 (Oct 26, $17.54) compares to Lot 1, +1.1%, no flag.
  Lot 3 (Oct 26, $17.54) compares to Lot 1 (same-day lots share
  the Oct 14 comparator), +1.1%, no flag. Lots 6 and 7 (Nov 9,
  $22.05) compare to Lot 3 (Oct 26, $17.54), +25.7%, both flagged.
- "Up 27%" in the proposal means $17.35/kg (first Guatemala lot)
  to $22.05/kg (+27.1%).

### Monthly history (v2)

- Group non-voided sales by **UTC month** of `sale.date`
  (`YYYY-MM` in UTC). Empty months are omitted.
- Each month shows: bags sold (1 decimal), actual revenue,
  standard revenue, overpay, shortfall.
- The monthly table lives in the Dashboard P&L section, below
  the per-lot margin table.
- No forecast, no average-month projection, no seasonal adjustment.

### What-if price (v2 scope)

- Input on the margin view, defaulting to the current standard
  price, must be > $0 (see Validation). Free entry allowed.
- It recomputes **forward profit per bag and forward profit per
  lot only**, where:
  `costPerBag = (bagWeight / (1 − loss)) / 1000 × costPerKg`,
  `forwardProfitPerBag = whatIfPrice − costPerBag`, and
  `forwardProfitPerLot = forwardBags × whatIfPrice + actualRevenueToDate − totalCost`
  (the whole-lot profit left, recomputed at the what-if price).
  For the worked example (fresh 5-lb lot, $22.05/kg, 13.71% loss,
  1-lb reserve): at $13, forward profit is $7.20 per bag and
  $39.66 per lot; at $14, $8.20 per bag and $46.56 per lot.
  Note `forwardBags × forwardProfitPerBag` ($49.66 at $13) is the
  future-bags margin only — it excludes the reserve's green cost,
  which is already inside `totalCost` — so it is NOT the per-lot
  figure.
- It does NOT change break-even bags, bags to break even,
  standard revenue, overpay, shortfall, or any stored value.

### Validation

- `Settings.standardBagPrice` must be > $0. Saving a value ≤ $0
  or non-numeric in `src/pages/SettingsPage.tsx` is refused with
  an error, and the previous value stays.
- What-if price must be > $0. A value ≤ $0 or non-numeric is
  ignored and the input reverts to the current standard price.
- `Sale.standardPriceAtSale`, when present, must be > $0; a sale
  recorded with a missing or invalid standard price is treated
  as $12 for that sale only and the setting is unchanged.

## Risks / Trade-offs

- [A lot is split across beans / combined bags] → Revenue, COGS,
  standard revenue, overpay, and shortfall are source-weighted
  per bag, as `costOfBag` already does. Bags sold is a decimal
  to one place, so a combined bag split across lots contributes
  fractional bags, and money is rounded per lot with `roundMoney`
  after summing.
- [A sale is below standard price] → Overpay is 0 for that sale
  and shortfall is standard revenue − actual amount. The identity
  actual = standard + overpay − shortfall always holds.
- [Weight loss varies by batch] → Forward margin is an estimate
  and MUST be labelled as such ("expected", not "guaranteed"). It
  uses the lot's own loss where available, so a lot that roasts
  lighter or darker than average is not judged by the average.
- [Reserve is changed after roasts] → Forward numbers change, past
  numbers do not. Break-even uses standard revenue to date, which
  is already recorded, so changing the reserve cannot rewrite history.
- [Standard price changes] → Past sales keep their stored
  `standardPriceAtSale`. Only future sales and forward / remaining
  break-even calculations use the new price. This is a deliberate
  choice: history is stable, forward numbers use the current price.

## Migration Plan

- No Dexie version change. `Settings.standardBagPrice` and
  `Sale.standardPriceAtSale` are both optional; missing means $12.
  Older backups import with those fields missing, and the v2
  definitions above apply.
- No backup format change. Rollback is reverting the margin view
  and helpers; the underlying data is unchanged, except for sales
  recorded after the change, which carry `standardPriceAtSale` —
  older builds ignore that field.
