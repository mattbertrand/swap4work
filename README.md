# Swap4Work

A local marketplace where people exchange physical items for skills and time — no money involved. Offer things you no longer need and set the work hours you'd accept in exchange, or browse listings and offer your labor to get what you need.

**Production:** https://swap4work.us

## How It Works

1. **List** — Post an item (with required work hours) or a service you offer. Choose whether you accept items, services, or both.
2. **Negotiate** — Interested users open a negotiation with an hours offer. Counter-offers, messages, and the full offer history are tracked until both sides agree.
3. **Agree** — Accepted terms become a locked agreement with a task description, agreed hours, and a due date.
4. **Work & Track** — The worker logs hours and progresses through milestones; the offerer reviews submitted work.
5. **Complete** — Both sides confirm the handover, leave ratings and reviews, and earn karma for a successful exchange.

## Core Features

- **Listings** — Items and services across categories, with photos, condition, location, offerer terms, and exchange preferences.
- **Negotiations** — Structured hours-based offers with counter-offers, messages, offer history, and 48-hour inactivity expiry.
- **Agreements** — Mutually confirmed terms with lock-in, start dates, handover confirmation from both parties, and a mutual cancellation flow with audit history.
- **Milestones** — Up to 5 ordered milestones per agreement with hours, due dates, submission, and approval/rejection.
- **Time Tracking** — A work timer and per-day time logs the offerer can approve or dispute.
- **Trust & Safety**
  - Ratings and written reviews after each completed agreement (new members show as "New member" until rated)
  - Karma points earned or deducted based on outcomes, including dispute resolutions
  - Reports for users, listings, negotiations, and messages; admin review with warnings, listing hiding, suspension, and bans
  - Dispute resolution with partial credit awards
  - Blocking, an admin user management dashboard, and moderation history
- **Privacy-First Location** — Users enter City, State, and ZIP; the server verifies the location against real geographic data (OpenStreetMap/Nominatim) and only the public "City, ST" format is ever shown. Street addresses are never displayed publicly.
- **Phone Confirmation** — Phone numbers are validated and normalized (E.164) and confirmed via an emailed code with brute-force protection. Numbers are labeled "saved," not "verified."
- **Notifications** — In-app notifications for offers, messages, agreement events, ratings, and moderation outcomes, with unread counts.
- **Waitlists** — Users can join a waitlist for a reserved listing and get notified when it becomes available.

## Tech Stack

- **Frontend:** React 18 + Vite, Tailwind CSS, shadcn/ui, lucide-react icons, TanStack Query, React Router
- **Backend:** Base44 platform — entities (JSON-schema data models), backend functions, row-level security (RLS), authentication, and file storage
- **External services:** OpenStreetMap/Nominatim (geocoding), libphonenumber-js (phone validation)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Publish from the Base44 builder for production changes to go live.

## Project Structure

```
src/
  pages/           # App pages (Home, Browse, ItemDetail, Negotiation, Profile, admin pages, ...)
  components/      # Feature components (negotiation, agreement, moderation, home, ...)
  components/ui/   # shadcn/ui primitives
  lib/             # Utilities (location, phone, skills, auth context, validation)
  hooks/           # Shared React hooks
  Layout.jsx       # Sidebar navigation, header, and footer
  App.jsx          # Router and auth/data providers
base44/
  entities/        # Entity schemas with row-level security rules
  functions/       # Backend functions (see below)
  shared/          # Shared backend modules
```

## Backend Functions

| Function | Purpose |
|---|---|
| `validateLocation` | Server-side city/state/ZIP verification via Nominatim (rate-limited) |
| `sendPhoneVerificationCode` | Generates a secure 6-digit code and emails it to the user |
| `verifyPhoneVerificationCode` | Confirms the code with expiry and attempt limits |
| `suspendUser` | Admin action to suspend/unsuspend a user |
| `deleteUser` | Admin action to remove a user (with audit record) |

## Key Entities

`Item`, `Negotiation`, `Agreement`, `Milestone`, `TimeLog`, `Message`, `Rating`, `KarmaTransaction`, `Notification`, `Report`, `Dispute`, `BlockedUser`, `ModerationHistory`, `ItemWaitlist`, `Worker`, `PhoneVerificationCode`, `TermsAcceptance`, `DeletedUser`

Each entity schema (in `base44/entities/`) defines its own row-level security rules, e.g. negotiations are readable only by the two participants and admins.

## Conventions

- The exchange is always described as a **trade**, **exchange**, or **swap** — never using marketplace terminology tied to money.
- Public locations always use the "City, ST" format.
- Unrated users are shown as "New member" — no placeholder ratings are ever displayed.
- Times are stored and displayed with explicit UTC to avoid timezone drift.