# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

Mutu — a free Swedish lending service ("låna av folk du litar på"). Items are shared into **sheds** (skjul): trusted circles like Grannar/Vänner that control who can see and borrow what. Around that sits a full loan flow: request with desired period → date negotiation in a chat thread → approval → calendar. All UI copy is Swedish; code, comments, and commit messages are English/Swedish mixed (commits in English).

The design source of truth is `design_handoff_mutuu/` — hi-fi HTML mockups plus a README with exact design tokens, copy, and behavior. When building or changing UI, check it first. `Mutu Prototyp.dc.html` (the logic class inside) is the behavior spec.

## Commands

Two processes for local dev:

```bash
npx convex dev        # backend: deploys convex/ functions on save, regenerates types
npm run dev           # frontend on :3000
```

- `npm test` — Vitest + convex-test (all), `npx vitest run tests/dates.test.ts` for one file, `npx vitest -t "dubbelbokning"` for one suite
- `npm run lint` / `npm run build` — build runs tsc; convex dev typechecks the backend
- `npm run seed` — idempotent dev data: users berit/jonas/sara@dev.mutu (password `mutu1234`), sheds joinable at `/join/dev-grannar` and `/join/dev-vanner`
- Password login form on `/login` is dev-only (hidden in production); production uses magic links
- Inspect data: `npx convex data <table>` (add `--prod` for production), run functions: `npx convex run seed:run`
- Prod env vars: `npx convex env set --prod KEY value`
- **Git push**: this repo belongs to the personal GitHub account `ketels`, but the default SSH key resolves to the work account. Push with:
  `GIT_SSH_COMMAND="ssh -i ~/.ssh/github-private.pub -o IdentitiesOnly=yes -o BatchMode=yes" git push`

## Deployment

Push to `main` → Vercel builds with `npx convex deploy --cmd 'npm run build'`, which deploys both the Convex production backend (`content-dragon-202`) and the Next.js frontend (mutu-ten.vercel.app). There is no separate deploy step. Everything runs on free tiers (Convex US East, Vercel Hobby, Resend) — keep it that way.

## Architecture

**All backend logic lives in `convex/`** (queries/mutations/actions). The Next.js side (`app/`, `components/`) is thin: client components calling `useQuery`/`useMutation`. Reactivity is the realtime mechanism — chat, loan lists, and the unread badge update live because `useQuery` re-runs on data changes; there is no other realtime plumbing.

**Authorization replaces RLS** and is enforced inside every Convex function via helpers in `convex/lib/access.ts`: `requireUser`, `assertShedMember`, `assertCanSeeItem` (owner or member of a shed the item is shared into), `assertLoanParty`. The shed-membership graph is the only access model — even person profiles (`convex/people.ts`) require a shared shed. Never return data without going through these checks; `tests/authorization.test.ts` guards the rules.

**Sharing model**: `itemShares` (item ↔ shed) is the single source of truth for visibility, toggled by the sharing matrix (`components/items/SharingMatrix.tsx`, optimistic updates). The Utforska feed deliberately excludes your own items.

**Loan state machine** (`convex/loans.ts`): `pending → proposed → approved → returned` plus `declined`/`cancelled`. "Pågår" and "försenad" are **derived in the UI from dates, never stored**. Dates are whole-day ISO strings (`"2026-07-05"`) compared lexicographically; helpers in `convex/lib/dates.ts` (backend, no deps) and `lib/dates.ts` (frontend, date-fns/sv). Today is computed in Europe/Stockholm. Double-booking is prevented by an overlap check inside the mutation — safe because Convex mutations are serializable transactions.

**Chat threads are loans**: `messages` rows belong to a `loanId`; kinds are `text`/`system`/`period`/`proposal`, where proposals carry `proposalState: open|accepted|hidden` (declined proposals are hidden, not deleted). The unread badge derives from `loanReads.lastReadAt` vs latest message time.

**Emails** (`convex/emails.ts`) are fired via `ctx.scheduler.runAfter(0, internal.emails.loanEvent, ...)` from loan mutations, plus a daily cron (`convex/crons.ts`, 05:00 UTC) for return reminders. Email sending is a silent no-op when `RESEND_API_KEY` is unset (local dev).

**Design system**: all tokens live as `@theme` CSS variables in `app/globals.css` (colors, shed palette, radii, shadows, animations) — use the Tailwind classes they generate (`bg-bg`, `text-muted`, `rounded-card`, `border-divider`...), never hardcode hex in components except via `lib/shed-colors.ts`. Shed colors are always resolved from `colorIdx` (0–4) through `shedColor()`; the palette is fixed and earthy. Typography is Schibsted Grotesk; brand wordmark is written `mutu.` (with period) in logo contexts only, not in body copy.

**Auth**: Convex Auth (`convex/auth.ts`) with Resend magic links + a Password provider used only by seeds/dev/tests. `middleware.ts` guards routes (public: `/login`, `/join/*`). Onboarding (name → geocoded address via Nominatim) is enforced client-side by `components/OnboardingGate.tsx`; `users.onboardedAt` marks completion. Join links store their token in a cookie when logged out; `components/JoinTokenRedeemer.tsx` redeems it after onboarding.

## Testing notes

`tests/authorization.test.ts` uses convex-test with an explicit `import.meta.glob` over `convex/**` — new top-level convex files are picked up automatically, but the generated `_generated/*.js` must exist (run `npx convex dev` or `codegen` first). Identity is faked with `t.withIdentity({ subject: "<userId>|session" })`.
