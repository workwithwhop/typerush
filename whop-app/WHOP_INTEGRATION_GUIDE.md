# 🎯 Whop Integration Setup Guide

## Overview
This guide helps you set up real $2 payments for your game continue feature using Whop's payment system.

## 🔧 **Step 1: Webhook Events Selection**

### ✅ **Select These Events in Whop Dashboard:**
1. **`payment_succeeded`** - When $2 payment is successful
2. **`payment_failed`** - When $2 payment fails  
3. **`payment_pending`** - When $2 payment is processing
4. **`refund_created`** - If you need to handle refunds
5. **`refund_updated`** - Refund status updates

### ❌ **Don't Select These (Not Needed):**
- `app_membership_*` events
- `membership_*` events  
- `dispute_*` events
- `resolution_*` events

## 🔑 **Step 2: Environment Variables**

Add these to your `.env.local` file:

```env
# Whop Webhook Secret (from Whop Dashboard)
WHOP_WEBHOOK_SECRET=your_webhook_secret_here

# Whop API Key (for creating payment links)
WHOP_API_KEY=your_api_key_here

# Your app's webhook URL
WHOP_WEBHOOK_URL=https://your-domain.com/api/webhooks
```

## 💳 **Step 3: Create $2 Access Pass**

### **In Whop Dashboard:**
1. Go to **Products** → **Create Product**
2. **Product Type**: Access Pass
3. **Price**: $2.00
4. **Name**: "Game Continue"
5. **Description**: "Continue your game from where you left off"
6. **One-time purchase**: Yes
7. **Save the Product ID** (you'll need this)

## 🎮 **Step 4: Update Game Payment Flow**

### **Replace the current payment button with Whop payment link:**

```typescript
// In your BubbleTypeGame.tsx component
const handlePayToContinue = async () => {
  try {
    // Create Whop payment link
    const paymentLink = await createWhopPaymentLink({
      productId: 'your_product_id_here',
      userId: user.username,
      metadata: {
        payment_type: 'game_continue',
        game_session: 'current_session_id'
      }
    });
    
    // Redirect to Whop payment page
    window.open(paymentLink, '_blank');
    
  } catch (error) {
    console.error('Error creating payment link:', error);
  }
};
```

## 🔗 **Step 5: Create Payment Link Function**

Add this function to your `lib/whop-sdk.ts`:

```typescript
export const createWhopPaymentLink = async (params: {
  productId: string;
  userId: string;
  metadata?: any;
}) => {
  const response = await fetch('https://api.whop.com/api/v2/checkout_sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: params.productId,
      user_id: params.userId,
      metadata: params.metadata,
      success_url: `${window.location.origin}/payment-success`,
      cancel_url: `${window.location.origin}/payment-cancel`,
    }),
  });

  const data = await response.json();
  return data.checkout_url;
};
```

## 🎯 **Step 6: Webhook Processing**

The webhook handler is already set up in `app/api/webhooks/route.ts` and will:

### **When Payment Succeeds:**
1. ✅ Validate the webhook signature
2. ✅ Check if it's a $2 game continue payment
3. ✅ Record payment in your database
4. ✅ Add 3 lives to the user
5. ✅ Update total spending
6. ✅ Log the transaction

### **When Payment Fails:**
1. ❌ Log the failure reason
2. ❌ Could send notification to user

### **When Payment is Pending:**
1. ⏳ Log the pending status
2. ⏳ Could show "processing" state in UI

## 🧪 **Step 7: Testing**

### **Test Payment Flow:**
1. Start a game and let bubbles hit the bottom
2. Click "PAY $2 TO CONTINUE"
3. Complete payment on Whop
4. Check webhook logs in your console
5. Verify user gets 3 lives and payment is recorded

### **Test Webhook:**
```bash
# Use ngrok to test locally
ngrok http 3000

# Update webhook URL in Whop dashboard to:
https://your-ngrok-url.ngrok.io/api/webhooks
```

## 📊 **Step 8: Monitor Payments**

### **Check Webhook Logs:**
```typescript
// In your browser console, you should see:
✅ Payment succeeded for user: $2.00 USD
🎮 Game continue payment confirmed for user
✅ Payment recorded successfully for user
```

### **Check Database:**
```sql
-- Verify payment was recorded
SELECT * FROM users WHERE id = 'your_user_id';
-- Should show updated total_spent, payment_count, lives

-- Check payments table
SELECT * FROM payments WHERE user_id = 'your_user_id';
-- Should show the payment record
```

## 🚨 **Troubleshooting**

### **Webhook Not Working?**
1. Check webhook URL is correct
2. Verify webhook secret matches
3. Check if webhook events are selected
4. Look for errors in browser console

### **Payment Not Recording?**
1. Check if `recordPayment` function is working
2. Verify database connection
3. Check webhook payload structure
4. Ensure metadata includes `payment_type: 'game_continue'`

### **User Not Getting Lives?**
1. Check if `updateUserLives` is called
2. Verify real-time subscriptions are working
3. Check if user exists in database
4. Verify payment amount is exactly $2.00

## 🎉 **Expected Flow**

### **Complete Payment Flow:**
1. 🎮 User plays game, bubbles hit bottom
2. 💳 User clicks "PAY $2 TO CONTINUE"
3. 🔗 Redirected to Whop payment page
4. 💰 User completes $2 payment
5. 📡 Whop sends webhook to your app
6. ✅ Webhook processes payment
7. 🎮 User gets 3 lives and continues game
8. 📊 Payment recorded in database
9. 🔄 UI updates in real-time

## 🔐 **Security Notes**

- ✅ Webhook signature validation prevents fake webhooks
- ✅ Only $2 payments with correct metadata are processed
- ✅ User ID validation ensures payments go to correct user
- ✅ Database transactions ensure data consistency

## 📈 **Benefits**

- ✅ **Real payments** - Actual $2 transactions
- ✅ **Secure** - Whop handles payment processing
- ✅ **Reliable** - Webhook ensures payment confirmation
- ✅ **Trackable** - All payments logged and monitored
- ✅ **Scalable** - Handles multiple users simultaneously

**Your game now has real $2 payments integrated with Whop!** 🚀
