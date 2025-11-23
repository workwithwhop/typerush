# Payment Implementation Testing Checklist

## What Was Fixed

The code was trying to use `whopSdk.payments.chargeUser()` which doesn't exist. 

**The fix:** Use `whopSdk.createCheckoutSession()` which is the correct GraphQL mutation in the `@whop/api` SDK.

## Testing Steps

### 1. Start Your Development Server
```bash
npm run dev
```

### 2. Test the Payment Flow

1. **Open your app** in the browser
2. **Click "Continue Game"** button (or whatever triggers the payment)
3. **Expected behavior:**
   - A Whop checkout modal should open
   - You should see a payment form for $2.00
   - You can enter test payment details
   
4. **If it works:**
   - Complete the test payment
   - Modal closes with success
   - Game continues with 1 life
   
5. **Check webhook:**
   - Look at your server logs
   - You should see `[PAYMENT SUCCEEDED]` log
   - Database should be updated with the payment

### 3. Common Issues & Solutions

#### Issue: "Cannot read properties of undefined (reading 'create')"
**Status:** ✅ FIXED - We're now using `createCheckoutSession()` instead

#### Issue: Checkout modal doesn't open
**Possible causes:**
- Check browser console for errors
- Verify iframe SDK is initialized (`useIframeSdk` hook)
- Make sure you're running inside Whop's iframe context

#### Issue: "Failed to create checkout session"
**Check:**
- `NEXT_PUBLIC_WHOP_COMPANY_ID` is set correctly in `.env`
- `WHOP_API_KEY` is valid
- Company ID starts with `biz_`

#### Issue: Webhook not receiving events
**Solution:**
- Setup company webhook in Whop dashboard (see guide)
- For local testing, use ngrok to expose your server
- Verify `WHOP_WEBHOOK_SECRET` is correct (no quotes!)

## Expected Console Output

### Server (when creating checkout):
```
Creating checkout session for user: user_xxxxx
```

### Client (when opening modal):
```
Opening Whop checkout modal with:
- checkoutId: checkout_xxxxx
- planId: plan_xxxxx
```

### Webhook (when payment succeeds):
```
[PAYMENT SUCCEEDED] {
  user_id: 'user_xxxxx',
  final_amount: 2,
  ...
}
Payment recorded: $2 for user user_xxxxx
```

## Verification

- [ ] Checkout modal opens successfully
- [ ] Payment form shows $2.00 amount
- [ ] Can complete test payment
- [ ] Modal closes on success
- [ ] Game continues with 1 life
- [ ] Webhook receives payment.succeeded event
- [ ] Database updated with payment record

## If Everything Works

Congratulations! Your one-time payment implementation is working correctly. The Whop checkout modal will now open properly when users want to continue the game.

## Next Steps

1. Test with real payment methods (not just test mode)
2. Add error handling for failed payments
3. Consider adding payment history UI
4. Monitor webhook logs for any issues
5. Test edge cases (cancelled payments, network errors, etc.)
