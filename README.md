# Pulse

API uptime and latency monitor. Register HTTP endpoints, ping them on a schedule, view uptime and latency trends on a dashboard.

## Stack

**Frontend** — React (Vite), Tailwind CSS, shadcn/ui, TanStack Query, Recharts, react-router-dom  
**Backend** — Node.js, Express, Mongoose, Zod, node-cron, axios  
**Database** — MongoDB Atlas (M0 free tier)  
**Deploy** — Vercel (frontend), Render (backend)

## Features

- Add, edit, delete monitored endpoints
- Configurable check interval per monitor (1 / 5 / 15 / 60 min)
- Pause and resume monitors without losing history
- Latency time-series chart and uptime percentage per monitor
- Ping logs auto-expire after 7 days (MongoDB TTL index)
- Request validation via Zod

## Project Structure

```
pulse/
├── client/          # React + Vite
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── lib/
└── server/          # Express API
    ├── models/
    ├── routes/
    ├── controllers/
    ├── services/
    └── jobs/
```

## Database Schema

**monitors**

| Field | Type | Notes |
|-------|------|-------|
| name | String | required |
| url | String | required |
| method | String | GET \| POST, default GET |
| intervalMinutes | Number | default 5 |
| isActive | Boolean | default true |
| createdAt / updatedAt | Date | auto |

**pings**

| Field | Type | Notes |
|-------|------|-------|
| monitorId | ObjectId | ref Monitor, indexed |
| statusCode | Number | 0 on timeout |
| latencyMs | Number | |
| isUp | Boolean | true if 2xx |
| timestamp | Date | TTL 7 days |

## API

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/monitors | Create monitor |
| GET | /api/monitors | List all monitors |
| PUT | /api/monitors/:id | Edit or pause/resume |
| DELETE | /api/monitors/:id | Delete monitor and pings |
| GET | /api/monitors/:id/stats | Uptime %, avg latency, recent pings |

## Local Setup

**Prerequisites:** Node >= 18, MongoDB Atlas M0 cluster

```bash
git clone https://github.com/<you>/pulse.git
cd pulse

# backend
cd server && npm install
cp .env.example .env   # add MONGO_URI and PORT
npm run dev

# frontend (new terminal)
cd client && npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5000/api
npm run dev
```

## Deployment

1. **MongoDB Atlas** — create M0 cluster, whitelist `0.0.0.0/0`
2. **Render** — new Web Service from `server/`, set `MONGO_URI` env var
3. **Vercel** — import `client/`, set `VITE_API_URL` to Render URL

Both auto-deploy on push to `main`.

Note: Render free tier cold-starts after 15 min of inactivity. First ping after wake may be delayed ~50s.

## Roadmap

- [ ] Alerting (email / webhook on status change)
- [ ] Auth and multi-tenant workspaces
- [ ] Public status page

## License

MIT
