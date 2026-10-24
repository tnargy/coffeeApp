# Delta for Resting and Packaging

## ADDED Requirements

### Requirement: Rest Period
The batch becomes available for bagging only after a minimum of 24 hours have elapsed. When the operator initiates bagging, the system displays how long the batch has rested.

#### Scenario: Bag after minimum rest
- GIVEN a roasted batch rested for at least 24 hours
- WHEN the operator initiates bagging
- THEN the system allows bagging and displays the actual rest duration

### Requirement: Bagging
When the operator records bagging of a rested batch, the system defaults to the configured bag size (starting at 8 oz) and reduces the available roasted weight of that batch by the total bagged weight, creating the corresponding bagged inventory units.

#### Scenario: Bag a rested batch
- GIVEN a rested batch with remaining roasted weight
- WHEN the operator bags a quantity into finished bags
- THEN roasted weight decreases and bagged units are created
