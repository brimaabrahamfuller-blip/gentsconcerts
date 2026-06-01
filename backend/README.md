# GentsConcerts Backend

This is the production-ready backend for the GentsConcerts platform.

## Setup Instructions

### 1. MongoDB Atlas Setup
- Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- Create a new cluster and a database named `gentsconcerts`.
- Go to "Database Access" and create a user with read/write privileges.
- Go to "Network Access" and allow access from anywhere (0.0.0.0/0) for testing.
- Get your connection string and replace it in the `.env` file.

### 2. MTN MoMo Sandbox Setup
- Register at the [MTN MoMo Developer Portal](https://momodeveloper.mtn.com/).
- Subscribe to the "Collections" product.
- Use the `services/mtnMomo.js` methods to generate your `API_USER` and `API_KEY` in the sandbox environment.
- Add your `SUBSCRIPTION_KEY`, `API_USER`, and `API_KEY` to the `.env` file.

### 3. Deployment to Render.com
- Create a free account at [Render.com](https://render.com).
- Connect your GitHub repository.
- Render will automatically detect the `render.yaml` file.
- Add your environment variables in the Render dashboard.

## API Documentation
- Auth: `/api/auth`
- Users: `/api/users`
- Events: `/api/events`
- Tickets: `/api/tickets`
- Payments: `/api/payments`
- Admin: `/api/admin`
