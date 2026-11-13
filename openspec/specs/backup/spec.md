# Backup

## Purpose
Let the operator download a complete JSON backup and restore it on this browser or another.

## Requirements

### Requirement: Export backup
The system MUST let the operator download a JSON file containing lots, profiles, batches, bags, sales, customers, and settings, plus a format version and export time. The format version MUST be 3.

#### Scenario: Download current data
- **GIVEN** lots, batches, and settings exist
- **WHEN** the operator exports a backup
- **THEN** the file includes those collections, including customers, format version 3, and an export time

### Requirement: Import replaces local data
The system MUST replace local data with a valid backup after the operator confirms. It MUST NOT merge the file with data already stored.

#### Scenario: Restore on another browser
- **GIVEN** a valid backup from another browser
- **WHEN** the operator confirms import
- **THEN** local lots, profiles, batches, bags, sales, customers, and settings match the file

#### Scenario: Cancel leaves data unchanged
- **GIVEN** local data exists
- **WHEN** the operator starts an import and does not confirm
- **THEN** local data is unchanged

### Requirement: Invalid import is rejected
The system MUST reject a file that is not JSON or is missing a backup collection, and MUST leave current data unchanged.

#### Scenario: Missing collections
- **GIVEN** local data exists
- **WHEN** the operator imports a JSON object that has no lots collection
- **THEN** the import fails
- **AND** local data is unchanged

#### Scenario: Older export still imports
- **GIVEN** a backup with the required collections and no format version
- **WHEN** the operator confirms import
- **THEN** the data is restored

### Requirement: Older roasts keep a single purpose
When a backup roast or bag has no personal and for-sale pools, the system MUST restore it as a single purpose. An internal roast and its bags MUST be personal use. A for-sale roast and its bags MUST be for sale. The import MUST NOT invent a split.

#### Scenario: Import a roast recorded before splits
- **GIVEN** a valid backup whose roast is for sale and has no pool fields
- **WHEN** the operator confirms import
- **THEN** that roast's roasted weight is all for sale
- **AND** its bags are for sale

### Requirement: Customer backup rules
Restore MUST accept format 2 and format 3. Import MUST replace local data and MUST NOT merge. A format 2 backup MUST import with an empty customer list, and the sale-note link MUST then run. A format 3 backup MUST include a customers array. A missing or non-array customers collection MUST be rejected with "That backup is missing the customers collection." A customer with a missing or blank name, or a grind preference other than `ground`, `whole`, or `unknown`, MUST be rejected with "That backup has an invalid customers collection." Duplicate names MUST keep the first customer and skip later ones, and the import summary MUST say which names were skipped. A sale whose `customerId` points at a customer that was not imported MUST be stored unlinked, and the summary MUST say so. Current data MUST stay unchanged when an import is rejected.

#### Scenario: Version 2 gains customers from notes
- **GIVEN** a format 2 backup whose sale note names a buyer and ends in a grind suffix
- **WHEN** the operator confirms import
- **THEN** the customer list starts empty and the link step creates the customer
- **AND** the sale note is unchanged

#### Scenario: Version 3 round trip
- **GIVEN** customers and a sale linked to one of them
- **WHEN** the operator exports a backup and imports it
- **THEN** the customers, grind preferences, and sale link match the file

#### Scenario: Missing customers collection
- **GIVEN** a format 3 backup with no customers collection
- **WHEN** the operator imports it
- **THEN** the import fails with "That backup is missing the customers collection."
- **AND** local data is unchanged

#### Scenario: Invalid customer
- **GIVEN** a format 3 backup whose customer name is blank or whose grind preference is not allowed
- **WHEN** the operator imports it
- **THEN** the import fails with "That backup has an invalid customers collection."
- **AND** local data is unchanged

#### Scenario: Duplicate name and missing customer
- **GIVEN** a format 3 backup with the same customer name twice, and a sale pointing at the skipped copy
- **WHEN** the operator imports it
- **THEN** the first customer is kept
- **AND** the sale is unlinked
- **AND** the summary names the skipped duplicate and the unlinked sale
