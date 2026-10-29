## MODIFIED Requirements

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
