# RideConnect — Node.js Backend

Production-ready Express.js backend — a complete 1-to-1 conversion of the Spring Boot backend.

## Tech Stack
| Spring Boot (Original) | Node.js (This) |
|---|---|
| Spring Security + JWT | `jsonwebtoken` + custom middleware |
| JPA / Hibernate | Sequelize ORM |
| PostgreSQL | PostgreSQL (same schema) |
| WebSocket / STOMP | Socket.IO |
| `CommandLineRunner` seeder | `config/seeder.js` |
| `@PreAuthorize("hasRole('ADMIN')")` | `requireAdmin` middleware |
| Razorpay Java SDK | Razorpay Node SDK |
| iText PDF | PDFKit |
| ClickHouse Audit | Winston + in-memory audit logs |

---

## Project Structure
```
backend-node/
├── Dockerfile               # Multi-stage production image
├── docker-compose.yml       # Full stack: API + PostgreSQL + Nginx
├── docker-compose.dev.yml   # Dev override: hot-reload, exposed DB port
├── nginx/nginx.conf         # Reverse proxy + rate limiting + WebSocket upgrade
├── pm2.config.js            # PM2 cluster-mode config
├── .env.example             # Safe env template (copy → .env)
└── src/
    ├── server.js            # Entry point: env validation, graceful shutdown
    ├── app.js               # Express: Helmet, CORS, rate-limit, compression, Morgan
    ├── config/
    │   ├── database.js      # Sequelize connection
    │   ├── jwtService.js    # JWT sign / verify
    │   ├── logger.js        # Winston (console dev / JSON+rotating files prod)
    │   ├── socket.js        # Socket.IO (chat + location tracking)
    │   ├── validateEnv.js   # Joi env schema — refuses to boot if invalid
    │   └── seeder.js        # DB seed (100+ users, rides, trips)
    ├── middleware/
    │   └── authMiddleware.js # authenticate + requireAdmin
    ├── models/index.js       # All Sequelize models + associations
    ├── routes/              # One file per Spring Boot controller
    └── services/            # One file per Spring Boot service
```

---

## Quick Start (Local Dev)

### Prerequisites
- Node.js ≥ 18
- PostgreSQL running on `localhost:5432`

```bash
cd backend-node
cp .env.example .env          # fill in your values
npm install
npm run dev                   # http://localhost:8081
```

---

## Deploy with Docker (Recommended)

### 1. Fill environment variables
```bash
cp .env.example .env
# Edit .env — set DB_PASSWORD, JWT_SECRET, RAZORPAY_* etc.
```

### 2. Build & start (production)
```bash
docker compose up -d --build
```

### 3. Local dev with Docker (hot-reload)
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 4. Check health
```bash
curl http://localhost/health
# {"status":"UP","service":"carpooling-platform-node",...}
```

### 5. View logs
```bash
docker compose logs -f api
```

---

## Deploy with PM2 (VPS without Docker)

```bash
npm install -g pm2
cp .env.example .env          # fill values
npm install --omit=dev

# Start in cluster mode (all CPU cores)
pm2 start pm2.config.js --env production

# Auto-restart on reboot
pm2 save && pm2 startup

# Zero-downtime reload after code update
pm2 reload pm2.config.js
```

---

## Security in Production

| Feature | Implementation |
|---|---|
| Security headers | `helmet` |
| CORS lockdown | whitelist via `CORS_ORIGIN` env var |
| Rate limiting | Express (`express-rate-limit`) + Nginx (`limit_req`) |
| Auth brute force protection | Tighter rate limit on `/api/auth/*` |
| Request size limit | 1 MB max body |
| Non-root container user | `appuser` in Dockerfile |
| Signal forwarding | `tini` PID-1 in Docker |
| Graceful shutdown | `http-graceful-shutdown` on SIGINT/SIGTERM |
| Env validation | `joi` schema — server refuses to start if misconfigured |
| Unhandled rejections | Caught globally, process exits so PM2/Docker restarts cleanly |
| Production error leakage | Stack traces hidden in production responses |

---

## API Endpoints (identical to Spring Boot)

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/forgot-password` | Public |
| POST | `/api/auth/reset-password` | Public |
| GET | `/api/rides/search` | Bearer |
| POST | `/api/rides` | Bearer |
| GET | `/api/rides/me` | Bearer |
| POST | `/api/trips` | Bearer |
| GET | `/api/trips/me` | Bearer |
| POST | `/api/trips/:id/accept` | Bearer (driver) |
| POST | `/api/trips/:id/verify-otp` | Bearer (driver) |
| GET | `/api/payments/wallet` | Bearer |
| POST | `/api/payments/wallet/recharge` | Bearer |
| POST | `/api/payments/create-order` | Bearer |
| POST | `/api/payments/verify-razorpay` | Bearer |
| GET | `/api/admin/dashboard/stats` | Bearer + ADMIN |
| GET | `/api/admin/users` | Bearer + ADMIN |
| GET | `/api/analytics/dashboard` | Bearer |
| GET | `/health` | Public |

## WebSocket (Socket.IO)
Connect to `ws://<host>/ws`

| Event (emit) | Payload | Description |
|---|---|---|
| `join-trip` | `tripId` | Join a trip chat room |
| `send-message` | `{ tripId, message }` | Send a chat message |
| `location-update` | `{ tripId, latitude, longitude }` | Live driver location |

| Event (listen) | Description |
|---|---|
| `receive-message` | New chat message broadcast |
| `location-updated` | Driver location update |

## Default Seeded Users
| Email | Password | Role |
|---|---|---|
| admin@acme.com | password123 | ADMIN |
| alice@acme.com | password123 | EMPLOYEE + vehicle |
| bob@acme.com | password123 | EMPLOYEE |
