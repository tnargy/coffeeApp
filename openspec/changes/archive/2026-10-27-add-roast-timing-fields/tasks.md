# Tasks: Add Roast Timing Fields

- [x] Add optional fields to `ProfileSnapshot` and `RoastProfile` in `src/types.ts`
- [x] Add `formatTime` / `parseTime` helpers (mm:ss ↔ seconds)
- [x] Update log-roast form to accept and display the three new inputs (times as mm:ss)
- [x] Update profile library create/edit UI (times as mm:ss)
- [x] Show the values (or em dash) in history and dashboard activity
- [x] Persist values through the existing repository layer (no schema change required)
- [x] Add/adjust unit tests for optional fields, mm:ss parsing, and the first-crack ≤ total-time rule
- [x] Verify existing batches and profiles still load with the new fields absent
