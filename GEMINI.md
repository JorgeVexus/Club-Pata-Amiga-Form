# GEMINI.md

This file provides guidance to Gemini CLI when working with code in this repository.

## Project Overview

Pet Membership Form is a comprehensive pet membership registration system built with Next.js. It manages user registration, pet registration, payments, and an admin dashboard. The project documentation is primarily in Spanish.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server locally
npm start

# Type checking (no emit)
npm run type-check

# Linting
npm run lint
```

**Note:** There is no test runner configured in this project.

## Architecture

### Stack

- **Framework**: Next.js 15.5.9 with App Router
- **Language**: TypeScript 5.3.3 (strict mode enabled)
- **UI**: React 19.0.1 with CSS Modules
- **Authentication**: Memberstack v2 (`@memberstack/nextjs`)
- **Database**: Supabase (PostgreSQL + Storage)
- **CMS**: Sanity
- **Email**: Resend
- **Payments**: Stripe
- **Fonts**: Google Fonts (Outfit, Fraiche)

### Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with Memberstack script
│   ├── globals.css              # CSS variables and global styles
│   ├── usuarios/registro/        # User registration (initial step)
│   ├── seleccion-plan/           # Plan selection + Stripe payment
│   ├── completar-perfil/         # Post-payment profile completion
│   ├── registrar-mascotas/       # Pet registration (up to 3 pets)
│   ├── admin/                    # Admin dashboard
│   │   ├── login/               # Admin login
│   │   ├── register/            # Admin registration
│   │   └── dashboard/           # Main admin panel
│   ├── api/                     # API Routes
│   │   ├── admin/               # Admin endpoints (members, metrics, approvals)
│   │   ├── user/                # User endpoints (pets, appeals)
│   │   ├── upload/              # File upload endpoints
│   │   └── ...
│   └── embajadores/             # Ambassador registration
├── components/
│   ├── Admin/                   # Admin dashboard components
│   ├── FormFields/              # Reusable form field components
│   ├── PetRegistrationForm/     # Pet registration form
│   ├── PlanSelection/           # Plan selection components
│   └── RegistrationForm/        # User registration form
├── services/                    # Business logic
│   ├── memberstack.service.ts   # Memberstack integration
│   ├── supabase.service.ts      # Storage operations
│   └── pet.service.ts           # Pet-related logic
├── lib/                         # Configurations
│   ├── supabase.ts              # Supabase client + bucket constants
│   ├── sanity.ts                # Sanity client
│   └── resend.ts                # Resend client
├── types/                       # TypeScript types
│   ├── form.types.ts
│   ├── pet.types.ts
│   ├── admin.types.ts
│   └── ambassador.types.ts
└── utils/                       # Utilities
```

### Key Path Aliases (tsconfig.json)

- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/services/*` → `./src/services/*`
- `@/lib/*` → `./src/lib/*`
- `@/types/*` → `./src/types/*`

### Registration Flow Architecture

The registration is a multi-step flow with the following states:

1. **User Registration** (`/usuarios/registro`)
   - Personal data + documents
   - **Copomex API integration** for Mexican postal code auto-completion (State, City, Colony)
   - Creates Memberstack user
   - Stores data in Supabase
   - Status: `pending` (awaiting payment)

2. **Plan Selection** (`/seleccion-plan`)
   - Displays available plans
   - Stripe integration
   - Post-payment status: `pending_approval`

3. **Complete Profile** (`/completar-perfil`)
   - Data review
   - Contract signature
   - Status: `waiting_approval`

4. **Pet Registration** (`/registrar-mascotas`)
   - Up to 3 pets per user
   - Photos and documents
   - Waiting period calculation (120-180 days for pets)

### Dashboard Implementation
- **Admin Dashboard**: Implemented within this Next.js application (`/admin`).
- **User Dashboard**: Implemented externally in **Webflow** for maximum design flexibility.

### Approval Status States (Memberstack Custom Fields)

- `pending` - Awaiting payment
- `pending_approval` - Payment done, awaiting profile completion
- `waiting_approval` - Profile complete, awaiting admin review
- `approved` - Approved
- `rejected` - Rejected
- `appealed` - Appealed

### Supabase Storage Buckets

| Bucket | Purpose | Privacy |
|--------|---------|---------|
| `ine-documents` | INE (front and back) | Private |
| `proof-of-address` | Address proof | Private |
| `pet-photos` | Pet photos | Public |
| `vet-certificates` | Vet certificates | Private |
| `ambassador-documents` | Ambassador docs | Private |

### Key Environment Variables

Required in `.env.local`:

```env
# Memberstack
NEXT_PUBLIC_MEMBERSTACK_APP_ID=app_cmiqkcuzv00670ssogle4ah3n
MEMBERSTACK_ADMIN_SECRET_KEY=sk_sb_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hjvhntxjkuuobgfslzlf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Resend (Email)
RESEND_API_KEY=re_...

# Stripe
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=...
SANITY_API_TOKEN=...
```

### CSS Design System

Variables defined in `src/app/globals.css`:

```css
:root {
  --color-primary: #7DD8D5;        /* Turquoise */
  --color-white: #FFFFFF;
  --opacity-60: 0.6;               /* Input opacity */
  --radius-input: 50px;            /* Rounded inputs */
  --radius-container: 50px;        /* Rounded containers */
  --font-heading: 'Fraiche', sans-serif;
  --font-body: 'Outfit', sans-serif;
}
```

**Button styles:**
- Primary (Next/Submit): `#FE8F15` (orange)
- Secondary (Back/Cancel): `#00BBB4` (turquoise)
- Border: `2px solid #000000`
- Border-radius: `50px`

### Important Conventions

- **Language**: Spanish for UI, English for code
- **Imports**: Use path aliases (`@/components`, `@/services`, etc.)
- **Components**: CSS Modules with camelCase class names
- **Error handling**: Use `console.error('❌ Error:', error)` pattern
- **Types**: Strict TypeScript - avoid `any`
- **Authentication**: Memberstack handles auth; Supabase has RLS disabled (auth handled at app level)

### Git Commit & Changelog Rules

- NEVER chain git commands using `&&`
- ALWAYS execute git commands as separate steps
- Format: `git commit -m "<type>: <short description>"`
- Allowed types: feat, fix, refactor, style, chore, docs
- NEVER execute `git commit` or `git push` without explicit user authorization
- **MANDATORY**: ALWAYS follow the systematic approach of the **GSD Debugger** BEFORE committing to verify that no regressions or bugs were introduced.
- **MANDATORY**: ALWAYS run `npm run build`, `npm run type-check`, AND `npm run lint` BEFORE committing to identify errors.
- **MANDATORY**: ALWAYS update or create the daily changelog in `changelogs/YYYY-MM-DD.md` after every `git push`, detailing all changes and their impact.
- **MANDATORY**: After completing ANY task (including before commit/push authorization to notify the user that work is ready for review), ALWAYS run this command in the terminal:
  `curl.exe -s -X POST "https://api.telegram.org/bot8770328522:AAEPbCO0BW44QYGKnjWYe9obSnI1pWC8rRY/sendMessage" -d chat_id="5626898593" -d text="✅ Agent done: [1-line summary of what was completed]"`

### MANDATORY PLANNING DOCUMENTATION
- For EVERY project/milestone, ALWAYS create a `Documentacion/planeacion/` folder.
- ALWAYS save implementation plans in this folder with a descriptive filename (e.g., `Documentacion/planeacion/2026-05-12-restructuracion-embajadores.md`).
- This rule is GLOBAL and MUST be followed for every plan created.

### Common API Routes

**Admin:**
- `GET/POST /api/admin/members` - List/create members
- `POST /api/admin/members/[id]/approve` - Approve member
- `POST /api/admin/members/[id]/reject` - Reject member
- `GET /api/admin/metrics` - Dashboard metrics

**User:**
- `GET/POST /api/user/pets` - Manage pets
- `POST /api/user/appeal` - Create appeal
- `POST /api/user/sync-memberstack` - Sync with Memberstack

### Database Migrations

Located in `supabase/migrations/`. Run migrations via Supabase CLI or SQL editor.

### Testing Data

- **CP**: 01000 (Ciudad de México)
- **CURP**: ABCD123456HDFRNN09
- **Email**: test@example.com
- **Phone**: 555 555 5555

### Documentation

Additional documentation in `Documentacion/` folder and root Markdown files:
- `AGENTS.md` - Comprehensive project guide
- `DEVELOPER-GUIDE.md` - Developer modifications guide
- `DEPLOYMENT.md` - Vercel deployment guide
- `MEMBERSTACK-FIELDS.md` - Complete Memberstack fields reference
- `WEBFLOW-DASHBOARD-GUIDE.md` - Webflow integration guide

---
Last updated: 2026-04-09

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
