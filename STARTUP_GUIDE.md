# Scroll Souls - Startup Guide

## Prerequisites Checklist

Before running the app, ensure you have completed these steps:

### 1. Neon Database Setup ✓
- [x] Database created on Neon
- [x] All 18 tables created (profiles, check_ins, journal_entries, emotions, etc.)
- [x] Authentication fields added to profiles table (password_hash, email_verified, etc.)

**Your Database has:**
- `profiles` table with columns: id, email, password_hash, display_name, created_at, updated_at, etc.
- `emotions` table with all mood types (Joy, Sadness, Anger, Fear, Stress, Peace, Love, Tired)
- All other feature tables ready (mood_posts, organizations, therapists, etc.)

### 2. Environment Variables

The following environment variable is REQUIRED:

```
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

**Where to set it:**
- In Vercel Dashboard: Settings → Environment Variables
- OR create a `.env.local` file locally with this value

The system has automatically requested `DATABASE_URL` from your Vercel project settings.

### 3. Start the Development Server

Once `DATABASE_URL` is configured, run:

```bash
npm run dev
# or
pnpm dev
```

The app will be available at `http://localhost:3000`

## How Sign-Up/Login Works

### Sign-Up Flow:
1. User enters email, password, and display name
2. Password is hashed using bcryptjs
3. Profile is created in the `profiles` table with hashed password
4. Session cookie `auth_session` is created (30-day expiration)
5. User is redirected to `/home` dashboard

### Login Flow:
1. User enters email and password
2. Password is verified against the hashed password in database
3. If valid, session cookie is created
4. User is redirected to `/home`

### Protected Routes:
The following routes require authentication:
- `/home` - Dashboard
- `/check-in` - Check-in page
- `/journal` - Journal entries
- `/profile` - User profile
- `/mood-wall` - Community mood posts
- `/organizations` - Team management
- `/therapist` - Therapist hub

Unauthenticated users are redirected to `/auth/login`

## Database Tables Ready to Use

All 18 tables are created and configured:

```
profiles              - User accounts with password hashing
emotions              - Mood types (Joy, Sadness, Anger, etc.)
check_ins             - Daily mood check-ins
journal_entries       - User journal/diary entries
mood_posts            - Community mood sharing
post_reactions        - Reactions to community posts
post_comments         - Comments on mood posts
user_badges           - Badges earned by users
badges                - Badge definitions
challenges            - Wellness challenges
user_challenges       - Challenge progress
organizations         - Team/group management
organization_members  - Team members
therapists            - Therapist profiles
therapist_bookings    - Therapy session bookings
therapist_messages    - Messaging between users and therapists
friendships           - Friend connections
mood_insights         - Emotional analytics
```

## Authentication System

**Authentication Method:** Custom Neon-based with bcryptjs hashing

**Files Involved:**
- `app/actions/auth.ts` - Sign-up and login actions
- `lib/neon/auth.ts` - Session management
- `middleware.ts` - Route protection
- `app/auth/sign-up/page.tsx` - Sign-up page
- `app/auth/login/page.tsx` - Login page

**Session Management:**
- HTTP-only cookies (secure, cannot be accessed via JavaScript)
- 30-day expiration
- SameSite: Lax (CSRF protection)

## Troubleshooting

### Error: "next: command not found"
**Solution:** Dependencies aren't installed. Run:
```bash
npm install
# or
pnpm install
```

### Error: "Failed to fetch" during sign-up
**Solution:** Ensure `DATABASE_URL` is set in environment variables and the dev server is running.

### Error: "Database connection failed"
**Solution:** Verify your `DATABASE_URL` is correct and the Neon database is accessible.

### Error: "Email already registered"
**Solution:** The email already exists in the database. Use a different email or reset the database.

## Architecture Overview

```
Landing Page (/)
├── Not Authenticated → Shows Sign-Up / Login buttons
└── Authenticated → Shows Dashboard buttons

Auth Flow
├── Sign-Up (/auth/sign-up) → Creates profile → Redirects to /home
└── Login (/auth/login) → Validates credentials → Redirects to /home

Dashboard (/home)
├── Check-In (/check-in)
├── Journal (/journal)
├── Profile (/profile)
├── Mood Wall (/mood-wall)
├── Organizations (/organizations)
└── Therapist Hub (/therapist)

Database Layer
└── Neon PostgreSQL with 18 tables
    ├── User Management (profiles, friendships)
    ├── Tracking (check_ins, journal_entries, mood_insights)
    ├── Community (mood_posts, post_reactions, post_comments)
    ├── Gamification (badges, user_badges, challenges, user_challenges)
    ├── Organizations (organizations, organization_members)
    └── Therapy (therapists, therapist_bookings, therapist_messages)
```

## Next Steps

1. **Set DATABASE_URL** in your Vercel environment variables
2. **Run the dev server:** `npm run dev`
3. **Visit http://localhost:3000** in your browser
4. **Click "Get Started Free"** to sign up
5. **Fill in your details** and submit
6. **Verify you can log in** with the created account

Your profiles table is ready to accept users!
