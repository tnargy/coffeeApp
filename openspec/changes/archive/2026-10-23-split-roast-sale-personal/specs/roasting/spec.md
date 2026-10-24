# Spec Delta

## MODIFIED Requirements

### Requirement: Record Roast Batch
When the operator records a roast batch, the system associates a roast profile with that batch. The profile must include at minimum: name of beans, charge temperature, batch size, DTR (development time ratio), and weight loss percent. The operator may select a previously saved profile (and override any values for this batch) or enter a new one. The system allows the operator to split that roast's roasted yield between internal/personal use and for sale. Either amount may be zero. If the operator does not set a personal amount, the whole yield is for sale. A personal amount below zero or above the roasted yield MUST be rejected. The system reduces green inventory by the green weight charged and records the resulting roasted weight in those two pools on one roast. Roasts may be recorded out of chronological order. The values used for the batch are retained so later edits to a library profile do not change history.

#### Scenario: Record a for-sale roast
- GIVEN green inventory is available
- WHEN the operator records a roast with green weight, roasted yield, profile, and “for sale” classification
- THEN green inventory decreases and roasted inventory increases by the respective amounts
- AND the batch stores the profile and classification

#### Scenario: Record an internal-use roast out of order
- GIVEN existing batches
- WHEN the operator records a roast with an earlier timestamp than a previous batch and classifies it as internal/personal use
- THEN the roast is accepted and recorded with its classification and profile

#### Scenario: Record a roast using a saved profile
- GIVEN at least one saved roast profile exists
- WHEN the operator selects that profile, optionally overrides one or more fields, and submits a valid roast
- THEN the batch is created with the values used at submission time
- AND green and roasted inventory update correctly
- AND the batch history shows the profile values that were actually used

#### Scenario: Split one roast
- **GIVEN** green inventory is available
- **WHEN** the operator records one roast and sets part of the roasted yield as personal use
- **THEN** one roast is stored
- **AND** the personal amount and the for-sale remainder sum to the roasted yield
- **AND** green inventory decreases by the green weight charged

#### Scenario: Personal amount outside the yield
- **GIVEN** the operator is recording a roast
- **WHEN** the personal amount is below zero or above the roasted yield
- **THEN** the system does not create the roast
- **AND** inventory is unchanged
