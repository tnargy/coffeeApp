# Delta for Roasting

## ADDED Requirements

### Requirement: Record Roast Batch
When the operator records a roast batch, the system associates a roast profile with that batch. The profile must include at minimum: name of beans, charge temperature, batch size, DTR, and weight loss percent. The system allows classification as “internal/personal use” or “for sale,” reduces green inventory by the green weight charged, and records the resulting roasted weight. Roasts may be recorded out of chronological order.

#### Scenario: Record a for-sale roast
- GIVEN green inventory is available
- WHEN the operator records a roast with green weight, roasted yield, profile, and “for sale” classification
- THEN green inventory decreases and roasted inventory increases by the respective amounts
- AND the batch stores the profile and classification

### Requirement: Roast Profile Required
The system requires a complete roast profile before creating a batch.

#### Scenario: Incomplete roast profile
- GIVEN the operator begins recording a roast
- WHEN the operator submits without a complete profile
- THEN the system does not create the batch and prompts for the required fields
