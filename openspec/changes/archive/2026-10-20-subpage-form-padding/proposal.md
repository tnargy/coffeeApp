# Proposal

## Why

Receive, Log Roast, Pack Bags, Record Sale, and Settings draw a bordered box around the page, but the text and fields sit against that edge. Operators need room inside the box so labels and headings are readable.

## What Changes

- Add inner padding to the form box used by Receive, Log Roast, Pack Bags, Record Sale, and Settings so headings, fields, and actions are not flush with the border.
- Keep the existing fields, validation, and routes unchanged.
- Assumption: the complaint is the edge of that box, not the page gutter. History and the dashboard are out of scope. Do not loosen dashboard card chrome.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Inventory, roasting, resting-and-packaging, and sales describe recording behavior, not spacing. `skip_specs: true` is set because no requirement text changes.

## Impact

- `src/index.css` only, on the shared `.form` box.
- No data model, route, or domain changes.
