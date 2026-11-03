# Free Agent HQ

An AI platform that lets athletes in every sport run their own careers without paying an agent's commission. Coaches and GMs use it to find and sign players. Brands use it to post NIL and sponsorship deals straight to athletes.

## What's built

| Space | Who | What it does |
|---|---|---|
| **My career** (`/athlete`) | Athletes | Profile, season-by-season stat production, game metrics, an AI scouting report (fit by play style, strengths, weaknesses, percentiles), tryouts posted by teams, invites and offers from teams, deal pricer |
| **Team center** (`/team`) | Coaches, GMs, scouts | Create a team (creator becomes GM), search athletes ranked by fit for your system, big board (Watching → Evaluating → Tryout invite → Offer sent → Signed), post tryouts, invite staff with role permissions |
| **NIL** (`/nil`) | Athletes and brands | Marketplace and applications, an "Is this deal OK?" check for NIL Go and the House settlement, earnings and tax set-aside. Brands post deals and accept or decline applicants |

Staff permissions are enforced in Postgres row-level security, not only in the UI:

| Action | GM | Head coach | Position coach | Scout |
|---|---|---|---|---|
| Search, read reports, add to board | ✓ | ✓ | ✓ | ✓ |
| Invite to tryout, post tryouts | ✓ | ✓ | | |
| Send offers, mark signed, manage staff | ✓ | | | |

## Scouting model

`lib/scouting.ts` defines the metrics for each sport (football WR, basketball PG, soccer winger, baseball pitcher), with peer benchmarks (mean and standard deviation). A value becomes a percentile through the normal CDF. Each play style weights the metrics it depends on, and fit is the weighted average percentile. The benchmarks are starting estimates. Replace them with real peer distributions as data grows, and add positions.

## Stack

- Next.js 14 (App Router, TypeScript)
- Supabase: auth, Postgres, row-level security (project `free-agent-hq`)
- Deployed on Railway

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Database migrations are in `supabase/migrations` and have already been applied to the Supabase project.

## Business model (from `docs/competitor-research.md`)

Athletes never pay a percentage. The people who want access to athletes pay.

- **Athletes:** free tier (profile, matches, one scouting report, basic NIL check), Pro at $19/month, Pro Pathway at $49/month or $299 per tryout cycle, contract review at $29 (AI) or $149 (partner attorney).
- **Teams ("Scout Desk"):** $99/month for small programs, $499/seat/month for pro-development leagues, $25K–$150K/year for top pro and college programs.
- **Leagues and teams:** pay for virtual trials ($5K–$50K per campaign), so athletes apply free.
- **Brands:** a 10% fee paid by the brand on top of athlete pay, plus plans at $0, $99 and $499 a month.
- **Data:** pricing and deal-outcome data sold to brands and schools.

To stay outside state athlete-agent laws, the platform takes no cut of athlete pay, has no staff soliciting athletes, and the athlete sends every message. Get a legal opinion before adding anything that negotiates for an athlete.

`docs/prototype.html` is the clickable design prototype.
