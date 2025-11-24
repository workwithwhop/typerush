-- SQL script to reset all users' lives to 0
-- Run this in your Supabase SQL editor to fix existing users

UPDATE users 
SET lives = 0 
WHERE lives = 3 OR lives IS NULL;

-- Verify the update
SELECT id, username, name, lives FROM users;

