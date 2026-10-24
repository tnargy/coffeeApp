# Delta for Roasting

## ADDED Requirements

### Requirement: Void a roast
When the operator voids a roast, the system MUST return the green weight it charged to its lot, MUST leave it out of roasted stock, and MUST refuse the void while that roast still has a live bagging.

#### Scenario: Voided roast returns its green
- **GIVEN** a roast that charged 500 g from a lot
- **WHEN** the operator voids that roast
- **THEN** the lot has 500 g more green remaining
- **AND** the roast is no longer counted as roasted stock

#### Scenario: Void refused while a bagging is live
- **GIVEN** a roast that has a live bagging
- **WHEN** the operator tries to void the roast
- **THEN** the system refuses the void and names the bagging to void first
