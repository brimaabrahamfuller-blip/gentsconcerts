# GentsConcerts — Frontend

Liberia's number one event hosting and ticketing platform — frontend.

Status: WIP · JavaScript (React Native / Expo)

---

## Table of contents

- [About](#about)
- [Demo](#demo)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Install](#install)
  - [Environment variables](#environment-variables)
  - [Running locally](#running-locally)
  - [Building for production](#building-for-production)
- [API contract](#api-contract)
- [Folder structure](#folder-structure)
- [Testing & linting](#testing--linting)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License & attribution](#license--attribution)
- [Contact](#contact)

---

## About

GentsConcerts is the frontend application for Liberia's event hosting and ticketing group. It provides event discovery, ticket purchasing, user accounts, and organizer dashboards. This repo contains the client-side application (built with Expo/React Native, exported to web) that communicates with the [GentsConcerts backend API](#) (Node.js/Express + MongoDB, deployed on Render).

---

## Demo

- Live site: https://gentsconcerts.netlify.app
- Backend API: https://gentsconcerts-backend.onrender.com
- Screenshots: (add screenshots in `/assets` or link to them)

---

## Features

- View upcoming events by category and location
- Event details with flyer images, description, dates, and venue info
- User authentication (sign up / login / profile), with role-based dashboards
- Organizer ("host") dashboard: create and manage events, view attendees
- Search, filters, and sorting for event discovery
- Responsive UI for desktop, mobile web, and native (iOS/Android via Expo)

> Some features above are in active development — see [Known issues](#known-issues) below.

---

## Tech stack

- **Framework:** React Native via [Expo](https://expo.dev), exported to web with `expo export --platform web`
- **Language:** JavaScript
- **App code location:** `gentsconcerts-app/` (see [Folder structure](#folder-structure))
- **Backend:** Node.js / Express, MongoDB — separate repo/service, deployed on [Render](https://render.com)
- **Email:** [Resend](https://resend.com)
- **Frontend hosting:** [Netlify](https://netlify.com)
- **State management:** (Context API / other — update to match actual implementation)
- **Styling:** React Native StyleSheet (adjust if using NativeWind/Tailwind or other)

---

## Getting started

### Prerequisites

- Node.js >= 18
- npm >= 8
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli` or use `npx expo`)
- Access to the backend API (development/staging/production URL)

### Install

Clone the repository and install dependencies inside the app folder:

```bash
git clone https://github.com/brimaabrahamfuller-blip/gentsconcerts.git
cd gentsconcerts/gentsconcerts-app
npm install
```

### Environment variables

Create a `.env` file inside `gentsconcerts-app/` with the following (adjust names to match what the code actually reads):

```
API_BASE_URL=https://gentsconcerts-backend.onrender.com
```

> Double-check variable names against `app.config.js` / `app.json` and any `process.env` references in the code — Expo web builds require env vars to be exposed correctly at build time.

### Running locally

```bash
cd gentsconcerts-app
npx expo start
```

- Press `w` to open in a web browser
- Press `a` / `i` to open in an Android/iOS simulator (if configured)

### Building for production

The site is currently built and deployed via Netlify using:

```bash
npm install && npx expo export --platform web
```

- **Base directory:** `gentsconcerts-app`
- **Publish directory:** `gentsconcerts-app/dist`

(as configured in `netlify.toml`)

To build locally and inspect the output before pushing:

```bash
cd gentsconcerts-app
npm install
npx expo export --platform web
```

---

## API contract

The frontend talks to the GentsConcerts backend at `API_BASE_URL`. Key endpoints in use include:

- `GET /api/events` — list events
- `GET /api/events/host/my-events` — events for the logged-in organizer
- `POST /api/auth/register` — sign up
- `POST /api/auth/login` — log in
- `GET /health` — backend health check

> Keep this section in sync with the backend repo's actual routes as they evolve.

---

## Folder structure

```
gentsconcerts/
├── gentsconcerts-app/       # Expo/React Native app (this is what gets built & deployed)
│   ├── screens/             # App screens (e.g. OwnerDashboardScreen.js, LoginScreen.js, TicketsScreen.js)
│   ├── components/          # Shared/reusable UI components
│   ├── assets/              # Images, fonts, logo, etc.
│   ├── app.json / app.config.js
│   └── package.json
├── netlify.toml             # Netlify build config (base/publish dirs, build command)
└── README.md
```

> Update this tree as the app grows — this reflects the structure referenced in build configs and recent fixes.

---

## Testing & linting

(Add test/lint commands here once configured, e.g.)

```bash
npm run lint
npm test
```

---

## Deployment

- **Frontend:** Auto-deploys to [Netlify](https://netlify.com) on push to `main`. Build command and publish directory are defined in `netlify.toml` (see [Building for production](#building-for-production)).
- **Backend:** Deploys separately on [Render](https://render.com) from the backend repo/service. Make sure backend `package.json` and lockfile are kept in sync with actual dependencies used in code (missing packages like `resend` or `expo-sharing` have previously caused deploy crashes/build failures).

---

## Known issues

- Some dashboard buttons (including logout) are currently non-functional.
- Header logo is a placeholder SVG pending a real logo asset.
- Home screen hero banner is planned to become a side-sliding sponsored-events carousel.

---

## Contributing

1. Fork the repo and create a feature branch
2. Make your changes inside `gentsconcerts-app/`
3. Test locally with `npx expo start`
4. Open a pull request against `main` with a clear description of the change

---

## License & attribution

("All rights reserved" product of NextGentsTechFirmInc.)

---

## Contact

For questions about this project, reach out to the GentsConcerts team via [add contact email or link].
