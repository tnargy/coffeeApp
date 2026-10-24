# Tasks

## 1. Project Scaffolding
- [x] 1.1 Initialize Vite + React + TypeScript project
- [x] 1.2 Add IndexedDB library (Dexie or equivalent) and define schema for GreenLot, RoastProfile, RoastBatch, BaggedUnit, Sale, Settings
- [x] 1.3 Configure basic routing and layout shell matching mockup style
- [x] 1.4 Add starter-data seed function

## 2. Core Persistence and Validation
- [x] 2.1 Implement CRUD helpers for all entities
- [x] 2.2 Enforce non-negative stock invariant on every write
- [x] 2.3 Implement settings store (reserve target, default bag size)

## 3. Dashboard (Read-Only)
- [x] 3.1 Build dashboard page with stat cards (green remaining, roasted stock, bags ready)
- [x] 3.2 Display green bean inventory list with remaining weights
- [x] 3.3 Show recent activity feed
- [x] 3.4 Surface personal-use reserve status and non-blocking warning
- [x] 3.5 Add quick-action buttons (placeholders linking to future forms)

## 4. Inventory and Roasting Flows
- [x] 4.1 Receive green lot form
- [x] 4.2 Log roast form (profile entry/selection, classification, green weight → roasted yield)
- [x] 4.3 Update inventory and create batch on successful roast

## 5. Resting, Packaging, and Sales
- [x] 5.1 Mark batch rested and display rest duration
- [x] 5.2 Pack bags flow (default size, reduce roasted weight, create bagged units)
- [x] 5.3 Record sale flow (select bags, amount, reduce inventory, record sale)

## 6. History and Polish
- [x] 6.1 Batch/lot history trail view
- [x] 6.2 Settings page for reserve target and bag size
- [x] 6.3 Verify all behavioral scenarios from the main specs
- [x] 6.4 Seed and confirm starter data (5 lb green + 300 g internal roast)
