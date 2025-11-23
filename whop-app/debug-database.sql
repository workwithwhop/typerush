-- Debug script to check your database structure
-- Run this in your Supabase SQL editor to see what's actually in your database

-- 1. Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check the structure of the users table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 3. Check if there are any users in the table
SELECT COUNT(*) as user_count FROM users;

-- 4. Check a sample user record (if any exist)
SELECT * FROM users LIMIT 1;

-- 5. Check if there are any constraints or policies
SELECT conname, contype, confrelid::regclass
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;

-- 6. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users';
