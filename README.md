# Next.js Infrastructure Checker Clone (SoftBank-like Flow)

A production-oriented full-stack starter using **Next.js App Router + Prisma + PostgreSQL** to implement a Japanese address flow:

`Zipcode -> Chome -> Banchi/Building Matching -> Eligibility`

## Tech Stack

- Next.js (App Router)
- React + Tailwind CSS
- Prisma + PostgreSQL (Neon/Supabase)
- Vercel Serverless Functions (`app/api/...`)

## Directory Structure

```text
.
├─ app/
│  ├─ api/
│  │  └─ address/
│  │     ├─ zipcode/route.ts
│  │     ├─ banchi-suggest/route.ts
│  │     ├─ banchi-matching/route.ts
│  │     └─ eligibility/route.ts
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  └─ address-checker.tsx
├─ lib/
│  ├─ prisma.ts
│  ├─ normalization.ts
│  ├─ matching.ts
│  └─ http.ts
├─ prisma/
│  └─ schema.prisma
├─ .env.example
├─ vercel.json
├─ package.json
└─ tsconfig.json
```

## API Routes

- `GET /api/address/zipcode?zipCode=3320034`
  - Returns `prefecture/city/chome` list by zipcode.
- `POST /api/address/banchi-matching`
  - Input: `{ chomeId, rawBanchi }`
  - Runs weighted matching with strong priority on house numbers.
- `GET /api/address/banchi-suggest?chomeId=...&query=...`
  - Returns real-time suggestions while user types banchi/building text.
- `GET /api/address/eligibility?buildingId=...`
  - Returns `eligible_plans` mapped from `ServiceAvailability`.

## Setup

1. Clone

```bash
git clone https://github.com/nhuhung1995/cloneapisb2.git
cd cloneapisb2
```

2. Install

```bash
npm install
```

3. Configure env

```bash
cp .env.example .env
```

4. Generate Prisma client + push schema

```bash
npx prisma generate
npx prisma db push
npm run prisma:seed
```

5. Run local

```bash
npm run dev
```

## Database / Pooling Notes (Important on Vercel)

Serverless functions can exhaust DB connections quickly. Use one of these:

1. Neon pooled connection string.
2. Supabase transaction pooler endpoint.
3. Prisma Accelerate.

Use pooled connection in `DATABASE_URL` for production.

## Vercel Deployment (One-click)

1. Push to GitHub.
2. In Vercel, import `nhuhung1995/cloneapisb2`.
3. Set framework preset to **Next.js**.
4. Add environment variables from `.env.example`.
5. Deploy.

## Data Model Highlights

- Hierarchy tables: `Prefecture -> City -> Chome -> Banchi -> Building`
- Availability table: `ServiceAvailability`
- Infrastructure enum: `VDSL`, `VDSL_G`, `FIBER_1G`, `FIBER_10G`, `AIR_5G`

## Matching Logic

`/api/address/banchi-matching` applies weighted scoring:

- 75% weight: numeric house sequence (`banchi/go`) accuracy
- 25% weight: normalized text similarity

This is resilient for mixed input like:

- `2-17`
- `2丁目17番6号`
- `２丁目１７番６号 レジデンス`

## License

For internal and authorized use.
