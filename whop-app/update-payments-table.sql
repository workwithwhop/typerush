-- Update payments table to support single row per user approach
-- This prevents unlimited rows and keeps database clean

-- Add new columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_count INTEGER DEFAULT 1;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS first_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create unique constraint to ensure only one payment record per user per payment type
-- This prevents duplicate payment records for the same user
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_type_unique;
ALTER TABLE payments ADD CONSTRAINT payments_user_type_unique 
    UNIQUE (user_id, payment_type);

-- Update existing payment records to have the new columns
UPDATE payments 
SET 
    payment_count = 1,
    first_payment_date = COALESCE(created_at, NOW()),
    last_payment_date = COALESCE(created_at, NOW()),
    updated_at = NOW()
WHERE payment_count IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_type ON payments(user_id, payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON payments(amount DESC);

-- Add comments for documentation
COMMENT ON COLUMN payments.payment_count IS 'Number of times user has made this type of payment';
COMMENT ON COLUMN payments.first_payment_date IS 'Date of first payment of this type';
COMMENT ON COLUMN payments.last_payment_date IS 'Date of most recent payment of this type';
COMMENT ON COLUMN payments.updated_at IS 'Last time this payment record was updated';

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- Show current payment records structure
SELECT 
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
