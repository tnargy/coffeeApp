# Tasks

## 1. Persist theme

- [x] 1.1 Add optional `theme: 'light' | 'mocha'` on settings, default it to light, and accept only those values in `updateSettings`. Verify a unit test covers mocha saved, light saved, a missing theme treated as light, and any other value rejected.
- [x] 1.2 Allow `saveSettings` to persist `theme` alone. Verify the repository patch type includes `theme` and `npm run typecheck` passes.

## 2. Settings control

- [x] 2.1 Add a Settings control that saves mocha or light immediately and is not part of the reserve/bag-size submit. Verify the handler calls `saveSettings` with only `{ theme }`.

## 3. Apply mocha

- [x] 3.1 Set `data-theme="mocha"` on the app shell only when the saved theme is mocha. Verify a missing theme does not set the attribute.
- [x] 3.2 Add a warm mocha token override, including the hardcoded light surfaces, under `[data-theme="mocha"]`. Verify `:root` light values are unchanged and those overrides are not global.

## 4. Integration check

- [x] 4.1 Run `npm test` and confirm the new theme test and the existing settings tests pass.
