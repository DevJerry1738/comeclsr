# Supabase Migration - Phase 1: Foundation & Setup

**Status**: 🟢 Phase 1 Complete - Ready for Phase 2  
**Date**: May 4, 2026  
**Duration**: ~2 days  

---

## ✅ Completed Tasks

### 1. Dependencies Updated ✓
- **Removed**:
  - `@hono/node-server`, `hono` (backend framework - not needed for Edge Functions)
  - `@trpc/client`, `@trpc/server`, `@trpc/react-query` (RPC framework)
  - `drizzle-orm`, `drizzle-kit` (MySQL ORM - replacing with Supabase)
  - `mysql2` (MySQL driver)
  - `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` (S3 - replacing with Supabase Storage)
  - `bcryptjs`, `jose`, `jsonwebtoken` (Auth management - Supabase handles this)
  - `@hono/vite-dev-server` (Hono dev server)
  - `esbuild`, `drizzle-kit` (old build tools)

- **Added**:
  - `@supabase/supabase-js` (Supabase JavaScript client)
  - `@supabase/auth-helpers-react` (Supabase auth React integration)
  - `@supabase/cli` (Supabase CLI for local development)

- **Kept**:
  - React 19, TypeScript, Tailwind CSS
  - React Query (for data fetching)
  - React Hook Form + Zod (validation)
  - All Radix UI components
  - Vite (frontend build tool)

### 2. Configuration Files Updated ✓

**package.json**:
- Updated build script: `"build": "vite build"` (removed esbuild)
- Updated dev script: Removed Hono dev server config
- Added Supabase-specific scripts:
  - `supabase:start` - Start local Supabase
  - `supabase:stop` - Stop local Supabase
  - `supabase:migrations` - List migrations
  - `supabase:push` - Push schema changes

**vite.config.ts**:
- Removed: `@hono/vite-dev-server` plugin
- Removed: `kimi-plugin-inspect-react` plugin
- Kept: React plugin, path aliases
- Updated: Build output to `dist/` (not `dist/public/`)

**.env.example**:
- Replaced MySQL vars with Supabase vars:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_JWT_SECRET`
- Added frontend-safe vars with `VITE_` prefix
- Kept: OAuth integration vars for Kimi

**.gitignore**:
- Added Supabase-specific exclusions:
  - `supabase/.branches/`
  - `supabase/.cli/`
  - `supabase/functions/.deno/`
  - `.supabase/`

### 3. Supabase Infrastructure Created ✓

**Created `supabase/` directory structure**:
```
supabase/
├── config.toml              # Supabase configuration
├── migrations/
│   └── 20260504_initial_schema.sql  # Complete PostgreSQL schema
└── functions/               # (Ready for Phase 3 - Edge Functions)
```

**supabase/config.toml**:
- Local development configuration
- JWT secret setup
- Real-time subscriptions enabled
- Storage (S3) configuration
- Auth provider configuration

**supabase/migrations/20260504_initial_schema.sql**:
- Complete PostgreSQL schema (all 12 tables)
- Row Level Security (RLS) policies for all tables
- Helper function: `is_admin()` for role checking
- Database indexes for optimal query performance

### 4. Frontend Type System Created ✓

**src/types/supabase.ts**:
- Complete TypeScript types for all database tables
- Typed `Database` object for Supabase client
- Type-safe Insert/Update interfaces
- Ready for auto-generation with Supabase CLI

### 5. Supabase Client Setup ✓

**src/lib/supabase.ts**:
- Supabase client initialization
- Configured session persistence
- Auto token refresh enabled
- Environment validation

### 6. React Integration Layer Created ✓

**src/providers/supabase.tsx**:
- New `SupabaseProvider` component (replaces `TRPCProvider`)
- SessionContextProvider from `@supabase/auth-helpers-react`
- React Query integration
- Auto-session detection
- Loading state during initialization

**src/main.tsx**:
- Updated to use `SupabaseProvider` instead of `TRPCProvider`
- Maintains React Router structure
- Ready for frontend auth implementation

---

## 📊 Current Architecture After Phase 1

```
┌─────────────────────────────────────────┐
│          Frontend (React 19)             │
│  ├─ React Router                         │
│  ├─ Tailwind CSS + shadcn/ui             │
│  ├─ React Query (data fetching)          │
│  └─ React Hook Form (validation)         │
└────────────┬────────────────────────────┘
             │
             │ (Edge Functions API)
             │ (Phase 3)
             │
┌────────────▼────────────────────────────┐
│       Supabase Backend (PostgreSQL)      │
│  ├─ Auth (managed)                       │
│  ├─ Database (12 tables)                 │
│  ├─ RLS Policies                         │
│  ├─ Real-time Subscriptions              │
│  └─ Storage (replaces S3)                │
└─────────────────────────────────────────┘
```

---

## 🚀 Next Steps: Phase 2 - Database & Authentication

### Phase 2 Timeline: ~3 days (May 5-7, 2026)

**What needs to happen**:

1. **Create Supabase Project**
   - Sign up at supabase.com
   - Create new project
   - Get credentials: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

2. **Push Initial Schema**
   - Use Supabase CLI: `supabase db push`
   - Verify all 12 tables created
   - Verify all RLS policies applied
   - Verify indexes created

3. **Configure Supabase Auth**
   - Enable Email provider
   - Configure OAuth: Kimi integration
   - Set password requirements
   - Configure JWT expiration

4. **Migrate User Data** (if existing users)
   - Export from MySQL
   - Transform to PostgreSQL format
   - Bulk insert into `user_profiles`
   - Verify data integrity

5. **Test Auth Flows**
   - Signup with email
   - Login/logout
   - OAuth (Kimi)
   - Session persistence
   - Token refresh

### Files to Create in Phase 2
- `src/hooks/useAuth.ts` (Supabase-based auth hook)
- `src/lib/auth.ts` (Auth helper functions)
- Update `src/pages/Login.tsx` (Supabase auth form)
- Update `src/pages/Register.tsx` (Supabase signup)

---

## ℹ️ How to Run Locally Now

### Prerequisites
```bash
# Install Node.js 20 LTS
# Install Supabase CLI
npm install -g supabase
```

### Setup Steps
```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Create Supabase project (at supabase.com)
#    Get credentials and update .env:
#    VITE_SUPABASE_URL=https://xxx.supabase.co
#    VITE_SUPABASE_ANON_KEY=xxx

# 4. Option A: Use Supabase Cloud (easiest for now)
#    Skip this step, Phase 2 will use cloud

# 4. Option B: Run local Supabase (advanced)
supabase start
supabase db push

# 5. Start dev server
npm run dev
```

### Development Commands
```bash
# Lint code
npm run lint

# Format code
npm run prettier

# Type check
npm run check

# Run tests (when available)
npm run test

# Build for production
npm run build
```

---

## ⚠️ Important Notes

### Breaking Changes Made
- ✗ Old API endpoints (`/api/trpc`) no longer work (removed Hono)
- ✗ Old auth middleware removed (replaced with RLS)
- ✗ tRPC removed from frontend (will use Supabase SDK)
- ✗ Old database connection logic removed

### What Still Works
- ✓ Frontend routes (React Router)
- ✓ UI components (Tailwind + shadcn)
- ✓ Styling and theming
- ✓ Form validation (Zod)

### Migration Status
| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Created | Ready to push to Supabase |
| RLS Policies | ✅ Created | All security rules in place |
| Auth Infrastructure | ⏳ Phase 2 | Supabase Auth config needed |
| API Endpoints | ⏳ Phase 3 | Will be Edge Functions |
| Frontend Auth | ⏳ Phase 2 | New useAuth hook needed |
| Data Fetching | ⏳ Phase 4 | Replace tRPC calls |
| Real-Time | ⏳ Phase 5 | Add subscriptions |

---

## 📝 Environment Setup for Phase 2

When you create your Supabase project, you'll get these credentials:

```env
# From Supabase Project Settings → API
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[anon-key-here]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key-here]
SUPABASE_JWT_SECRET=[automatically-generated]

# Frontend (safe to expose)
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key-here]

# Optional: OAuth for Kimi
VITE_KIMI_AUTH_URL=https://auth.kimi.com
VITE_APP_ID=[your-app-id]
OWNER_UNION_ID=[admin-user-id]
```

---

## ✨ Phase 1 Summary

| Item | Before | After |
|------|--------|-------|
| Backend | Hono + tRPC + Node.js | Supabase Edge Functions |
| Database | MySQL | PostgreSQL |
| Auth | Custom JWT | Supabase Auth |
| Storage | AWS S3 | Supabase Storage |
| Real-Time | None | Built-in WebSockets |
| Operations | Manual server scaling | Serverless auto-scaling |
| Infrastructure | Multiple services | Single Supabase project |

---

## 🎯 Phase 1 Checklist

- [x] Update package.json dependencies
- [x] Update build configuration (vite.config.ts)
- [x] Update environment variables (.env.example)
- [x] Create Supabase directory structure
- [x] Create initial PostgreSQL schema migration
- [x] Create RLS security policies
- [x] Create TypeScript database types
- [x] Create Supabase client library
- [x] Create Supabase React provider
- [x] Update main.tsx to use new provider
- [x] Update .gitignore for Supabase
- [x] Create Phase 1 documentation

---

## 📞 Troubleshooting Phase 1

### Issue: "Cannot find module '@supabase/supabase-js'"
```bash
npm install
npm ls @supabase/supabase-js
```

### Issue: Environment variables not loading
- Ensure `.env` file exists in project root
- Run `npm run dev` again
- Check browser console for env errors

### Issue: TypeScript errors in supabase.ts
- Ensure `src/types/supabase.ts` exists
- Run `npm run check` to see all errors
- Types will be auto-generated in Phase 2

---

## 📌 Key Files Modified/Created

**Modified**:
- ✏️ `package.json` - Dependencies
- ✏️ `vite.config.ts` - Build config
- ✏️ `.env.example` - Environment vars
- ✏️ `.gitignore` - Exclude Supabase local dev
- ✏️ `src/main.tsx` - Use SupabaseProvider

**Created**:
- ✨ `supabase/config.toml` - Supabase config
- ✨ `supabase/migrations/20260504_initial_schema.sql` - Database schema
- ✨ `src/lib/supabase.ts` - Supabase client
- ✨ `src/providers/supabase.tsx` - React provider
- ✨ `src/types/supabase.ts` - TypeScript types

---

## Next Phase: Phase 2

Proceed to Phase 2 when:
1. ✅ All Phase 1 files created/modified
2. ✅ `npm install` completes without errors
3. ✅ `npm run check` shows no type errors
4. ✅ You have a Supabase account
5. ✅ You've created a Supabase project

**Ready to proceed?** Continue to Phase 2: Database & Authentication Setup
