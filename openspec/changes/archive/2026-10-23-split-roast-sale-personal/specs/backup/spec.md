# Spec Delta

## ADDED Requirements

### Requirement: Older roasts keep a single purpose
When a backup roast or bag has no personal and for-sale pools, the system MUST restore it as a single purpose. An internal roast and its bags MUST be personal use. A for-sale roast and its bags MUST be for sale. The import MUST NOT invent a split.

#### Scenario: Import a roast recorded before splits
- **GIVEN** a valid backup whose roast is for sale and has no pool fields
- **WHEN** the operator confirms import
- **THEN** that roast's roasted weight is all for sale
- **AND** its bags are for sale
