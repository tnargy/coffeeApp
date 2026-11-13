# Dashboard

## Purpose
Provide an immediate post-roast-day summary of green vs. roasted weights, personal-use reserve status, money (P&L snapshot and per-lot margin), and what is ready to sell.

## Requirements

### Requirement: Post-Roast-Day Summary
When the operator opens the dashboard, the system presents accurate current green vs. roasted weights, personal-use reserve status, bags ready, and a simple P&L snapshot. Roasted weight MUST be split into personal use and for sale. The green-lot list MUST omit any lot whose remaining weight is zero or less. The dashboard MUST NOT display the recent-activity card or the quick-actions card. The dashboard MUST NOT display a Recent profiles section or a Bagged and sold section; per-batch roast facts live on History, and per-batch bagging and sale events live on History and Records. Per-batch bagged/sold totals are not shown anywhere after this change.

#### Scenario: Dashboard shows full summary
- GIVEN several lots and batches exist, including one recent roast
- WHEN the operator opens the main dashboard
- THEN the dashboard shows current green weight, roasted weight, personal-use reserve status, and a P&L snapshot
- AND the recent-activity card is not shown
- AND no Recent profiles section is shown
- AND no Bagged and sold section is shown

#### Scenario: Dashboard shows summary
- GIVEN lots and batches exist
- WHEN the operator opens the main dashboard
- THEN green weight, roasted weight, and reserve status are displayed
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
- AND no Recent profiles section is shown
- AND no Bagged and sold section is shown

#### Scenario: Roasted stock is marked by use
- **GIVEN** one internal/personal-use batch and one for-sale batch still have roasted weight
- **WHEN** the operator opens the dashboard
- **THEN** personal-use roasted weight and for-sale roasted weight are shown separately

#### Scenario: Depleted lot is omitted from the dashboard list
- GIVEN one lot has remaining green weight and another has none
- WHEN the operator opens the dashboard
- THEN only the lot with remaining weight appears in the green-inventory list
- AND the green remaining total still includes every lot

#### Scenario: Roast facts remain on History
- GIVEN a batch that was roasted with a profile, then bagged and sold
- WHEN the operator opens History and selects that batch
- THEN the batch list shows its classification, loss, and timing
- AND its trail shows the roast event with profile label, charge temp, batch size, DTR, loss, and timing, followed by its bagging and sale events

### Requirement: Full History Trail
When the operator views the history of a batch or lot, the system MUST show that subject's full timeline in this order: green receipt → roast (with profile) → bagging → sale(s). Rest MUST NOT be tracked or shown as a timeline event. Stages that have not happened MUST NOT appear as if they did. A lot trail MUST include every batch on that lot, in the same order, and each of those events MUST identify its batch.

#### Scenario: View batch history
- **GIVEN** a batch that has been roasted, bagged, and partially sold
- **WHEN** the operator views its history
- **THEN** the timeline shows green receipt, roast with profile, bagging, and the sale, in that order
- **AND** the timeline is labeled as that batch

#### Scenario: View lot history
- GIVEN a lot with two batches, and those batches have different completed stages
- WHEN the operator views the lot history
- THEN the green receipt appears once
- AND each batch is shown in roast order, with that batch's events in stage order
- AND each batch event identifies its batch

#### Scenario: Open a lot subject from the dashboard
- GIVEN the dashboard links to a lot history (green-inventory and margin lot names)
- WHEN the operator follows that link
- THEN that lot's timeline is shown without a further selection

#### Scenario: Omit stages that have not happened
- GIVEN a batch that has been roasted but not bagged or sold
- WHEN the operator views its history
- THEN the timeline shows green receipt and roast with profile, in that order
- AND bagging and sale are not shown as completed events

### Requirement: Per-lot break-even
The dashboard MUST list every lot with green remaining, with the same per-lot fields as before: total cost, revenue to date, standard revenue, bags sold to one decimal, break-even bags `ceil(totalCost / current standard price)`, bags still to break even `ceil(max(0, totalCost − standard revenue) / current standard price)`, profit left after the lot cost, personal-use cost (the green-equivalent cost of live personal roasted stock from that lot, shown separately and NOT added to cost of goods), and a status. Status is `no cost` when total cost is zero, `covered` when standard revenue is at least total cost, and `not covered` otherwise. A $0 lot shows no break-even line. Standard revenue uses the standard price stored on each sale. A missing stored price means $12. Standard revenue for a sale is the sum over its bags of (bag weight / packed bag weight for the default bag size) × that sale's standard price, so a 4 oz bag counts about half the standard price. Finished lots (no green remaining) are NOT listed by default; see Finished-lots toggle.

#### Scenario: A lot sold past its cost
- GIVEN a lot whose standard revenue is at least its total cost
- WHEN the operator views lot margin
- THEN the lot is listed as covered
- AND bags still to break even is zero

#### Scenario: A finished lot is hidden from lot margin by default
- GIVEN a lot with no green remaining
- WHEN the operator opens the dashboard
- THEN that lot is omitted from the green-inventory list
- AND that lot is NOT listed in lot margin
- AND the Lot margin card offers a way to show it (see Finished-lots toggle)

### Requirement: Finished-lots toggle
The Lot margin card MUST offer a button that reveals finished lots (lots with no green remaining, `weightRemaining <= 0`, the same `isDepletedLot` definition the green-inventory list uses). The button reads `Show finished lots (n)` where `n` is the count of finished lots, and `Hide finished lots` while they are shown. The button sits directly below the intro paragraph of the Lot margin card, above the what-if bag price field. When there are no finished lots the button MUST NOT be rendered. The choice is local component state, default hidden, and resets on reload; it is not persisted and is not a setting. While finished lots are hidden the card subtitle reads `Active lots — finished lots hidden`; while they are shown it reads `Every lot, including finished ones`. A shown finished lot renders identically to an active lot and in place, in the same `lotBreakEvens` order: same row, same forward line, same reserve what-if, same what-if price behaviour. When lots exist but the active-only list is empty, the table is replaced by `<p className="muted">No active lots — show finished lots to see them.</p>`.

#### Scenario: Toggle reveals finished lots
- GIVEN 4 lots with green remaining and 3 finished lots
- WHEN the operator opens the dashboard
- THEN lot margin lists 4 lots
- AND the button reads `Show finished lots (3)`
- AND the subtitle reads `Active lots — finished lots hidden`
- WHEN the operator taps the button
- THEN lot margin lists 7 lots
- AND the button reads `Hide finished lots`
- AND the subtitle reads `Every lot, including finished ones`
- AND the finished lots appear in place, in the same order as before

#### Scenario: All lots finished shows an empty state
- GIVEN lots exist and every one has no green remaining
- WHEN the operator opens the dashboard
- THEN lot margin shows `No active lots — show finished lots to see them.` instead of the table
- AND the button reads `Show finished lots (n)` with `n` equal to the lot count

#### Scenario: No finished lots means no button
- GIVEN every lot still has green remaining
- WHEN the operator opens the dashboard
- THEN lot margin lists every lot
- AND no finished-lots button is rendered

#### Scenario: Toggle resets on reload
- GIVEN the operator has shown finished lots
- WHEN the operator reloads the dashboard
- THEN lot margin lists active lots only
- AND the button reads `Show finished lots (n)`
