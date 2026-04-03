# Not Boosted

A MapleStory Guild Progression Tracker. Replaces a shared Google Spreadsheet with a collaborative web app — members log in, manage their characters and gear, track boss drops, and view a guild-wide dashboard.

**Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Supabase + GitHub Pages

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in your Supabase URL and anon key (see Supabase Setup below)

# 3. Start dev server
npm run dev
# → http://localhost:5173/not_boosted/
```

---

## Supabase Setup

### 1. Create a project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click **New Project** and fill in:
   - Name: `not-boosted`
   - Database password: save this somewhere safe
   - Region: pick the closest to you
3. On the project creation screen:
   - ✅ **Enable Data API** — required for the JS client to work
   - ⬜ **Automatic RLS** — leave off, the schema SQL handles this explicitly
   - **Advanced config** — leave all defaults
4. Click **Create Project** and wait ~2 minutes

### 2. Run the schema

1. In your Supabase dashboard, go to **SQL Editor** → **New query**
2. Paste the entire contents of `supabase-schema.sql`
3. Click **Run** (`Cmd+Enter`)

You should see 5 tables appear in **Table Editor**: `users`, `characters`, `gear_slots`, `meso_savings`, `boss_drops`.

### 3. Get your credentials

1. Go to **Project Settings** (gear icon) → **Data API**
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon public key** → `VITE_SUPABASE_ANON_KEY`
3. Paste into your `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

> The anon key is safe to use in frontend code — security is enforced by RLS policies in the database, not by keeping this key secret.

### 4. Create your admin account

1. Go to **Authentication** → **Users** → **Add user** → **Create new user**
2. Enter your email + password → **Create user**
3. Go to **Table Editor** → `users` table → find your row → set `role` to `admin`

---

## GitHub Pages Deploy

### One-time setup

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add two repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Go to **Settings** → **Pages** → set Source to **Deploy from a branch** → branch: `gh-pages`

### Deploy

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`) which builds and deploys automatically.

To deploy manually:
```bash
npm run deploy
```

---

## NPM Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Build + push to `gh-pages` branch |

---

## Project Structure

```
src/
├── components/       # Shared UI components
│   ├── Layout.tsx    # Sidebar + page outlet shell
│   ├── Sidebar.tsx   # Left navigation
│   └── ProtectedRoute.tsx
├── context/
│   └── AuthContext.tsx  # Auth state + signIn/signOut
├── lib/
│   └── supabase.ts   # Supabase client
├── pages/            # One file per route
│   ├── Login.tsx
│   ├── Guild.tsx
│   ├── Player.tsx
│   ├── Characters.tsx
│   ├── CharacterDetail.tsx
│   ├── Drops.tsx
│   └── Admin.tsx
└── types/
    └── index.ts      # TypeScript types + GEAR_SLOTS / BOSSES constants
```
