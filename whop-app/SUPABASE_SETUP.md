# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

## 2. Environment Variables

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Example:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL from `database-schema.sql` file
4. This will create all necessary tables and sample data

## 4. Database Tables Created

- **users**: Store user profiles and heart counts
- **game_scores**: Store game scores and combos
- **heart_purchases**: Store heart purchase transactions

## 5. Features Integrated

- ✅ User heart count tracking
- ✅ Game score leaderboard
- ✅ Top heart buyer display
- ✅ Heart purchase history
- ✅ Real-time data updates

## 6. Security

- Row Level Security (RLS) enabled
- Users can only modify their own data
- Public read access for leaderboards and top buyers
