# Proposal: Roast Profile Library

## Why
Operators currently re-enter the full roast profile (beans name, charge temperature, batch size, DTR, weight loss percent) on every roast. Once a few successful profiles exist, they should be able to save, reuse, and lightly edit them so subsequent batches of the same coffee are faster and more consistent.

## What Changes
- Allow saving a roast profile as a reusable library entry.
- When logging a new roast, let the operator select an existing profile (and optionally tweak values for that batch).
- Support light editing and deletion of saved profiles.
- Keep the existing minimum required fields and the rule that a complete profile is required before a batch is created.
- Profiles remain linked to the batches that used them so history stays accurate.

## Capabilities
### New Capabilities
None

### Modified Capabilities
- roasting

## Impact
Adds a small profile library UI and persistence. No changes to inventory math, rest rules, bagging, or sales. Existing batches keep their historical profile data even if the library entry is later edited or deleted.
