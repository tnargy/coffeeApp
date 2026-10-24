# Tasks

## 1. Data Model
- [x] 1.1 Ensure RoastProfile can be stored independently of a single batch (id, required fields, optional name/notes, timestamps)
- [x] 1.2 Confirm batches snapshot profile values (or store both reference + snapshot) so history is immutable

## 2. Library Management
- [x] 2.1 Add a simple profile library list (view / edit name or notes / delete)
- [x] 2.2 Deleting a profile leaves existing batches unchanged

## 3. Log Roast Integration
- [x] 3.1 Add “Use saved profile” selector on the log-roast form
- [x] 3.2 Pre-fill form fields when a profile is selected; allow overrides
- [x] 3.3 Add “Save as new profile” (and optional “Update existing”) after a successful roast or from the form
- [x] 3.4 Keep existing validation: incomplete profile still blocks batch creation

## 4. Display
- [x] 4.1 Show profile name (or beans name) in recent activity and batch history
- [x] 4.2 Verify existing roast scenarios still pass

## 5. Polish
- [x] 5.1 Empty state when no profiles exist yet
- [x] 5.2 Basic confirmation on delete
