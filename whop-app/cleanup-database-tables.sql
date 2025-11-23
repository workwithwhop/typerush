-- Database Cleanup and Optimization Script
-- This script helps you clean up redundant tables and optimize your database

-- ============================================
-- ANALYSIS: Your Current Tables
-- ============================================

-- 1. users - ✅ KEEP (Main table with all user data)
-- 2. payments - ✅ KEEP (Payment records with single-row-per-user system)
-- 3. user_purchases - ❓ REDUNDANT (Similar to payments, consider removing)
-- 4. payments_backup - ❌ DELETE (Temporary backup table, no longer needed)

-- ============================================
-- STEP 1: Check current table sizes and data
-- ============================================

SELECT 
    'Current Database Analysis' as info,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check row counts
SELECT 
    'Table Row Counts' as info,
    'users' as table_name,
    COUNT(*) as row_count
FROM users
UNION ALL
SELECT 
    'Table Row Counts' as info,
    'payments' as table_name,
    COUNT(*) as row_count
FROM payments
UNION ALL
SELECT 
    'Table Row Counts' as info,
    'user_purchases' as table_name,
    COUNT(*) as row_count
FROM user_purchases
UNION ALL
SELECT 
    'Table Row Counts' as info,
    'payments_backup' as table_name,
    COUNT(*) as row_count
FROM payments_backup;

-- ============================================
-- STEP 2: Compare user_purchases vs payments
-- ============================================

-- Check if user_purchases has any unique data not in payments
SELECT 
    'Data Comparison: user_purchases vs payments' as info,
    'user_purchases' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(amount) as total_amount
FROM user_purchases
UNION ALL
SELECT 
    'Data Comparison: user_purchases vs payments' as info,
    'payments' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(amount) as total_amount
FROM payments;

-- ============================================
-- STEP 3: SAFE CLEANUP OPTIONS
-- ============================================

-- Option A: Keep only essential tables (RECOMMENDED)
-- This will keep: users, payments
-- This will remove: user_purchases, payments_backup

-- Option B: Keep all tables but clean up backup
-- This will keep: users, payments, user_purchases
-- This will remove: payments_backup

-- ============================================
-- STEP 4: Execute cleanup (Choose one option)
-- ============================================

-- OPTION A: Minimal cleanup (Remove only backup table)
-- Uncomment the lines below to execute:

/*
-- Remove payments_backup table (safe to delete)
DROP TABLE IF EXISTS payments_backup;
RAISE NOTICE 'payments_backup table removed';
*/

-- OPTION B: Full cleanup (Remove redundant tables)
-- Uncomment the lines below to execute:

/*
-- First, backup any important data from user_purchases
CREATE TABLE user_purchases_backup AS SELECT * FROM user_purchases;

-- Remove redundant tables
DROP TABLE IF EXISTS user_purchases;
DROP TABLE IF EXISTS payments_backup;

RAISE NOTICE 'Redundant tables removed: user_purchases, payments_backup';
RAISE NOTICE 'Data backed up to user_purchases_backup';
*/

-- ============================================
-- STEP 5: Verify final structure
-- ============================================

SELECT 
    'Final Database Structure' as info,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- RECOMMENDATIONS
-- ============================================

/*
RECOMMENDED FINAL STRUCTURE:

1. users table (KEEP)
   - Contains: id, username, name, lives, best_score, best_combo, total_spent, payment_count, last_payment_date
   - Purpose: Main user data and game statistics

2. payments table (KEEP)
   - Contains: id, user_id, amount, payment_type, payment_count, first_payment_date, last_payment_date
   - Purpose: Single-row-per-user payment tracking (no duplicates)

OPTIONAL TABLES (if you need them):
3. user_purchases table (OPTIONAL)
   - Only keep if you need detailed purchase history
   - Otherwise, remove to save space

REMOVE:
- payments_backup (temporary table, no longer needed)
- Any other temporary or redundant tables

BENEFITS OF CLEANUP:
✅ Reduced database size
✅ Faster queries (fewer tables to scan)
✅ Simplified maintenance
✅ Better performance
✅ Less storage costs
*/
