# Address Eligibility API (Vercel + Prisma)

Production-ready template for Japanese address matching and eligibility checks using:

- Vercel Serverless Functions (`/api`)
- Prisma + PostgreSQL
- Stateful step flow (`Zipcode -> Chome -> Banchi -> Room -> Eligibility`)
- Fuzzy matching engine with weighted scoring

## Architecture

```text
client
  -> /api/flow/zipcode
  -> /api/flow/chome
  -> /api/flow/banchi
  -> /api/flow/room
  -> /check-availability (rewrite) -> /api/check-availability
                         |
                         +-> Prisma (PostgreSQL)
                         +-> External Provider Adapter (optional)
```

## Project Structure

```text
.
├─ api/
│  ├─ check-availability.js
│  └─ flow/
│     ├─ zipcode.js
│     ├─ chome.js
│     ├─ banchi.js
│     └─ room.js
├─ lib/
│  ├─ db.js
│  ├─ external-provider.js
│  ├─ http.js
│  ├─ matching-logic.js
│  ├─ normalize.js
│  └─ session-store.js
├─ prisma/
│  └─ schema.prisma
├─ .env.example
├─ package.json
└─ vercel.json
```

## Quick Start

1. Clone repository

```bash
git clone https://github.com/nhuhung1995/cloneapisb2.git
cd cloneapisb2
```

2. Install dependencies

```bash
npm install
```

3. Configure environment

```bash
cp .env.example .env
```

4. Generate Prisma client and push schema

```bash
npx prisma generate
npx prisma db push
```

5. Run locally

```bash
npm run dev
```

## API Endpoints

- `POST /api/flow/zipcode`
- `POST /api/flow/chome`
- `POST /api/flow/banchi`
- `POST /api/flow/room`
- `POST /check-availability` (rewritten to `/api/check-availability`)

## Request/Response Example

`POST /check-availability`

```json
{
  "sessionId": "your-session-id",
  "address": {
    "zipCode": "3320034",
    "prefecture": "埼玉県",
    "city": "川口市",
    "chome": "芝2丁目",
    "banchi": "17",
    "go": "6",
    "buildingName": "サンプルマンション"
  }
}
```

Response

```json
{
  "is_eligible": true,
  "matching_score": 0.91,
  "matched_address_id": "clx123...",
  "suggested_plans": [
    { "code": "HIKARI-1G", "name": "Hikari 1G", "speedMbps": 1000 }
  ]
}
```

## Connection Pooling Notes (Important on Vercel)

Vercel Serverless can quickly exhaust direct PostgreSQL connections.

Recommended options:

1. Prisma Accelerate
2. Supabase Transaction Pooler (`pooler.supabase.com` endpoint)
3. Neon pooled connection string

For PostgreSQL URL, use pooled connection in `DATABASE_URL`.

## Deploy to GitHub + Vercel (1-click flow)

1. Push code to your GitHub repo.
2. Open Vercel dashboard and click **Add New Project**.
3. Import `nhuhung1995/cloneapisb2`.
4. Set environment variables from `.env.example`.
5. Click **Deploy**.

After first deploy:

- Run `npx prisma db push` against production DB (from your CI/CD pipeline or local trusted environment).
- Verify endpoint: `POST https://<your-domain>/check-availability`.

## Security

- Protect APIs with `x-api-key` header (`API_KEY`).
- Never commit `.env`.
- Restrict CORS at function level if exposing to browser clients.

## License

Private internal use.
