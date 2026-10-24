# Proposal

## Why

The dashboard can download a JSON file, but nothing can read that file back. IndexedDB stays in one browser, so a cleared site or another machine starts empty.

## What Changes

- Make the JSON export a complete backup of lots, profiles, batches, bags, sales, and settings, with a format version and export time.
- Add import that restores that file on this browser or another. Import replaces local data after the operator confirms. It does not merge.
- Reject a file that is not valid JSON or is missing the backup collections, and leave current data unchanged.
- Assumption: an older export without a version still imports when the collections are present and valid.

## Capabilities

### New Capabilities

- `backup`: Export a restorable JSON backup and import it to replace local data.

### Modified Capabilities

None.

## Impact

Dashboard export and Settings. Local IndexedDB is replaced only after a confirmed import. No change to roast, inventory, or sale rules.
