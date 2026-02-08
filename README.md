# HomeSocial MVP (Netlify + Supabase)

This repo is a **working MVP scaffold** for HomeSocial.com:
- Supabase Auth (email/password)
- Listings (create + feed + detail)
- Media uploads (photos + one hero video) to Supabase Storage
- Listing-centered social: comments/Q&A
- Messaging (basic threads + messages)
- Profile (buyer/seller/pro role)

## 0) Requirements
- Node 18+ installed
- A Supabase project
- A Netlify account

## 1) Supabase setup (10–20 minutes)
### 1.1 Create project
Create a new Supabase project, then grab:
- `Project URL`
- `anon public key`
- (optional) `service_role key` (keep private)

### 1.2 Run the SQL schema
In Supabase: **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, run it.

### 1.3 Create Storage buckets
In Supabase: **Storage → New bucket**
- `listing-photos` (public)
- `listing-videos` (public)

> MVP note: we use *public* buckets for easiest testing. You can lock this down later.

### 1.4 Auth settings
In Supabase: **Authentication → Providers**
- Email enabled
- For MVP, you can disable email confirmations to speed up testing.

## 2) Local dev
1. Copy `.env.example` → `.env.local`
2. Fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Then:
```bash
npm install
npm run dev
```
Open http://localhost:3000

## 3) Deploy to Netlify (fastest)
### 3.1 Upload to GitHub
Create a GitHub repo and push this project.

### 3.2 Netlify new site from Git
- Build command: `npm run build`
- Publish directory: `.next`
- Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Netlify will automatically detect Next.js using the included plugin in `netlify.toml`.

## 4) What to test first
1) Sign up + set profile role
2) Create a listing with 1 video + a few photos
3) View it on the feed + listing page
4) Post a comment
5) Click “Message seller” and send messages

## 5) Next upgrades (optional)
- “Studio wizard” page (script prompts + shot checklist)
- Sponsored Pro marketplace + paid placements
- Search filters (price range, beds, etc.)
- Moderation/reporting, admin role, verified profiles
- Private buckets + signed URLs for media
