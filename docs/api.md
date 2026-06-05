# API Specifications - Prague Blackout Resilience App

All request bodies and responses are encoded in JSON. The backend server listens on port **`3001`**.

## Public Endpoints

### 1. Health Check
* **Path**: `GET /health`
* **Response**: `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-06-05T12:00:00.000Z"
}
```

### 2. Get Approved Places
* **Path**: `GET /markers`
* **Query Parameters**:
  - `category` (optional): Filter by category enum string (e.g. `HOSPITAL`)
  - `status` (optional): Filter by publicStatus (e.g. `OPEN`)
* **Response**: `200 OK`
```json
[
  {
    "id": "e305e7e0-47b2-4d2d-8fcf-3fa2f78ea2ca",
    "title": "Všeobecná fakultní nemocnice v Praze",
    "description": "Hlavní krizový lékařský bod.",
    "category": "HOSPITAL",
    "latitude": 50.0735,
    "longitude": 14.4211,
    "address": "U Nemocnice 499/2, Praha 2",
    "publicStatus": "OPEN",
    "verificationStatus": "APPROVED",
    "hasElectricity": true,
    "hasWater": true,
    "hasInternet": false,
    "crowdLevel": "MEDIUM",
    "lastVerifiedAt": "2026-06-05T12:00:00.000Z"
  }
]
```

### 3. Suggest Place
* **Path**: `POST /markers`
* **Request Body**:
```json
{
  "title": "Nouzová studna park Mírák",
  "category": "EMERGENCY_SUPPORT_POINT",
  "latitude": 50.0751,
  "longitude": 14.4365,
  "address": "Náměstí Míru, Praha 2",
  "description": "Ruční pumpa funkční i bez proudu.",
  "submittedByLocalUserId": "local_user_8f3a2c91"
}
```
* **Response**: `201 Created`
```json
{
  "message": "Děkujeme. Místo bylo odesláno ke kontrole.",
  "messageEn": "Thank you. The place has been submitted for review.",
  "marker": { "id": "uuid-here", "verificationStatus": "PENDING" }
}
```

### 4. Submit Status Report
* **Path**: `POST /markers/:id/reports`
* **Request Body**:
```json
{
  "reportedStatus": "CLOSED",
  "hasElectricity": false,
  "hasWater": true,
  "hasInternet": false,
  "crowdLevel": "UNKNOWN",
  "issueType": "CLOSED",
  "comment": "Lékárna je dočasně uzamčena.",
  "localUserId": "local_user_8f3a2c91"
}
```
* **Response**: `201 Created`
```json
{
  "message": "Děkujeme. Hlášení bylo odesláno.",
  "messageEn": "Thank you. Your report has been submitted.",
  "report": { "id": "uuid", "markerId": "marker-uuid" },
  "flagged": true
}
```

### 5. Get Guides list
* **Path**: `GET /guides`
* **Response**: `200 OK` (returns only published guides with active translations and checklist items).

---

## Admin Authentication

### 1. Login
* **Path**: `POST /admin/auth/login`
* **Request Body**:
```json
{
  "email": "admin@praha-blackout.demo",
  "password": "change-me-demo-password"
}
```
* **Response**: `200 OK` (Sets `httpOnly` cookie `admin_session`).

---

## Admin Moderation

All admin endpoints require authentication via cookie `admin_session` or header `x-admin-session-id`.

* `GET /admin/markers/pending`: Get pending place suggestions.
* `PATCH /admin/markers/:id/approve`: Approve place.
* `PATCH /admin/markers/:id/reject`: Reject place.
* `PATCH /admin/markers/:id/dismiss-reports`: Dismiss reports.
* `PATCH /admin/markers/:id`: Edit place parameters.
* `DELETE /admin/markers/:id`: Delete place.

---

## Admin Analytics

* `GET /admin/analytics/overview`: High-level counts.
* `GET /admin/analytics/reports-by-issue-type`: Counts of issues.
* `GET /admin/analytics/reports-by-category`: Reports grouped by category.
* `GET /admin/analytics/markers-needing-review`: Flagged places needing review.
* `GET /admin/analytics/problem-areas`: Coordinates with report counts.
