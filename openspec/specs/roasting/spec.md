# Roasting

## Purpose
Record roast batches with required profiles, classify them as internal/personal use or for sale, and update inventory from green to roasted weight.

## Requirements

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

### Requirement: Roast Profile Required
The system requires a complete roast profile before creating a batch.

#### Scenario: Incomplete roast profile
- GIVEN the operator begins recording a roast
- WHEN the operator submits without a complete profile
- THEN the system does not create the batch and prompts for the required fields

### Requirement: Weight Loss Tracking
The system records and can display weight loss percent as part of the roast profile and batch outcome.

#### Scenario: Weight loss calculated or entered
- GIVEN a roast with green weight and roasted yield
- WHEN the profile includes weight loss percent
- THEN the value is stored with the batch and available in history

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

### Requirement: Prefill log-roast form from URL
When the operator navigates to the log-roast page with recognized query parameters, the system SHALL pre-fill the corresponding form fields. All parameters are optional. Invalid or missing values MUST be ignored. Pre-filled values MUST remain editable before the roast is submitted.

#### Scenario: Prefill from a shareable link
- GIVEN the operator opens `/roast?beans=Guatemala&green=500&charge=176.2&total=14:37&fc=11:57&drop=194.2&dtr=18.2`
- WHEN the log-roast page loads
- THEN the form shows those values
- AND the operator can edit any field before submitting

#### Scenario: Partial or invalid parameters
- GIVEN the operator opens `/roast?charge=176.2&total=not-a-time`
- WHEN the page loads
- THEN charge temperature is pre-filled
- AND total time remains empty
- AND the rest of the form is unchanged

#### Scenario: No parameters
- GIVEN the operator navigates to `/roast` with no query string
- WHEN the page loads
- THEN the form is empty as usual

### Requirement: Optional roast timing fields
The system SHALL allow the operator to record, on a roast profile or batch snapshot, an optional total roast time, an optional first-crack time, and an optional drop temperature. Times are entered and displayed in mm:ss format and stored internally as seconds. These fields are not required to create a batch. When present, first-crack time MUST NOT exceed total roast time.

#### Scenario: Record timing on a new roast
- GIVEN the operator is logging a roast
- WHEN they enter a total time of 14:37, a first-crack time of 11:57, and a drop temperature
- THEN the values are stored on the batch profile snapshot
- AND the batch is created successfully
- AND history later shows the times as 14:37 and 11:57

#### Scenario: Omit timing fields
- GIVEN the operator is logging a roast
- WHEN they leave total time, first-crack time, and drop temperature blank
- THEN the batch is still created
- AND history shows no value for those fields

#### Scenario: First-crack after drop is rejected
- GIVEN the operator has entered a total time
- WHEN the first-crack time is greater than the total time
- THEN the system does not create the batch
- AND the operator is informed of the error

#### Scenario: Invalid time format is rejected
- GIVEN the operator is entering a time
- WHEN they type a value that cannot be parsed as mm:ss
- THEN the system does not accept the value
- AND the operator is informed of the error
