# Sustainance

**Green Skills Gap Intelligence for the modern workforce.**

Turn workforce sustainability readiness gaps into dollar amounts, risk scores, and actionable business cases.

**Live:** [sustainance.netlify.app](https://sustainance.netlify.app)

---

## Setup

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
# Install dependencies
npm install

# Generate Prisma client, push schema, and seed the database
npx prisma generate
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-oauth-client-id"
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite connection string (default: `file:./dev.db`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Google OAuth client ID for real authentication. Without it, only demo mode is available. |

---

## Demo Flow

1. Visit the app at [localhost:3000](http://localhost:3000) or [sustainance.netlify.app](https://sustainance.netlify.app)
2. Click **"Continue as Demo User"** on the welcome screen
3. You'll land on the **Dashboard** for "TEST INCORPORATED" with pre-seeded data:
   - 5 departments (Sustainability & ESG, Operations, Innovation & R&D, Compliance & Legal, Marketing & Communications)
   - 7 roles with completed assessments
   - 18 employees with skill levels and XP scores
4. Explore the full app:
   - **Dashboard** — KPIs, gap distribution chart, heatmap, high-risk roles, ROI panel, incentive matching
   - **Departments / Roles / Employees** — manage organizational structure
   - **Assess** — run green skills gap assessments for any role
   - **Reports** — drill into department, role, function, and employee-level reports
   - **Leaderboard** — gamified XP rankings across employees and departments
   - **Community** — benchmark against other companies
   - **Executive Report** — one-page strategic summary
   - **Export** — download Employee Scorecards, Department Summaries, or Full Company Reports as branded Excel (.xlsx) files

---

## User Roles

| Role | Access | How to Get It |
|------|--------|---------------|
| **Demo** | Full access with admin/employee view toggle | Click "Continue as Demo User" |
| **Manager** | Admin views only (dashboard, departments, roles, employees, assessments, reports, exports) | Sign in with Google and create a company |
| **Member** | Employee views only (profile, personal assessment, leaderboard) | Join a company via invite code |

- Managers see admin navigation. Members see employee navigation. Demo users can toggle between both views.
- Members join by entering an invite code on the onboarding page, then claim their employee profile.

---

## Onboarding (New Company)

1. Sign in with Google
2. **Step 1** — Enter company info (name, industry, size, state)
3. **Step 2** — Set up departments (pre-filled defaults based on company size)
4. **Step 3** — Add roles per department (pick a business function for each)
5. **Step 4** — Add employees and assign them to departments/roles
6. **Step 5** — Summary with a CTA to run your first assessment

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Prisma + SQLite
- **Auth:** Google OAuth (via `google-auth-library`) + cookie-based sessions
- **Exports:** ExcelJS for server-rendered branded .xlsx reports
- **Styling:** Tailwind CSS
- **Deployment:** Netlify with `@netlify/plugin-nextjs`

---

## Project Structure

```
src/
  app/
    api/           # API routes (auth, dashboard, employees, export, etc.)
    dashboard/     # Main dashboard + employee sub-views
    onboarding/    # 5-step company setup wizard
    auth/          # Login page
    claim-profile/ # Member employee linking
    assess/        # Assessment flow
    reports/       # Detailed report pages
  components/
    layout/        # AppShell, Sidebar, ViewToggle
    dashboard/     # KPI, charts, heatmap, tables
  lib/
    auth.ts        # Session verification
    prisma.ts      # Prisma client singleton
    scoring-engine.ts  # Skill gap calculations
    roi-engine.ts      # ROI/cost-of-inaction estimates
    incentive-engine.ts # Government incentive matching
    seed-demo.ts       # Demo data generator
prisma/
  schema.prisma    # Database schema
  seed.ts          # Build-time seed script
  seed-data/       # JSON fixtures (skills, questions, incentives, etc.)
```

---

## Deploying to Netlify

The app is configured for Netlify deployment via `netlify.toml`:

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Link to your Netlify site
netlify link

# Deploy
netlify deploy --build --prod
```

The build command runs `prisma generate && prisma db push && prisma db seed && next build`, which pre-seeds the SQLite database with demo data during build time. This is necessary because Netlify's serverless functions have a read-only filesystem at runtime.
