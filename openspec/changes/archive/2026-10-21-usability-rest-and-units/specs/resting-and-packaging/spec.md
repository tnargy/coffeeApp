# Delta for Resting and Packaging

## MODIFIED Requirements

### Requirement: Rest Period
The batch becomes available for bagging only after a minimum of 24 hours have elapsed from the roast time stored on the batch. Rest MUST start when the roast is logged. The operator MUST NOT have to mark rest separately. When the operator initiates bagging, the system displays how long the batch has rested. A batch with no stored rest start MUST use its roast time.

#### Scenario: Bag after minimum rest
- GIVEN a roasted batch rested for at least 24 hours
- WHEN the operator initiates bagging
- THEN the system allows bagging and displays the actual rest duration

#### Scenario: Attempt to bag before rest completes
- GIVEN a roasted batch rested less than 24 hours
- WHEN the operator attempts to bag it
- THEN the system indicates the batch is not yet ready
- AND shows the remaining or elapsed rest time

#### Scenario: Rest starts at roast time
- **GIVEN** the operator logs a roast at a specific time
- **WHEN** the batch is created
- **THEN** rest starts at that stored roast time
- **AND** bagging does not ask for a separate rest start
