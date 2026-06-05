# Prague Blackout Resilience App - Monorepo MVP

An offline-first resilience web and mobile portal built for the residents of Prague, Czech Republic. The application provides coordinate mapping of local help hubs, status reporting, and checklists to help citizens navigate extended power outages.

---

## 🚀 Tech Stack

- **Monorepo**: pnpm workspaces + TypeScript
- **Backend API**: Node.js + Express + Prisma ORM + PostgreSQL/PostGIS
- **Web App**: Next.js (App Router) + Leaflet + Vanilla CSS (Glassmorphism theme)
- **Admin Panel**: Next.js (App Router) + Leaflet + Analytics Dashboard
- **Mobile App**: React Native + Expo + AsyncStorage + Native layouts

---

## 🛠️ Project Structure

```text
blackout-resilience-app/
  apps/
    web/          # Next.js web application
    admin/        # Next.js admin dashboard
    mobile/       # Expo React Native mobile client
  packages/
    shared/       # Shared TypeScript models, schemas, and sorting logic
  services/
    api/          # Express API server + Prisma database client
  docs/           # Architectural, database, and decisions documentation
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` in the root folder. The database connection defaults to the docker-compose service configuration.

```env
# Database configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blackout_resilience?schema=public"

# Admin Credentials
ADMIN_DEMO_EMAIL=admin@praha-blackout.demo
ADMIN_DEMO_PASSWORD=change-me-demo-password
ADMIN_SESSION_SECRET=change-me-session-secret-at-least-32-chars-long

# API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

---

## 🏁 How to Run Locally

### 1. Initial Workspace Setup
Install all packages and generate the Prisma client:
```bash
# Install dependencies
pnpm install

# Start PostgreSQL with PostGIS database container
pnpm docker:up

# Run Prisma schema migrations
pnpm --filter api db:migrate

# Seed Prague markers and emergency guides
pnpm --filter api db:seed
```

### 2. Starting the Services

Open separate terminal tabs to run the services, or run their respective workspace commands:

- **Run Express API Server**:
  ```bash
  pnpm dev:api
  # Runs on http://localhost:3001
  ```
- **Run Web App**:
  ```bash
  pnpm dev:web
  # Runs on http://localhost:3000
  ```
- **Run Admin Panel**:
  ```bash
  pnpm dev:admin
  # Runs on http://localhost:3002
  ```
- **Run Mobile App**:
  ```bash
  pnpm dev:mobile
  # Press 'w' in terminal to open browser simulator
  ```

---

## 👤 Demo Coordinator Credentials

To access the `/admin` dashboard:
- **Email**: `admin@praha-blackout.demo`
- **Password**: `change-me-demo-password`

---

## ⚠️ Known MVP Limitations

1. **Map Tile Caching**: Leaflet tile layers are loaded dynamically from online tile servers. If entirely offline, the map displays a friendly placeholder.
2. **Geocoding API**: Uses OpenStreetMap's Nominatim service which is free but rate-limited. For production, switch to Google Maps or Mapbox geocoders.
3. **Admin Authentication**: Uses static credentials matching environment files instead of hashed database user tables.
