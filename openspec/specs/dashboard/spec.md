# Dashboard

## Purpose
Provide an immediate post-roast-day summary of green vs. roasted weights, attached profiles, personal-use reserve status, and the trail of rested, bagged, and sold items.

## Requirements

### Requirement: Post-Roast-Day Summary
When the operator opens the dashboard, the system presents accurate current green vs. roasted weights, profiles attached to recent batches, personal-use reserve status, bags ready, and a simple P&L snapshot. Roasted weight MUST be split into personal use and for sale. The green-lot list MUST omit any lot whose remaining weight is zero or less. The dashboard MUST NOT display the recent-activity card or the quick-actions card.

#### Scenario: Dashboard shows full summary
- GIVEN several lots and batches exist, including one recent roast
- WHEN the operator opens the main dashboard
- THEN the dashboard shows current green weight, roasted weight, personal-use reserve status, profiles on recent batches, and a clear list of items that have been roasted, bagged, or sold
- AND the recent-activity card is not shown

#### Scenario: Dashboard shows summary
- GIVEN lots and batches exist
- WHEN the operator opens the main dashboard
- THEN green weight, roasted weight, reserve status, and recent profiles are displayed
- AND the recent-activity card is not shown

#### Scenario: Dashboard shows enriched summary
- GIVEN lots, batches, bags, and sales exist
- WHEN the operator opens the main dashboard
- THEN stat cards show green remaining, roasted stock, bags ready, and any unpaid indicator
- AND a simple P&L snapshot (revenue, COGS, gross profit) is displayed
- AND green lots that still have remaining weight show that weight with a visual progress indicator
- AND a lot with no remaining weight is omitted from that list
- AND View all on that card opens the Inventory page, which is not a top-navigation item
- AND the recent-activity card and the quick-actions card are not shown

#### Scenario: Roasted stock is marked by use
- **GIVEN** one internal/personal-use batch and one for-sale batch still have roasted weight
- **WHEN** the operator opens the dashboard
- **THEN** personal-use roasted weight and for-sale roasted weight are shown separately

#### Scenario: Depleted lot is omitted from the dashboard list
- GIVEN one lot has remaining green weight and another has none
- WHEN the operator opens the dashboard
- THEN only the lot with remaining weight appears in the green-inventory list
- AND the green remaining total still includes every lot

### Requirement: Full History Trail
When the operator views the history of a batch or lot, the system MUST show that subject's full timeline in this order: green receipt → roast (with profile) → bagging → sale(s). Rest MUST NOT be tracked or shown as a timeline event. Stages that have not happened MUST NOT appear as if they did. A lot trail MUST include every batch on that lot, in the same order, and each of those events MUST identify its batch.

#### Scenario: View batch history
- **GIVEN** a batch that has been roasted, bagged, and partially sold
- **WHEN** the operator views its history
- **THEN** the timeline shows green receipt, roast with profile, bagging, and the sale, in that order
- **AND** the timeline is labeled as that batch

#### Scenario: View lot history
- **GIVEN** a lot with two batches, and those batches have different completed stages
- **WHEN** the operator views the lot history
- **THEN** the green receipt appears once
- **AND** each batch is shown in roast order, with that batch's events in stage order
- **AND** each batch event identifies its batch

#### Scenario: Open a subject from the dashboard
- **GIVEN** the dashboard links to a batch or lot history
- **WHEN** the operator follows that link
- **THEN** that subject's timeline is shown without a further selection

#### Scenario: Omit stages that have not happened
- **GIVEN** a batch that has been roasted but not bagged or sold
- **WHEN** the operator views its history
- **THEN** the timeline shows green receipt and roast with profile, in that order
- **AND** bagging and sale are not shown as completed events

### Requirement: Recent Activity and Quick Actions
The system keeps recent-activity and quick-action definitions available, but the dashboard MUST NOT display the recent-activity card or the quick-actions card. Log Roast, Pack Bags, and Record Sale MUST remain reachable from navigation. History MUST still show the activity trail.

#### Scenario: Cards are hidden
- GIVEN the operator is on the dashboard
- WHEN the page is shown
- THEN the recent-activity card is not shown
- AND the quick-actions card is not shown

#### Scenario: Recording flows stay in navigation
- GIVEN the operator is on the dashboard
- WHEN they use the top navigation
- THEN Log Roast, Pack Bags, and Record Sale are still available

### Requirement: Quick Actions
Quick-action definitions for logging a roast, packing bags, and recording a sale MUST remain in the application. The dashboard MUST NOT display the quick-actions card.

#### Scenario: Quick actions card is hidden
- GIVEN the operator is on the dashboard
- WHEN the page is shown
- THEN no quick-actions card is shown
- AND the operator can still open Log Roast, Pack Bags, and Record Sale from navigation

### Requirement: Simple P&L Snapshot
The system displays a basic profit-and-loss summary derived from recorded sales and associated green costs. No tax calculation or filing is performed.

#### Scenario: P&L reflects sales and costs
- GIVEN one or more sales of bagged coffee with known cost basis
- WHEN the operator views the dashboard
- THEN revenue, cost of goods, and gross profit are shown

### Requirement: Personal cost is separate from cost of goods
The P&L section MUST show the green-equivalent cost of live personal roasted stock, which is unpacked personal weight plus live personal bags, using the same green-cost share as a sold bag. That amount MUST NOT be added to cost of goods. It is not the cost of the personal-yield split alone when personal bags were packed from for-sale coffee.

#### Scenario: Personal stock is shown apart from sold beans
- GIVEN sold bags and live personal roasted coffee
- WHEN the operator views the P&L section
- THEN cost of goods counts the sold bags
- AND personal stock is shown separately
- AND personal stock is not included in cost of goods

### Requirement: Monthly sales history
The P&L section MUST list live sales by UTC month of the sale date. Each month shows bags, actual revenue, standard revenue, overpay, and shortfall. A month with no live sales MUST NOT appear. Voided sales MUST NOT be included. The list is history, not a demand forecast.

#### Scenario: Two months of sales
- GIVEN live sales in October and November and none in the months between
- WHEN the operator views the P&L section
- THEN October and November are listed with their bags and revenue
- AND the empty months are omitted

### Requirement: Per-lot break-even
The dashboard MUST list every lot, including lots with no green remaining. For each lot it shows total cost, revenue to date, standard revenue, bags sold to one decimal, break-even bags `ceil(totalCost / current standard price)`, bags still to break even `ceil(max(0, totalCost − standard revenue) / current standard price)`, profit left after the lot cost, personal-use cost (the green-equivalent cost of live personal roasted stock from that lot, shown separately and NOT added to cost of goods), and a status. Status is `no cost` when total cost is zero, `covered` when standard revenue is at least total cost, and `not covered` otherwise. A $0 lot shows no break-even line. Standard revenue uses the standard price stored on each sale. A missing stored price means $12. Standard revenue for a sale is the sum over its bags of (bag weight / packed bag weight for the default bag size) × that sale's standard price, so a 4 oz bag counts about half the standard price.

#### Scenario: A lot sold past its cost
- GIVEN a lot whose standard revenue is at least its total cost
- WHEN the operator views lot margin
- THEN the lot is listed as covered
- AND bags still to break even is zero

#### Scenario: A finished lot stays in the margin list
- GIVEN a lot with no green remaining
- WHEN the operator views the dashboard
- THEN that lot is omitted from the green-inventory list
- AND that lot is still listed in lot margin

### Requirement: Forward margin and what-if
Forward roasted weight for a lot is `max(0, remaining green − unmet reserve) × (1 − loss) + for-sale roasted remaining + available for-sale bag weight` from that lot. Loss is the lot's own green-weighted loss, `1 − roasted yield / green charged`, or the overall green-weighted loss when the lot has no roast. Bag count divides that weight by `round(default bag ounces × 28.349523125)`. Displayed bags use one decimal. Forward revenue and profit use the exact bag count. The section MUST offer a per-lot reserve what-if, showing what selling that reserve would add (extra bags, extra revenue, and extra profit left), and a what-if bag price above zero. The what-if price recomputes forward profit per bag and per lot only. It MUST NOT change stored sales, break-even, or standard revenue. A what-if price of zero or less, or non-numeric, is ignored and the section falls back to the current standard price.

#### Scenario: Reserve what-if does not change stored sales
- GIVEN a lot with a personal reserve and no roasts
- WHEN the operator changes the reserve what-if and the what-if bag price
- THEN forward bags and forward profit change
- AND recorded sales and break-even stay as they were

### Requirement: Cost trend
Lots MUST be comparable by price per kilogram in receipt order. A lot is flagged when its price per kilogram is at least 10% higher than the most recent earlier paid lot received on an earlier UTC day. Ties use the latest receipt time, then the highest id. Lots received on the same UTC day share that comparator. A lot with no such comparator is not flagged. A lot with zero total cost is not a comparator and is not flagged.

#### Scenario: Same-day receipts share a comparator
- GIVEN two paid lots received on one UTC day and an earlier paid lot
- WHEN the operator views lot margin
- THEN both same-day lots are compared with the earlier lot
- AND neither is compared with the other

### Requirement: Fair to sell
When a lot's personal allotment is covered, the dashboard MUST mark that lot's remaining green and its for-sale roasted stock as fair to sell. For-sale roasted stock includes the for-sale pool of a split roast. Personal-use roasted stock MUST stay marked personal use and MUST NOT be marked fair to sell. If the allotment is not covered, the dashboard MUST show how much of that lot is still reserved and MUST NOT mark that reserved green as fair to sell.

#### Scenario: Allotment roasted
- **GIVEN** a lot whose personal reserve has been fully charged to internal/personal-use roasts
- **WHEN** the operator opens the dashboard
- **THEN** that lot's remaining green is marked fair to sell
- **AND** roasted weight from for-sale batches of that lot is marked fair to sell
- **AND** roasted weight from personal-use batches is marked personal use

#### Scenario: Allotment still open
- **GIVEN** a lot whose personal reserve is not yet covered
- **WHEN** the operator opens the dashboard
- **THEN** the unmet reserve is shown
- **AND** that unmet amount is not marked fair to sell

#### Scenario: Split roast is fair only on its for-sale pool
- **GIVEN** a covered lot and one roast with both unpacked personal weight and unpacked for-sale weight
- **WHEN** the operator opens the dashboard
- **THEN** the for-sale pool is marked fair to sell
- **AND** the personal pool is not

### Requirement: Split roast stock
When one roast still has both personal-use and for-sale roasted weight, the dashboard MUST count each pool in the matching roasted total.

#### Scenario: One roast contributes to both totals
- **GIVEN** one roast has unpacked personal weight and unpacked for-sale weight
- **WHEN** the operator opens the dashboard
- **THEN** the personal total includes the personal weight
- **AND** the for-sale total includes the for-sale weight

### Requirement: Bags ready excludes personal bags
Bags ready MUST count available for-sale bags only. An available personal-use bag MUST NOT be included.

#### Scenario: Personal bags are not ready to sell
- **GIVEN** one available personal-use bag and one available for-sale bag
- **WHEN** the operator opens the dashboard
- **THEN** bags ready is 1
