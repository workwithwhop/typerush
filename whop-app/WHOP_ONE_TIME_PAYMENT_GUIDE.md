# Whop One-Time Payment Implementation Guide

## Overview
This guide explains how one-time payments work in your Whop app using checkout configurations and the iframe SDK, following the official Whop documentation.

## How It Works

### 1. Server-Side: Create Checkout Configuration
**File:** `lib/actions/charge-user.ts`

The server action creates a checkout configuration with:
- **Plan type:** `one_time` (not recurring)
- **Price:** $2.00
- **Company ID:** Your Whop company ID from env vars
- **Metadata:** Custom data about the payment (game session, user ID, etc.)

```typescript
const result = await whopSdk.createCheckoutSession({
  plan: {
    company_id: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!,
    initial_price: 2,
    plan_type: "one_time",
  },
  metadata: {
    payment_type: 'game_continue',
    game_session: 'current_session',
    userId: userId
  },
});
```

Returns: `{ checkoutId, planId }`

**Important:** This uses `@whop/api` package with `WhopServerSdk` and GraphQL mutations

### 2. Client-Side: Open Whop Checkout Modal
**File:** `components/BubbleTypeGame.tsx`

The client uses the iframe SDK to open Whop's checkout modal:

```typescript
const result = await iframeSdk.inAppPurchase({
  planId: config.planId,
  id: config.checkoutId
});
```

This opens a **Whop-hosted checkout page** in a modal where the user can:
- Enter payment details
- Complete the purchase
- See confirmation

### 3. Handle Payment Result
The iframe SDK returns a result object:

```typescript
if (result.status === "ok") {
  // Payment successful
  // result.data.receipt_id contains the payment ID
} else if (result.status === "error") {
  // Payment cancelled or failed
}
```

### 4. Webhook Confirmation (Server-Side)
**File:** `app/api/webhooks/route.ts`

After payment succeeds, Whop sends a webhook to your server:

```typescript
const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "",
});

export async function POST(request: Request) {
  const webhook = await validateWebhook(request);
  
  if (webhook.action === "payment.succeeded") {
    // Verify payment and update database
    await recordPayment({
      user_id: webhook.data.user_id,
      amount: webhook.data.final_amount
    });
  }
  
  return new Response("OK", { status: 200 });
}
```

**Important:** You must setup a company webhook in your Whop developer dashboard (not app-specific)

## Why This Approach?

### ❌ What Doesn't Work
- `whopSdk.payments.chargeUser()` - This method doesn't exist
- Direct charging without user interaction - Not supported

### ✅ What Works
- Checkout configurations with iframe SDK
- User-initiated payments through Whop's checkout UI
- Webhook verification for security

## Payment Flow Diagram

```
User clicks "Continue Game"
         ↓
Server creates checkout config
         ↓
Client opens Whop checkout modal
         ↓
User enters payment details
         ↓
Whop processes payment
         ↓
Modal closes with success/error
         ↓
Webhook confirms payment (async)
         ↓
Database updated with payment record
```

## Environment Variables Required

```env
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxx
WHOP_API_KEY=UkL-xxxxx
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_xxxxx
WHOP_WEBHOOK_SECRET=ws_xxxxx  # Without quotes!
```

**Important:** Remove quotes from WHOP_WEBHOOK_SECRET in your .env file

## Setting Up Webhooks

**CRITICAL:** You must setup a **company webhook** (not app webhook) in your Whop dashboard:

1. Go to your [Whop Developer Dashboard](https://whop.com/developers)
2. **Don't select any app** - this is a company-level webhook
3. Click "Create Webhook" in the top right
4. Select API version: **v1**
5. Select event: **payment.succeeded**
6. Enter your webhook URL: `https://yourdomain.com/api/webhooks`
7. Copy the webhook secret and add it to your `.env` file (without quotes!)

For local testing, use [ngrok](https://ngrok.com/) to expose your local server:
```bash
ngrok http 3000
# Use the ngrok URL for your webhook: https://abc123.ngrok.io/api/webhooks
```

## Testing

1. Run your app locally
2. Click the "Continue Game" button
3. You should see the Whop checkout modal open
4. Complete a test payment
5. Check your webhook logs to confirm payment.succeeded event
6. Verify database was updated

## Common Issues

### Issue: "chargeUser returned null"
**Solution:** You were using the wrong method. Use `checkoutConfigurations.create()` instead.

### Issue: Checkout modal doesn't open
**Solution:** Check that:
- iframe SDK is properly initialized
- You're passing both `planId` and `id` (checkoutId)
- Your app is running in the Whop iframe context

### Issue: Webhook not receiving events
**Solution:** 
- Verify webhook URL is configured in Whop dashboard
- Check WHOP_WEBHOOK_SECRET is correct
- Ensure your webhook endpoint is publicly accessible (use ngrok for local testing)

## Documentation References

- [Whop Accept Payments Guide](https://dev.whop.com/guides/accept-payments)
- [Iframe SDK - In-App Purchases](https://dev.whop.com/sdk/iframe/in-app-purchases)
- [Checkout Configurations API](https://dev.whop.com/api-reference/checkout-configurations/create)
- [Webhooks Guide](https://dev.whop.com/guides/webhooks)
