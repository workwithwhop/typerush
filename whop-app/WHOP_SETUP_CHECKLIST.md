# 🎯 Whop Integration Setup Checklist

## ✅ **Step 1: Environment Variables**

Add these to your `.env.local` file:

```env
# Whop Webhook Secret (from Whop Dashboard → Webhooks)
WHOP_WEBHOOK_SECRET=your_webhook_secret_here

# Whop API Key (from Whop Dashboard → API Keys)
WHOP_API_KEY=your_api_key_here

# Whop App ID (from Whop Dashboard → App Settings)
NEXT_PUBLIC_WHOP_APP_ID=your_app_id_here

# Whop Company ID (from Whop Dashboard → Company Settings)
NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id_here

# Whop Agent User ID (optional - for API requests on behalf of a user)
NEXT_PUBLIC_WHOP_AGENT_USER_ID=your_agent_user_id_here

# Whop Product ID for $2 Game Continue (from Whop Dashboard → Products)
WHOP_GAME_CONTINUE_PRODUCT_ID=your_product_id_here

# Your App URL (for webhook callbacks)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## ✅ **Step 2: Create $2 Product in Whop**

1. Go to **Whop Dashboard** → **Products**
2. Click **Create Product**
3. **Product Type**: Access Pass
4. **Price**: $2.00
5. **Name**: "Game Continue"
6. **Description**: "Continue your game from where you left off"
7. **One-time purchase**: Yes
8. **Save the Product ID** and add it to your `.env.local`

## ✅ **Step 3: Set Up Webhook**

1. Go to **Whop Dashboard** → **Webhooks**
2. **Webhook URL**: `https://your-domain.com/api/webhooks`
3. **Events to Subscribe** (select these):
   - ✅ `payment_succeeded`
   - ✅ `payment_failed`
   - ✅ `payment_pending`
   - ✅ `refund_created`
   - ✅ `refund_updated`
4. **Copy the Webhook Secret** and add it to your `.env.local`

## ✅ **Step 4: Test the Integration**

### **Test Payment Flow:**
1. Start your app
2. Play the game until bubbles hit bottom
3. Click "PAY $2 TO CONTINUE"
4. Complete payment on Whop
5. Check webhook logs in your console
6. Verify user gets 3 lives

### **Expected Console Logs:**
```
🎯 Webhook received: payment.succeeded
✅ Payment succeeded for user: $2.00 USD
🎮 Game continue payment confirmed for user
✅ Payment recorded successfully for user
```

## ✅ **Step 5: Verify Database Updates**

Check that payments are recorded:

```sql
-- Check user's updated data
SELECT id, username, total_spent, payment_count, lives 
FROM users 
WHERE id = 'your_user_id';

-- Check payments table
SELECT * FROM payments 
WHERE user_id = 'your_user_id';
```

## 🚨 **Troubleshooting**

### **Webhook Not Working?**
- ✅ Check webhook URL is correct
- ✅ Verify webhook secret matches
- ✅ Ensure webhook events are selected
- ✅ Check for errors in browser console

### **Payment Not Recording?**
- ✅ Verify `WHOP_GAME_CONTINUE_PRODUCT_ID` is correct
- ✅ Check if `recordPayment` function is working
- ✅ Verify database connection
- ✅ Ensure metadata includes `payment_type: 'game_continue'`

### **User Not Getting Lives?**
- ✅ Check if webhook is processing payments
- ✅ Verify real-time subscriptions are working
- ✅ Check if user exists in database
- ✅ Verify payment amount is exactly $2.00

## 🎉 **Success Indicators**

When everything is working correctly, you should see:

1. **Payment Link Created**: User clicks "PAY $2 TO CONTINUE" → Opens Whop payment page
2. **Payment Processed**: User completes payment → Whop sends webhook
3. **Webhook Received**: Your app receives webhook → Processes payment
4. **Database Updated**: Payment recorded → User gets 3 lives
5. **UI Updated**: Real-time update → User sees new lives count
6. **Game Continues**: User can continue playing from where they left off

## 📊 **Monitoring**

### **Webhook Logs:**
Monitor your webhook endpoint for:
- ✅ Successful payments
- ❌ Failed payments
- ⏳ Pending payments
- 🔄 Refunds

### **Database Monitoring:**
Track in your database:
- 💰 Total payments received
- 👥 Number of paying users
- 🎮 Game continues purchased
- 📈 Revenue generated

**Your $2 game continue payment system is now fully integrated with Whop!** 🚀
