# Delta for Dashboard

## MODIFIED Requirements

### Requirement: Post-Roast-Day Summary
When the operator opens the dashboard, the system presents accurate current green vs. roasted weights, profiles attached to recent batches, personal-use reserve status, bags ready, a simple P&L snapshot, and the trail of recent activity (rested/bagged/sold).

#### Scenario: Dashboard shows enriched summary
- GIVEN lots, batches, bags, and sales exist
- WHEN the operator opens the main dashboard
- THEN stat cards show green remaining, roasted stock, bags ready, and any unpaid indicator
- AND a simple P&L snapshot (revenue, COGS, gross profit) is displayed
- AND green lots show remaining weight with a visual progress indicator
- AND recent activity and quick actions are clearly visible

## ADDED Requirements

### Requirement: Simple P&L Snapshot
The system displays a basic profit-and-loss summary derived from recorded sales and associated green costs. No tax calculation or filing is performed.

#### Scenario: P&L reflects sales and costs
- GIVEN one or more sales of bagged coffee with known cost basis
- WHEN the operator views the dashboard
- THEN revenue, cost of goods, and gross profit are shown
