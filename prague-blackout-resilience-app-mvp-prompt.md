# Build MVP Prototype: Prague Blackout Resilience App

## 1. Product Overview

Create a working MVP prototype for a blackout resilience application for local residents of Prague, Czech Republic.

The product helps people during a blackout or city-wide emergency by providing:

- An interactive map of useful places in Prague
- A list of approved places
- Emergency blackout guides
- Simple checklists inside guides
- Offline access to previously loaded markers and guides
- User-submitted place suggestions
- User reports for existing places
- Admin moderation
- Simple admin analytics

The MVP must include:

- Web app
- Android app
- iOS app
- Backend API
- PostgreSQL/PostGIS database
- Admin panel
- Offline cache support
- Clean production-like file structure
- Documentation
- A separate AI work summary markdown file

The prototype must be usable, not just a static skeleton.

---

## 2. Target Audience

The app is for local residents of Prague.

It should not feel like a tourist app.

The tone should be:

- Practical
- Calm
- Local
- Trustworthy
- Easy to use during stress

---

## 3. Languages and Localization

The app must support:

- Czech as the primary language
- English as the fallback language

Requirements:

- All UI labels must support localization
- All marker category labels must support Czech and English
- All emergency guides must have Czech and English content
- User can manually switch language
- User language preference must be stored locally
- Place names and addresses should remain in their local Czech form

Create translation files:

```text
cs.json
en.json
```

Default language:

```text
cs
```

---

## 4. Main Demo City

The MVP is focused only on:

```text
Prague, Czech Republic
```

Default map behavior:

- Initial city: Prague
- Initial center: Prague city center
- Initial zoom: city-level zoom

Fallback location:

```text
Prague city center
```

---

## 5. Recommended Tech Stack

Use this stack unless there is a strong technical reason not to:

### Monorepo

- pnpm workspaces
- TypeScript everywhere

### Web App

- Next.js
- React
- TypeScript

### Mobile App

- React Native
- Expo
- TypeScript

### Backend

- Node.js
- NestJS or Express/Fastify
- TypeScript

### Database

- PostgreSQL
- PostGIS extension for geolocation
- Prisma ORM

### Admin Panel

- Next.js admin app or separate admin route/app

### Offline Storage

Web:

- IndexedDB for cached markers, cached guides, and offline queue
- localStorage for mock user ID, language, and simple settings

Mobile:

- SQLite for cached markers, cached guides, and offline queue
- AsyncStorage or SecureStore for mock user ID, language, and simple settings

### Maps

Use a map provider abstraction.

Preferred:

- Google Maps if API keys are available

Important:

- Do not hardcode map provider logic directly into UI components
- Keep map provider replaceable with Mapbox or OpenStreetMap later
- Store API keys in environment variables

---

## 6. MVP Scope

### MVP Includes

- Web app
- Android app
- iOS app
- Prague-focused interactive map
- Map + marker list
- Czech primary language
- English fallback
- Anonymous local mock user ID
- Local profile with home address only
- Optional geolocation
- Fixed marker categories
- Category priority sorting
- User-submitted pending markers
- Admin approval flow
- Marker reports
- Automatic `NEEDS_REVIEW` logic based on repeated reports
- Emergency blackout guides
- Simple checklists inside guides
- Offline cached guides
- Offline cached Prague markers
- Offline queue for reports and marker submissions
- Manual refresh
- Offline banner
- External directions link
- Simple emergency mode screen
- Simple admin analytics
- Demo admin login
- Documentation
- AI work summary markdown file

### MVP Does Not Include

- Required user registration
- Push notifications
- AI assistant
- AI disaster prediction
- Real government integration
- Payments
- Full production authentication
- Advanced role management
- Advanced geospatial heatmaps
- Full global places search
- In-app turn-by-turn navigation
- Category management in admin panel

---

## 7. User Authentication

Regular users do not need to log in.

On first app launch:

- Generate local anonymous `mockUserId`
- Store it locally
- Use it for:
  - marker submissions
  - marker reports
  - offline queue ownership
  - checklist progress
  - local profile

Storage:

Web:

```text
localStorage
```

Mobile:

```text
AsyncStorage or SecureStore
```

Example local user object:

```json
{
  "id": "local_user_8f3a2c91",
  "createdAt": "2026-06-05T10:00:00.000Z",
  "preferredLanguage": "cs",
  "deviceType": "web"
}
```

---

## 8. Local User Profile

The MVP has a lightweight local profile.

No registration is required.

Profile supports only:

- mockUserId
- homeAddress
- homeLatitude
- homeLongitude
- preferredLanguage

Do not add:

- work address
- school address
- relatives
- saved important places

Model:

```ts
type LocalUserProfile = {
  mockUserId: string;
  homeAddress: string | null;
  homeLatitude: number | null;
  homeLongitude: number | null;
  preferredLanguage: "cs" | "en";
  createdAt: string;
  updatedAt: string;
};
```

Profile/settings UI:

Czech:

- Nastavení
- Domácí adresa
- Jazyk
- Uložit
- Smazat adresu

English:

- Settings
- Home address
- Language
- Save
- Clear address

---

## 9. Location Behavior

Geolocation is optional.

The app must not block usage if the user denies location permission.

Add button:

Czech:

```text
Použít mou polohu
```

English:

```text
Use my location
```

Location resolution order:

1. If user allows geolocation:
   - center map on current location
   - show user location marker
   - optionally sort nearby places by distance

2. If geolocation is denied or unavailable:
   - use saved home address coordinates

3. If home address coordinates are unavailable:
   - center map on Prague city center

4. If user enters home address while online:
   - geocode the address
   - store latitude and longitude locally

5. If user enters home address while offline:
   - store the typed address
   - geocode later when online

---

## 10. Marker Categories

Marker categories are fixed in code.

Admin cannot create, edit, or delete categories in MVP.

Use this list:

```ts
export const MARKER_CATEGORIES = [
  "HOSPITAL",
  "PHARMACY",
  "GAS_STATION",
  "POLICE_STATION",
  "FIRE_STATION",
  "SUPERMARKET",
  "PUBLIC_TRANSPORT_HUB",
  "CITY_DISTRICT_OFFICE",
  "COMMUNITY_CENTER",
  "SCHOOL",
  "ELDERLY_CARE",
  "EMERGENCY_SUPPORT_POINT"
] as const;

export type MarkerCategory = typeof MARKER_CATEGORIES[number];
```

Category labels:

```ts
export const MARKER_CATEGORY_LABELS = {
  cs: {
    HOSPITAL: "Nemocnice",
    PHARMACY: "Lékárna",
    GAS_STATION: "Čerpací stanice",
    POLICE_STATION: "Policie",
    FIRE_STATION: "Hasiči",
    SUPERMARKET: "Supermarket",
    PUBLIC_TRANSPORT_HUB: "Dopravní uzel",
    CITY_DISTRICT_OFFICE: "Úřad městské části",
    COMMUNITY_CENTER: "Komunitní centrum",
    SCHOOL: "Škola",
    ELDERLY_CARE: "Péče o seniory",
    EMERGENCY_SUPPORT_POINT: "Nouzové podpůrné místo"
  },
  en: {
    HOSPITAL: "Hospital",
    PHARMACY: "Pharmacy",
    GAS_STATION: "Gas station",
    POLICE_STATION: "Police station",
    FIRE_STATION: "Fire station",
    SUPERMARKET: "Supermarket",
    PUBLIC_TRANSPORT_HUB: "Public transport hub",
    CITY_DISTRICT_OFFICE: "City district office",
    COMMUNITY_CENTER: "Community center",
    SCHOOL: "School",
    ELDERLY_CARE: "Elderly care",
    EMERGENCY_SUPPORT_POINT: "Emergency support point"
  }
};
```

Category priority:

```ts
export const MARKER_CATEGORY_PRIORITY: Record<MarkerCategory, number> = {
  HOSPITAL: 1,
  EMERGENCY_SUPPORT_POINT: 2,
  PHARMACY: 3,
  SUPERMARKET: 4,
  GAS_STATION: 5,
  FIRE_STATION: 6,
  POLICE_STATION: 7,
  PUBLIC_TRANSPORT_HUB: 8,
  CITY_DISTRICT_OFFICE: 9,
  COMMUNITY_CENTER: 10,
  ELDERLY_CARE: 11,
  SCHOOL: 12
};
```

Sorting rules:

If user location or home address coordinates are available:

1. Sort by distance ascending
2. Then by category priority ascending
3. Then by title ascending

If distance is unavailable:

1. Sort by category priority ascending
2. Then by title ascending

---

## 11. Markers

Approved markers are visible on the public map.

User-submitted markers are saved as `PENDING` and are not visible publicly until admin approval.

Marker verification statuses:

```text
PENDING
APPROVED
REJECTED
NEEDS_REVIEW
```

Public marker status:

```text
OPEN
CLOSED
UNKNOWN
```

Marker model:

```ts
type Marker = {
  id: string;
  title: string;
  description: string | null;
  category: MarkerCategory;
  latitude: number;
  longitude: number;
  address: string | null;
  publicStatus: "OPEN" | "CLOSED" | "UNKNOWN";
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_REVIEW";
  hasElectricity: boolean | null;
  hasWater: boolean | null;
  hasInternet: boolean | null;
  crowdLevel: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  submittedByLocalUserId: string | null;
  approvedByAdminId: string | null;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
```

---

## 12. Marker Submission Flow

Users can suggest new places.

Flow:

1. User taps:
   - Czech: `Přidat místo`
   - English: `Add place`

2. User enters:
   - title
   - category
   - address
   - description
   - location on map or current location

3. Backend creates marker with:

```text
verificationStatus = PENDING
```

4. Public map does not show the marker.

5. User sees confirmation:

Czech:

```text
Děkujeme. Místo bylo odesláno ke kontrole.
```

English:

```text
Thank you. The place has been submitted for review.
```

6. Admin reviews the marker.

7. Admin can:
   - approve
   - reject
   - edit
   - delete

8. Approved markers become visible publicly.

---

## 13. Marker Reports

Users can report the status of existing approved markers.

Reports do not immediately change the public marker status.

Each report is stored separately.

Report model:

```ts
type MarkerReport = {
  id: string;
  markerId: string;
  localUserId: string;
  reportedStatus: "OPEN" | "CLOSED" | "UNKNOWN";
  hasElectricity: boolean | null;
  hasWater: boolean | null;
  hasInternet: boolean | null;
  crowdLevel: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  issueType:
    | "CLOSED"
    | "NO_ELECTRICITY"
    | "NO_WATER"
    | "NO_INTERNET"
    | "TOO_CROWDED"
    | "WRONG_LOCATION"
    | "OUTDATED_INFO"
    | "OTHER";
  comment: string | null;
  createdAt: string;
};
```

After report submission, show:

Czech:

```text
Děkujeme. Hlášení bylo odesláno.
```

English:

```text
Thank you. Your report has been submitted.
```

---

## 14. Automatic NEEDS_REVIEW Logic

When a report is submitted:

1. Save `MarkerReport`
2. Load all reports for the same marker from the last 24 hours
3. Group reports by `issueType`
4. If total recent reports >= 3 and any issue type count >= 2:
   - set marker `verificationStatus = NEEDS_REVIEW`
5. Otherwise:
   - keep marker unchanged
6. Return success response

`NEEDS_REVIEW` markers:

- remain visible on the public map
- show a warning badge

Warning text:

Czech:

```text
Toto místo může vyžadovat ověření.
```

English:

```text
This place may need verification.
```

PlantUML:

```plantuml
@startuml
start
:User submits marker report;
:Save MarkerReport;
:Load reports for marker from last 24h;
:Group reports by issueType;

if (Total reports >= 3?) then (yes)
  if (Any issueType count >= 2?) then (yes)
    :Set marker verificationStatus = NEEDS_REVIEW;
  else (no)
    :Keep marker unchanged;
  endif
else (no)
  :Keep marker unchanged;
endif

:Return success message;
stop
@enduml
```

---

## 15. Map + Marker List

The main screen must show both:

- interactive map
- marker list

Search and filters affect both.

Desktop web layout:

- marker list sidebar
- search and filters above list
- map beside or behind the list

Mobile layout:

- map
- draggable bottom sheet with marker list

Bottom sheet states:

- collapsed
- half-expanded
- full-expanded

Marker list item shows:

- title
- category
- address
- public status
- verification badge
- electricity indicator
- water indicator
- internet indicator
- crowd level
- distance if available

If map tiles are unavailable offline:

- keep marker list usable
- show placeholder map area
- show message:

Czech:

```text
Mapa nemusí být dostupná offline. Níže zobrazujeme uložená místa.
```

English:

```text
The map may not be available offline. Showing saved places below.
```

---

## 16. Marker Detail Card

Marker detail card must include:

- title
- category
- address
- description
- public status
- verification status
- has electricity
- has water
- has internet
- crowd level
- last verified time
- report status button
- directions button

Buttons:

Czech:

```text
Nahlásit stav
Navigovat
```

English:

```text
Report status
Get directions
```

---

## 17. External Directions

Add external directions button.

Do not implement in-app turn-by-turn navigation.

Web:

- open Google Maps directions URL in a new browser tab

Android:

- prefer Google Maps app if installed
- fallback to browser Google Maps URL

iOS:

- prefer Apple Maps or Google Maps if available
- fallback to browser Google Maps URL

Helpers:

```ts
export function buildGoogleDirectionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export function buildAppleMapsUrl(latitude: number, longitude: number): string {
  return `http://maps.apple.com/?daddr=${latitude},${longitude}`;
}
```

---

## 18. Search

Implement simple search only.

Do not implement full global places search.

Search supports:

1. Searching among already loaded approved markers
2. Searching home address when saving local profile
3. Filtering by category and status

Marker search:

- title
- category label
- address
- description

Search must work offline using cached markers.

Search input placeholder:

Czech:

```text
Hledat místo nebo kategorii
```

English:

```text
Search place or category
```

No results text:

Czech:

```text
Nenalezena žádná místa
```

English:

```text
No places found
```

Search algorithm:

1. Load approved markers from API or offline cache
2. User enters search query
3. Normalize query:
   - lowercase
   - trim spaces
   - optionally remove diacritics
4. Search in marker title, category label, address, and description
5. Show matched markers on map and in list
6. If query is empty, show all markers matching active filters

---

## 19. Emergency Guides

Guides are short and practical.

Each guide can include:

- title
- short description
- text sections
- checklist items

Guides must support Czech and English.

Guides must work offline after first successful sync.

Admin can:

- create guide
- edit guide
- publish/unpublish guide
- set category and priority
- edit Czech content
- edit English content
- add checklist items
- reorder checklist items
- delete checklist items

Guide categories:

```ts
export const GUIDE_CATEGORIES = [
  "BEFORE_BLACKOUT",
  "DURING_BLACKOUT",
  "COMMUNICATION",
  "WATER_AND_FOOD",
  "MEDICAL_HELP",
  "HEATING",
  "SAFETY",
  "AFTER_POWER_RETURNS"
] as const;
```

Guide models:

```ts
type Guide = {
  id: string;
  slug: string;
  category: GuideCategory;
  priority: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type GuideTranslation = {
  id: string;
  guideId: string;
  language: "cs" | "en";
  title: string;
  shortDescription: string;
  content: string;
};

type GuideChecklistItem = {
  id: string;
  guideId: string;
  order: number;
  textCs: string;
  textEn: string;
};
```

Checklist progress:

- stored locally per mockUserId
- does not sync to backend in MVP
- works offline

```ts
type LocalChecklistProgress = {
  mockUserId: string;
  guideId: string;
  checkedItemIds: string[];
  updatedAt: string;
};
```

Checklist section title:

Czech:

```text
Kontrolní seznam
```

English:

```text
Checklist
```

---

## 20. Seed Emergency Guides

Create seed guide content in Czech and English.

Seed at least these guides:

1. What to do before a blackout
2. What to do during a blackout
3. Water and food
4. Medical help
5. Communication
6. Heating and safety
7. After power returns

Example checklist items:

### Before blackout

- Charge your phone and power bank
- Prepare drinking water
- Prepare flashlight and batteries
- Save important contacts offline
- Check on elderly neighbors

### During blackout

- Stay calm
- Turn off sensitive electronics
- Use flashlights instead of candles if possible
- Check official city communication channels if internet is available
- Avoid unnecessary travel

### Water and food

- Keep drinking water at home
- Prepare non-perishable food
- Avoid opening fridge/freezer often
- Check nearby supermarkets or support points

### Medical help

- Keep essential medication available
- Know the nearest hospital or pharmacy
- Save emergency numbers offline
- Check on people who need medical devices

### Communication

- Keep phone battery low-power mode enabled
- Use SMS when mobile data is unstable
- Agree on a meeting point with family
- Save addresses and contacts offline

### Heating and safety

- Do not use outdoor grills indoors
- Ventilate if using alternative heating
- Wear layered clothing
- Watch for carbon monoxide risks

### After power returns

- Turn appliances back on gradually
- Check food safety
- Recharge devices
- Update marker statuses if you visited a place

---

## 21. Offline Support

Cache:

- approved Prague markers
- emergency guides
- guide checklist structure
- marker categories
- user language preference
- anonymous mock user ID
- local user profile
- checklist progress

When online:

- load approved Prague markers from API
- load published guides from API
- save markers and guides to local cache
- save last sync timestamp
- allow reports
- allow new marker suggestions
- process offline queue

When offline:

- show cached approved Prague markers
- show cached emergency guides
- show cached marker categories
- show offline banner
- allow user to create reports locally
- allow user to suggest markers locally
- queue offline actions
- sync queued actions when internet returns

Offline banner:

Czech:

```text
Jste offline. Zobrazujeme poslední uložená data.
```

English:

```text
You are offline. Showing the last saved data.
```

Last sync label:

Czech:

```text
Naposledy aktualizováno: {time}
```

English:

```text
Last updated: {time}
```

Manual refresh button:

Czech:

```text
Aktualizovat data
```

English:

```text
Refresh data
```

Refresh failure message:

Czech:

```text
Data se nepodařilo aktualizovat. Zobrazujeme poslední uloženou verzi.
```

English:

```text
Could not refresh data. Showing the last saved version.
```

---

## 22. Offline Sync Queue

Supported queued actions:

```text
CREATE_MARKER
CREATE_MARKER_REPORT
```

Queue item model:

```ts
type OfflineQueueItem = {
  id: string;
  type: "CREATE_MARKER" | "CREATE_MARKER_REPORT";
  payload: unknown;
  localUserId: string;
  createdAt: string;
  syncStatus: "PENDING" | "SYNCED" | "FAILED";
  retryCount: number;
  lastAttemptAt: string | null;
};
```

Sync behavior:

1. Detect that internet connection returned
2. Process queued actions in creation order
3. Send action to backend
4. If success:
   - mark as `SYNCED`
5. If failure:
   - increment `retryCount`
   - mark as `FAILED` or keep `PENDING`
6. Max retry count:
   - 5

Do not retry forever.

---

## 23. Emergency Mode

Add a simple Emergency Mode screen.

It must work online and offline.

Title:

Czech:

```text
Nouzový režim
```

English:

```text
Emergency Mode
```

Subtitle:

Czech:

```text
Rychlé akce pro výpadek elektřiny
```

English:

```text
Quick actions for a power outage
```

Large action buttons:

1. Nearest help

Czech:

```text
Nejbližší pomoc
```

English:

```text
Nearest help
```

Filters:

```text
EMERGENCY_SUPPORT_POINT
HOSPITAL
PHARMACY
```

2. Emergency guides

Czech:

```text
Nouzové návody
```

English:

```text
Emergency guides
```

3. Saved offline data

Czech:

```text
Uložená offline data
```

English:

```text
Saved offline data
```

4. Report a place

Czech:

```text
Nahlásit místo
```

English:

```text
Report a place
```

5. Hospitals and pharmacies

Czech:

```text
Nemocnice a lékárny
```

English:

```text
Hospitals and pharmacies
```

Filters:

```text
HOSPITAL
PHARMACY
```

---

## 24. Push Notifications

Do not implement push notifications in MVP.

Do not request notification permissions.

Do not integrate:

- Firebase Cloud Messaging
- APNs
- Web Push

Emergency updates should be handled through:

- offline/online banner
- manual refresh
- refreshed marker statuses
- admin analytics

---

## 25. Admin Login

Implement simple demo admin login.

Do not implement full production authentication.

Admin login is required for admin panel access.

Use environment variables:

```env
ADMIN_DEMO_EMAIL=admin@praha-blackout.demo
ADMIN_DEMO_PASSWORD=change-me-demo-password
ADMIN_SESSION_SECRET=change-me-session-secret
```

Do not hardcode credentials directly in source code.

Admin login route:

```text
/admin/login
```

Protected routes:

```text
/admin
/admin/markers/pending
/admin/markers/:id
/admin/guides
/admin/guides/:id
/admin/analytics
```

Admin auth API:

```text
POST /admin/auth/login
POST /admin/auth/logout
GET /admin/auth/me
```

Admin session:

```ts
type AdminSession = {
  id: string;
  email: string;
  role: "ADMIN";
  createdAt: string;
  expiresAt: string;
};
```

Session duration:

```text
8 hours
```

Security notes:

- do not expose password to frontend
- validate login only on backend
- use signed httpOnly cookie if possible
- document that this is demo authentication only

---

## 26. Admin Marker Moderation

Admin can:

- see pending markers
- approve pending markers
- reject pending markers
- edit marker details
- delete markers
- view reports for markers
- update public marker status
- mark marker as verified
- dismiss reports

Admin marker pages:

```text
Pending submissions
Marker detail
Marker reports
Marker edit
```

---

## 27. Admin Guide Management

Admin can:

- list guides
- create guide
- edit guide
- publish/unpublish guide
- edit Czech translation
- edit English translation
- add checklist items
- reorder checklist items
- delete checklist items

---

## 28. Admin Analytics

Add simple analytics dashboard.

Do not use AI in MVP analytics.

Analytics is based only on markers and user reports.

Dashboard sections:

### Overview

Show:

- total approved markers
- total pending markers
- total reports in last 24 hours
- total markers with `NEEDS_REVIEW`
- most reported category
- most common issue type

### Reports by issue type

Show counts for:

- CLOSED
- NO_ELECTRICITY
- NO_WATER
- NO_INTERNET
- TOO_CROWDED
- WRONG_LOCATION
- OUTDATED_INFO
- OTHER

### Reports by category

Group reports by marker category.

### Markers needing review

Show table:

- marker title
- category
- address
- number of reports in last 24h
- most common issue type
- last report time
- action buttons:
  - view reports
  - update status
  - mark as verified
  - edit marker

### Problem areas map

For MVP, implement simple report count markers or clustered markers.

Do not implement advanced heatmap.

Analytics time ranges:

- last 24 hours
- last 7 days
- last 30 days

Analytics API:

```text
GET /admin/analytics/overview
GET /admin/analytics/reports-by-issue-type?from=&to=
GET /admin/analytics/reports-by-category?from=&to=
GET /admin/analytics/markers-needing-review
GET /admin/analytics/problem-areas?from=&to=
```

---

## 29. Public API

Auth / anonymous:

```text
GET /health
```

Markers:

```text
GET /markers?bbox=&category=&status=
GET /markers/:id
POST /markers
POST /markers/:id/reports
GET /marker-categories
```

Guides:

```text
GET /guides
GET /guides/:slug
```

Admin auth:

```text
POST /admin/auth/login
POST /admin/auth/logout
GET /admin/auth/me
```

Admin markers:

```text
GET /admin/markers/pending
GET /admin/markers/:id
GET /admin/markers/:id/reports
PATCH /admin/markers/:id/approve
PATCH /admin/markers/:id/reject
PATCH /admin/markers/:id/needs-review
PATCH /admin/markers/:id/confirm-status
PATCH /admin/markers/:id/dismiss-reports
PATCH /admin/markers/:id
DELETE /admin/markers/:id
```

Admin guides:

```text
GET /admin/guides
GET /admin/guides/:id
POST /admin/guides
PATCH /admin/guides/:id
DELETE /admin/guides/:id
```

Admin analytics:

```text
GET /admin/analytics/overview
GET /admin/analytics/reports-by-issue-type
GET /admin/analytics/reports-by-category
GET /admin/analytics/markers-needing-review
GET /admin/analytics/problem-areas
```

---

## 30. Database Schema

Use Prisma with PostgreSQL/PostGIS.

Models required:

```text
User
Marker
MarkerReport
Guide
GuideTranslation
GuideChecklistItem
AdminSession
```

User model must support anonymous MVP users and admin users.

Suggested User fields:

```text
id
type: ANONYMOUS | ADMIN
email nullable
phone nullable
name nullable
role: USER | ADMIN | GOVERNMENT_VIEWER
localUserId nullable unique
preferredLanguage: cs | en
createdAt
updatedAt
```

Use PostGIS-compatible fields or latitude/longitude fields for MVP.

---

## 31. Seed Data

Create realistic seed data for Prague.

Seed markers should include:

- hospitals
- pharmacies
- gas stations
- police stations
- fire stations
- supermarkets
- public transport hubs
- city district offices
- community centers
- schools
- elderly care / social support points
- emergency support points

Each priority category should have at least one marker:

- HOSPITAL
- PHARMACY
- GAS_STATION
- SUPERMARKET
- EMERGENCY_SUPPORT_POINT
- POLICE_STATION
- FIRE_STATION

Seed guides:

- at least 7 guides
- Czech and English translations
- checklist items for each guide

Seed one demo admin user through environment-based login, not database password storage.

---

## 32. Required File Structure

Use this monorepo structure:

```text
blackout-resilience-app/
  apps/
    web/
      src/
        app/
        components/
        features/
          map/
            MapView.tsx
            MarkerLayer.tsx
            MarkerDetailCard.tsx
            MarkerFilters.tsx
            MarkerList.tsx
            MarkerListItem.tsx
            MapBottomSheet.tsx
            useVisibleMarkers.ts
            useMarkerSelection.ts
            openDirections.ts
          guides/
            GuidesPage.tsx
            GuideDetailPage.tsx
            GuideCard.tsx
            GuideChecklist.tsx
            checklistProgressStorage.ts
          emergency/
            EmergencyModePage.tsx
            EmergencyActionButton.tsx
            emergencyActions.ts
          offline/
            offlineStorage.ts
            offlineQueue.ts
            syncOfflineActions.ts
            useOfflineStatus.ts
            OfflineBanner.tsx
          profile/
            ProfileSettingsPage.tsx
            HomeAddressInput.tsx
            profileStorage.ts
            useLocalProfile.ts
          location/
            useOptionalGeolocation.ts
            geocodeAddress.ts
            resolveInitialMapLocation.ts
          search/
            MarkerSearchInput.tsx
            useMarkerSearch.ts
        lib/
        styles/

    mobile/
      src/
        screens/
        components/
        navigation/
        features/
          map/
            MapScreen.tsx
            MapView.tsx
            MarkerLayer.tsx
            MarkerDetailCard.tsx
            MarkerFilters.tsx
            MarkerList.tsx
            MarkerListItem.tsx
            MarkerBottomSheet.tsx
            useVisibleMarkers.ts
            useMarkerSelection.ts
            openDirections.ts
          guides/
            GuidesScreen.tsx
            GuideDetailScreen.tsx
            GuideCard.tsx
            GuideChecklist.tsx
            checklistProgressStorage.ts
          emergency/
            EmergencyModeScreen.tsx
            EmergencyActionButton.tsx
            emergencyActions.ts
          offline/
            offlineStorage.ts
            offlineQueue.ts
            syncOfflineActions.ts
            useOfflineStatus.ts
            OfflineBanner.tsx
          profile/
            ProfileSettingsScreen.tsx
            HomeAddressInput.tsx
            profileStorage.ts
            useLocalProfile.ts
          location/
            useOptionalGeolocation.ts
            geocodeAddress.ts
            resolveInitialMapLocation.ts
          search/
            MarkerSearchInput.tsx
            useMarkerSearch.ts
        lib/

    admin/
      src/
        app/
        components/
        features/
          auth/
            AdminLoginPage.tsx
            adminAuthApi.ts
            useAdminSession.ts
            RequireAdminAuth.tsx
          markers/
            PendingMarkersPage.tsx
            MarkerReviewPage.tsx
            MarkerReportsPanel.tsx
            MarkerEditForm.tsx
          guides/
            GuidesAdminPage.tsx
            GuideEditor.tsx
            GuideChecklistEditor.tsx
            GuideTranslationEditor.tsx
          analytics/
            AnalyticsPage.tsx
            OverviewCards.tsx
            ReportsByIssueTypeChart.tsx
            ReportsByCategoryChart.tsx
            MarkersNeedingReviewTable.tsx
            ProblemAreasMap.tsx
            DateRangeFilter.tsx

  packages/
    shared/
      src/
        anonymous-user/
          createAnonymousUser.ts
          getAnonymousUser.ts
          anonymousUser.types.ts
        profile/
          localUserProfile.types.ts
          profile.validation.ts
        markers/
          marker.types.ts
          marker.validation.ts
          markerCategory.constants.ts
          markerCategory.labels.ts
          markerCategory.priority.ts
          sortMarkersForDisplay.ts
          distance.ts
        maps/
          directionsUrl.ts
          mapProvider.types.ts
        guides/
          guide.types.ts
          guideCategory.constants.ts
          guideCategory.labels.ts
          checklist.types.ts
        offline/
          offlineQueue.types.ts
          cachedMarker.types.ts
          cachedGuide.types.ts
          syncStatus.types.ts
        search/
          normalizeSearchText.ts
          markerSearch.ts
          search.types.ts
        emergency/
          emergencyAction.types.ts
          emergencyFilters.ts
        validation/
        api-client/
        constants/
        types/

    ui/
      src/
        components/

    config/
      eslint/
      tsconfig/

  services/
    api/
      src/
        modules/
          admin-auth/
            admin-auth.controller.ts
            admin-auth.service.ts
            admin-session.types.ts
            require-admin.middleware.ts
          markers/
            markers.controller.ts
            markers.service.ts
            markers.repository.ts
            marker-category.service.ts
          reports/
            reports.controller.ts
            reports.service.ts
            needs-review.service.ts
          guides/
            guides.controller.ts
            guides.service.ts
            guides.repository.ts
          analytics/
            analytics.controller.ts
            analytics.service.ts
            analytics.repository.ts
            analytics.types.ts
        common/
        database/
        main.ts
      prisma/
        schema.prisma
        seed.ts

  docs/
    architecture.md
    api.md
    database.md
    local-development.md
    decisions.md

  ai-work-summary/
    work-summary.md

  docker-compose.yml
  package.json
  pnpm-workspace.yaml
  README.md
  .env.example
```

---

## 33. AI Work Summary Requirement

Create a separate folder:

```text
ai-work-summary/
```

Inside it, create:

```text
work-summary.md
```

The AI coding tool must update this file during or after implementation.

The file must be written in English.

The summary must include:

```markdown
# AI Work Summary

## Project Overview

Briefly describe what was built.

## Implemented Features

List completed features.

## File Structure Summary

Explain the main folders and their purpose.

## Backend Summary

Describe API modules, database models, seed data, and important business logic.

## Web App Summary

Describe implemented web features.

## Mobile App Summary

Describe implemented mobile features.

## Admin Panel Summary

Describe implemented admin features.

## Offline Support Summary

Describe offline cache, offline queue, sync behavior, and limitations.

## Localization Summary

Describe Czech and English localization implementation.

## Known Limitations

List what is not production-ready or not implemented in MVP.

## Environment Variables

List required environment variables.

## How to Run Locally

Provide commands for local setup.

## Next Recommended Steps

List practical next steps for v2.
```

This file must be committed as part of the generated project.

Important: Build the project incrementally. After each major implementation step, update `ai-work-summary/work-summary.md` with what was completed, what files were created or changed, and what remains unfinished.

---

## 34. Documentation Requirements

Create documentation files:

```text
docs/architecture.md
docs/api.md
docs/database.md
docs/local-development.md
docs/decisions.md
README.md
```

README must include:

- product description
- tech stack
- setup instructions
- environment variables
- how to run backend
- how to run web app
- how to run mobile app
- how to run admin panel
- how to seed database
- demo admin credentials
- known MVP limitations

---

## 35. Environment Variables

Create `.env.example`.

Include:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/blackout_resilience
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=blackout_resilience

GOOGLE_MAPS_API_KEY=replace-with-your-key
GOOGLE_GEOCODING_API_KEY=replace-with-your-key

ADMIN_DEMO_EMAIL=admin@praha-blackout.demo
ADMIN_DEMO_PASSWORD=change-me-demo-password
ADMIN_SESSION_SECRET=change-me-session-secret

API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
```

---

## 36. Docker Requirements

Create `docker-compose.yml` for PostgreSQL with PostGIS.

It should start:

- PostgreSQL
- PostGIS extension

The backend should be able to connect to it locally.

---

## 37. Quality Rules

Follow these implementation rules:

- Use TypeScript everywhere
- Keep shared types in `packages/shared`
- Do not duplicate business logic between web and mobile
- Do not hardcode API keys
- Do not hardcode admin password in source code
- Keep map provider abstracted
- Validate API input
- Use clear error handling
- Keep UI usable and clean
- Make the prototype runnable locally
- Seed realistic demo data for Prague
- Keep MVP scope focused
- Do not implement excluded features

---

## 38. Final Deliverables

The final generated project must include:

- Working web app
- Working Expo mobile app for Android/iOS
- Working backend API
- Working admin panel
- PostgreSQL/PostGIS database schema
- Prisma migrations or schema
- Seed data for Prague
- Czech and English localization
- Offline cache logic
- Offline queue logic
- Demo admin login
- Admin analytics
- Documentation
- `.env.example`
- `docker-compose.yml`
- `ai-work-summary/work-summary.md`

The project should be runnable locally by following the README.
