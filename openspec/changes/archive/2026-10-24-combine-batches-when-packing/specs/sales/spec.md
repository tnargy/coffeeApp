# Spec Delta

## ADDED Requirements

### Requirement: Cost basis follows a bag's source batches
For a bag that took weight from more than one batch, the system MUST compute that bag's cost from each source batch's share, using that batch's green lot cost. A sale of such a bag MUST be traceable to every source batch and green lot.

#### Scenario: Cost of a bag from two lots
- **GIVEN** a bag of 200 g with 100 g from a batch on a cheaper lot and 100 g from a batch on a dearer lot
- **WHEN** the bag is sold
- **THEN** the bag's cost equals the cost of 100 g of roast from each lot's batch added together
- **AND** the P&L cost of goods uses that amount

#### Scenario: Sale shows every source
- **GIVEN** a sold bag that took weight from batch A and batch B
- **WHEN** the operator views the sale's sources
- **THEN** both batches and their green lots are shown
