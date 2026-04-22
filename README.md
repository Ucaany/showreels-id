# VideoPort AI Hub

Next.js 16 App Router project for a video portfolio platform with:

- Drizzle ORM + Supabase PostgreSQL
- Supabase Auth (email/password + Google login)
- Creator public profiles and public video pages
- Tailwind CSS and full-light creator dashboard
- Vercel-ready deployment flow
- URL-only media storage policy (no base64 media stored in DB)

## Local setup

1. Copy `.env.example` to `.env.local`
2. Fill these values:
   - `DATABASE_URL`
   - `DATABASE_URL_MIGRATION` (direct migration connection)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH`
   - `ADMIN_EMAILS=hello@ucan.com`
   - `OWNER_EMAIL`
   - `OWNER_PASSWORD`
   - `NEXT_PUBLIC_APP_URL`
3. Install dependencies:

```bash
npm install
```

4. Push the schema to PostgreSQL:

```bash
npm run db:push
```

5. Seed owner/admin account:

```bash
npm run db:seed:owner
```

6. Start development:

```bash
npm run dev
```

Open `http://localhost:3002`

## Supabase Auth setup

Configure these URLs in the Supabase Auth dashboard:

- Site URL: `https://video-port-id.vercel.app`
- Redirect URL local reset: `http://localhost:3002/auth/reset-password`
- Redirect URL production reset: `https://video-port-id.vercel.app/auth/reset-password`
- Redirect URL local callback: `http://localhost:3002/auth/callback`
- Redirect URL production callback: `https://video-port-id.vercel.app/auth/callback`

Enable email/password auth, disable email confirmation for immediate login, and enable Google provider with the project's Google OAuth client.

Google login button hanya muncul ketika `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true`.

## Database workflow

Generate migration files:

```bash
npm run db:generate
```

Push schema directly in development:

```bash
npm run db:push
```

Run generated migrations:

```bash
npm run db:migrate
```

Seed owner account:

```bash
npm run db:seed:owner
```

Drizzle docs: [orm.drizzle.team/docs/get-started/postgresql-new](https://orm.drizzle.team/docs/get-started/postgresql-new)

## Deploy to Vercel

1. Push this project to GitHub.
2. Import the repo into Vercel.
3. Add the same environment variables from `.env.local` to the Vercel project:
   - `DATABASE_URL`
   - `DATABASE_URL_MIGRATION` (optional but recommended for CLI migration jobs)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH`
   - `ADMIN_EMAILS`
   - `OWNER_EMAIL`
   - `OWNER_PASSWORD`
   - `NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app`
4. Provision a Supabase PostgreSQL project and set connection strings:
   - `DATABASE_URL` for runtime should use the Supabase pooler connection string
   - `DATABASE_URL_MIGRATION` should keep using the direct database host for migrations and backfills
5. Configure Supabase Auth site URL, redirect URLs, and Google provider for your Vercel domain.
6. Trigger a new deployment.

If you use the Vercel CLI locally, pull env vars with:

```bash
vercel env pull
```

Vercel environment variable docs: [vercel.com/docs/environment-variables](https://vercel.com/docs/environment-variables)

## Notes

- Runtime will fail fast when `DATABASE_URL` is missing.
- Runtime on Vercel should use the pooler connection string, not the direct `db.<project-ref>.supabase.co` host.
- Admin access is fail-closed when `ADMIN_EMAILS` is empty.
- Media URLs for avatar/cover/thumbnail/gallery are URL-only (`http/https`) to keep DB usage lean.
- The app builds with `next build --webpack` because this machine falls back to the WASM SWC path on Windows.
- If `npm run dev` is already using a port, start another one with `npm run dev -- --port 3003`.
