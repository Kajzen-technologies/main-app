# Database Specifications - Prague Blackout Resilience App

The database uses **PostgreSQL** with the **PostGIS** extension for geospatial query support.

## Data Dictionary

### 1. `User` Table
Identifies both anonymous residents (for reporting trails) and administrative operators.
- `id`: Primary Key (UUID)
- `type`: ENUM (`ANONYMOUS`, `ADMIN`)
- `email`: String (nullable, unique)
- `name`: String (nullable)
- `role`: ENUM (`USER`, `ADMIN`, `GOVERNMENT_VIEWER`)
- `localUserId`: String (unique identifier stored on device)
- `preferredLanguage`: String (`cs` | `en`)
- `createdAt` / `updatedAt`: Timestamps

### 2. `Marker` Table
Stores geographical places in Prague with utility availability and verification tags.
- `id`: Primary Key (UUID)
- `title`: String
- `description`: Text (nullable)
- `category`: String (Category Enum string)
- `latitude` / `longitude`: Double Precision floats
- `address`: String (nullable)
- `publicStatus`: ENUM (`OPEN`, `CLOSED`, `UNKNOWN`)
- `verificationStatus`: ENUM (`PENDING`, `APPROVED`, `REJECTED`, `NEEDS_REVIEW`)
- `hasElectricity` / `hasWater` / `hasInternet`: Boolean (nullable)
- `crowdLevel`: ENUM (`LOW`, `MEDIUM`, `HIGH`, `UNKNOWN`)
- `submittedByLocalUserId`: String (nullable)
- `approvedByAdminId`: String (nullable)
- `lastVerifiedAt`: Timestamp

### 3. `MarkerReport` Table
Saves status updates reported by residents.
- `id`: Primary Key (UUID)
- `markerId`: Foreign Key -> `Marker.id` (onCascade Delete)
- `localUserId`: String (reporter identifier)
- `reportedStatus`: ENUM (`OPEN`, `CLOSED`, `UNKNOWN`)
- `hasElectricity` / `hasWater` / `hasInternet`: Boolean (nullable)
- `crowdLevel`: ENUM (`LOW`, `MEDIUM`, `HIGH`, `UNKNOWN`)
- `issueType`: ENUM (`CLOSED`, `NO_ELECTRICITY`, `NO_WATER`, `NO_INTERNET`, `TOO_CROWDED`, `WRONG_LOCATION`, `OUTDATED_INFO`, `OTHER`)
- `comment`: Text (nullable)

### 4. `Guide` Table
Emergency guides catalog.
- `id`: Primary Key (UUID)
- `slug`: String (unique)
- `category`: String
- `priority`: Integer
- `isPublished`: Boolean

### 5. `GuideTranslation` Table
Translations index (Czech and English) for guides.
- `id`: Primary Key (UUID)
- `guideId`: Foreign Key -> `Guide.id` (onCascade Delete)
- `language`: String (`cs` | `en`)
- `title`: String
- `shortDescription`: String
- `content`: Text

### 6. `GuideChecklistItem` Table
Pre-prepared checklist items for emergency guides.
- `id`: Primary Key (UUID)
- `guideId`: Foreign Key -> `Guide.id` (onCascade Delete)
- `order`: Integer
- `textCs` / `textEn`: String

### 7. `AdminSession` Table
Stores coordinator session tokens.
- `id`: Primary Key (UUID)
- `email`: String
- `role`: String
- `createdAt` / `expiresAt`: Timestamps
