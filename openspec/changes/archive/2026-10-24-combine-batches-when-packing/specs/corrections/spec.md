# Spec Delta

## ADDED Requirements

### Requirement: Void a combined bagging
When the operator voids a bagging that drew from more than one batch, the system MUST return each source batch's share to that batch, in the purpose pool stored on the bags. The bagging MUST be listed once in the records list, not once per batch.

#### Scenario: Void a bagging that drew from two batches
- **GIVEN** a live for-sale bagging that took 300 g from batch A and 100 g from batch B
- **WHEN** the operator voids it with a note
- **THEN** batch A gets 300 g back and batch B gets 100 g back in unpacked for-sale weight
- **AND** the bagging is kept and marked void with the note

#### Scenario: One record for a combined bagging
- **GIVEN** a bagging that drew from two batches
- **WHEN** the operator opens the records list
- **THEN** the bagging is listed once
- **AND** it shows each source batch and the grams taken from it

### Requirement: Roast void sees combined bags
The system MUST refuse to void a roast while any live bag took weight from it, including a bag that is part of a bagging whose first source is another batch. The refusal MUST name the bagging to void first.

#### Scenario: Roast used only as a later source
- **GIVEN** a live bagging that drew from batch A first and batch B second
- **WHEN** the operator tries to void batch B
- **THEN** the system refuses the void
- **AND** it says the bagging must be voided first

### Requirement: Edit a combined bagging
For a bagging that drew from more than one batch, the system MUST allow editing bag size with a note. It MUST refuse an edit of weight per bag and MUST tell the operator to void the bagging and pack again. Edits to a single-batch bagging are unchanged.

#### Scenario: Change bag size on a combined bagging
- **GIVEN** a live bagging that drew from two batches
- **WHEN** the operator changes its bag size with a note
- **THEN** the bags show the new size
- **AND** every source batch's weights are unchanged

#### Scenario: Weight edit on a combined bagging is refused
- **GIVEN** a live bagging that drew from two batches
- **WHEN** the operator changes its weight per bag
- **THEN** the system refuses the edit and says to void and pack again
- **AND** the bags and batches are unchanged
