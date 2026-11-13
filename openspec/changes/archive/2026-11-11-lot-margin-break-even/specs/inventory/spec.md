# Delta for Inventory

## ADDED Requirements

### Requirement: Lot rows show margin, cost trend, and forward margin
Each lot row on Inventory / lot history MUST show $/kg, total cost,
break-even status (`covered`, `not covered`, or `no cost` for a $0
lot), bags to break even, and forward margin (expected bags, expected
revenue, expected whole-lot profit left), using the same definitions
as the Dashboard delta. The cost-trend flag MUST be shown on the
lot row when it applies (a lot's $/kg at least 10% higher than its
comparator, as defined in Design). The margin table MUST list all
lots, including depleted ones (remaining green 0 g). Receipt and
reserve editing MUST NOT change.

#### Scenario: November lots are flagged on Inventory
- **GIVEN** the Nov 10 export fixture
- **WHEN** the operator views Inventory / lot history
- **THEN** the Nov 9 Guatemala and Peru lots show the cost-trend flag
- **AND** the October lots do not

#### Scenario: Depleted lot still shows margin
- **GIVEN** lot 1, Guatemala, remaining green 0 g, 6.0 bags sold, $72.00 revenue
- **WHEN** the operator views Inventory / lot history
- **THEN** lot 1 is listed with status `covered`, 0 bags to break even, and $32.65 whole-lot profit left

#### Scenario: $0 sample lot shows no cost
- **GIVEN** lot 4, Nicaraguan sample, total cost $0
- **WHEN** the operator views Inventory / lot history
- **THEN** it shows status `no cost` and no break-even line
