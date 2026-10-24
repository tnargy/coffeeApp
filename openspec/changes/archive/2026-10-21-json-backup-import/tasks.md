# Tasks

## 1. Backup document

- [x] 1.1 Build an export object with format version 1, export time, and lots, profiles, batches, bags, sales, and settings. Add a test that those fields are present. Verify `npm test` passes it.
- [x] 1.2 Parse a backup and reject missing collections, invalid JSON, and a higher format version. Accept a file with no version when the collections are valid. Add tests for reject and accept. Verify `npm test` passes them.
- [x] 1.3 Reject a backup whose sales reference missing bags or whose weights are negative, without returning a replacement state. Add a test that the parsed result is an error. Verify `npm test` passes it.

## 2. Restore

- [x] 2.1 Add a repository import that replaces IndexedDB only with a validated state. Add a test that a valid import replaces lots and settings and that a rejected file leaves the database unchanged. Verify `npm test` passes it.
- [x] 2.2 Add import and export on Settings, and point the dashboard export at the same builder. Import asks for confirmation before replace and shows an error when the file is rejected. Verify both controls exist and `npm run typecheck` passes.

## 3. Integration

- [x] 3.1 Run `npm test`, `npm run typecheck`, and `npm run lint`. Confirm export includes every collection, a versionless file still imports, and a bad file does not replace data.
