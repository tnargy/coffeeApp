# Design

## Context

See proposal.md for why. Appearance requirements are in `specs/appearance/spec.md`. Theme is not stored today. Colors live as CSS variables on `:root` in `src/index.css`, plus a few hardcoded light surfaces (inputs, quick actions, icon chips, progress track). Settings are one IndexedDB row written through `updateSettings` / `saveSettings`, which currently accept only reserve and bag size.

## Goals / Non-Goals

**Goals:**

- Persist `light` or `mocha` on the settings row and paint every route from that value.
- Keep the light token set as the default when the field is missing.

**Non-Goals:**

- Operating-system theme sync, a third theme, or a Catppuccin palette.
- A Dexie schema version bump. The new field is not indexed.

## Decisions

1. **Optional `theme` on `Settings`.** Type is `'light' | 'mocha'`. `defaultSettings()` sets `'light'`. A stored row with no theme is treated as light. Alternative: localStorage. Rejected because the rest of the operator preferences already live on the settings row and must survive in the same backup export.

2. **Save the theme on its own.** The Settings control calls `saveSettings({ theme })` immediately. It is not part of the reserve/bag-size submit. `updateSettings` accepts `theme` and rejects any other value. Alternative: include theme in the existing Save button. Rejected because the spec requires a theme swap without saving those other fields.

3. **Apply with `data-theme` on the app shell.** `Layout` reads settings and sets `data-theme="mocha"` only when the saved value is mocha. `:root` stays the light palette. A `[data-theme="mocha"]` block overrides the tokens and the hardcoded light surfaces so cards, inputs, and chips stay readable. Alternative: a second stylesheet. Rejected because the app already themes through variables.

4. **Warm mocha, not a new font.** Dark brown page and paper, cream text, lighter coffee accents, `color-scheme: dark` on the mocha shell. Keep Georgia. Alternative: invert the current palette. Rejected because a straight invert makes the topbar and warnings muddy.

## Risks / Trade-offs

- [Hardcoded hex leaves a light patch in mocha] → Override those selectors under `[data-theme="mocha"]`, not by editing the light values.
- [Old settings rows have no theme] → Read missing as light. Do not rewrite the row until the operator chooses a theme.
- [Export JSON gains a theme field] → Accepted. Older imports that omit it still load as light.

## Migration Plan

No migration. Existing databases keep working. Rollback is ignoring `theme` and removing the mocha CSS block.
