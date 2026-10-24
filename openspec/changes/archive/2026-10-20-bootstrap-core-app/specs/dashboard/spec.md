# Delta for Dashboard

## ADDED Requirements

### Requirement: Post-Roast-Day Summary
When the operator opens the dashboard, the system presents accurate current green vs. roasted weights, profiles attached to recent batches, personal-use reserve status, and the trail of rested/bagged/sold items.

#### Scenario: Dashboard shows summary
- GIVEN lots and batches exist
- WHEN the operator opens the main dashboard
- THEN green weight, roasted weight, reserve status, recent profiles, and activity are displayed

### Requirement: Quick Actions
The dashboard provides quick actions for logging a roast, packing bags, and recording a sale.

#### Scenario: Quick actions available
- GIVEN the operator is on the dashboard
- WHEN they select a quick action
- THEN they navigate to the corresponding recording flow
