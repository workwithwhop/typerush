-- Safe removal of payments_backup table
-- This table was created during the duplicate payment fix and is no longer needed

-- Check if payments_backup table exists and has data
SELECT 
    'payments_backup Analysis' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments_backup') 
        THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments_backup') 
        THEN (SELECT COUNT(*) FROM payments_backup)::text
        ELSE 'N/A' 
    END as row_count;

-- Remove payments_backup table (safe to delete)
DROP TABLE IF EXISTS payments_backup;

-- Verify removal
SELECT 
    'Verification' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments_backup') 
        THEN 'STILL EXISTS' 
        ELSE 'SUCCESSFULLY REMOVED' 
    END as removal_status;

-- Show final table list
SELECT 
    'Final Tables' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
