# Spec Delta

## ADDED Requirements

### Requirement: Edit the unbagged split
The system MUST let the operator change how much unpacked roasted weight is personal use and how much is for sale. The edit MUST require a note. The two unpacked amounts MUST sum to the roast's unpacked roasted weight. The edit MUST NOT change the purpose of bags already packed.

#### Scenario: Move unpacked weight
- **GIVEN** a roast with unpacked for-sale weight and a packed personal bag
- **WHEN** the operator moves some unpacked weight to personal use with a note
- **THEN** the unpacked pools show the new split
- **AND** the packed bag stays personal use
- **AND** the change log records the note

#### Scenario: Split edit without a note is refused
- **GIVEN** a roast with unpacked roasted weight
- **WHEN** the operator submits a split edit with no note
- **THEN** the system refuses the edit
- **AND** the pools are unchanged

### Requirement: Voided bagging returns to its purpose
When the operator voids a bagging, the system MUST return that bagging's weight to the unpacked pool of the purpose stored on those bags.

#### Scenario: Void a personal bagging
- **GIVEN** a live personal-use bagging on a roast that also has for-sale weight
- **WHEN** the operator voids that bagging with a note
- **THEN** the bagging's weight is added to unpacked personal weight
- **AND** unpacked for-sale weight is unchanged
