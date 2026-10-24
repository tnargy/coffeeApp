# Delta for Dashboard

## MODIFIED Requirements

### Requirement: Post-Roast-Day Summary
When the operator opens the dashboard, the system presents accurate current green vs. roasted weights, profiles attached to recent batches, personal-use reserve status, bags ready, a simple P&L snapshot, and the trail of recent activity (rested/bagged/sold). Roasted weight MUST be split into personal use and for sale.

#### Scenario: Dashboard shows full summary
- GIVEN several lots and batches exist, including one recent roast
- WHEN the operator opens the main dashboard
- THEN the dashboard shows current green weight, roasted weight, personal-use reserve status, profiles on recent batches, and a clear list of items that have been rested, bagged, or sold

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

## ADDED Requirements

### Requirement: Fair to sell
When a lot's personal allotment is covered, the dashboard MUST mark that lot's remaining green and its for-sale roasted stock as fair to sell. Personal-use roasted stock MUST stay marked personal use. If the allotment is not covered, the dashboard MUST show how much of that lot is still reserved and MUST NOT mark that reserved green as fair to sell.

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
