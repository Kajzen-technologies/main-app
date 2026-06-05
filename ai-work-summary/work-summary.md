# AI Work Summary - Prague Blackout Resilience App

This summary outlines the features, architecture, and modules built for the Prague Blackout Resilience App MVP.

## Project Overview

A complete TypeScript monorepo prototype designed to support Prague residents during extended power outages. It includes a dark-themed interactive map frontend (web), a tabbed native simulation dashboard (mobile), a database configuration with PostGIS, and a moderation command center (admin panel).

---

## Implemented Features

1. **Prague Focused Map & List**: Displays 12 seeded hospitals, pharmacies, emergency points, and supermarkets, sorted by user proximity and priority categories.
2. **Offline Local Cache**: Automatically persists places, crisis guides, user coordinates, and profile settings in localStorage (web) and AsyncStorage (mobile).
3. **Offline Queue Sync**: Accumulates user submissions and reports in a FIFO queue while offline, pushing them to the backend server API when the connection is restored.
4. **Auto Flags Review**: Flags a place as `NEEDS_REVIEW` if it receives 3 or more reports within 24 hours with matching issue types.
5. **Admin Moderation & Analytics**: A dashboard showing total counts, reports by issue type, problem areas, and pending place suggestion approvals.
6. **Localized guides & Checklists**: Localized crisis guides in Czech (primary) and English (fallback) with checklist tracking.

---

## File Structure Summary

- **`packages/shared/`**: Common types, Zod schemas, search matching, and priority constants.
- **`services/api/`**: Express API routes, repositories, controllers, Prisma schemas, and seeding.
- **`apps/web/`**: Next.js user portal with Leaflet map tiles, profile geocoding, and sync state.
- **`apps/admin/`**: Next.js coordinator dashboard with report charts, moderation tables, and guide editors.
- **`apps/mobile/`**: React Native mobile app with AsyncStorage cachers and emergency buttons.
- **`docs/`**: Technical specs (Architecture, database schema, APIs, decisions log).

---

## Backend Summary

The Express server utilizes Prisma to access PostgreSQL.
- **Database models**: `User`, `Marker`, `MarkerReport`, `Guide`, `GuideTranslation`, `GuideChecklistItem`, `AdminSession`.
- **Seeding**: Generates 12 specific Prague coordinate points and 7 comprehensive localised emergency guides.
- **Business Logic**: Implemented in `needs-review.service.ts` to automatically flag places requiring validation.

---

## Web App Summary

Next.js App Router portal styled in glassmorphic dark mode.
- **Features**: Proximity sorting, OSM address geocoding, dark tile leaflet map, report modals, and manual sync buttons.

---

## Mobile App Summary

Expo-based React Native mobile app built using tab layouts.
- **Features**: Offline guide checklists, native dialog alerts, emergency hotlines, and mock geolocations.

---

## Admin Panel Summary

Coordinator control dashboard.
- **Features**: Login cookie validation, analytics counts, charts by problem type, guides editors, and reports dismissal tools.

---

## Offline Support Summary

- **Caching**: Local storage keeps markers and guides available when offline.
- **Syncing**: Background hooks monitor network events and automatically empty the synchronization queue upon reconnection.

---

## Localization Summary

Supports Czech (`cs`) as primary and English (`en`) as fallback. Swaps translation maps dynamically and saves language choices on device.

---

## Known Limitations

- Leaflet tiles are loaded online; offline falls back to list views.
- Address geocoding uses free OSM servers which can be rate-limited.
- Admin authentication checks matching env strings rather than encrypted database passwords.

---

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string.
- `ADMIN_DEMO_EMAIL` / `ADMIN_DEMO_PASSWORD`: Admin login details.
- `ADMIN_SESSION_SECRET`: Cookie session signature.
- `NEXT_PUBLIC_API_BASE_URL`: Express API endpoint.

---

## How to Run Locally

1. Install: `pnpm install`
2. Start Database: `pnpm docker:up`
3. Migrate & Seed: `pnpm --filter api db:migrate && pnpm --filter api db:seed`
4. Start Backend API: `pnpm dev:api`
5. Start Web Portal: `pnpm dev:web`
6. Start Admin Dashboard: `pnpm dev:admin`
7. Start Mobile App: `pnpm dev:mobile` (press `w` for browser simulation)

---

## Next Recommended Steps

1. Integrate offline map tile pack downloads (e.g. Mapbox offline maps).
2. Configure OAuth or bcrypt-hashed database user passwords for admin auth.
3. Migrate from OSM Nominatim to enterprise geocoders to handle rate-limiting.
