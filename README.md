# mutu

Gratis delningstjänst för verktyg och saker — låna av folk du litar på. Sakerna
delas i **skjul**: kretsar som Vänner, Grannar och Familjen. Runt det finns ett
komplett låneflöde: förfrågan med önskad period → dialog/motförslag om datum →
godkännande → kalender med hämtningar och återlämningar.

Designen kommer från hi-fi-handoffen i [`design_handoff_mutuu/`](design_handoff_mutuu/README.md).

## Stack

- **Next.js** (App Router, TypeScript) på Vercel
- **Convex** — databas, auth, realtid, fillagring, cron
- **Convex Auth** — magic link via Resend (+ lösenordskonton för dev/test)
- **Tailwind v4** — design tokens som `@theme` i [app/globals.css](app/globals.css)
- **Resend** — e-postnotiser vid lånehändelser + daglig påminnelsecron

## Kom igång lokalt

```bash
npm install
npx convex dev        # startar/kopplar Convex-deployment + kodgenerering
npm run seed          # testdata: berit/jonas/sara@dev.mutu, lösenord mutu1234
npm run dev           # Next.js på :3000
```

Första gången behöver Convex Auth nycklar på deploymenten:

```bash
npx @convex-dev/auth  # sätter JWT_PRIVATE_KEY + JWKS
npx convex env set SITE_URL http://localhost:3000
```

Logga in med dev-formuläret längst ner på inloggningssidan (bara synligt i
development). Gå med i seed-skjulen via `/join/dev-grannar` eller
`/join/dev-vanner`.

## Miljövariabler

| Variabel | Var | Beskrivning |
| --- | --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | Next (.env.local) | Convex-deploymentens URL |
| `CONVEX_DEPLOYMENT` | Next (.env.local) | Sätts av `npx convex dev` |
| `SITE_URL` | Convex env | Bas-URL för länkar i mail och magic links |
| `AUTH_RESEND_KEY` | Convex env | Resend-nyckel för magic link-mailen |
| `RESEND_API_KEY` | Convex env | Resend-nyckel för notismail (utan: mail av) |
| `EMAIL_FROM` | Convex env | Avsändare, t.ex. `Mutu <hej@mutu.se>` |

## Tester

```bash
npm test
```

Vitest + [convex-test](https://docs.convex.dev/functions/testing): auktorisering
(vem ser vad), dubbelbokningsskydd, lånets statusmaskin och datum-/avståndslogik.

## Deploy

Vercel bygger frontend; `npx convex deploy` i build-steget pekar den mot
produktions-deploymenten. Convex free tier + Vercel Hobby + Resend free räcker
för grannskapsskala.
