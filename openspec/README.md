# Coffee Roasting App — OpenSpec Starter

This folder contains an OpenSpec-style specification structure for the internal coffee roasting inventory, roasting, packaging, and sales tracking app.

## Structure

```
openspec/
├── config.yaml
├── specs/                          # Source of truth (main specs)
│   ├── inventory/spec.md
│   ├── roasting/spec.md
│   ├── resting-and-packaging/spec.md
│   ├── sales/spec.md
│   └── dashboard/spec.md
└── changes/
    └── bootstrap-core-app/         # First change
        ├── proposal.md
        ├── design.md
        ├── tasks.md
        └── specs/                  # Delta specs (ADDED requirements)
            ├── inventory/spec.md
            ├── roasting/spec.md
            ├── resting-and-packaging/spec.md
            ├── sales/spec.md
            └── dashboard/spec.md
```

## How to use

1. Unzip this into your project root (or keep `openspec/` at the root).
2. Review `openspec/changes/bootstrap-core-app/proposal.md`, `design.md`, and `tasks.md`.
3. If you install the OpenSpec CLI (`npm i -g @fission-ai/openspec`), you can run `openspec init` (it will respect the existing folder) and later use `/opsx:apply` style workflows with your AI assistant.
4. Implement from the tasks checklist. After the core app is working, archive the change so the deltas are considered merged into the main specs.

The original behavioral specification and dashboard mockup that informed these files remain in the parent artifacts folder.
