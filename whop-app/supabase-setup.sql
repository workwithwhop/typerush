-- Supabase Setup Script for BubbleType Game
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. CREATE TABLES (if not already created)
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id text NOT NULL,
  username text NOT NULL UNIQUE,
  name text NOT NULL,
  lives integer DEFAULT 3,
  best_score integer DEFAULT 0,
  best_combo integer DEFAULT 0,
  total_spent numeric DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT now(),
  payment_count integer DEFAULT 0,
  last_payment_date timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  amount numeric NOT NULL,
  payment_type text NOT NULL DEFAULT 'game_continue'::text,
  created_at timestamp with time zone DEFAULT now(),
  payment_count integer DEFAULT 1,
  first_payment_date timestamp with time zone,
  last_payment_date timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_user_id_fkey1 FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- User purchases table
CREATE TABLE IF NOT EXISTS public.user_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_purchases_pkey PRIMARY KEY (id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Game scores table (if you need it for leaderboard)
CREATE TABLE IF NOT EXISTS public.game_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  combo integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT game_scores_pkey PRIMARY KEY (id),
  CONSTRAINT game_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. DROP EXISTING POLICIES (if any)
-- ============================================

DROP POLICY IF EXISTS "Allow public read access to users" ON public.users;
DROP POLICY IF EXISTS "Allow public insert access to users" ON public.users;
DROP POLICY IF EXISTS "Allow public update access to users" ON public.users;

DROP POLICY IF EXISTS "Allow public read access to payments" ON public.payments;
DROP POLICY IF EXISTS "Allow public insert access to payments" ON public.payments;
DROP POLICY IF EXISTS "Allow public update access to payments" ON public.payments;

DROP POLICY IF EXISTS "Allow public read access to user_purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Allow public insert access to user_purchases" ON public.user_purchases;

DROP POLICY IF EXISTS "Allow public read access to game_scores" ON public.game_scores;
DROP POLICY IF EXISTS "Allow public insert access to game_scores" ON public.game_scores;
DROP POLICY IF EXISTS "Allow public update access to game_scores" ON public.game_scores;

-- ============================================
-- 4. CREATE RLS POLICIES (Allow all operations)
-- ============================================

-- Users table policies
CREATE POLICY "Allow public read access to users"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to users"
  ON public.users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to users"
  ON public.users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Payments table policies
CREATE POLICY "Allow public read access to payments"
  ON public.payments FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to payments"
  ON public.payments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to payments"
  ON public.payments FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- User purchases table policies
CREATE POLICY "Allow public read access to user_purchases"
  ON public.user_purchases FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to user_purchases"
  ON public.user_purchases FOR INSERT
  WITH CHECK (true);

-- Game scores table policies
CREATE POLICY "Allow public read access to game_scores"
  ON public.game_scores FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to game_scores"
  ON public.game_scores FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to game_scores"
  ON public.game_scores FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON public.user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON public.game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON public.game_scores(score DESC);

-- ============================================
-- 6. ENABLE REALTIME (for live updates)
-- ============================================

-- Try to add tables to realtime, ignore if already added
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_purchases;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.game_scores;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- DONE! Your database is now ready to use.
-- ============================================
