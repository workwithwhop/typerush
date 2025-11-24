# Hearts Purchase System

## Overview
Users can now buy hearts (lives) at a custom price instead of a fixed $1 continue fee.

## Pricing
- **$0.50 per heart**
- Users can buy 1-10 hearts at once
- Quick select buttons for 1, 3, or 5 hearts

## How It Works

### 1. User Interface
- Hearts counter displayed in the header (top right)
- Click on hearts to open purchase modal
- Select number of hearts (1-10)
- See price breakdown before purchasing

### 2. Purchase Flow
1. User clicks on hearts counter
2. Modal opens showing current hearts
3. User selects how many hearts to buy (use +/- buttons or quick select)
4. User clicks "Buy X Hearts for $Y.YY"
5. Redirected to Whop checkout page
6. After payment, webhook adds hearts to user account

### 3. Backend Processing
- `createCheckoutConfig(hearts)` creates Whop checkout with custom price
- Metadata includes: `payment_type: 'hearts_purchase'`, `hearts_count`, `userId`
- Webhook receives payment success
- `addHeartsToUser()` adds purchased hearts to user's account
- Real-time update shows new heart count

## Files Modified

### New Files
- `components/HeartsPurchaseModal.tsx` - Purchase UI
- `HEARTS_PURCHASE_SYSTEM.md` - This documentation

### Modified Files
- `lib/actions/charge-user.ts` - Added hearts parameter, custom pricing
- `lib/database-optimized.ts` - Added `addHeartsToUser()` function
- `app/api/webhooks/route.ts` - Added hearts purchase handling
- `components/MobileGamePage.tsx` - Added hearts display and purchase button

## Customization Options

### Change Price Per Heart
Edit `whop-app/lib/actions/charge-user.ts`:
```typescript
const pricePerHeart = 50; // 50 cents (in cents)
```

Also update `whop-app/components/HeartsPurchaseModal.tsx`:
```typescript
const pricePerHeart = 0.50; // $0.50 per heart
```

### Change Max Hearts
Edit `whop-app/components/HeartsPurchaseModal.tsx`:
```typescript
onClick={() => setHearts(Math.min(10, hearts + 1))} // Change 10 to your max
```

### Change Quick Select Options
Edit the quick select buttons array:
```typescript
{[1, 3, 5].map((count) => ( // Change these numbers
```

## Testing

1. **Local Testing:**
   - Run `npm run dev`
   - Click on hearts counter
   - Select hearts and click buy
   - You'll be redirected to Whop checkout

2. **Webhook Testing:**
   - Use Whop's webhook testing tool
   - Send a `payment.succeeded` event with metadata:
     ```json
     {
       "payment_type": "hearts_purchase",
       "hearts_count": "3",
       "userId": "test_user"
     }
     ```

3. **Verify:**
   - Check user's hearts increased
   - Check payment recorded in database
   - Check real-time update works

## Future Enhancements

- Add heart packages (e.g., "Best Value: 10 hearts for $4")
- Add discount for bulk purchases
- Add heart expiration system
- Add daily free hearts
- Add hearts as rewards for achievements
