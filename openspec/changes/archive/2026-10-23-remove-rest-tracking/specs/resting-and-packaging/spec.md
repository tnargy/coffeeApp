# Spec Delta

## REMOVED Requirements

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

**Reason**: Rest timing is no longer needed in the app, and the operator wants to bag without waiting for an app-enforced period.

**Migration**: Ignore any legacy rest-start values on existing batches and imported backups.

## MODIFIED Requirements

### Requirement: Bagging
When the operator records bagging of a batch with remaining roasted weight, the system MUST allow bagging immediately, use the configured bag size (starting at 8 oz), reduce available roasted weight by the total bagged weight, and create the corresponding bagged inventory units.

#### Scenario: Bag a rested batch
- **GIVEN** a newly recorded roast with remaining roasted weight
- **WHEN** the operator records bagging
- **THEN** the system allows bagging without a rest delay
- **AND** roasted weight decreases and bagged units are created

#### Scenario: Bag a rested batch into default bags
- GIVEN a batch of 1.2 kg classified as for sale
- WHEN the operator bags 400 g into two 200 g bags (or equivalent of the configured bag size)
- THEN roasted weight of the batch decreases by 400 g
- AND two bagged units appear in inventory

#### Scenario: Bag entire remaining roasted weight
- GIVEN 450 g roasted remains on a batch
- WHEN the operator bags 450 g into finished bags
- THEN roasted weight for that batch becomes zero
- AND bagged inventory increases correctly
- AND the batch is no longer offered for further bagging
