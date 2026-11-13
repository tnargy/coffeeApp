# Proposal

## Why

The big picture for this side gig is not maximising margin %: buy green
beans mainly for personal / family use, sell the rest to cover the cost
of the beans, and best case make a profit for the time spent roasting
and packing.

The app today has one all-time P&L snapshot on the dashboard — revenue,
cost of goods, gross profit, gross margin — and nothing else. As of the
2026-11-10 export that is $186 revenue, $64.39 COGS, $121.61 profit,
65.4% margin. That single number cannot answer the three questions
that matter per lot:

1. Is my personal coffee paid for yet?
2. How many bags are left until this lot breaks even?
3. After that, what is left for my time?

Bean prices are also moving, which is what makes this urgent now:
$17.35/kg for the first Guatemala lot (5 lb, $39.35, Oct 14),
$17.54/kg for Colombian / Papua New Guinea (Oct 26), and $22.05/kg
for the new Guatemala and Peru lots (5 lb, $50 each, Nov 9) — up
27.1% from the first Guatemala lot's $17.35/kg. At 13.71% roast
loss (green-weighted, see Design), cost per 8oz bag rises from
$4.56 to $5.80, and profit per $12 bag falls from $7.44 to $6.20.

## What Changes

- Add a per-lot margin view, on the Dashboard P&L section and on
  Inventory / lot history, showing for each lot: total cost, revenue
  to date (actual and at standard price), bags sold, break-even bags,
  bags to break even, whole-lot profit left after the lot cost
  ("profit left", not "profit for my time" — time is not tracked),
  and personal-use cost shown separately from COGS.
- Break-even is whole-lot and on the standard-price basis, so
  "covered" and "bags to break even" cannot contradict each other
  (see Design, Goldfish fix B4). `covered` means
  `standardRevenue >= totalCost`. `bagsToBreakEven` is
  `ceil(max(0, totalCost - standardRevenue) / currentStandardPrice)`.
  For a $50 lot at $12 that is 5 bags when nothing is sold; for the
  $39.35 first Guatemala lot it was 4 bags when nothing was sold.
- Add forward margin for stock on hand: for each lot, expected bags
  for sale, expected revenue, and expected whole-lot profit if the
  remaining green and roasted for-sale stock is sold at the current
  standard price, using that lot's own weight loss where it has
  roasts, or the overall green-weighted average loss (13.71% in the
  Nov 10 export) where it has none. The formula is stated exactly
  in Design, including packed bags and the unmet reserve.
- Make the personal reserve a what-if, not a fixed rule. The reserve
  is typically 1 lb of a 5-lb lot, but it is flexible: if Grant is
  stocked up personally and demand is high, he may sell more.
  The margin view recalculates when the per-lot reserve changes, and
  shows the extra bags / revenue / profit if the reserve were sold
  instead of kept.
- Show cost trend: $/kg by lot and by origin, in receipt order, with
  a flag when a new lot's $/kg is at least 10% higher than the
  comparator lot defined in Design (most recent earlier paid lot
  received on an earlier UTC calendar day). Lots received on the
  same day share the same comparator, so both Nov 9 lots are flagged
  against Oct 26.
- Show sales by month (bags, actual revenue, standard revenue,
  overpay, shortfall) as history only, grouped by UTC month of
  `sale.date`. Demand varies month to month — some months hot, some
  low — so v1 does not forecast demand.
- Add a what-if price input on the margin view ($12 / $13 / $14, free
  entry allowed, must be > $0) that recomputes forward profit per
  bag and per lot only. It changes no stored sale, no break-even
  bags, and no standard revenue.
- Split overpay / shortfall from standard revenue. A sale above the
  standard bag price shows as standard revenue plus overpay; a sale
  below it shows as standard revenue minus shortfall. In the Nov 10
  export, $18 of the $186 revenue is overpay (Daniel and Dalton $20
  each, Dean $14 once), and Papua New Guinea's apparent 72.1% margin
  is 61.6% at standard price.

## Capabilities

### New Capabilities

- `lot-margin`: Per-lot break-even, forward margin, cost trend, and
  monthly sales history, framed around covering the lot cost and the
  personal reserve.

### Modified Capabilities

- `dashboard`: The P&L snapshot gains per-lot margin and forward
  margin; the all-time totals stay as they are. The margin table
  lists all lots, including depleted ones.
- `sales`: Sales show standard revenue, overpay, and shortfall
  separately in the margin view; a sale stores the standard price
  in effect when it was recorded. Sale recording, amounts, and P&L
  totals do not change.
- `inventory`: Lot rows show $/kg, break-even status, and forward
  margin; receipt and reserve editing do not change.

## Impact

- New logic in `src/domain/rules.ts`: lot margin, break-even,
  forward margin, cost trend, monthly sales, overpay / shortfall
  split, and what-if pricing. New / extended sections in
  `src/pages/Dashboard.tsx` and `src/pages/Inventory.tsx`, a margin
  detail on lot history, and a standard-price field in
  `src/pages/SettingsPage.tsx`.
- `Settings` gains `standardBagPrice` (default $12, editable in
  Settings, must be > $0). `Sale` gains optional
  `standardPriceAtSale`, set at record time. No new Dexie store.
  No backup format change: both new fields are optional, and older
  backups / sales without them are treated as $12.
- No change to roast, bagging, sale, void, tax, or backup rules. Tax
  is still stored only, not calculated.

## Decisions made in this revision (Goldfish review, 2026-11-11)

The v1 draft received a zero-context Goldfish review with verdict
NO-GO. This revision (v2) fixes all 6 blockers and 8 majors; see
`REVISIONS.md` for the full list. The three questions the Goldfish
said must be answered before implementation are decided here, and
Grant can override any of them:

1. **Standard price does NOT apply retroactively.** The standard
   price in effect at sale time is stored on the sale as
   `standardPriceAtSale`. Changing `Settings.standardBagPrice`
   affects future sales and forward margin only; past standard
   revenue, overpay, and monthly history do not recompute.
2. **"Personal cost" is the green-equivalent cost of live personal
   roasted stock** — live internal bags plus unpacked personal
   remaining weight, computed per bag / pool with `bagSources`
   exactly like `costOfBag`. It is NOT the green cost of
   `personalYield` alone ($10.13 in the fixture). In the fixture
   it is $18.13.
3. **Cost-trend comparator is the most recent earlier paid lot
   received on an earlier UTC calendar day**, regardless of origin.
   Lots received on the same day share that comparator. A lot with
   no such comparator is never flagged. This flags both Nov 9 lots
   ($22.05/kg) against Oct 26 ($17.54/kg, +25.7%).

## Open Questions (remaining, defaults in this draft)

- A lot's `totalCost` is treated as the all-in bean cost as entered
  (the first lot was $39.35 in the app vs. about $40 shipped in
  Grant's account). Margin stays bean-only in v1; bags, labels, and
  other costs are not tracked.
- Time is not tracked in v1. The view shows profit left after the
  lot cost, not profit per hour.
- The cost-jump flag threshold is 10%.
