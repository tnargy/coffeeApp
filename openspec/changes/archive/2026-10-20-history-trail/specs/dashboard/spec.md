# Delta for Dashboard

## MODIFIED Requirements

### Requirement: Full History Trail
When the operator views the history of a batch or lot, the system MUST show that subject's full trail as a clear timeline in this order: green receipt → roast (with profile) → rest → bagging → sale(s). Stages that have not happened MUST NOT appear as if they did. A lot trail MUST include every batch on that lot, in the same order, and each of those events MUST identify its batch.

#### Scenario: View batch history
- **GIVEN** a batch that has been roasted, rested, bagged, and partially sold
- **WHEN** the operator views its history
- **THEN** the timeline shows green receipt, roast with profile, rest, bagging, and the sale, in that order
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
- **GIVEN** a batch that has been roasted but not rested, bagged, or sold
- **WHEN** the operator views its history
- **THEN** the timeline shows green receipt and roast with profile, in that order
- **AND** rest, bagging, and sale are not shown as completed events
