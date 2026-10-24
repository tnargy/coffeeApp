# Delta for Roasting

## MODIFIED Requirements

### Requirement: Record Roast Batch
When the operator records a roast batch, the system associates a roast profile with that batch. The profile must include at minimum: name of beans, charge temperature, batch size, DTR (development time ratio), and weight loss percent. The operator may select a previously saved profile (and override any values for this batch) or enter a new one. The system allows the operator to classify the roast as “internal/personal use” or “for sale,” reduces green inventory by the green weight charged, and records the resulting roasted weight. Roasts may be recorded out of chronological order. The values used for the batch are retained so later edits to a library profile do not change history.

#### Scenario: Record a roast using a saved profile
- GIVEN at least one saved roast profile exists
- WHEN the operator selects that profile, optionally overrides one or more fields, and submits a valid roast
- THEN the batch is created with the values used at submission time
- AND green and roasted inventory update correctly
- AND the batch history shows the profile values that were actually used

## ADDED Requirements

### Requirement: Roast Profile Library
The system allows the operator to save, reuse, lightly edit, and delete roast profiles. A saved profile can be selected when logging a new roast.

#### Scenario: Save a new profile
- GIVEN the operator has entered a complete set of profile fields
- WHEN they choose to save it as a new profile
- THEN the profile appears in the library for future use

#### Scenario: Delete a profile
- GIVEN a saved profile exists and has been used by one or more batches
- WHEN the operator deletes the profile
- THEN the profile is removed from the library
- AND existing batches retain the profile values that were recorded at roast time

#### Scenario: Incomplete profile still blocked
- GIVEN the operator is logging a roast
- WHEN they submit without a complete profile (whether typed or selected)
- THEN the system does not create the batch and prompts for the required fields
