# Local Development Guide - Prague Blackout Resilience App

Follow these instructions to spin up the monorepo locally.

## Prerequisites
- Node.js >= 18
- pnpm (workspace manager)

---

## 1. Database Setup (Zero-Configuration JSON DB)

The application has been configured to run without any external database (Docker or local PostgreSQL). 
All database operations read and write to a local file: **[services/api/db.json](file:///Users/bynarig/dev/main-app/services/api/db.json)**.

- **Auto-Seeding**: The file is automatically created and seeded with default Prague location markers and emergency guides when the API backend starts for the first time.
- **Resetting Data**: If you want to reset the database to its initial seeded state, simply delete the `services/api/db.json` file and restart the API server.

---

## 2. Running Applications (with Hot Reloading)

For local development with hot-reloading (Fast Refresh), run each service in a separate terminal window/tab:

### A. Shared Package (Watch Mode)
Because the services and apps import from `shared`, start compiling shared changes automatically:
```bash
pnpm --filter shared dev
```
*(Runs `tsc -w` to compile TypeScript to `dist/index.js` in real-time).*

### B. Running the API backend
```bash
pnpm dev:api
```
- **Hot Reloading**: Uses `ts-node-dev --respawn` to watch code changes and automatically reload the server.
- The Express server starts listening on **`http://localhost:12360`** (configured via `PORT` in `.env`).
- On first start, it will create and seed the `services/api/db.json` file.


### C. Running the Web Application
```bash
pnpm dev:web
```
- **Hot Reloading**: Uses Next.js Fast Refresh.
- Open **`http://localhost:12359`** in your browser. The Leaflet map will load and connect to the local API.

### D. Running the Admin Dashboard
```bash
pnpm dev:admin
```
- **Hot Reloading**: Uses Next.js Fast Refresh.
- Open **`http://localhost:12361`** in your browser.
- Use the credentials:
  - **Email**: `admin@praha-blackout.demo`
  - **Password**: `change-me-demo-password`

### E. Running the Expo Mobile Client
To run the mobile interface in the browser (web fallback) or native simulator:
```bash
pnpm dev:mobile
```
- Press **`w`** to open the web simulator.
- Press **`a`** for Android or **`i`** for iOS simulator (requires Xcode or Android Studio).

