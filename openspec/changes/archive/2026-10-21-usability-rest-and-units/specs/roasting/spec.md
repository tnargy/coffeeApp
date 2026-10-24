# Delta for Roasting

## ADDED Requirements

### Requirement: Rest starts when the roast is logged
When the operator records a roast, the system MUST set that batch's rest start to the roast time stored on the batch. The operator MUST NOT record a separate rest start for that batch.

#### Scenario: Logged roast is already resting
- **GIVEN** green inventory is available
- **WHEN** the operator records a roast at a chosen date and time
- **THEN** the batch rest start is that roast time
- **AND** no further rest-start action is required
