# Steady — personal consistency tracker

Steady is a personal workspace for daily habits, independent streaks, study progress, and measurable goals. Its central flow is intentionally small: open Today, check off what is done, optionally add a note, and move on.

> **Project status:** Foundation in progress. The repository currently contains the workspace shell, a minimal Today landing page, MongoDB connection handling, and initial persistence models. Product flows described as planned below are not implemented yet.

## Why this project

Consistency tools should make it easier to return to meaningful work. Steady is designed to make today's next action obvious while keeping long-term history, streaks, and goal pace available when useful.

## Planned features

- Configurable daily categories and schedules
- Fast daily check-ins with optional notes
- Timezone-aware streaks and a contribution-style history calendar
- Measurable, multi-component goals with dated progress logs and pace guidance
- Weekly review, achievements, data export, and responsive light/dark UI

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

The API will own validation, persistence, authorization, and business calculations. The web client will present API results and manage request state. The modular monolith keeps deployment and local development straightforward while preserving clear domain boundaries. The API now has a Mongo connection lifecycle and Mongoose schemas for users, categories, daily entries, goals, goal progress logs, and achievements. Feature routes and persistence workflows are not implemented yet.

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

Daily entries will be separate records keyed by user, category, and the user's local date. A completed scheduled day advances a category's streak; a missed scheduled day breaks it. Unscheduled days have no effect. Frequency-based schedules such as three times per week will be measured against a weekly target rather than treated as consecutive-day streaks. Rest days should be scheduled ahead of time so retroactive skips cannot rewrite streak history.

### Goal progress

Goals will track one or more measurable components. Each component contributes equally by default; optional weights must total 100%. Overall progress is derived from each component's capped completed-to-target ratio. The initial on-track comparison will use linear expected progress over the goal's date range, alongside required remaining units per day so the status is actionable.

### Timezone

Users will have an IANA timezone. Calendar dates and schedule boundaries will be derived in that timezone, while event timestamps remain timestamps. This avoids relying on the API server's local timezone for daily logic.

## Local development

Prerequisites: Node.js 20 or newer and npm 10 or newer.

```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run dev
```

The web shell runs at `http://localhost:5173`; the API health endpoint is at `http://localhost:4000/api/health`. The API connects to the configured MongoDB URI before it begins listening and disconnects during graceful shutdown. A local MongoDB instance or hosted MongoDB URI is required to start the API.

## Environment variables

The API example file is [`apps/api/.env.example`](apps/api/.env.example). It documents the intended local API configuration. Secrets in real `.env` files are excluded from version control.

## Verification

Foundation checks are workspace TypeScript checks and production builds. Domain and API tests will be introduced alongside their implementation steps. In the current environment, dependency installation did not complete, so those commands have not yet been verified successfully.

## Screenshots

Screenshots will be added after the interactive dashboard and core product flows are implemented.

## Future improvements

- Category management and scheduling workflows
- Authentication and database-backed API workflows
- Daily check-in, history, and tested streak calculations
- Goal progress, reviews, achievements, and export
- Deployment guides for separately hosted web and API apps
