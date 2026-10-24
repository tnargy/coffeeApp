# Delta for Resting and Packaging

## ADDED Requirements

### Requirement: Void a bagging
When the operator voids a bagging, the system MUST return the roasted weight it packed to its batch, MUST leave its bags out of bags ready, and MUST refuse the void while one of those bags is still sold.

#### Scenario: Voided bagging returns its roasted weight
- **GIVEN** a bagging that packed 400 g from a batch
- **WHEN** the operator voids that bagging
- **THEN** the batch has 400 g more roasted weight remaining
- **AND** the bags are no longer counted as ready

#### Scenario: Void refused while a bag is sold
- **GIVEN** a bagging with a bag that has been sold
- **WHEN** the operator tries to void the bagging
- **THEN** the system refuses the void and names the sale to void first
