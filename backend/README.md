# GentsConcerts — Backend

This is the production-ready backend for the GentsConcerts platform — Liberia's number one event hosting and ticketing platform.

Status: WIP · Node.js / Express · MongoDB

Live API: https://gentsconcerts-backend.onrender.com
Frontend: https://gentsconcerts.netlify.app

---

## Table of contents

- [About](#about)
- [Tech stack](#tech-stack)
- [Setup instructions](#setup-instructions)
  - [1. MongoDB Atlas setup](#1-mongodb-atlas-setup)
  - [2. MTN MoMo sandbox setup](#2-mtn-momo-sandbox-setup)
  - [3. Email (Resend) setup](#3-email-resend-setup)
  - [4. Deployment to Render.com](#4-deployment-to-rendercom)
- [Environment variables](#environment-variables)
- [Running locally](#running-locally)
- [API documentation](#api-documentation)
- [Folder structure](#folder-structure)
- [Known issues](#known-issues)
- [Contributing](#contributing)
- [Contact](#contact)

---

## About

This service powers the GentsConcerts platform: user authentication, event management, ticketing, and payments (via MTN MoMo). It's consumed by the [GentsConcerts frontend](https://github.com/brimaabrahamfuller-blip/gentsconcerts) (Expo/React Native app, deployed on Netlify).

---

## Tech stack

- **Runtime:** Node.js (v24+ in production on Render)
- **Framework:** Express
- **Database:** MongoDB (via MongoDB Atlas)
- **Payments:** MTN MoMo (Collections API, sandbox/production)
- **Email:** [Resend](https://resend.com)
- **Hosting:** [Render.com](https://render.com), configured via `render.yaml`

---

## Setup instructions

### 1. MongoDB Atlas setup

- Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- Create a new cluster and a database named `gentsconcerts`.
- Go to "Database Access" and create a user with read/write privileges.
- Go to "Network Access" and allow access from anywhere (0.0.0.0/0) for testing.
- Get your connection string and set it as `MONGODB_URI` in your `.env` file.

### 2. MTN MoMo sandbox setup

- Register at the [MTN MoMo Developer Portal](https://momodeveloper.mtn.com/).
- Subscribe to the "Collections" product.
- Use the `services/mtnMomo.js` methods to generate your `API_USER` and `API_KEY` in the sandbox environment.
- Add your `SUBSCRIPTION_KEY`, `API_USER`, and `API_KEY` to the `.env` file.

### 3. Email (Resend) setup

- Create an account at [Resend](https://resend.com) and generate an API key.
- Add `RESEND_API_KEY` to your `.env` file.
- Email sending logic lives in `services/emailService.js`.
- **Important:** `resend` must be listed as a real dependency in `package.json` (and committed lockfile) — a missing entry here has previously caused production crashes on startup (`Error: Cannot find module 'resend'`). Run `npm install resend` from the `backend/` folder rather than editing `package.json` by hand.

### 4. Deployment to Render.com

- Create a free account at [Render.com](https://render.com).
- Connect your GitHub repository.
- Render will automatically detect the `render.yaml` file.
- Add your environment variables in the Render dashboard (see [Environment variables](#environment-variables)).
- Before pushing, run a clean `npm install` locally to confirm all `require`d/`import`ed packages are actually present in `package.json` and the lockfile — this has been the cause of prior deploy failures.

---

## Environment variables

Set these in your `.env` file locally, and in the Render dashboard for deployed environments:

```
PORT=10000
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-jwt-secret

SUBSCRIPTION_KEY=your-mtn-momo-subscription-key
API_USER=your-mtn-momo-api-user
API_KEY=your-mtn-momo-api-key

RESEND_API_KEY=your-resend-api-key
```

> Confirm exact variable names against `server.js` and the relevant service files — update this list if it drifts from the code.

---

## Running locally

```bash
cd backend
npm install
node server.js
```

On successful startup you should see:

```
Server running in production mode on port 10000
MongoDB Connected...
```

---

## API documentation

- **Auth:** `/api/auth` — register, login
- **Users:** `/api/users`
- **Events:** `/api/events` — includes `/api/events/host/my-events` for organizer-specific listings
- **Tickets:** `/api/tickets`
- **Payments:** `/api/payments` — MTN MoMo integration
- **Admin:** `/api/admin`
- **Health check:** `/health`

> Expand each section with request/response examples as the API stabilizes.

---

## Folder structure

```
backend/
├── controllers/       # Route handlers (authController.js, etc.)
├── routes/             # Express route definitions (auth.js, events.js, etc.)
├── services/           # External integrations (emailService.js, mtnMomo.js)
├── models/              # Mongoose models
├── server.js            # App entry point
├── render.yaml           # Render deployment config
└── package.json
```

> Update this tree if the actual structure differs.

---

## Known issues

- Missing dependencies (e.g. `resend`) not committed to `package.json`/lockfile have caused startup crashes in production — always verify a clean install before deploying.

---

## Contributing

1. Fork the repo and create a feature branch.
2. Make your changes inside `backend/`.
3. Run the server locally and confirm clean startup (no crash, MongoDB connects).
4. Open a pull request against `main` with a clear description of the change.

---

## Contact

For questions about this project, reach out to the GentsConcerts team via gentsconcerts@gmail.com.
