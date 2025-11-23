-- Add purchased_hearts_during_game column to user_heart_stats table
-- This column stores hearts purchased during gameplay (temporary)
-- When game ends, these hearts are added to current_hearts and this column is reset to 0

-- Add the new column
ALTER TABLE public.user_heart_stats 
ADD COLUMN purchased_hearts_during_game integer NOT NULL DEFAULT 0;

-- Add a comment to explain the column
COMMENT ON COLUMN public.user_heart_stats.purchased_hearts_during_game IS 'Hearts purchased during current gameplay session. Added to current_hearts when game ends.';

-- Update existing rows to have 0 for the new column
UPDATE public.user_heart_stats 
SET purchased_hearts_during_game = 0 
WHERE purchased_hearts_during_game IS NULL;

-- Optional: Add an index for performance if needed
-- CREATE INDEX IF NOT EXISTS idx_user_heart_stats_purchased_during_game 
-- ON public.user_heart_stats (purchased_hearts_during_game);

-- Verify the column was added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_heart_stats' 
AND column_name = 'purchased_hearts_during_game';
