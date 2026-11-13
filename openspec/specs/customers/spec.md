# Customers

## Purpose
Keep an internal directory of coffee buyers so grind preference and purchase history are structured fields, not a separate note and not free text on each sale.

## Requirements

### Requirement: Customer directory
The system MUST provide a Customers page at `/customers`. A customer MUST have a name, a grind preference of `ground`, `whole`, or `unknown`, an optional operator note, and a `createdAt` timestamp in ISO 8601 UTC set when the customer is created. The page MUST NOT collect contact information or a bean preference. A fresh install MUST start with an empty customer list. The application MUST NOT ship with any customer name hard-coded.

#### Scenario: Empty directory
- **GIVEN** a new install
- **WHEN** the operator opens Customers
- **THEN** the directory is empty

#### Scenario: Add a customer
- **GIVEN** the Customers page
- **WHEN** the operator adds a name and a grind preference
- **THEN** the customer is stored with that grind and a UTC `createdAt`

### Requirement: Derived status and totals
For each customer the system MUST derive status and totals from linked sales that are not void. Zero such sales is `interested`, one is `bought`, and two or more is `repeat`. Bags bought MUST be the count of `baggedUnitIds` on those sales. Total spent MUST be the sum of `saleAmount` on those sales, including unpaid sales. Last purchase date MUST be the latest `date` among those sales, and MUST be blank when there are none. A customer whose only linked sales are void MUST be `interested`, with 0 bags, 0 spent, and a blank last purchase date.

#### Scenario: Repeat buyer
- **GIVEN** a customer linked to two sales that are not void
- **WHEN** the operator views that customer
- **THEN** the status is repeat
- **AND** bags bought and total spent include both sales

#### Scenario: Only a voided sale
- **GIVEN** a customer whose only linked sale is void
- **WHEN** the operator views that customer
- **THEN** the status is interested
- **AND** bags bought are 0, total spent is 0, and last purchase date is blank

#### Scenario: Directory summary
- **GIVEN** customers with mixed grind preferences, including one with no live sale
- **WHEN** the operator views the directory summary
- **THEN** it counts customers, how many are ground, whole, and unknown, and how many are interested

### Requirement: Duplicate names are refused
Creating or renaming a customer MUST be refused when another customer already has that name, compared after trim and internal whitespace collapse, case-insensitively. The existing customer MUST stay unchanged. Renaming a customer to a different capitalisation of their own name MUST be allowed.

#### Scenario: Create refuses a duplicate
- **GIVEN** a customer named with a particular spelling
- **WHEN** the operator creates another customer with the same name in a different case
- **THEN** the create is refused
- **AND** the directory still has one customer with that name

#### Scenario: Rename refuses a duplicate
- **GIVEN** two customers
- **WHEN** the operator renames one to the other's name
- **THEN** the rename is refused

### Requirement: Edit without delete
The operator MUST be able to edit a customer's name, grind preference, and notes. The system MUST NOT offer customer delete.

#### Scenario: Edit grind and notes
- **GIVEN** a customer
- **WHEN** the operator changes the grind preference and notes
- **THEN** those fields are saved
- **AND** there is no delete control

### Requirement: One-time customer import
The Customers page MUST accept a JSON file `{ "format": "coffeeApp customers import v1", "customers": [{ "name": "...", "grindPreference": "ground" | "whole" | "unknown" }] }`. It MUST create customers in file order. A missing grind preference MUST be stored as `unknown`. Duplicate names, within the file or against customers already stored, MUST be skipped case-insensitively without deleting or overwriting anything. The result MUST report how many were created and how many were skipped, by name. The import MUST NOT run on its own, on first load, or as part of a backup import.

#### Scenario: First import creates and skips
- **GIVEN** an empty directory
- **WHEN** the operator imports a file that repeats a name
- **THEN** the first copy is created
- **AND** the later copy is skipped
- **AND** the summary names both outcomes

#### Scenario: Second import creates nothing
- **GIVEN** those customers already exist
- **WHEN** the operator imports the same file again
- **THEN** no customer is created
- **AND** every row is reported as skipped

#### Scenario: Invalid grind is refused
- **GIVEN** a customer import whose grind preference is not ground, whole, unknown, or missing
- **WHEN** the operator imports it
- **THEN** the import is refused
- **AND** the directory is unchanged

### Requirement: Sale notes are linked once
On the first load after the upgrade, after the app is ready, and when a backup that has not already been linked is imported, the system MUST link each sale that has no customer. Sales are considered in sale-id order. The note is normalised by trimming, collapsing whitespace, and removing a trailing grind suffix until none remains. Suffixes are matched case-insensitively, longest first: ` - Ground`, ` - Whole`, ` ground`, ` whole`. The normalised name is matched to an existing customer case-insensitively. Otherwise, when the name is not empty, a customer is created. Grind on that new customer comes from the outermost stripped suffix: a ground suffix sets `ground`, a whole suffix sets `whole`, and no suffix sets `unknown`. The sale note text MUST NOT be changed. The link MUST NOT run again on an ordinary load. A sale recorded after the link has run MUST NOT be scanned again, including when a later backup that already went through the link is imported.

#### Scenario: Suffix becomes grind
- **GIVEN** an unlinked sale whose note ends in ` - Ground`
- **WHEN** the link step runs
- **THEN** the customer name does not include that suffix
- **AND** the grind preference is ground
- **AND** the sale note is unchanged

#### Scenario: Whole suffix
- **GIVEN** an unlinked sale whose note ends in ` whole`
- **WHEN** the link step runs
- **THEN** the grind preference is whole

#### Scenario: Later sale is not scanned
- **GIVEN** the link step has already run
- **WHEN** a new sale is recorded with no customer and a note that looks like a name
- **AND** the operator opens the app again
- **THEN** that sale stays unlinked
- **AND** no customer is created from the note
