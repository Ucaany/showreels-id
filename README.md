# VideoPort AI Hub

Next.js 16 App Router project for a video portfolio platform with:

- Drizzle ORM + Supabase PostgreSQL
- Auth.js v5 beta with Credentials + Google login
- Creator public profiles and public video pages
- Tailwind CSS and full-light creator dashboard
- Vercel-ready deployment flow
- URL-only media storage policy (no base64 media stored in DB)

## Local setup

1. Copy `.env.example` to `.env.local`
2. Fill these values:
   - `DATABASE_URL`
   - `DATABASE_URL_MIGRATION` (recommended for direct migration connection)
   - `AUTH_SECRET`
   - `AUTH_TRUST_HOST=true`
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
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

Open `http://localhost:3000`

## Google OAuth callback URLs

Use these callback URLs in Google Cloud Console:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://your-domain.com/api/auth/callback/google`

Auth.js deployment guidance: [authjs.dev/getting-started/deployment](https://authjs.dev/getting-started/deployment)  
Google provider guidance: [authjs.dev/getting-started/providers/google](https://authjs.dev/getting-started/providers/google)

Google login button otomatis muncul ketika `AUTH_GOOGLE_ID` dan `AUTH_GOOGLE_SECRET` terisi.

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
   - `AUTH_SECRET`
   - `AUTH_TRUST_HOST=true`
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - `ADMIN_EMAILS`
   - `OWNER_EMAIL`
   - `OWNER_PASSWORD`
   - `NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app`
4. Provision a Supabase PostgreSQL project and set connection strings in `DATABASE_URL` (+ `DATABASE_URL_MIGRATION` for direct migrations).
5. Update the Google OAuth production callback URL to your Vercel domain.
6. Trigger a new deployment.

If you use the Vercel CLI locally, pull env vars with:

```bash
vercel env pull
```

Vercel environment variable docs: [vercel.com/docs/environment-variables](https://vercel.com/docs/environment-variables)

## Notes

- Runtime will fail fast when `DATABASE_URL` is missing.
- Admin access is fail-closed when `ADMIN_EMAILS` is empty.
- Media URLs for avatar/cover/thumbnail/gallery are URL-only (`http/https`) to keep DB usage lean.
- The app builds with `next build --webpack` because this machine falls back to the WASM SWC path on Windows.
- If `npm run dev` is already using a port, start another one with `npm run dev -- --port 3003`.
