-- Fix duplicate payment records before creating unique constraint
-- This script will merge duplicate records and clean up the database

-- Step 1: Check current duplicate records
SELECT 
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

-- Step 2: Create a temporary table with merged payment data
CREATE TEMP TABLE temp_merged_payments AS
SELECT 
    user_id,
    payment_type,
    SUM(amount) as total_amount,
    COUNT(*) as payment_count,
    MIN(created_at) as first_payment_date,
    MAX(created_at) as last_payment_date,
    (SELECT id FROM payments p2 
     WHERE p2.user_id = payments.user_id 
     AND p2.payment_type = payments.payment_type 
     ORDER BY p2.created_at ASC 
     LIMIT 1) as keep_id  -- Keep the oldest record's ID
FROM payments 
GROUP BY user_id, payment_type;

-- Step 3: Delete all existing payment records
DELETE FROM payments;

-- Step 4: Insert the merged records back
INSERT INTO payments (
    id,
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
    keep_id,
    user_id,
    payment_type,
    total_amount,
    payment_count,
    first_payment_date,
    last_payment_date,
    first_payment_date as created_at,
    last_payment_date as updated_at
FROM temp_merged_payments;

-- Step 5: Add the new columns if they don't exist
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_count INTEGER DEFAULT 1;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS first_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 6: Update any records that might be missing the new columns
UPDATE payments 
SET 
    payment_count = COALESCE(payment_count, 1),
    first_payment_date = COALESCE(first_payment_date, created_at),
    last_payment_date = COALESCE(last_payment_date, created_at),
    updated_at = COALESCE(updated_at, NOW())
WHERE payment_count IS NULL 
   OR first_payment_date IS NULL 
   OR last_payment_date IS NULL 
   OR updated_at IS NULL;

-- Step 7: Now create the unique constraint (should work now)
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_type_unique;
ALTER TABLE payments ADD CONSTRAINT payments_user_type_unique 
    UNIQUE (user_id, payment_type);

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_type ON payments(user_id, payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON payments(amount DESC);

-- Step 9: Add comments for documentation
COMMENT ON COLUMN payments.payment_count IS 'Number of times user has made this type of payment';
COMMENT ON COLUMN payments.first_payment_date IS 'Date of first payment of this type';
COMMENT ON COLUMN payments.last_payment_date IS 'Date of most recent payment of this type';
COMMENT ON COLUMN payments.updated_at IS 'Last time this payment record was updated';

-- Step 10: Verify the results
SELECT 
    'Final payment records:' as info,
    user_id,
    payment_type,
    amount,
    payment_count,
    first_payment_date,
    last_payment_date
FROM payments 
ORDER BY user_id, payment_type;

-- Step 11: Verify no duplicates exist
SELECT 
    'Duplicate check:' as info,
    user_id, 
    payment_type, 
    COUNT(*) as record_count
FROM payments 
GROUP BY user_id, payment_type 
HAVING COUNT(*) > 1;

-- Step 12: Show table structure
SELECT 
    'Table structure:' as info,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;
