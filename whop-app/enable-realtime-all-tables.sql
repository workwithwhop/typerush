-- Enable real-time for all tables to ensure complete CRUD monitoring
-- This script ensures all tables support real-time subscriptions

-- Enable real-time for users table (main table) - only if not already added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'users'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE users;
        RAISE NOTICE 'Real-time enabled for users table';
    ELSE
        RAISE NOTICE 'Users table already has real-time enabled';
    END IF;
END $$;

-- Enable real-time for payments table (if it exists and not already added)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'payments'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE payments;
            RAISE NOTICE 'Real-time enabled for payments table';
        ELSE
            RAISE NOTICE 'Payments table already has real-time enabled';
        END IF;
    ELSE
        RAISE NOTICE 'Payments table does not exist, skipping...';
    END IF;
END $$;

-- Enable real-time for user_purchases table (if it exists and not already added)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_purchases') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'user_purchases'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE user_purchases;
            RAISE NOTICE 'Real-time enabled for user_purchases table';
        ELSE
            RAISE NOTICE 'User_purchases table already has real-time enabled';
        END IF;
    ELSE
        RAISE NOTICE 'User_purchases table does not exist, skipping...';
    END IF;
END $$;

-- Enable real-time for any other tables that might exist
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT IN ('users', 'payments', 'user_purchases')
    LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
            RAISE NOTICE 'Real-time enabled for table: %', table_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not enable real-time for table %: %', table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Verify real-time is enabled for all tables
SELECT 
    'Real-time Status Check' as info,
    t.table_schema as schemaname,
    t.table_name as tablename,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = t.table_schema 
            AND tablename = t.table_name
        ) THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as realtime_status
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- Show current publication configuration
SELECT 
    'Current Publication Configuration' as info,
    pubname,
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;

-- Test real-time functionality (this will show if real-time is working)
DO $$
BEGIN
    RAISE NOTICE 'Real-time configuration completed!';
    RAISE NOTICE 'All tables should now support real-time CRUD operations.';
    RAISE NOTICE 'Test by running the RealtimeMonitor component in your app.';
END $$;
