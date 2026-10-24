# Proposal

## Why

The app is light-only. Operators working a roast day in a dim room need a dark, coffee-colored theme they can turn on from Settings and keep.

## What Changes

- Add a Settings control that swaps the whole app between the current light theme and a mocha dark theme.
- Persist the choice with the other settings. Missing or new installs stay light.
- Apply the theme immediately, without also saving reserve or bag size.
- Assumption: mocha means a warm dark-brown palette with cream text, not Catppuccin and not an operating-system preference.

## Capabilities

### New Capabilities

- `appearance`: Operator-chosen light or mocha theme, persisted and applied across the app.

### Modified Capabilities

None. Dashboard, inventory, roasting, resting-and-packaging, and sales do not specify colors or a theme control.

## Impact

- Settings record, Settings page, layout root, and CSS tokens.
- No inventory, roast, pack, or sale rule changes.
