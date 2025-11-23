-- Add payment tracking columns to users table
-- This is much simpler than maintaining a separate payments table

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN users.payment_count IS 'Number of times user has paid $2 to continue';
COMMENT ON COLUMN users.last_payment_date IS 'Date of most recent $2 payment';
COMMENT ON COLUMN users.total_spent IS 'Total amount user has spent on game continues';

-- Create index for better performance on payment queries
CREATE INDEX IF NOT EXISTS idx_users_total_spent ON users(total_spent DESC);
CREATE INDEX IF NOT EXISTS idx_users_payment_count ON users(payment_count DESC);

-- Verify the changes
SELECT 
    'Users table structure:' as info,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Show current users with payment data
SELECT 
    'Current users with payment data:' as info,
    id,
    username,
    name,
    total_spent,
    payment_count,
    last_payment_date,
    lives
FROM users 
WHERE total_spent > 0 OR payment_count > 0
ORDER BY total_spent DESC;
