# 🚀 HUSTL - Micro-Gig Marketplace Platform

**HUSTL** is a location-based micro-gig marketplace connecting students with local businesses for short-term shifts. Built with a modern monorepo architecture using pnpm workspaces and Turborepo.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Mobile App     │────▶│  Backend API     │────▶│  PostgreSQL     │
│  (Expo/RN)      │     │  (Express)       │     │  + PostGIS      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         │
         │                       ▼                         │
         │              ┌──────────────────┐              │
         │              │  Redis Cache     │              │
         │              │  + BullMQ        │              │
         │              └──────────────────┘              │
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Admin Panel    │     │  Socket.io       │     │  Cloudinary     │
│  (Next.js)      │     │  (Realtime)      │     │  (Media)        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 20+ with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL 15+ with PostGIS extension
- **Cache:** Redis 7+ with BullMQ for job queues
- **ORM:** Prisma
- **Realtime:** Socket.io with Redis adapter
- **Auth:** JWT + Twilio Verify (OTP)
- **Payments:** Razorpay
- **Storage:** Cloudinary
- **Push:** Firebase Cloud Messaging

### Mobile
- **Framework:** Expo SDK 52 + React Native 0.76
- **Router:** Expo Router v4
- **Animations:** React Native Reanimated 3
- **Gestures:** React Native Gesture Handler
- **State:** Zustand
- **Validation:** Zod

### Admin
- **Framework:** Next.js 15 (App Router)
- **Auth:** NextAuth.js
- **UI:** Tailwind CSS + shadcn/ui
- **Styling:** Tailwind CSS v4

### Shared
- **Monorepo:** pnpm workspaces + Turborepo
- **Validation:** Zod schemas (shared)
- **Types:** TypeScript strict mode

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **pnpm** 9+ (`npm install -g pnpm`)
- **PostgreSQL** 15+ with PostGIS ([Download](https://www.postgresql.org/download/))
- **Redis** 7+ ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/downloads))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/hustl.git
   cd hustl
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create database
   createdb hustl
   
   # Run migrations
   pnpm prisma:migrate
   
   # Seed data
   pnpm seed
   ```

5. **Start development servers**
   ```bash
   # Start all services
   pnpm dev
   
   # Or start individually
   pnpm dev:backend   # Backend API on :4000
   pnpm dev:mobile    # Mobile app on :8081
   ```

## 📁 Project Structure

```
hustl/
├── apps/
│   ├── backend/          # Express API server
│   │   ├── src/
│   │   │   ├── config/   # Environment & clients
│   │   │   ├── middleware/ # Auth, validation, rate limiting
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── services/ # Business logic
│   │   │   ├── realtime/ # Socket.io handlers
│   │   │   └── utils/    # Helpers
│   │   └── package.json
│   ├── mobile/           # Expo React Native app
│   │   ├── app/          # Expo Router screens
│   │   ├── src/
│   │   │   ├── components/ # Reusable components
│   │   │   ├── stores/   # Zustand stores
│   │   │   └── lib/      # API client, utils
│   │   └── package.json
│   └── admin/            # Next.js admin panel
│       ├── src/
│       │   ├── app/      # App Router pages
│       │   ├── components/ # UI components
│       │   └── lib/      # Auth, utils
│       └── package.json
├── packages/
│   ├── shared/           # Shared types & schemas
│   │   └── src/
│   │       ├── types.ts  # TypeScript types
│   │       └── schemas.ts # Zod schemas
│   ├── ui/               # Shared UI components
│   │   └── src/
│   │       └── primitives.tsx
│   └── eslint-config/    # Shared ESLint config
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── .github/
│   └── workflows/
│       └── ci.yml        # CI/CD pipeline
├── package.json          # Root package.json
├── pnpm-workspace.yaml   # pnpm workspace config
├── turbo.json            # Turborepo config
└── tsconfig.base.json    # Base TypeScript config
```

## 💻 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start all apps in parallel
pnpm dev:backend      # Start backend only
pnpm dev:mobile       # Start mobile only

# Build
pnpm build            # Build all packages
pnpm typecheck        # Type check all packages
pnpm lint             # Lint all packages

# Database
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:migrate   # Run migrations
pnpm seed             # Seed database
```

### Code Quality

This project enforces:
- **TypeScript strict mode** with `noUncheckedIndexedAccess`
- **Zod validation** on all API inputs
- **PostGIS** for all geospatial queries
- **React Native Reanimated** for all animations
- **ESLint + Prettier** for code formatting

### Key Conventions

1. **All file paths** must be relative to workspace root
2. **All API inputs** must be validated with Zod
3. **All animations** must use Reanimated 3 (no Animated API)
4. **All geospatial queries** must use PostGIS (no haversine)
5. **All errors** must be handled with central error handler

## 🚢 Deployment

### Backend (Railway)

1. **Provision services**
   - PostgreSQL with PostGIS extension
   - Redis instance
   - Set environment variables

2. **Deploy**
   ```bash
   # Railway will auto-deploy on push to main
   git push origin main
   ```

### Mobile (Expo EAS)

1. **Configure EAS**
   ```bash
   eas build:configure
   ```

2. **Build & Submit**
   ```bash
   # Development build
   eas build --profile development --platform all
   
   # Production build
   eas build --profile production --platform all
   
   # Submit to stores
   eas submit --platform all
   ```

### Admin (Vercel)

1. **Connect repository** to Vercel
2. **Set environment variables**
3. **Deploy** (auto-deploys on push to main)

## 📚 Documentation

- [CONSTITUTION.md](./CONSTITUTION.md) - Non-negotiable technical rules
- [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) - Product requirements
- [TASK_BREAKDOWN.md](./TASK_BREAKDOWN.md) - Implementation roadmap
- [SPECIFICATION_AUDIT_REPORT.md](./SPECIFICATION_AUDIT_REPORT.md) - Compliance audit

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

For support, email dev@hustl.in or join our Slack channel.

---

**Built with ❤️ by the HUSTL team**
