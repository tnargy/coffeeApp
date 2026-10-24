# CoffeeApp

A lightweight, local-first web application built with React, TypeScript, Vite, and Dexie.js (IndexedDB) for tracking coffee bean roasting inventory, green bean lots, profiling, packaging, sales, personal vs. commercial split allocations, and P&L tracking.

## Features

- **Green Bean Inventory & Allotments**: Track green coffee lots, record receipts, and set per-lot personal-use reserves.
- **Roasting & Profiling**: Log roast batches with detailed profile snapshots (charge temp, batch size, DTR, weight loss %) and split yields between personal use and for sale.
- **Packaging & Sales**: Pack roasted batches into bags with specific purpose classifications, track available/sold inventory, record sales and tax context (with personal-use bags excluded from commercial sales), and monitor unpaid balances.
- **Records & Corrections**: Comprehensive audit trail supporting edits and voids with required notes.
- **Backup & Restore**: Full JSON export and import capabilities.
- **Local-First**: Powered by IndexedDB (Dexie) with zero server dependencies required for core usage.

## Tech Stack

- **Frontend**: React 19, React Router 7, TypeScript, Vite
- **Storage**: Dexie.js (IndexedDB)
- **Testing**: Vitest, fake-indexeddb
- **Linting**: Oxlint

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:
```bash
npm run dev
```

### Build

Build for production:
```bash
npm run build
```

### Testing & Quality Checks

Run unit tests:
```bash
npm test
```

Run type checking:
```bash
npm run typecheck
```

Run linter:
```bash
npm run lint
```
