# Steady — personal consistency tracker

Steady is a personal workspace for daily habits, independent streaks, study progress, and measurable goals. Its central flow is intentionally small: open Today, check off what is done, optionally add a note, and move on.

> **Project status:** Early MVP foundation. Authentication, category/entry/goal API slices, isolated calculation functions, and a responsive client prototype are present. The client still uses local demo state for most views and is not yet connected to the API. Several requested flows remain incomplete; see [Current limitations](#current-limitations).

## Why this project

Consistency tools should make it easier to return to meaningful work. Steady is designed to make today's next action obvious while keeping long-term history, streaks, and goal pace available when useful.

## Implemented so far

- Monorepo workspace with React/Vite and Express/TypeScript apps
- MongoDB connection lifecycle and initial Mongoose models/indexes
- Registration, login, refresh, logout, and current-user endpoints using HTTP-only cookies
- Per-user category CRUD with archive action and schedule shape validation
- Dated daily entry upsert and history-range query API
- Goal creation and additive progress-log API with metric targets and optional weights
- Standalone schedule/streak and goal progress/pace calculations with focused unit tests
- Responsive client prototype with Today check-in and notes stored in browser local storage
- Overview, history, goals, achievements, and settings prototype routes

## Planned features

- Frontend-to-API authentication and persisted daily check-in flow
- Fully accurate, timezone-aware streak/stat aggregation from persisted records
- Goal status/required pace display from backend calculations
- Real calendar inspection, weekly review, achievement evaluation, and export
- Complete dark theme, category editor, goal forms, and mobile polish

## Tech stack

- **Web:** React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query
- **API:** Node.js, TypeScript, Express, Zod
- **Data:** MongoDB and Mongoose
- **Validation:** shared Zod schemas and types where appropriate

## Architecture

The planned application is a modular monorepo:

```text
apps/
  api/       Express API and domain services
  web/       React client
packages/
  shared/    Cross-app schemas and types
```

The API owns validation, persistence, authorization, and business calculations. The modular monolith keeps deployment and local development straightforward while preserving clear domain boundaries. The API currently exposes auth, category, entry, and goal route groups. Several aggregate/statistics and achievement endpoints still need implementation.

## Data model

The initial models are separate MongoDB documents rather than unbounded history arrays:

- **User:** normalized unique email, password hash excluded from normal queries, display name, IANA timezone, and appearance preference.
- **Category:** user-owned name, icon/accent, schedule configuration, ordering, and archive timestamp.
- **DailyEntry:** user/category, local `YYYY-MM-DD` date, completion state, optional note, and timezone snapshot.
- **Goal:** category, local start/target dates, measurable metric definitions, optional milestones, and lifecycle state.
- **GoalProgressLog:** dated metric deltas, retained as an append-only history record.
- **Achievement:** user, stable achievement key, unlock timestamp, and optional context.

Indexes include unique normalized user email, case-insensitive unique category name per user, unique daily entry per user/category/local date, and unique achievement key per user. Query indexes support user-scoped date and status lookups. Production auto-index creation is disabled; deployment will need an explicit index creation/migration process before serving traffic.

## Planned engineering rules

### Daily records and streaks

Daily entries are separate records keyed by user, category, and the user's local date. A completed scheduled day advances a category's streak; a missed scheduled day breaks it. Unscheduled days have no effect. Frequency-based schedules such as three times per week use a separate completed-week run calculation. A skipped day currently behaves as a non-completion in the calculation service. Entry creation/edit APIs do not yet enforce schedule-derived missed/not-scheduled status, and rest-day policy is not implemented.

### Goal progress

Goals track one or more measurable components in the persistence model. Each component contributes equally by default; optional weights must total 100%. Overall progress is derived from each component's capped completed-to-target ratio. The calculation service compares progress with linear expected progress over the goal's date range and estimates the remaining units per day. The API currently exposes progress percentages and completion, but does not yet expose the complete pace/status response on every goal query.

### Timezone

Users have a timezone field, registration validates it as an IANA timezone, and entries retain a local date and timezone snapshot. The frontend formats dates locally. Server-side date derivation at midnight, schedule boundaries, and all historical timezone migration cases still need dedicated implementation and tests.

## Authentication and security

Passwords are hashed with bcryptjs. Access tokens expire after 15 minutes and refresh tokens after 30 days; both are HTTP-only cookies, with secure cookies in production and `SameSite=Lax`. Refresh tokens are stored as hashes and rotated on refresh. Authentication routes use an IP-based rate limit. Helmet, JSON size limits, and credentialed CORS are configured. Production secrets must be supplied through environment variables. CSRF protections beyond SameSite cookie behavior, account recovery, email verification, and session management across multiple devices are not implemented.

## API routes

- `POST /api/auth/register`, `/login`, `/refresh`, `/logout`; `GET /api/auth/me`
- `GET/POST/PATCH/DELETE /api/categories`
- `GET/PUT /api/entries` (PUT upserts a user/category/local-date entry)
- `GET/POST /api/goals`; `POST /api/goals/:id/progress`
- `GET /api/health`

API handlers validate client input with Zod and scope records by authenticated user. Calculated values are derived from progress logs instead of treating a mutable total as the only history.

## Current limitations

- Frontend screens are prototypes: most data is static or stored in local storage and is not synchronized with MongoDB.
- History heatmap values are illustrative placeholders, not API-derived history.
- Goal cards and achievement states are illustrative; goal creation/edit forms, pace API integration, and achievement unlocking are incomplete.
- There is no seed command, daily journal persistence, data export/import, weekly review, search, or fully developed personal records.
- Integration tests, authentication tests, database-backed concurrency tests, and broad timezone boundary tests remain to be added.
- No production deployment configuration or deployment walkthrough has been verified.

## Local development

Prerequisites: Node.js 20 or newer and npm 10 or newer.

```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run dev
```

The web app runs at `http://localhost:5173`; the API health endpoint is at `http://localhost:4000/api/health`. The API connects to the configured MongoDB URI before it begins listening and disconnects during graceful shutdown. A local MongoDB instance or hosted MongoDB URI is required to start the API.

## Environment variables

The API example file is [`apps/api/.env.example`](apps/api/.env.example). It documents the intended local API configuration. Secrets in real `.env` files are excluded from version control.

## Verification

Run `npm test`, `npm run typecheck`, and `npm run build`. Current automated coverage is focused on seven streak and goal calculation cases; API and database integration coverage is still needed.

## Screenshots

Screenshots will be added after the interactive dashboard and core product flows are implemented.

## Future improvements

- Category management and scheduling workflows
- Authentication and database-backed API workflows
- Daily check-in, history, and tested streak calculations
- Goal progress, reviews, achievements, and export
- Deployment guides for separately hosted web and API apps
