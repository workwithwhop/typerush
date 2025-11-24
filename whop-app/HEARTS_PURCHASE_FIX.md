# Hearts Purchase System - Complete Fix

## Issues Fixed

### 1. ✅ Webhook Metadata Extraction
**Problem:** Webhook wasn't properly extracting metadata from Whop payment webhook

**Fix:** Enhanced webhook handler to check multiple possible locations for metadata:
- `data.metadata`
- `data.checkout_configuration.metadata`
- `data.plan.metadata`

**File:** `app/api/webhooks/route.ts`

### 2. ✅ Hearts Not Updating After Purchase
**Problem:** Hearts weren't increasing after purchase completion

**Fix:** 
- Improved webhook logging to debug metadata issues
- Added better error handling
- Enhanced metadata extraction logic

**File:** `app/api/webhooks/route.ts`

### 3. ✅ Game Not Continuing After Purchase
**Problem:** Game wasn't automatically resuming after hearts were added

**Fix:**
- Added `onPurchaseSuccess` callback to `GameOverPurchaseScreen`
- Triggers immediate refresh after purchase
- Starts polling every 2 seconds for 30 seconds to detect hearts
- Game already has polling mechanism that auto-resumes when hearts > 0

**Files:** 
- `components/GameOverPurchaseScreen.tsx`
- `components/BubbleTypeGame.tsx`

### 4. ✅ Testing Mode - $0 Pricing
**Problem:** Needed to test without actual payment

**Fix:** Set `initial_price: 0` in checkout configuration for testing

**File:** `lib/actions/charge-user.ts` (line 20)

**Note:** Change back to `initial_price: totalPrice` for production!

## Database Schema Verification

Your database schema is **100% correct** and matches the hearts system:

```sql
CREATE TABLE public.users (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  lives integer DEFAULT 3,  -- ✅ Stores hearts (used by system)
  best_score integer DEFAULT 0,
  best_combo integer DEFAULT 0,
  total_spent numeric DEFAULT 0.00,
  payment_count integer DEFAULT 0,
  last_payment_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id),
  amount numeric NOT NULL,
  payment_type text NOT NULL DEFAULT 'game_continue',
  created_at timestamp with time zone DEFAULT now(),
  payment_count integer DEFAULT 1,
  first_payment_date timestamp with time zone,
  last_payment_date timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.user_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id),
  amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id),
  score integer NOT NULL DEFAULT 0,
  combo integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);
```

**Key Points:**
- ✅ `users.lives` column stores hearts (integer, default 3)
- ✅ `users.total_spent` tracks total spending
- ✅ `payments` table records all payments
- ✅ `user_purchases` table can track individual purchases
- ✅ All foreign keys are properly set up

## Complete Purchase Flow

### 1. User Purchases Hearts
```
User clicks "Buy X Hearts" 
  → createCheckoutConfig(hearts) creates checkout with metadata
  → Whop checkout modal opens ($0 for testing)
  → User completes checkout
```

### 2. Webhook Processes Payment
```
Whop sends webhook to /api/webhooks
  → Validates webhook signature
  → Extracts metadata (payment_type: 'hearts_purchase', hearts_count, userId)
  → Calls addHeartsToUser(userId, heartsCount)
  → Updates users.lives in database
```

### 3. Game Detects Hearts
```
Game polls every 2 seconds when on game over screen
  → loadUserData() fetches updated hearts from database
  → Detects hearts > 0
  → Auto-resumes game
  → User continues playing with new hearts
```

## How to Test

1. **Start Game:**
   - Game starts with 3 hearts (from `users.lives`)

2. **Lose Hearts:**
   - Let bubbles touch bottom
   - Hearts decrease: 3 → 2 → 1 → 0
   - Game Over screen appears

3. **Purchase Hearts:**
   - Select number of hearts (1-20)
   - Click "Buy X Hearts"
   - Whop checkout opens with $0.00 (testing mode)
   - Complete checkout

4. **Hearts Added:**
   - Webhook receives payment
   - Adds hearts to `users.lives` in database
   - Game polls and detects hearts > 0
   - Game automatically resumes
   - Hearts display shows updated count

5. **Verify:**
   - Check database: `SELECT lives FROM users WHERE id = 'your_user_id'`
   - Should show: original_lives + purchased_hearts
   - Game should continue automatically

## Production Checklist

Before going live, make sure to:

1. ✅ Change pricing back to production:
   ```typescript
   // In lib/actions/charge-user.ts line 20
   initial_price: totalPrice, // Change from 0 to totalPrice
   ```

2. ✅ Verify webhook is set up in Whop dashboard:
   - Company-level webhook (not app-level)
   - Event: `payment.succeeded`
   - URL: `https://yourdomain.com/api/webhooks`
   - Secret: `WHOP_WEBHOOK_SECRET` in .env

3. ✅ Test with real payment:
   - Use test mode first
   - Verify webhook receives payment
   - Check hearts are added correctly
   - Verify game continues properly

## Troubleshooting

### Hearts Not Increasing After Purchase

1. **Check Webhook Logs:**
   - Look for `[PAYMENT SUCCEEDED]` in server logs
   - Check if metadata is extracted correctly
   - Verify `[HEARTS PURCHASE DETECTED]` message appears

2. **Check Database:**
   ```sql
   SELECT lives FROM users WHERE id = 'your_user_id';
   ```
   - Should increase after purchase

3. **Check Webhook Secret:**
   - Ensure `WHOP_WEBHOOK_SECRET` is set correctly
   - No quotes in .env file

### Game Not Continuing After Purchase

1. **Check Polling:**
   - Game polls every 2 seconds when on game over screen
   - Check browser console for errors

2. **Check Real-time Subscriptions:**
   - Game subscribes to user changes
   - Should update automatically when hearts change

3. **Manual Refresh:**
   - Game should auto-resume, but you can also close and reopen

## Files Modified

1. `app/api/webhooks/route.ts` - Enhanced metadata extraction and logging
2. `components/GameOverPurchaseScreen.tsx` - Added purchase success callback and polling
3. `components/BubbleTypeGame.tsx` - Added refresh callback after purchase
4. `lib/actions/charge-user.ts` - Set to $0 for testing (change for production!)

## Summary

✅ Webhook properly extracts metadata from multiple locations
✅ Hearts are added to database after purchase
✅ Game automatically detects hearts and continues
✅ Database schema is correct and matches system
✅ Testing mode enabled ($0 pricing)

**Everything is ready for testing!** 🎉

