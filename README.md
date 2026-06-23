# Trading Journal

A discipline-first prop-trading dashboard. Every number — balance, PnL, win
rate, R-multiples, profit factor — is computed from the trades you log.
Nothing is entered manually anywhere else in the app.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase · Recharts ·
FullCalendar

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. **The app works immediately with no setup** —
if Supabase isn't configured yet, it runs in local demo mode (data lives in
your browser's localStorage, seeded with a few sample trades) so you can try
every feature right away.

## Login

This is a private, single-user app, gated by a hardcoded username/password.

Change the credentials in **`lib/auth-config.ts`** before you use this for
real:

```ts
export const AUTH_USERNAME = "dinesha";
export const AUTH_PASSWORD = "changeme123";
```

Note: because this is a client-side app, anyone with access to the deployed
JS bundle could technically find these values in the source. This gate is
meant to keep the app off casual/accidental access, not to withstand a
determined attacker. If you ever need real security, swap this for Supabase
Auth.

## Connecting Supabase (for real persistence)

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run everything in `supabase/schema.sql`. This
   creates the `accounts`, `symbols`, `strategies`, and `trades` tables, a
   public storage bucket for trade screenshots, open RLS policies (single
   user, no auth), and seeds one starter account + strategy.
3. Copy `.env.local.example` to `.env.local` and fill in your project URL
   and anon key (Project Settings → API):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

4. Restart `npm run dev`. The app now reads/writes Supabase instead of
   localStorage — your local demo data won't carry over automatically.

The Supabase RLS policies in `schema.sql` are intentionally open (`true`)
since this app has no multi-user auth model. If you deploy it somewhere
other than your own machine, add Supabase Auth and scope the policies to
`auth.uid()`.

## How the numbers work

Nothing is hardcoded in the UI. The calculation engine lives entirely in
`lib/calculations.ts`:

- **Risk $** = current account balance × risk % (account balance compounds
  as trades close, so risk sizing stays correct over time).
- **R-multiple** = how many "risk units" a trade made or lost, derived from
  entry, exit, and stop-loss price.
- **PnL** = R-multiple × Risk $.
- **Win rate / profit factor / avg R** are aggregated from every trade's
  derived PnL and R-multiple.

One addition beyond the original spec: a **Stop Loss Price** field was added
to the trade form. It's required to derive R-multiple and PnL purely from
data (as the brief asks for) and lines up with the existing "Stop loss is
clearly defined" checklist item — there was no other field carrying that
information.

## Project structure

```
app/                Routes: dashboard, journal, calendar, strategy
components/
  auth/              Login gate
  layout/            Sidebar, top bar, theme/account/logout
  dashboard/         KPI cards, account balance chart
  journal/           Trade form, selectors, checklist, image upload, table
  review/            Full-screen trade review modal + screenshot viewer
  calendar/          FullCalendar wrapper, day-trades modal
  strategy/          (inline in app/strategy/page.tsx)
lib/
  calculations.ts    All derived-metric math — the single source of truth
  store.ts           Data layer (Supabase or localStorage, same API either way)
  hooks/             useTradeData (global data context), useAuth
  auth-config.ts     Hardcoded login credentials
supabase/schema.sql  Full SQL schema + RLS policies + storage bucket
```

## Deploying

Any Next.js host works (Vercel, etc.). Set the `NEXT_PUBLIC_SUPABASE_*` env
vars in your host's dashboard, and update `lib/auth-config.ts` with real
credentials before going live.
