# Resting and Packaging

## Purpose
Enforce a minimum rest period before bagging and track packaging into bags of a configurable default size.

## Requirements

### Requirement: Bagging
When the operator records bagging of a rested batch, the system defaults to the configured bag size (starting at 8 oz) and reduces the available roasted weight of that batch by the total bagged weight, creating the corresponding bagged inventory units. The operator MUST choose a purpose for that pack, personal use or for sale. Each bag MUST store that purpose. The packed weight MUST be taken from the opposite-purpose pool first, then from the chosen-purpose pool. Unpacked weight not included in the pack MUST stay in its pool. The system MUST reject a pack that exceeds the roast's total remaining roasted weight.

#### Scenario: Bag a rested batch
- GIVEN a rested batch with remaining roasted weight
- WHEN the operator bags a quantity into finished bags
- THEN roasted weight decreases and bagged units are created

#### Scenario: Bag a rested batch into default bags
- GIVEN a rested batch of 1.2 kg classified as for sale
- WHEN the operator bags 400 g into two 200 g bags (or equivalent of the configured bag size)
- THEN roasted weight of the batch decreases by 400 g
- AND two bagged units appear in inventory

#### Scenario: Bag entire remaining roasted weight
- GIVEN 450 g roasted remains on a batch
- WHEN the operator bags 450 g into finished bags
- THEN roasted weight for that batch becomes zero
- AND bagged inventory increases correctly
- AND the batch is no longer offered for further bagging

#### Scenario: Pack personal bags from a for-sale roast
- **GIVEN** a rested roast whose remaining weight is all for sale
- **WHEN** the operator packs part of it as personal use
- **THEN** those bags are personal use
- **AND** the unpacked remainder stays for sale

#### Scenario: Pack more than remains
- **GIVEN** a rested roast with remaining roasted weight
- **WHEN** the operator packs more than that remaining weight
- **THEN** the system rejects the pack
- **AND** roasted weight and bags are unchanged

### Requirement: Configurable Bag Size
The default bag size starts at 8 oz and is adjustable by the operator.

#### Scenario: Change default bag size
- GIVEN the default is 8 oz
- WHEN the operator updates the setting to a different size
- THEN subsequent bagging operations default to the new size

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
