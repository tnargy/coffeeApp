# Design: Add Roast Timing Fields

## Technical Approach
Extend the existing `ProfileSnapshot` / `RoastProfile` types and the log-roast form. The three new values are optional. Times are stored as integer seconds but displayed and entered exclusively in mm:ss format. They are snapshotted onto the batch exactly like the current required fields so later library edits do not rewrite history.

## Key Changes
- **Data model**
  - Add to `ProfileSnapshot` and `RoastProfile`:
    - `totalTimeSeconds?: number`
    - `firstCrackSeconds?: number`
    - `dropTemp?: number`
  - Dexie schema version bump is not required (IndexedDB is schemaless for new optional properties).
- **Time format**
  - UI always shows and accepts `mm:ss` (e.g. `14:37`, `11:57`).
  - Convert to/from seconds only at the boundary of the form and storage.
  - Helper functions: `formatTime(seconds) → "mm:ss"` and `parseTime("mm:ss") → seconds`.
- **Log roast form**
  - Three new optional inputs under the existing profile fields.
  - Labels: “Total time”, “First crack”, “Drop temp (°C)”.
  - Time inputs use `inputMode="numeric"` and accept `mm:ss` (or just minutes if the user types a single number).
  - Pre-filled when a saved profile is selected; can be overridden for the batch.
- **Profile library**
  - Same three fields appear when creating or editing a profile, times in mm:ss.
- **History / dashboard**
  - Display times as mm:ss (or “—” when absent) next to the existing profile summary.
- **Validation**
  - Fields remain optional.
  - When entered, times must parse as valid mm:ss and be non-negative.
  - First-crack time, when present, must be ≤ total time.
  - Drop temperature, when present, must be a positive number.

## Data Model Adjustments
```ts
export interface ProfileSnapshot {
  // existing required fields …
  totalTimeSeconds?: number   // stored as seconds, displayed as mm:ss
  firstCrackSeconds?: number  // stored as seconds, displayed as mm:ss
  dropTemp?: number
}
```

## UI Notes
- Keep the form compact; place the three new inputs in the same grid as the existing profile fields.
- Placeholder examples: `14:37` for total time, `11:57` for first crack.
- No curve storage.

## Out of Scope
- Full temperature curves or RoR series.
- Automatic import from HiBean CSV.
- Making any of the three fields required.
- Changing DTR calculation (DTR remains a manually entered or separately calculated value).
- Storing or displaying times in any unit other than mm:ss in the UI.
