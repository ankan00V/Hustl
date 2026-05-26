# Hustl Project Constitution

This document serves as the absolute source of truth for the Hustl platform's architecture, design, and engineering principles. Any new code, features, or architectural decisions must adhere strictly to these guidelines.

## 1. Product Vision
- **Concept:** Tinder-style swipe deck for part-time micro-gigs.
- **Target Audience:** College students swiping on 2–6 hr shifts posted by local businesses.
- **Market Focus:** India-first, Tier 1 cities.

## 2. Tech Stack
- **Mobile Client:** Expo React Native (iOS + Android)
- **Language:** TypeScript (strict mode, no `any`)
- **API Server:** Node.js + Express
- **Database Layer:** Prisma ORM, PostgreSQL + PostGIS, Redis
- **Real-time:** Socket.io
- **Push Notifications:** Firebase FCM
- **Media Storage:** Cloudinary
- **Payments:** Razorpay
- **Admin Panel:** Next.js 15

## 3. Design & UI/UX
- **Theme:** Dark-first UI (`#0E0E0E` background).
- **Brand Colors:** Amber accent (`#F5A623`) only.
- **Typography:** Clash Display + Space Mono typography.
- **Animations:** Physical swipe feel with haptics (Use **Reanimated** only, never the built-in `Animated` API).
- **Performance:** Mobile-first, 60fps non-negotiable. Swiggy speed × Linear precision aesthetic.
- **Onboarding:** Under 60 seconds.

## 4. Architecture
- **Structure:** pnpm monorepo (`/apps/mobile`, `/apps/backend`, `/apps/admin`, `/packages/shared`, `/packages/ui`).
- **Validation:** Zod validation on every API input, shared across the monorepo.
- **Geospatial:** All geo queries via PostGIS only (e.g., `ST_DWithin`); never compute haversine distance in app code.
- **Middleware Flow:** `verifyToken` → `checkRole` → `checkQuota`.
- **Error Handling:** Central error handler only. **Never** expose stack traces in API responses.
- **Webhooks:** Idempotent Razorpay webhooks with Redis deduplication.
- **Real-time:** Socket.io events must be namespaced strictly to `hustl:*`.
- **State & Components:** Components are dumb, hooks are smart. No API calls directly inside components. Use React Query for all server state.

## 5. Core Features
- **Smart Matching Engine:** Swipe deck ranked by hidden smart match score (skill overlap + distance + history + availability).
- **Urgent Hire Mode:** Trigger `hustl:urgent_listing_nearby` socket event + FCM push for immediate fulfillment (2hr window).
- **Location Verification:** Geo-verified check-in/check-out with a strict 200m radius confirmation.
- **Reputation System:** Weighted rolling average of the last 20 reviews. No-shows incur a severe penalty (−0.8 score).
- **Skill Milestones:** 10 / 25 / 50 shifts = Trusted / Pro / Expert per category.
- **Campus Partnerships:** Email domain whitelist triggers an automatic campus-verified badge.
- **Admin Panel:** Built in Next.js 15 for handling the verification queue, disputes, MRR, and flagged users.
- **Hustl Wallet:** Design schema for v2 release (8% platform fee, UPI withdrawal).

## 6. Monetisation Model
### Subscriptions (Businesses)
- **Free:** 2 listings, no urgency toggle.
- **Pro:** ₹999/mo — unlimited listings, urgency toggle, analytics dashboard.
- **Elite:** ₹2,499/mo — Pro features + verified badge + priority deck placement.

### Micro-transactions
- **Student Verified Badge:** ₹49 one-time.
- **Listing Boost:** ₹49/24hr.
- **Profile Boost:** ₹29/24hr.

### Growth Loops
- **Student Referral:** Refers a friend = 48hr profile boost.
- **Business Referral:** Refers a business = 1 free month of Pro.

## 7. Non-Negotiable Rules
1. **TypeScript Strict:** Enabled everywhere. `any` is banned.
2. **Input Validation:** Zod on every API input.
3. **Rate Limiting:** Mandatory on all auth routes (10 req/min).
4. **Security:** No stack traces in API responses under any circumstances.
5. **Database:** PostGIS for all geo queries.
6. **Animations:** Reanimated only, never `Animated` API.
7. **Webhooks:** Idempotent webhook handling is mandatory.
8. **Documentation:** `README.md` must be updated on every structural change.
9. **Seed Data:** Seed script must populate exactly: 10 businesses, 30 students, 50 listings, 20 matches.
10. **Code Quality:** Production-grade code only. No demo shortcuts, no technical debt in MVP.
