# PerDiem.fyi

Travel nurse per diem calculator. Plug in your assignment ZIP and see what GSA says your stipend should be. The math your recruiter won't show you.

## Architecture

```
ZIP (user input)
  → gsa_zip_mappings (40,426 rows) → destination_id
  → gsa_rates (297 localities, FY2026) → lodging + meals rates
  → hud_fmr (36 metros) → fair market rent
  → financials engine → pay breakdown, negotiation bands, contract projection
```

## Data Sources

| Table | Rows | Source | Refresh |
|-------|------|--------|---------|
| `gsa_zip_mappings` | 40,426 | GSA API endpoint 6 | Annually (Oct 1) |
| `gsa_rates` | 297 | GSA per diem rates | Annually (Oct 1) |
| `hud_fmr` | 36 | HUD Fair Market Rents | Annually |
| `nlc_compact_states` | 53 | NCSBN.org | As states join/leave |
| `state_income_tax` | 51 | Tax Foundation 2025 | Annually |
| `cms_hospitals` | 35 | CMS Hospital Compare | Quarterly |
| `pay_reports` | 0+ | Crowdsourced via calculator | Continuous |

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://hixjxztrblfjbwavyyph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Required for pay report ingestion (server-side only)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Optional
IP_HASH_SALT=<random-string>     # Salt for IP hashing in pay_reports
NEXT_PUBLIC_SITE_URL=https://perdiem.fyi
```

## Local Development

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # Production build
npx tsc --noEmit     # Type check
```

## Deploy

Connected to Vercel via GitHub (`Kfarkye/perdiem`). Push to `main` triggers auto-deploy.

1. Push code: `git push origin main`
2. Vercel auto-builds with Next.js preset
3. Add domain: Vercel → Domains → `perdiem.fyi`
4. DNS: Point `perdiem.fyi` to Vercel

## API

### POST `/api/v1/lookup-stipend`

```json
{
  "zip": "07030",
  "gross_weekly": 2500,
  "hours": 36,
  "specialty": "RN",
  "agency_name": "Aya Healthcare"
}
```

Returns: location, GSA rates, pay breakdown, housing analysis, negotiation bands, 13-week projection.

Rate limited: 20 req/min per IP. Input validated with Zod.

## Key Design Decisions

- **Destination ID joins**: GSA uses multi-county locality strings (e.g., "Essex / Bergen / Hudson / Passaic"). The `destination_id` is the only reliable join key between ZIP mappings and rate tables.
- **Seasonal lodging**: GSA rates vary by month. The calculator uses the current month's rate, not `max_lodging`.
- **20% flat tax estimate**: Conservative baseline. Labeled as an estimate throughout. Travel nurse effective rates vary by filing status, deductions, and state.
- **Fire-and-forget ingestion**: Pay reports are inserted asynchronously to keep calculator responses fast. Uses service role client (not anon key) for trusted writes.
