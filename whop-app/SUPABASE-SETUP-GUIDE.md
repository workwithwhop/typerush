# Supabase Setup Guide for BubbleType

## Problem
After migrating your Supabase project to a new account, the database isn't working because the new project needs proper configuration.

## Solution - Follow These Steps:

### Step 1: Run the SQL Setup Script

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `grhuhmrwwuvxbvvkvlle`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase-setup.sql` file
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)

This will:
- Create all necessary tables (if they don't exist)
- Enable Row Level Security (RLS)
- Create policies to allow public access (needed for your game)
- Add indexes for better performance
- Enable realtime updates

### Step 2: Verify Your Data

1. In Supabase Dashboard, click **Table Editor**
2. Check these tables exist:
   - `users`
   - `payments`
   - `user_purchases`
   - `game_scores` (optional)

3. If you migrated data, verify it's there by clicking on each table

### Step 3: Test the Connection

Run the test script to verify everything works:

```bash
cd whop-app
node test-supabase-connection.js
```

You should see:
- ✅ Users table accessible!
- ✅ Payments table accessible!
- ✅ User purchases table accessible!

### Step 4: Restart Your Development Server

```bash
# Stop your current server (Ctrl+C)
# Then restart it
npm run dev
```

## Common Issues & Fixes

### Issue 1: "permission denied for table"
**Fix:** You need to run the SQL setup script to create RLS policies.

### Issue 2: "relation does not exist"
**Fix:** The table wasn't created. Run the SQL setup script.

### Issue 3: Data is missing
**Fix:** You need to migrate your data from the old project:
1. In old project: Go to Table Editor → Export as CSV
2. In new project: Go to Table Editor → Import from CSV

### Issue 4: Realtime not working
**Fix:** The SQL script enables realtime. If still not working:
1. Go to Database → Replication
2. Enable replication for all tables

## Environment Variables (Already Set)

Your `.env.local` file has the correct values:
```
NEXT_PUBLIC_SUPABASE_URL=https://grhuhmrwwuvxbvvkvlle.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Need to Migrate Data?

If you need to copy data from your old Supabase project:

1. **Export from old project:**
   - Go to old project's Table Editor
   - For each table: Click the table → Click "..." → Export as CSV

2. **Import to new project:**
   - Go to new project's Table Editor
   - For each table: Click the table → Click "..." → Import from CSV
   - Upload the CSV file

## Verify Everything Works

After setup, your app should:
- ✅ Show leaderboard data
- ✅ Show top spender
- ✅ Save game scores
- ✅ Track user data
- ✅ Update in realtime

## Still Having Issues?

Check the browser console (F12) for error messages and let me know what you see!
