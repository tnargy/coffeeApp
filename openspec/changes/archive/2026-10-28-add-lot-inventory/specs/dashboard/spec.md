## MODIFIED Requirements

### Requirement: Post-Roast-Day Summary
When the operator opens the dashboard, the system presents accurate current green vs. roasted weights, profiles attached to recent batches, personal-use reserve status, bags ready, a simple P&L snapshot, and the trail of recent activity (roasted/bagged/sold). Roasted weight MUST be split into personal use and for sale. The green-lot list MUST omit any lot whose remaining weight is zero or less.

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
- AND green lots that still have remaining weight show that weight with a visual progress indicator
- AND a lot with no remaining weight is omitted from that list
- AND View all on that card opens the Inventory page, which is not a top-navigation item
- AND recent activity and quick actions are clearly visible

#### Scenario: Roasted stock is marked by use
- **GIVEN** one internal/personal-use batch and one for-sale batch still have roasted weight
- **WHEN** the operator opens the dashboard
- **THEN** personal-use roasted weight and for-sale roasted weight are shown separately

#### Scenario: Depleted lot is omitted from the dashboard list
- GIVEN one lot has remaining green weight and another has none
- WHEN the operator opens the dashboard
- THEN only the lot with remaining weight appears in the green-inventory list
- AND the green remaining total still includes every lot
