# Design: Roast Profile Library

## Technical Approach
Extend the existing client-side data model and roast-logging flow. Store reusable profiles in IndexedDB alongside batches. A batch continues to snapshot the profile values used at roast time so later library edits do not rewrite history.

## Key Changes
- **Profile library store**: Persist named roast profiles with the required fields (beans name, charge temp, batch size, DTR, weight loss %) plus optional notes.
- **Log roast flow**:
  - Option to “Use saved profile” (dropdown or searchable list).
  - Selecting a profile pre-fills the form; operator can override any value for this batch.
  - Option to “Save as new profile” or “Update existing profile” after a successful roast (or from a dedicated library view).
- **Library management**: Simple list/view to edit name/notes or delete a profile. Deleting a profile does not affect past batches.
- **Validation**: Same rules as today — a complete profile is still required before a batch can be created.

## Data Model Adjustments
- `RoastProfile` gains (or already has) a stable `id`, optional `name`/`notes`, and `createdAt`/`updatedAt`.
- `RoastBatch` continues to store the actual values used (or a reference + snapshot) so history is immutable.
- Prefer snapshot-on-batch so library edits are non-destructive.

## UI Notes
- Keep the flow lightweight — a dropdown or small modal is enough; no need for a full profile editor page in this change.
- Match existing dashboard styling.
- Show the profile name (or beans name) in recent activity and history so reused profiles are recognizable.

## Out of Scope
- Importing profiles from HiBean or other tools.
- Advanced profile versioning or automatic suggestions.
- Changing the required profile fields.
