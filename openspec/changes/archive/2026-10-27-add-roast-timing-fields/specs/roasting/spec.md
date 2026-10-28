## ADDED Requirements

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
