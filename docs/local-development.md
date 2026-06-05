# Local Development Guide - Prague Blackout Resilience App

Follow these instructions to spin up the monorepo locally.

## Prerequisites
- Node.js >= 18
- pnpm (workspace manager)
- Docker Desktop (for PostgreSQL database)

---

## 1. Database Setup (Docker)

1. Boot up the PostgreSQL container:
```bash
pnpm docker:up
```

2. Generate the Prisma database client:
```bash
pnpm --filter api db:generate
```

3. Run migrations to configure table structures:
```bash
pnpm --filter api db:migrate
```

4. Seed the database with Prague location points and emergency guides:
```bash
pnpm --filter api db:seed
```

---

## 2. Running the API backend

```bash
pnpm dev:api
```
The Express server starts listening on **`http://localhost:3001`**.

---

## 3. Running the Web Application

```bash
pnpm dev:web
```
Open **`http://localhost:3000`** in your browser. The Leaflet map will load and connect to the local API.

---

## 4. Running the Admin Dashboard

```bash
pnpm dev:admin
```
Open **`http://localhost:3002`** in your browser. 
- Use the credentials:
  - **Email**: `admin@praha-blackout.demo`
  - **Password**: `change-me-demo-password`

---

## 5. Running the Expo Mobile Client

To run the mobile interface in the browser (web fallback) or native simulator:
```bash
pnpm dev:mobile
```
- Press **`w`** to open the web simulator.
- Press **`a`** for Android or **`i`** for iOS simulator (requires Xcode or Android Studio).
