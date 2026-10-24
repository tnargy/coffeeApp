# Proposal: Bootstrap Core App

## Why
A solo coffee roasting operator needs a simple internal tool to track green beans, roast batches (with profiles), rest periods, bagging, limited sales, and a clear post-roast-day summary. The existing behavioral specification and dashboard mockup define the desired system. This change establishes the application foundation so subsequent features can be implemented against a stable data model and UI shell.

## What Changes
- Initialize a greenfield, single-user, offline-capable web application.
- Implement the core data model and local persistence for lots, roast profiles, batches, bagged units, and sales.
- Deliver the main dashboard (aligned with the existing mockup) showing green remaining, roasted stock, bags ready, personal-use reserve status, recent activity, and quick actions.
- Support the initial starter data (approximately 5 lb green beans and one 300 g personal-use roast).
- Enforce the non-functional constraints: no multi-user auth, no barcodes, no HiBean import, no public storefront, no automated tax calculation.

## Capabilities
### New Capabilities
- inventory
- roasting
- resting-and-packaging
- sales
- dashboard

### Modified Capabilities
None (greenfield).

## Impact
This is the foundational change. All future work will build on the data model, persistence layer, and dashboard established here. Tech stack and storage decisions made in design.md become the project defaults.
