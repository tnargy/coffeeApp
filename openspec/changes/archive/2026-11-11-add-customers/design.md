# Customers

## Decisions
- `whole` means whole bean. The stored value is `whole`. The picker and directory say "Whole bean". `ground` is ground coffee. `unknown` is the default when nobody has said.
- Customer names are trimmed and internal whitespace is collapsed. Comparison is case-insensitive. Grind suffixes are removed only while linking sale notes, not when the operator types a name.
- When more than one grind suffix is stripped, the outermost one sets the grind. Later suffixes only clean the name.
- The note link runs when `settings.customersLinkedAt` is missing: at the end of `ensureReady`, and inside backup import. Format 2 and older drop that flag so the link runs. Format 3 keeps it, so a sale recorded with no customer after the link is not scanned again, including on a later import of that backup.
- A sale whose `customerId` is not in the imported customers is stored unlinked and is skipped by that import's note link. A bad id is not repaired from the note.
- Duplicate names in a backup keep the first row and skip the rest. The import summary names them. The file is not rejected for duplicates.
- A customer-import file with an invalid grind preference, or a blank name, is rejected and changes nothing. A missing grind preference means `unknown`.
- Record Sale reuses an existing customer when the typed name matches. Create and rename on the Customers page refuse that match.
- There is no delete, and a recorded sale's customer is not edited later. Renaming the customer updates the name shown on Records because the sale stores the id.
- Customers are a Dexie table. `loadState` and `saveState` read and write `db.customers`, and the save transaction includes that table. A fresh database has no customers.

## Open question
G means ground and W means whole bean. Contact info and bean preference stay out of this change.
