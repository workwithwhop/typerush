# Hearts System - Complete Implementation

## Overview
Complete hearts/lives system where users buy hearts to continue playing when they run out.

## Pricing
- **$1.00 per heart**
- Users can buy 1-20 hearts at once
- Quick select: 1, 3, 5, or 10 hearts

## How It Works

### 1. Gameplay
- User starts with 3 hearts (from database)
- Each time a bubble touches the bottom: **-1 heart**
- Hearts update in **real-time** in the database
- Hearts display in navbar (read-only, shows current count)
- When hearts reach 0 → Game Over screen appears

### 2. Game Over & Purchase
- Game Over screen shows:
  - Final score
  - Max combo (if > 5)
  - Heart purchase interface
- User selects number of hearts (1-20)
- Price calculated automatically ($1 per heart)
- Click "Buy X Hearts - $Y.YY" → Redirects to Whop checkout
- After payment → Webhook adds hearts to database
- Game automatically resumes when hearts detected

### 3. Real-Time Updates
- Hearts decrease immediately when bubble touches bottom
- Database updated instantly
- Game polls every 2 seconds on Game Over screen
- When hearts > 0 detected → Game resumes automatically
- Score and progress maintained

### 4. Database Integration
Uses existing `users` table:
- `lives` column stores current hearts
- Updated in real-time during gameplay
- Webhook adds purchased hearts after payment

## Files Modified

### New Files
- `components/GameOverPurchaseScreen.tsx` - Game over + purchase UI
- `HEARTS_SYSTEM_COMPLETE.md` - This documentation

### Modified Files
1. **lib/actions/charge-user.ts**
   - Changed price to $1 per heart
   - Accepts hearts parameter (1-20)
   - Metadata includes hearts_count

2. **lib/database-optimized.ts**
   - Added `addHeartsToUser()` function
   - Adds purchased hearts to user's lives

3. **app/api/webhooks/route.ts**
   - Detects hearts_purchase payment type
   - Calls `addHeartsToUser()` after payment
   - Logs hearts addition

4. **components/BubbleTypeGame.tsx**
   - Imports `GameOverPurchaseScreen` and `updateUserLives`
   - Decreases lives when bubble touches bottom
   - Updates database in real-time
   - Game over when lives = 0
   - Polls for hearts on game over screen
   - Auto-resumes game when hearts detected
   - Replaced old modal with new purchase screen

5. **components/MobileGamePage.tsx**
   - Hearts display in navbar (read-only)
   - Shows current heart count
   - Not clickable (purchase only from game over)

6. **components/HeartsPurchaseModal.tsx**
   - Updated price to $1 per heart
   - (Not used in game, kept for reference)

## User Flow

### Normal Gameplay
1. User starts game with 3 hearts
2. Bubble touches bottom → -1 heart (updates database)
3. Hearts display updates in navbar
4. Repeat until hearts = 0

### Out of Hearts
1. Last bubble touches bottom → hearts = 0
2. Game Over screen appears immediately
3. Shows final score and purchase interface
4. User selects hearts to buy
5. Clicks purchase → Redirects to Whop checkout

### After Purchase
1. User completes payment on Whop
2. Webhook receives payment.succeeded
3. Webhook adds hearts to database
4. Game polls database (every 2 seconds)
5. Detects hearts > 0
6. Game resumes automatically
7. User continues from where they left off

## Technical Details

### Heart Decrease Logic
```typescript
// When bubble touches bottom:
const newLives = lives - 1;
setLives(newLives);

// Update database immediately
updateUserLives(user.username, newLives);

// Check game over
if (newLives <= 0) {
  setGameState('gameover');
  setShowAdModal(true);
}
```

### Heart Purchase Flow
```typescript
// 1. Create checkout
const result = await createCheckoutConfig(hearts);

// 2. Redirect to Whop
window.location.href = `https://whop.com/checkout/${result.checkoutId}`;

// 3. Webhook adds hearts
await addHeartsToUser(userId, heartsCount);

// 4. Game polls and detects hearts
if (spendingStats.current_lives > 0) {
  // Resume game
  setGameState('playing');
}
```

### Database Schema
```sql
CREATE TABLE users (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  lives integer DEFAULT 3,  -- Current hearts
  best_score integer DEFAULT 0,
  best_combo integer DEFAULT 0,
  total_spent numeric DEFAULT 0.00,
  payment_count integer DEFAULT 0,
  last_payment_date timestamp,
  created_at timestamp DEFAULT now()
);
```

## Testing

### Test Heart Decrease
1. Start game
2. Let bubble touch bottom
3. Check hearts decreased by 1
4. Check database updated
5. Repeat until hearts = 0
6. Verify game over screen appears

### Test Heart Purchase
1. Get to game over screen (hearts = 0)
2. Select hearts (e.g., 3)
3. Click purchase
4. Complete Whop checkout
5. Return to game
6. Verify hearts added (should see 3 hearts)
7. Verify game resumed automatically

### Test Real-Time Updates
1. Open game in two tabs
2. Play in tab 1, let bubble touch bottom
3. Check tab 2 - hearts should update
4. Purchase hearts in tab 1
5. Check tab 2 - hearts should increase

## Configuration

### Change Price Per Heart
Edit both files:

**lib/actions/charge-user.ts:**
```typescript
const pricePerHeart = 100; // $1 in cents
```

**components/GameOverPurchaseScreen.tsx:**
```typescript
const pricePerHeart = 1.00; // $1.00 per heart
```

### Change Max Hearts
**components/GameOverPurchaseScreen.tsx:**
```typescript
onClick={() => setHearts(Math.min(20, hearts + 1))} // Change 20
```

### Change Starting Hearts
**Database default:**
```sql
lives integer DEFAULT 3  -- Change 3 to desired amount
```

### Change Poll Interval
**components/BubbleTypeGame.tsx:**
```typescript
const pollInterval = setInterval(() => {
  loadUserData(true);
}, 2000); // Change 2000 (milliseconds)
```

## Troubleshooting

### Hearts not decreasing
- Check `updateUserLives()` is being called
- Verify database connection
- Check console for errors

### Game not resuming after purchase
- Check webhook is receiving payment
- Verify `addHeartsToUser()` is called
- Check polling is active (every 2 seconds)
- Verify database has updated hearts

### Hearts not syncing across tabs
- Check real-time subscriptions are active
- Verify Supabase real-time is enabled
- Check network tab for subscription errors

## Future Enhancements
- Add heart packages with discounts
- Daily free hearts
- Hearts as rewards for achievements
- Heart regeneration over time
- Bonus hearts for high scores
