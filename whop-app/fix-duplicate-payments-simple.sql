-- Simple fix for duplicate payment records
-- This approach is more reliable and handles UUIDs properly

-- Step 1: Check current duplicate records
SELECT 
    'Current duplicates:' as info,
    user_id, 
    payment_type, 
    COUNT(*) as duplicate_count,
    SUM(amount) as total_amount,
    MIN(created_at) as first_payment,
    MAX(created_at) as last_payment
FROM payments 
GROUP BY user_id, payment_type 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Create a backup table (optional - for safety)
CREATE TABLE IF NOT EXISTS payments_backup AS 
SELECT * FROM payments;

-- Step 3: Delete all existing payment records
DELETE FROM payments;

-- Step 4: Add new columns if they don't exist
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_count INTEGER DEFAULT 1;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS first_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 5: Recreate payment records with merged data
-- This will create new UUIDs for each merged record
INSERT INTO payments (
    user_id, 
    payment_type, 
    amount, 
    payment_count,
    first_payment_date,
    last_payment_date,
    created_at,
    updated_at
)
SELECT 
    user_id,
    payment_type,
    SUM(amount) as total_amount,
    COUNT(*) as payment_count,
    MIN(created_at) as first_payment_date,
    MAX(created_at) as last_payment_date,
    MIN(created_at) as created_at,  -- Use first payment date as created_at
    MAX(created_at) as updated_at   -- Use last payment date as updated_at
FROM payments_backup 
GROUP BY user_id, payment_type;

-- Step 6: Create the unique constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_type_unique;
ALTER TABLE payments ADD CONSTRAINT payments_user_type_unique 
    UNIQUE (user_id, payment_type);

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_type ON payments(user_id, payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON payments(amount DESC);

-- Step 8: Add comments for documentation
COMMENT ON COLUMN payments.payment_count IS 'Number of times user has made this type of payment';
COMMENT ON COLUMN payments.first_payment_date IS 'Date of first payment of this type';
COMMENT ON COLUMN payments.last_payment_date IS 'Date of most recent payment of this type';
COMMENT ON COLUMN payments.updated_at IS 'Last time this payment record was updated';

-- Step 9: Verify the results
SELECT 
    'Final payment records:' as info,
    user_id,
    payment_type,
    amount,
    payment_count,
    first_payment_date,
    last_payment_date,
    created_at,
    updated_at
FROM payments 
ORDER BY user_id, payment_type;

-- Step 10: Verify no duplicates exist
SELECT 
    'Duplicate check (should be empty):' as info,
    user_id, 
    payment_type, 
    COUNT(*) as record_count
FROM payments 
GROUP BY user_id, payment_type 
HAVING COUNT(*) > 1;

-- Step 11: Show table structure
SELECT 
    'Table structure:' as info,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- Step 12: Clean up backup table (optional)
-- DROP TABLE IF EXISTS payments_backup;
