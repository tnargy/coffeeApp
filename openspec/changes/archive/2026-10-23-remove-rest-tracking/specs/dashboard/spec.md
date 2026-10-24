# Spec Delta

## MODIFIED Requirements

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
