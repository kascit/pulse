# Pulse

An open-source uptime and cron monitoring platform. Pulse allows you to track HTTP endpoints, monitor background jobs, route alerts, and publish public status pages — all from a single dashboard.

## Tech Stack

**Workspace** — pnpm workspaces, concurrently  
**Frontend** — React 19, Vite, Tailwind CSS v4, shadcn/ui (Radix UI), TanStack Query, Zustand, React Router v7, React Hook Form + Zod, Recharts, Sonner, Lucide & Hugeicons  
**Backend** — Node.js, Express v5, Mongoose (MongoDB), Zod, node-cron, jose (JWT), bcryptjs, helmet  
**Database** — MongoDB Atlas  
**Deploy** — Vercel (Frontend), Render (Backend API & CRON)

## Features

- **Authentication:** Secure JWT-based login and registration.
- **Monitors (Active):** Ping HTTP endpoints on configurable schedules (1, 5, 15, 30, 60 mins). Tracks uptime and latency.
- **Heartbeats (Passive):** Monitor background jobs, backups, and cron tasks. Generates unique ping URLs with configurable grace periods.
- **Alerting & Routing:** Create alert rules based on resource status changes. Route notifications to Webhooks or Telegram.
- **Public Status Pages:** Create shareable, public-facing status pages. Attach specific monitors/heartbeats, customize slugs, and manually pause updates during maintenance.
- **Activity Logs:** Comprehensive audit log of all system events, resource creations, status changes, and alert dispatches.

## Project Structure

```text
pulse/
├── client/          # React + Vite Frontend
│   └── src/
│       ├── components/  # Reusable UI & Layout
│       ├── hooks/       # Custom React Query mutations
│       ├── lib/         # API client, event configs
│       ├── pages/       # Route components
│       ├── store/       # Zustand auth store
│       └── types/       # TypeScript interfaces
└── server/          # Express API Backend
    ├── controllers/ # Route handlers
    ├── jobs/        # CRON scheduler & stats aggregation
    ├── middleware/  # JWT Auth & Error handling
    ├── models/      # Mongoose schemas
    ├── routes/      # Express routers
    ├── services/    # Uptime checkers & alert dispatchers
    └── validation/  # Zod schemas
```

## Local Setup

**Prerequisites:** Node >= 18, pnpm, MongoDB

```bash
git clone https://github.com/kascit/pulse.git
cd pulse

# Install dependencies (root + both workspaces)
pnpm install

# Setup environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# Start both server and client concurrently
pnpm run dev
```

- Backend API: `http://localhost:5000`
- Frontend UI: `http://localhost:5173`

## Deployment

1. **MongoDB Atlas**: Deploy an M0 cluster.
2. **Render (Backend)**: Deploy the `server/` directory as a Web Service. Set `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL`.
3. **Vercel (Frontend)**: Deploy the `client/` directory. Set `VITE_API_URL` to your Render backend URL.

## License

MIT
