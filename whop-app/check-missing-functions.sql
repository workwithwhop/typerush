-- Check if required functions exist and create them if missing

-- Check if get_leaderboard function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_leaderboard';

-- Check if get_top_spender function exists  
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_top_spender';

-- Drop existing functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS get_leaderboard();
DROP FUNCTION IF EXISTS get_top_spender();

-- Create get_leaderboard function
CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE(
    user_id text,
    username text,
    name text,
    best_score integer,
    best_combo integer,
    total_spent numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.username,
        u.name,
        COALESCE(u.best_score, 0) as best_score,
        COALESCE(u.best_combo, 0) as best_combo,
        COALESCE(u.total_spent, 0) as total_spent
    FROM users u
    WHERE COALESCE(u.best_score, 0) > 0
    ORDER BY u.best_score DESC, u.best_combo DESC
    LIMIT 10;
END;
$$;

-- Create get_top_spender function
CREATE OR REPLACE FUNCTION get_top_spender()
RETURNS TABLE(
    name text,
    total_amount_spent numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.name,
        COALESCE(u.total_spent, 0) as total_amount_spent
    FROM users u
    WHERE COALESCE(u.total_spent, 0) > 0
    ORDER BY u.total_spent DESC
    LIMIT 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_leaderboard() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_top_spender() TO anon, authenticated;

-- Test the functions
SELECT * FROM get_leaderboard();
SELECT * FROM get_top_spender();
