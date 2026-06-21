# AfyaLink HMS — Project Analysis & Architecture

**Project:** AfyaLink HMS (Hospital Management System)  
**Location:** Kapsabet Referral Hospital, Kenya  
**Stack:** TanStack Start + React 19 + Supabase + Tailwind CSS  
**Status:** Production-ready shell with hardcoded stub data; ready for database integration

---

## Executive Summary

AfyaLink is a **full-featured Hospital Management System** built with a modern serverless architecture. The frontend is fully implemented and functional, using **TanStack Start (SSR framework)** with **React Router** for client-side navigation. The **Supabase backend** has been fully configured with comprehensive schema, migrations, and Row-Level Security (RLS) policies. 

The current state is that **routes and components render hardcoded/stub data** instead of live database queries. The application is **ready for a final integration phase** where real database queries replace placeholder data.

---

## Tech Stack Overview

### Frontend
- **Framework:** TanStack Start v1.167.50 (fullstack React meta-framework built on Vite)
- **UI Library:** React 19.2.0
- **Router:** TanStack React Router v1.168.25
- **State Management:** TanStack React Query v5.83.0 (for server state)
- **Form Handling:** React Hook Form v7.71.2 + Zod v3.24.2 (validation)
- **Component Library:** Radix UI (accessible headless components)
- **Styling:** Tailwind CSS v4.2.1 + CVA (class-variance-authority)
- **Charts:** Recharts v2.15.4
- **Icons:** Lucide React v0.575.0
- **Notifications:** Sonner v2.0.7 (toast library)
- **Build Tool:** Vite v7.3.1 with Lovable Vite TanStack config

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (JWT-based)
- **Hosting:** Vercel (configured in nitro preset)
- **Server Runtime:** Nitro (edge/serverless via Vercel)
- **Server Framework:** Custom SSR layer via TanStack Start

### Database & Infrastructure
- **Database Engine:** PostgreSQL (via Supabase)
- **Auth Layer:** Supabase Auth with custom middleware
- **Security:** Row-Level Security (RLS) policies on all tables
- **Session Storage:** Browser localStorage (auto-persist JWT)

### Development
- **Language:** TypeScript 5.8.3
- **Linting:** ESLint 9.32.0 + Prettier 3.7.3
- **Package Manager:** npm (lock file present) / Bun (bunfig.toml + bun.lock)
- **Build Output:** Vercel (.vercel/output directory structure)

---

## Project Structure

```
afyalink-core-shell-main/
├── src/
│   ├── components/           # React components (348K)
│   │   ├── ui/              # Radix UI wrapper components (accordion, button, card, dialog, etc.)
│   │   ├── patients/        # Patient-specific components (RegisterPatientSheet.tsx)
│   │   ├── queue/           # OPD queue components (CheckInDialog.tsx)
│   │   ├── AppLayout.tsx    # Main layout wrapper (sidebar + navbar + auth check)
│   │   ├── AppNavbar.tsx    # Top navigation bar
│   │   ├── AppSidebar.tsx   # Sidebar navigation
│   │   ├── GlobalSearch.tsx # Command palette search
│   │   ├── NotificationsPanel.tsx
│   │   ├── AccessDenied.tsx # 403 view for unauthorized users
│   │   ├── PendingApproval.tsx # Approval waiting screen
│   │   ├── OfflineIndicator.tsx # PWA offline status
│   │   ├── InstallBanner.tsx   # PWA install prompt
│   │   ├── EmptyState.tsx      # Placeholder for empty lists
│   │   └── TableSkeleton.tsx   # Loading skeleton
│   │
│   ├── routes/              # TanStack Router file-based routes (236K)
│   │   ├── __root.tsx       # Root layout + error boundary + auth provider
│   │   ├── index.tsx        # Dashboard (KPIs, queue status, recent activities)
│   │   ├── login.tsx        # Auth login page
│   │   ├── patients.tsx     # Patient list + search + pagination
│   │   ├── patients.$patientId.tsx  # Patient details view
│   │   ├── opd-queue.tsx    # OPD queue management (check-in, triage, status)
│   │   ├── pharmacy.tsx     # Drug inventory + prescriptions + dispensing
│   │   ├── laboratory.tsx   # Lab orders + results + QC
│   │   ├── billing.tsx      # Transactions + payment methods + receipts
│   │   ├── referrals.tsx    # Referral management (outgoing/incoming)
│   │   ├── analytics.tsx    # Dashboard analytics + reports
│   │   ├── users.tsx        # User management + role approval (admin-only)
│   │   ├── settings.tsx     # User profile + preferences
│   │   └── README.md        # Route structure docs
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts    # Supabase JS client initialization
│   │       ├── client.server.ts  # Server-side client (if needed)
│   │       ├── auth-middleware.ts # Auth state sync
│   │       ├── auth-attacher.ts   # Session context injection
│   │       └── types.ts     # Generated TypeScript types from Supabase schema
│   │
│   ├── lib/
│   │   ├── auth.tsx         # AuthProvider context + useAuth hook + role-based access control
│   │   ├── config.server.ts # Server-side environment config
│   │   ├── error-capture.ts # Error logging to Lovable
│   │   ├── lovable-error-reporting.ts # Integration with Lovable IDE
│   │   ├── error-page.ts    # Error page rendering
│   │   ├── utils.ts         # Shared utilities (classNames, etc.)
│   │   └── api/
│   │       └── example.functions.ts  # Example API functions (TODO: replace with real queries)
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx   # Mobile detection hook
│   │   └── useDashboardMetrics.ts # Dashboard data fetching hook
│   │
│   ├── data/                # Hardcoded stub data (44K) — THESE NEED TO BE REPLACED
│   │   ├── patients.ts      # 8 stub patient records
│   │   ├── queue.ts         # OPD queue stub data
│   │   ├── laboratory.ts    # Lab orders & results stub
│   │   ├── pharmacy.ts      # Pharmacy inventory stub
│   │   ├── billing.ts       # Billing transactions stub
│   │   ├── referrals.ts     # Referrals stub
│   │   └── analytics.ts     # Analytics metrics stub
│   │
│   ├── utils/
│   │   └── Supabase.ts      # Supabase client re-export
│   │
│   ├── router.tsx           # TanStack Router initialization
│   ├── routeTree.gen.ts     # Auto-generated route tree (do not edit manually)
│   ├── server.ts            # Custom TanStack Start server entry point (SSR + error handling)
│   ├── start.ts             # App entry point
│   └── styles.css           # Global Tailwind CSS + custom styles
│
├── supabase/
│   ├── config.toml          # Supabase local development config
│   └── migrations/
│       ├── 20260609131341_73ce76aa-ae63-445c-a3f9-357ed5168b33.sql
│       │   └── Creates: profiles, user_roles, auth middleware, RLS policies
│       ├── 20260609131357_854caca1-fcee-4deb-8f63-d08031cfb877.sql
│       │   └── Revokes permissions on helper functions
│       └── 20260617000000_clinical_tables.sql
│           └── Creates: patients, visits, opd_queue, lab_orders, lab_results,
│                        pharmacy_drugs, prescriptions, billing_transactions,
│                        nhif_claims, referrals (comprehensive clinical schema)
│
├── public/
│   ├── icon.svg             # PWA icon
│   └── manifest.webmanifest # PWA manifest
│
├── package.json             # 89 dependencies (React, TanStack, Supabase, UI libs, etc.)
├── tsconfig.json            # TypeScript strict mode + path aliases (@/ = src/)
├── vite.config.ts           # Vite config (Lovable preset, TanStack Start, Vercel nitro)
├── bunfig.toml              # Bun runtime config
├── eslint.config.js         # ESLint rules
├── vercel.json              # Vercel deployment config
└── .prettierrc/.prettierignore  # Code formatting

```

---

## Database Schema (Supabase / PostgreSQL)

### Authentication & Access Control

**Tables:**
- `auth.users` (Supabase built-in) — JWT authentication
- `profiles` — User profiles with full name, email, phone, department, facility, status
- `user_roles` — Role assignments (many-to-many, but currently single role per user)

**Types/Enums:**
```sql
app_role: 'Clinician', 'Nurse', 'Pharmacist', 'Lab Technician', 'Admin', 'Finance Officer'
profile_status: 'pending', 'approved', 'rejected'
```

**Row-Level Security:**
- `users` can read own profile; `Admin` can read all profiles
- `users` can update own profile; `Admin` can update any
- `Admin` manages role assignments
- First user created becomes `Admin` automatically

---

### Clinical Data

#### 1. **Patients** (core)
```sql
patients (
  id UUID PK,
  national_id TEXT UNIQUE,
  full_name, dob, gender, phone, county, sub_county,
  blood_group, allergies[], nhif_no,
  nok_name, nok_phone, created_by UUID, created_at, updated_at
)
```
**RLS:** Approved users read; Clinician/Nurse/Admin insert/update

---

#### 2. **Visits** (outpatient encounters)
```sql
visits (
  id UUID PK,
  patient_id UUID FK,
  visit_date DATE,
  diagnosis, notes,
  clinician_id UUID FK, clinician_name TEXT,
  department TEXT DEFAULT 'OPD',
  created_at TIMESTAMPTZ
)
```
**RLS:** Approved users read; Clinician/Admin insert only

---

#### 3. **OPD Queue** (outpatient flow)
```sql
opd_queue (
  id UUID PK,
  queue_no, patient_id UUID FK, patient_name,
  check_in_time TIMESTAMPTZ,
  triage triage_level ENUM ('Red'|'Orange'|'Yellow'|'Green'|'Blue'),
  assigned_to TEXT,
  status queue_status ENUM ('Waiting'|'Triaged'|'In Consult'|'Done'|'Did Not Wait'),
  checked_in_by UUID FK,
  updated_at TIMESTAMPTZ
)
```
**RLS:** All approved users have full access (ALL permissions)

---

#### 4. **Lab Orders** (lab management)
```sql
lab_orders (
  id UUID PK,
  order_no TEXT UNIQUE,
  patient_id UUID FK, patient_name, national_id,
  tests TEXT[],
  ordered_by UUID FK, ordered_by_name,
  priority lab_priority ENUM ('Routine'|'Urgent'|'STAT'),
  status lab_order_status ENUM ('Pending'|'Collected'|'Processing'|'Completed'),
  created_at, updated_at
)
```

#### 5. **Lab Results** (lab outcomes)
```sql
lab_results (
  id UUID PK,
  order_id UUID FK,
  test_name, result, reference_range,
  flag result_flag ENUM ('Normal'|'High'|'Low'),
  is_critical BOOLEAN,
  verified_by UUID FK, verified_by_name,
  sample_id TEXT,
  created_at
)
```
**RLS:** Lab Technician/Admin insert; all approved users read

---

#### 6. **Pharmacy** (drug inventory & dispensing)
```sql
pharmacy_drugs (
  id UUID PK,
  name, category, stock INTEGER, unit, reorder_level,
  expiry_date, supplier,
  updated_by UUID FK, updated_at
)

prescriptions (
  id UUID PK,
  visit_id, patient_id UUID FK, patient_name,
  drug_id UUID FK, drug_name, dose, quantity,
  prescribed_by UUID FK, prescribed_by_name,
  dispensed BOOLEAN, dispensed_by UUID FK, dispensed_at,
  created_at
)
```
**RLS:** Pharmacist/Admin manage drugs; Clinician/Admin write prescriptions; Pharmacist/Admin dispense

---

#### 7. **Billing** (payments & invoices)
```sql
billing_transactions (
  id UUID PK,
  receipt_no TEXT UNIQUE,
  patient_id UUID FK, patient_name,
  visit_id UUID FK,
  amount NUMERIC(10,2), method payment_method ENUM,
  status payment_status ENUM ('Paid'|'Pending'|'Failed'),
  items JSONB (line items),
  recorded_by UUID FK,
  transaction_date DATE,
  created_at
)
```
**RLS:** Finance Officer/Admin full access; all approved users read

---

#### 8. **NHIF Claims** (insurance claims processing)
```sql
nhif_claims (
  id UUID PK,
  claim_no TEXT UNIQUE,
  patient_id UUID FK, patient_name,
  visit_id UUID FK,
  amount, visit_date, submitted_date,
  status claim_status ENUM ('Submitted'|'Approved'|'Rejected'),
  rejection_reason TEXT,
  submitted_by UUID FK,
  created_at
)
```
**RLS:** Finance Officer/Admin full access

---

#### 9. **Referrals** (inter-facility transfers)
```sql
referrals (
  id UUID PK,
  ref_no TEXT UNIQUE,
  patient_id UUID FK, patient_name, national_id,
  sent_to TEXT (facility name),
  urgency referral_urgency ENUM ('Routine'|'Urgent'|'Emergency'),
  status referral_status ENUM ('Pending'|'Received'|'Completed'|'No Feedback'),
  reason, outcome TEXT,
  referred_by UUID FK, referred_by_name,
  date_sent DATE,
  created_at, updated_at
)
```
**RLS:** Clinician/Admin full access; all approved users read

---

### Security Features
- **All tables have RLS enabled** (no unauthorized access possible at DB level)
- **Role-based access control via `has_role()` function** (SECURITY DEFINER)
- **Automatic updated_at trigger** on all mutable tables
- **Automatic profile creation on signup** with first user = Admin
- **JWT-based authentication** with secure session storage

---

## Authentication & Authorization Flow

```
1. User signs up with email, password, metadata (name, department, role request)
   ↓
2. Supabase trigger creates profile entry (status='pending' unless first user)
   ↓
3. First user automatically becomes 'Admin' and approved
   ↓
4. Admin approves other users by updating their role in user_roles table
   ↓
5. useAuth() hook loads profile + roles on every app load
   ↓
6. AppLayout checks: is user authenticated? approved? has role?
   ↓
7. isRouteAllowed() function checks ALLOWED_ROUTES[role][pathname]
   ↓
8. If unauthorized: AccessDenied component shown
   ↓
9. If pending: PendingApproval component shown
   ↓
10. If approved & authorized: renders page with RLS-filtered data
```

**ALLOWED_ROUTES by Role:**
| Role | Routes |
|------|--------|
| Clinician | `/`, `/patients`, `/opd-queue`, `/laboratory`, `/referrals`, `/settings` |
| Nurse | `/`, `/opd-queue`, `/patients`, `/settings` |
| Pharmacist | `/`, `/pharmacy`, `/settings` |
| Lab Technician | `/`, `/laboratory`, `/settings` |
| Admin | `/`, `/patients`, `/opd-queue`, `/pharmacy`, `/laboratory`, `/billing`, `/referrals`, `/analytics`, `/users`, `/settings` |
| Finance Officer | `/`, `/billing`, `/analytics`, `/settings` |

---

## Routes & Pages (Feature Map)

### Public Routes
- **`/login`** — Email/password authentication

### Protected Routes

| Route | Component | Purpose | Auth Required | Roles |
|-------|-----------|---------|---------------|-------|
| `/` | `index.tsx` | Dashboard + KPIs | Yes | All approved |
| `/patients` | `patients.tsx` | Patient registry + search | Yes | Clinician, Nurse, Admin |
| `/patients/$patientId` | `patients.$patientId.tsx` | Patient detail view | Yes | Clinician, Nurse, Admin |
| `/opd-queue` | `opd-queue.tsx` | OPD queue mgmt | Yes | All except Finance Officer |
| `/pharmacy` | `pharmacy.tsx` | Drug inventory + dispensing | Yes | Pharmacist, Admin |
| `/laboratory` | `laboratory.tsx` | Lab orders + results | Yes | Lab Tech, Clinician, Admin |
| `/billing` | `billing.tsx` | Transactions + NHIF claims | Yes | Finance Officer, Admin |
| `/referrals` | `referrals.tsx` | Referral management | Yes | Clinician, Admin |
| `/analytics` | `analytics.tsx` | Dashboards + reports | Yes | Finance Officer, Admin |
| `/users` | `users.tsx` | User management | Yes | Admin only |
| `/settings` | `settings.tsx` | Profile + preferences | Yes | All approved |

---

## Data Flow & Current State

### Current Architecture (Shell State)
```
User clicks "View Patients"
  ↓
React Router navigates to /patients
  ↓
patients.tsx mounts
  ↓
useEffect calls supabase.from('patients').select(...)
  ↓
Supabase returns: empty array (no data in production tables)
  ↓
Component would show empty table OR
  (Routes currently hardcoded to show stub data from src/data/patients.ts instead)
```

### Post-Integration (Live State)
```
User clicks "View Patients"
  ↓
React Router navigates to /patients
  ↓
patients.tsx mounts
  ↓
useEffect calls supabase.from('patients').select(...).order(...).limit(...)
  ↓
Supabase RLS filters: only if user has 'approved' status + valid role
  ↓
Real database rows returned for clinic's patients
  ↓
Table renders with live data + pagination
```

---

## Stub Data Files (To Be Replaced)

All stub data is in `src/data/`:

| File | Contents | Records | Purpose |
|------|----------|---------|---------|
| `patients.ts` | Patient records with visits, prescriptions, labs, billing | 8 | Type definitions + sample data |
| `queue.ts` | OPD queue entries | ~12 | Queue simulation |
| `laboratory.ts` | Lab orders + results | ~20 | Lab workflow simulation |
| `pharmacy.ts` | Drug inventory + prescriptions | ~15 drugs + RX | Inventory simulation |
| `billing.ts` | Transactions + methods | ~20 | Payment workflow simulation |
| `referrals.ts` | Referral records | ~10 | Referral workflow simulation |
| `analytics.ts` | KPI metrics + trends | Synthetic | Dashboard metrics |

**These are currently used in routes via:**
```typescript
// Current (stub)
import { patients } from '@/data/patients';
const data = patients; // hardcoded array

// After integration (live)
const { data } = await supabase.from('patients').select(...);
```

---

## Key Component Inventory

### Layout Components
- **AppLayout** — Main wrapper, auth check, route protection, sidebar + navbar
- **AppSidebar** — Navigation menu with collapsible sections
- **AppNavbar** — Top bar with user menu, notifications, search

### Shared Components
- **GlobalSearch** — Command palette (⌘K or Ctrl+K) for navigation
- **NotificationsPanel** — Bell icon with notification list
- **OfflineIndicator** — Shows PWA offline status
- **InstallBanner** — Prompts to install as PWA
- **AccessDenied** — 403 page for unauthorized routes
- **PendingApproval** — Approval waiting screen
- **EmptyState** — Placeholder for empty lists
- **TableSkeleton** — Loading skeleton for tables
- **UserCredentialCard** — User identity display

### Feature Components
- **RegisterPatientSheet** (patients) — Form to add new patient
- **CheckInDialog** (queue) — Check patient into OPD queue

### UI Components (Radix-based)
- Button, Card, Dialog, Select, Input, Textarea, Checkbox, Radio, Toggle
- Table, Badge, Avatar, Alert, Popover, Tooltip, Dropdown Menu, Sidebar
- Accordion, Tabs, Carousel, Breadcrumb, Progress, Slider, DatePicker, Calendar
- ResizablePanels, ScrollArea, CommandPalette, Form (React Hook Form integration)

---

## Current Challenges & Integration Opportunities

### What's Ready
✅ Full UI/UX implementation  
✅ Complete Supabase schema with RLS  
✅ Authentication flow (sign up → approval → dashboard)  
✅ Role-based access control  
✅ TanStack Start SSR setup  
✅ Responsive design (mobile + desktop)  
✅ Chart/analytics widgets  
✅ Form validation (Zod + React Hook Form)  
✅ PWA configuration  
✅ Error boundaries & logging  

### What Needs Integration
❌ All routes currently use hardcoded stub data  
❌ Supabase queries exist but are commented/partial  
❌ Real-time subscriptions not implemented  
❌ Pagination / infinite scroll needs completion  
❌ Search/filter optimizations  
❌ Batch operations (bulk upload, etc.)  
❌ Audit logging  
❌ Notifications (via Supabase functions or webhooks)  

### Integration Checklist

1. **Replace hardcoded data imports** in each route
   - Remove: `import { patients } from '@/data/patients'`
   - Add: Direct Supabase queries

2. **Convert useState/useEffect → React Query** (recommended)
   - Enables caching, background refetching, pagination
   - Better error handling

3. **Add missing Supabase functions**
   - Check `src/lib/api/example.functions.ts` for pattern
   - Implement one function per major query

4. **Implement real-time subscriptions** (optional but powerful)
   - Queue updates: `supabase.realtime.subscribe('opd_queue')`
   - Lab results: `supabase.realtime.subscribe('lab_results')`

5. **Add Supabase Edge Functions** (optional, for complex logic)
   - Check-in validation
   - Billing calculations
   - NHIF claim submission

6. **Test RLS policies** thoroughly
   - Verify Nurse can't see Finance Officer data
   - Verify Pharmacist can't approve user roles
   - etc.

---

## Build & Deployment

### Development
```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # Build for production (Vercel preset)
npm run build:dev    # Build in dev mode (useful for debugging)
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run format       # Auto-format with Prettier
```

### Production
- **Hosted on:** Vercel (nitro preset configured)
- **Output:** `.vercel/output/` directory
- **Static assets:** `.vercel/output/static/`
- **Server functions:** `.vercel/output/functions/__server.func/`
- **Deployment:** Push to GitHub → Vercel auto-builds

### Environment Variables Required
```
VITE_SUPABASE_URL=https://fcetorcatklhkelqqplc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-public-key>
SUPABASE_URL=...  (server-side, if needed)
SUPABASE_SERVICE_ROLE_KEY=...  (for admin tasks, keep secret)
```

---

## Performance Considerations

### Current (Stub Data)
- All data in memory → instant renders
- No network latency
- Suitable for demo/sandbox

### After Integration (Live)
- Network latency for each query (50-500ms typical)
- **Recommendation:** Use React Query with caching
- **Pagination:** Implement cursor-based or limit/offset
- **Filtering:** Use Supabase query filters (not client-side)
- **Search:** Consider full-text search for patient names/IDs

### Optimization Techniques
1. **Memoization** (React.memo, useMemo, useCallback)
2. **Code splitting** (TanStack Router auto-splits per route)
3. **Image optimization** (avatars, icons already SVG)
4. **Lazy loading** (modals, sheets only load when opened)
5. **Virtual scrolling** (for large tables — use `@tanstack/react-virtual` if needed)

---

## Monitoring & Logging

### Error Reporting
- **Integration:** Lovable IDE error reporter (src/lib/lovable-error-reporting.ts)
- **Client errors:** Captured in error boundaries

### Database Logs
- **Supabase dashboard:** View query logs, RLS violations, etc.

### Recommendations
- Add Sentry or similar for production error tracking
- Implement audit logging (who did what, when)
- Monitor slow queries in Supabase dashboard

---

## File-by-File Integration Guide

### Highest Priority (Core Data)
1. `src/routes/patients.tsx` — Replace `patients.ts` stub with Supabase query
2. `src/routes/opd-queue.tsx` — Replace queue stub with real queue table
3. `src/routes/index.tsx` (Dashboard) — Replace all KPI queries with Supabase aggregations

### High Priority (Clinical Workflows)
4. `src/routes/laboratory.tsx` — Lab orders + results
5. `src/routes/pharmacy.tsx` — Drug inventory + prescriptions
6. `src/routes/referrals.tsx` — Referral management

### Medium Priority (Administrative)
7. `src/routes/billing.tsx` — Billing transactions + NHIF claims
8. `src/routes/analytics.tsx` — Analytics dashboard (aggregated queries)
9. `src/routes/users.tsx` — User management + role approval

### Low Priority (User-Facing)
10. `src/routes/settings.tsx` — Profile updates
11. Components for forms → Supabase mutations

---

## Database Query Patterns (Examples)

### Read All Patients
```typescript
const { data } = await supabase
  .from('patients')
  .select('*')
  .order('created_at', { ascending: false });
```

### Read Patient with Visits & Prescriptions
```typescript
const { data } = await supabase
  .from('patients')
  .select('*, visits(*), prescriptions(*)')
  .eq('id', patientId)
  .single();
```

### Create Billing Transaction
```typescript
const { data } = await supabase
  .from('billing_transactions')
  .insert([
    {
      receipt_no: generateReceiptNo(),
      patient_id: patientId,
      visit_id: visitId,
      amount: 1500,
      method: 'M-Pesa',
      status: 'Pending',
      items: [{ description: 'Consultation', amount: 1500 }],
      recorded_by: auth.user.id,
    }
  ])
  .select()
  .single();
```

### List OPD Queue with Sorting
```typescript
const { data } = await supabase
  .from('opd_queue')
  .select('*')
  .eq('status', 'Waiting')
  .order('check_in_time', { ascending: true });
```

### Check Lab Result Flag
```typescript
const { data } = await supabase
  .from('lab_results')
  .select('*, order:lab_orders(*)')
  .eq('is_critical', true)
  .order('created_at', { ascending: false });
```

---

## Next Steps

### Immediate (Week 1)
1. Set up Supabase project connection (verify env vars)
2. Seed database with initial clinic data (if needed)
3. Test authentication flow (sign up → approval)
4. Verify RLS policies work as expected

### Short-term (Weeks 2-3)
1. Replace patients.tsx stub with live query
2. Replace opd-queue.tsx stub with live query
3. Replace pharmacy.tsx, laboratory.tsx, referrals.tsx
4. Add loading skeletons + error states

### Medium-term (Weeks 4-6)
1. Implement billing transactions
2. Implement NHIF claims workflow
3. Add search/filtering optimizations
4. Implement real-time queue updates

### Long-term (Weeks 7+)
1. Edge Functions for complex workflows
2. Analytics/reporting optimization
3. Bulk data import/export
4. Audit logging
5. Mobile app (optional, using React Native)

---

## Key Files to Review First

**High Priority:**
- `src/lib/auth.tsx` — Understanding authentication context
- `src/routes/__root.tsx` — Understanding app shell + error boundaries
- `src/routes/index.tsx` — Dashboard structure
- `supabase/migrations/20260617000000_clinical_tables.sql` — Full schema

**Medium Priority:**
- `src/integrations/supabase/client.ts` — Supabase client setup
- `src/routes/patients.tsx` — Example of data fetching
- `src/components/AppLayout.tsx` — Understanding layout + auth checks

**Reference:**
- `src/data/patients.ts` — Example data structure
- `src/components/ui/*.tsx` — Component API reference

---

## Conclusion

**AfyaLink is a production-ready Hospital Management System** with:
- ✅ Full feature UI implementation
- ✅ Enterprise-grade database schema with security
- ✅ Serverless scalability via TanStack Start + Vercel
- ✅ Role-based access control at database level
- ✅ Mobile-responsive design
- ✅ PWA capabilities

**The integration phase is the final step** to connect these hardcoded routes to live Supabase queries. Once complete, the system will be ready for clinical deployment at Kapsabet Referral Hospital.

**Estimated integration effort:** 2-4 weeks for one developer, assuming familiarity with TypeScript + SQL + Supabase.
