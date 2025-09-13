# Deployment Guide

## Prerequisites

1. **Supabase Database Setup**
   - Run the migration script: `node scripts/migrate.js`
   - If tables don't exist, manually create them in Supabase SQL Editor:
     - Go to: https://supabase.com/dashboard/project/htswobvtqtfmytmlfhjt/sql
     - Copy and paste the contents of `scripts/001_create_tables.sql`
     - Click "Run" to execute the migration

2. **Environment Variables**
   - All required environment variables are already configured in `.env.local`
   - For production deployment, these will be added to Vercel

## Vercel Deployment

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the application:
   ```bash
   vercel
   ```

4. Add environment variables to Vercel:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add SUPABASE_JWT_SECRET
   vercel env add POSTGRES_URL
   vercel env add POSTGRES_PRISMA_URL
   vercel env add POSTGRES_URL_NON_POOLING
   vercel env add POSTGRES_USER
   vercel env add POSTGRES_HOST
   vercel env add POSTGRES_PASSWORD
   vercel env add POSTGRES_DATABASE
   ```

### Option 2: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Configure environment variables in the dashboard:
   - Add all variables from `.env.local`
   - Make sure to set the correct values for production

### Environment Variables for Vercel

Copy these values from your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=https://htswobvtqtfmytmlfhjt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=xfIeQK1fWsU7Nh/hxSROzsh8Iq3nmSgYLbgFixzfpzqyD404cVlxj7UOCVTE2bctOh3w2LIHFahQhkvn1afV2Q==
POSTGRES_URL=postgres://postgres.htswobvtqtfmytmlfhjt:6mTM2072Xfl0baSa@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_PRISMA_URL=postgres://postgres.htswobvtqtfmytmlfhjt:6mTM2072Xfl0baSa@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
POSTGRES_URL_NON_POOLING=postgres://postgres.htswobvtqtfmytmlfhjt:6mTM2072Xfl0baSa@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
POSTGRES_USER=postgres
POSTGRES_HOST=db.htswobvtqtfmytmlfhjt.supabase.co
POSTGRES_PASSWORD=6mTM2072Xfl0baSa
POSTGRES_DATABASE=postgres
```

## Post-Deployment

1. Verify the application is running correctly
2. Test database connectivity
3. Test all features (search, ratings, reactions)
4. Monitor for any errors in Vercel dashboard

## Troubleshooting

- If deployment fails, check the build logs in Vercel dashboard
- Ensure all environment variables are correctly set
- Verify database tables are created in Supabase
- Check that Supabase RLS policies allow the required operations