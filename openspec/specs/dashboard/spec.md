# Dashboard

## Purpose
Provide an immediate post-roast-day summary of green vs. roasted weights, attached profiles, personal-use reserve status, and the trail of rested, bagged, and sold items.

## Requirements

### Requirement: Post-Roast-Day Summary
When the operator opens the dashboard, the system presents accurate current green vs. roasted weights, profiles attached to recent batches, personal-use reserve status, bags ready, a simple P&L snapshot, and the trail of recent activity (roasted/bagged/sold). Roasted weight MUST be split into personal use and for sale.

#### Scenario: Dashboard shows full summary
- GIVEN several lots and batches exist, including one recent roast
- WHEN the operator opens the main dashboard
- THEN the dashboard shows current green weight, roasted weight, personal-use reserve status, profiles on recent batches, and a clear list of items that have been roasted, bagged, or sold

#### Scenario: Dashboard shows summary
- GIVEN lots and batches exist
- WHEN the operator opens the main dashboard
- THEN green weight, roasted weight, reserve status, recent profiles, and activity are displayed

#### Scenario: Dashboard shows enriched summary
- GIVEN lots, batches, bags, and sales exist
- WHEN the operator opens the main dashboard
- THEN stat cards show green remaining, roasted stock, bags ready, and any unpaid indicator
- AND a simple P&L snapshot (revenue, COGS, gross profit) is displayed
- AND green lots show remaining weight with a visual progress indicator
- AND recent activity and quick actions are clearly visible

#### Scenario: Roasted stock is marked by use
- **GIVEN** one internal/personal-use batch and one for-sale batch still have roasted weight
- **WHEN** the operator opens the dashboard
- **THEN** personal-use roasted weight and for-sale roasted weight are shown separately

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
The dashboard surfaces recent activity and quick actions for logging a roast, packing bags, and recording a sale.

#### Scenario: Quick actions available
- GIVEN the operator is on the dashboard
- WHEN they select a quick action
- THEN they are taken to the corresponding recording flow

### Requirement: Quick Actions
The dashboard provides quick actions for logging a roast, packing bags, and recording a sale.

#### Scenario: Quick actions available
- GIVEN the operator is on the dashboard
- WHEN they select a quick action
- THEN they navigate to the corresponding recording flow

### Requirement: Simple P&L Snapshot
The system displays a basic profit-and-loss summary derived from recorded sales and associated green costs. No tax calculation or filing is performed.

#### Scenario: P&L reflects sales and costs
- GIVEN one or more sales of bagged coffee with known cost basis
- WHEN the operator views the dashboard
- THEN revenue, cost of goods, and gross profit are shown

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
