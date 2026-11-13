# Delta for Dashboard

## ADDED Requirements

### Requirement: Per-lot margin and break-even
The dashboard P&L section MUST show, for each lot, total cost,
revenue to date, standard revenue, bags sold (to one decimal place),
break-even bags, bags to break even, whole-lot profit left, and
personal-use cost. The table MUST list all lots, including depleted
ones. Break-even bags for a fresh lot MUST be
`ceil(totalCost / currentStandardPrice)`. Bags to break even MUST
be `ceil(max(0, totalCost − standardRevenue) / currentStandardPrice)`.
Whole-lot profit left MUST be actual revenue to date minus the lot's
total cost, labelled as profit left after the lot cost, not as
profit for time. A lot MUST be marked `covered` when its standard
revenue is at least its total cost, otherwise `not covered`. A lot
with `totalCost = 0` MUST be marked `no cost` and show no
break-even line. The existing all-time revenue, COGS, gross profit,
and margin totals MUST stay unchanged.

#### Scenario: First Guatemala lot is covered
- **GIVEN** lot 1, Guatemala, total cost $39.35, 6.0 bags sold, $72.00 revenue, $72.00 standard revenue
- **WHEN** the operator views the per-lot margin table
- **THEN** it shows 4 break-even bags, 0 bags to break even, $32.65 whole-lot profit left, and status `covered`

#### Scenario: New lot is not covered
- **GIVEN** lot 6, Guatemala, total cost $50.00, 0.0 bags sold
- **WHEN** the operator views the per-lot margin table
- **THEN** it shows 5 break-even bags, 5 bags to break even, -$50.00 whole-lot profit left, and status `not covered`

#### Scenario: Overpay does not make a lot covered
- **GIVEN** a $50 lot with 4 bags sold at $20 each (actual revenue $80, standard revenue $48)
- **WHEN** the operator views the per-lot margin table
- **THEN** it shows status `not covered` and 1 bag to break even

#### Scenario: $0 sample lot is not covered
- **GIVEN** lot 4, Nicaraguan sample, total cost $0, 0.0 bags sold
- **WHEN** the operator views the per-lot margin table
- **THEN** it shows status `no cost` and no break-even line

#### Scenario: Personal cost is shown separately
- **GIVEN** the Nov 10 export fixture, with $82.51 green cost consumed
- **WHEN** the operator views per-lot margin
- **THEN** personal-use cost is shown separately from COGS
- **AND** sold COGS ($64.39) plus personal stock cost ($18.13) reconciles to green cost consumed within ±$0.02

#### Scenario: Depleted lot still appears
- **GIVEN** lot 1, Guatemala, remaining green 0 g
- **WHEN** the operator views the per-lot margin table
- **THEN** lot 1 is still listed, with its revenue, profit left, and covered status

### Requirement: Forward margin for stock on hand
For each lot, the dashboard MUST show expected bags for sale,
expected revenue, and expected whole-lot profit left if the
remaining green (minus the unmet reserve) plus roasted for-sale
stock on hand plus already-packed available for-sale bags were
sold at the current standard price. It MUST use the exact formula
in Design: `forwardRoasted = max(0, remainingGreen − unmetReserve)
× (1 − loss) + forSaleRoastedRemaining + weightOfAvailableForSaleBags`,
where `unmetReserve` comes from `lotAllotment`, `loss` is the lot's
own green-weighted loss (1 − sum roastedYield / sum greenWeightCharged)
or the overall green-weighted loss (13.71%) if it has no roasts, and
bag weight is `round(defaultBagSizeOz × 28.349523125)` (227 g for
8 oz). Forward bags MUST be shown to one decimal place and labelled
as expected, not guaranteed. Forward revenue, forward profit left,
and the reserve what-if line MUST be computed from exact
(unrounded) forward bags; the 1-decimal figure is display only
(6.9 × $12 = $82.80, not the correct $82.77).

#### Scenario: New 5-lb lot forward margin
- **GIVEN** a new 5-lb lot at $50, 13.71% loss, 1-lb reserve, no sales yet
- **WHEN** the operator views forward margin
- **THEN** it shows 6.9 bags for sale, $82.77 expected revenue (±$0.02), and $32.77 expected whole-lot profit left

#### Scenario: Reserve sold instead
- **GIVEN** the same lot
- **WHEN** the operator views the reserve what-if line
- **THEN** it shows 1.7 extra bags and $20.69 extra revenue if the reserve were sold instead of kept

#### Scenario: Packed for-sale bags count
- **GIVEN** a lot with available for-sale bags packed and `roastedWeightRemaining` 0
- **WHEN** the operator views forward margin
- **THEN** those packed bags are counted in expected bags and revenue

#### Scenario: Changing the reserve recalculates forward margin only
- **GIVEN** a lot with a stored reserve
- **WHEN** the operator changes that reserve
- **THEN** forward bags, revenue, and profit recalculate
- **AND** revenue to date, standard revenue, and bags sold do not change

### Requirement: What-if price
The margin view MUST offer a what-if price input, defaulting to
the current standard bag price, that recomputes forward profit per
bag and per lot only, using `costPerBag = (bagWeight / (1 − loss))
/ 1000 × costPerKg`, `forwardProfitPerBag = whatIfPrice − costPerBag`,
and `forwardProfitPerLot = forwardBags × whatIfPrice + actualRevenueToDate − totalCost`
(whole-lot profit left recomputed at the what-if price, from exact
forward bags). It MUST NOT change break-even bags, bags to break
even, standard revenue, overpay, shortfall, or any stored sale. A
what-if price ≤ $0 or non-numeric MUST be ignored and the input
MUST revert to the current standard price.

#### Scenario: What-if $13 and $14
- **GIVEN** a new lot at $22.05/kg, 13.707% loss, 227 g bag, no sales yet, total cost $50
- **WHEN** the operator enters $13 as the what-if price
- **THEN** forward profit is $7.20 per bag (±$0.02) and $39.66 per lot (±$0.02)
- **AND** when the operator enters $14, forward profit is $8.20 per bag (±$0.02) and $46.56 per lot (±$0.02)
- **AND** no stored sale amount changes

### Requirement: Cost trend
Lots MUST be listed in receipt order with $/kg and total cost.
A lot MUST be flagged when its $/kg is at least 10% higher than
its comparator: the most recent earlier paid lot (`totalCost > 0`)
received on an earlier UTC calendar day than this lot, with ties
broken by latest `dateReceived`, then highest `id`. Lots
received on the same UTC day MUST share the same comparator. A lot
with no comparator MUST never be flagged. The flag is a label, not
a block.

#### Scenario: November lots are flagged
- **GIVEN** lots at $17.35–$17.54/kg in October and $22.05/kg in November
- **WHEN** the operator views the cost trend
- **THEN** the November Guatemala and Peru lots are flagged (+25.7% vs Oct 26)
- **AND** the October lots are not flagged

### Requirement: Monthly sales history
Sales MUST be grouped by UTC month of `sale.date` (YYYY-MM in UTC),
showing bags sold (to one decimal place), actual revenue, standard
revenue, overpay, and shortfall. Months with no sales MUST be omitted.
The table MUST live in the Dashboard P&L section, below the per-lot
margin table. No demand forecast MUST be shown.

#### Scenario: October and November history
- **GIVEN** the Nov 10 export fixture
- **WHEN** the operator views monthly history
- **THEN** October 2026 shows 6.0 bags and $72, and November 2026 shows 8.0 bags and $114

## MODIFIED Requirements

### Requirement: Simple P&L Snapshot
The existing all-time P&L snapshot (revenue, COGS, gross profit,
gross margin) MUST stay as it is, and the per-lot margin table in
this change MUST be shown alongside it, not instead of it. The
existing requirement that the green-inventory lot list omit
depleted lots applies to that inventory list only, NOT to the
per-lot margin table, which MUST list all lots including depleted
ones.

#### Scenario: All-time totals are unchanged
- **GIVEN** the Nov 10 export fixture
- **WHEN** the operator views the dashboard
- **THEN** the all-time totals still read $186 revenue, $64.39 COGS, $121.61 gross profit, 65.4% margin
