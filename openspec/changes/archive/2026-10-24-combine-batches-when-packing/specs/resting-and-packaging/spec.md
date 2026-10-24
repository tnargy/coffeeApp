# Spec Delta

## ADDED Requirements

### Requirement: Pack from several batches
The system MUST let the operator select more than one roast batch for a single pack. The pack's total weight is the number of bags times the weight per bag. The system MUST take that total from the selected batches automatically, draining each in the order selected until the total is met. A pack has one purpose, one bag size, and one weight per bag.

#### Scenario: Combine two batches to fill the bags
- **GIVEN** batch A has 300 g remaining and batch B has 500 g remaining
- **WHEN** the operator selects A then B and packs 3 bags of 200 g
- **THEN** batch A is drained to zero and batch B drops to 200 g remaining
- **AND** three bags are created

#### Scenario: Later batches are untouched when the first covers the pack
- **GIVEN** batch A has 800 g remaining and batch B has 500 g remaining
- **WHEN** the operator selects A then B and packs 2 bags of 200 g
- **THEN** batch A drops to 400 g remaining
- **AND** batch B is unchanged

#### Scenario: Selection order decides the draw
- **GIVEN** batch A has 300 g remaining and batch B has 500 g remaining
- **WHEN** the operator selects B then A and packs 2 bags of 200 g
- **THEN** batch B drops to 100 g remaining
- **AND** batch A is unchanged

### Requirement: Bags record their source batches
Each bag MUST record how many grams came from each batch. A bag that spans two batches MUST list both. The recorded amounts for a bag MUST sum to that bag's weight. A bag packed from a single batch records that batch as its only source.

#### Scenario: A bag straddles two batches
- **GIVEN** batch A has 300 g remaining and batch B has 500 g remaining
- **WHEN** the operator selects A then B and packs 2 bags of 200 g
- **THEN** the first bag is 200 g from batch A
- **AND** the second bag is 100 g from batch A and 100 g from batch B

#### Scenario: Existing bags keep a single source
- **GIVEN** a bag packed before this change from one batch
- **WHEN** the operator views its sources
- **THEN** it shows its full weight from that one batch

### Requirement: Combined pack shortfall
The system MUST reject a pack whose total weight exceeds the combined remaining roasted weight of the selected batches. The system MUST report the shortfall and MUST leave every batch and bag unchanged.

#### Scenario: Selected batches do not hold enough
- **GIVEN** batch A has 300 g remaining and batch B has 100 g remaining
- **WHEN** the operator selects both and packs 3 bags of 200 g
- **THEN** the system rejects the pack and reports a 200 g shortfall
- **AND** both batches and the bag list are unchanged

#### Scenario: A batch cannot be selected twice
- **GIVEN** batch A with weight remaining
- **WHEN** the operator selects batch A twice in one pack
- **THEN** the system rejects the pack

#### Scenario: Unusable batches are refused
- **GIVEN** a batch that is void or has no roasted weight remaining
- **WHEN** the operator includes it in a pack
- **THEN** the system rejects the pack
- **AND** every batch and the bag list are unchanged

### Requirement: Purpose pools apply per source batch
When a pack draws from a batch, the system MUST take the weight from that batch's opposite-purpose pool first, then from its chosen-purpose pool, as for a single-batch pack. Each bag MUST store the pack's purpose.

#### Scenario: Personal pack across two for-sale batches
- **GIVEN** batch A has 300 g for sale and batch B has 500 g for sale, with no personal weight
- **WHEN** the operator selects A then B and packs 2 bags of 200 g for personal use
- **THEN** both bags are personal use
- **AND** batch A has 0 g for sale and batch B has 400 g for sale remaining
- **AND** both batches still show 0 g unpacked personal weight
