-- Fix RLS policies for the users table
-- This will allow users to create and update their own records

-- First, let's see what RLS policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for all users" ON users;
DROP POLICY IF EXISTS "Enable update for all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Temporarily disable RLS to allow all operations
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with permissive policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new, very permissive policies
-- Allow everyone to read all user data (needed for leaderboard, etc.)
CREATE POLICY "Allow all read access" ON users
    FOR SELECT USING (true);

-- Allow everyone to insert user data
CREATE POLICY "Allow all insert access" ON users
    FOR INSERT WITH CHECK (true);

-- Allow everyone to update user data
CREATE POLICY "Allow all update access" ON users
    FOR UPDATE USING (true) WITH CHECK (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';