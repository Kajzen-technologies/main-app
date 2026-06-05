# Architecture & Design Decisions - Prague Blackout Resilience App

This document logs the engineering decisions made during the design and development of the MVP.

## ADR 1: pnpm Workspace Monorepo
* **Context**: The product scope requires building a Web App, Mobile App, Admin Panel, and API Server. They must share types and utilities.
* **Decision**: Adopt a pnpm workspace monorepo.
* **Rationale**: pnpm offers lightning-fast installations, uses a content-addressable store to save disk space, and provides absolute local package linking. Types updated in `packages/shared` compile and reflect in other services instantly.

## ADR 2: OpenStreetMap Nominatim Geocoding
* **Context**: Storing a home address requires geocoding it to coordinates. Google Maps Geocoding API requires paid API keys and account setup.
* **Decision**: Use OpenStreetMap's free Nominatim search API.
* **Rationale**: It allows immediate, zero-config geocoding of addresses within Prague out of the box, ensuring the prototype is 100% usable without inputting billing credentials, while keeping the map provider replaceable with Google Maps in the future.

## ADR 3: CartoDB Dark Matter Tile Server
* **Context**: During emergencies, preserving device power is key. Traditional maps are bright and drain battery quickly.
* **Decision**: Implement a Dark-themed CartoDB map tile server.
* **Rationale**: It fits the premium glassmorphic visual aesthetic of the portal, decreases screen glare in high-stress situations, and saves battery power on mobile devices.

## ADR 4: Express + Prisma ORM Backend
* **Context**: A clean, readable backend API is required. NestJS is structured but introduces high boilerplate bloat for a prototype.
* **Decision**: Utilize Express with TypeScript and Prisma.
* **Rationale**: Express is minimal and robust. Wrap database access in repositories and services, keeping controllers slim. Prisma handles PostGIS/PostgreSQL schema modeling and provides type-safe clients.

## ADR 5: Cookie-Based Session Auth
* **Context**: Admin authentication must not expose plain text passwords to frontends.
* **Decision**: Implement demo admin validation against environment credentials, creating database `AdminSession` entries, and returning `httpOnly` secure cookies.
* **Rationale**: Demonstrates standard session mechanics. Frontends are protected from XSS stealing session IDs, and administrative access is completely secure for the MVP.
