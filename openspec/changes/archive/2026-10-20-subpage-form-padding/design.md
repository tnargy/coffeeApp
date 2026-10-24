# Design

## Context

See proposal.md for why. Receive, Log Roast, Record Sale, and Settings wrap the page in `<form class="stack form">`. Pack Bags uses the same class on its pack form. `.form` shares the card border and background in `src/index.css`, but only `.card, fieldset` have padding (`1rem 1.1rem`). The form box therefore has a border and no inner space.

## Goals / Non-Goals

**Goals:**

- Give the form box at least as much inner space as a card, on all four sides.
- Leave field markup, validation, and routes alone.

**Non-Goals:**

- Changing `.page` gutter, dashboard card chrome, or History layout.
- Increasing padding on every `.card`.

## Decisions

1. **Pad `.form`, not `.card`.** Add padding on `.form` only, about `1.35rem 1.5rem`. That covers every named page that uses the flush box, including Pack's pack form. Alternative: increase the shared `.card, fieldset` padding. Rejected because dashboard and History cards already have padding, and the flush edge is the form.

2. **Leave nested cards alone.** Record Sale's fieldset already has card padding. It will sit inside the newly padded form. Do not remove that padding. Alternative: zero out nested card padding. Rejected because the fieldset is its own box and should keep its own inset.

3. **Do not add a page wrapper class.** The shared `.form` rule is enough. Alternative: a new class on each page. Rejected because all five pages already use `.form`.

## Risks / Trade-offs

- [Pack's batch list card still has only card padding] → Accepted. That card is not flush. The pack form is the flush box and gets the new padding.
- [Nested fieldset on Record Sale looks more inset than other fields] → Accepted. The outer title and fields are the flush content. Do not restyle the fieldset.
- [A later page reuses `.form` and inherits the padding] → Desired. The class means "bordered form box."

## Migration Plan

CSS only. Rollback is reverting the `.form` padding rule.
