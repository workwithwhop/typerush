# 🔗 Webhook Setup Guide for BubbleType Game

## 🎯 **Overview**

Your BubbleType game now uses **secure webhook-based payment validation** instead of immediate client-side validation. This ensures that payments are verified server-side before granting lives to users.

## 🔧 **What Changed**

### **Before (Insecure):**
- Payment validation happened immediately on client-side
- User could potentially manipulate the response
- Database updates happened without server verification

### **After (Secure):**
- Payment validation happens via webhook from Whop
- Server-side verification ensures payment authenticity
- Database updates only after webhook confirmation

## 📋 **Setup Steps**

### **1. Add Webhook Secret to Environment Variables**

Add this to your `.env.local` file:
```bash
WHOP_WEBHOOK_SECRET=your_webhook_secret_here
```

### **2. Configure Webhook in Whop Dashboard**

1. Go to your Whop app dashboard
2. Navigate to **Settings** → **Webhooks**
3. Click **Add Webhook**
4. Set the following:
   - **Endpoint URL**: `https://your-domain.com/api/webhooks`
   - **Events**: Select `payment.succeeded`
   - **Secret**: Copy the webhook secret to your environment variables
5. Click **Save**

### **3. Deploy Your App**

Make sure your app is deployed with the webhook endpoint accessible at:
```
https://your-domain.com/api/webhooks
```

## 🔄 **How It Works Now**

### **Payment Flow:**
1. **User clicks "PAY $2 TO CONTINUE"**
2. **Client creates charge** via `whopSdk.payments.chargeUser()`
3. **Whop processes payment** and shows checkout modal
4. **User completes payment**
5. **Whop sends webhook** to your `/api/webhooks` endpoint
6. **Server validates webhook** and records payment in database
7. **User gets 1 life** and game continues

### **Security Benefits:**
- ✅ **Server-side validation** - Webhook comes directly from Whop
- ✅ **Tamper-proof** - Client cannot fake payment success
- ✅ **Audit trail** - All payments logged server-side
- ✅ **Reliable** - Webhook retries if your server is down

## 🎮 **Required Permissions**

Now that you're using webhooks, you need these permissions:

1. **`payment:charge`** - For creating $2 charges
2. **`member:basic:read`** - For getting user info
3. **`webhook_receive:payments`** - For receiving payment webhooks

## 🧪 **Testing**

### **Test Payment Flow:**
1. Start a game and let bubbles hit the bottom
2. Click "PAY $2 TO CONTINUE"
3. Complete the payment in Whop's modal
4. Check your server logs for webhook confirmation
5. Verify user gets 1 life and game continues

### **Check Webhook Logs:**
Look for these log messages in your server:
```
🎯 Webhook received: payment.succeeded
✅ Payment succeeded for user: $2.00 USD
🎮 Game continue payment confirmed for user
✅ Payment recorded successfully for user
```

## 🚨 **Troubleshooting**

### **Webhook Not Receiving:**
- ✅ Check webhook URL is correct and accessible
- ✅ Verify `WHOP_WEBHOOK_SECRET` is set correctly
- ✅ Ensure webhook is enabled in Whop dashboard
- ✅ Check server logs for webhook validation errors

### **Payment Not Recorded:**
- ✅ Check webhook is receiving `payment.succeeded` events
- ✅ Verify `final_amount === 2.00` and `metadata.payment_type === 'game_continue'`
- ✅ Check database connection and `recordPayment` function
- ✅ Look for error logs in webhook handler

### **User Not Getting Lives:**
- ✅ Verify webhook is processing successfully
- ✅ Check `recordPayment` function is updating user lives
- ✅ Ensure real-time subscriptions are working for UI updates

## 📊 **Monitoring**

### **Webhook Health:**
- Monitor webhook delivery success rate in Whop dashboard
- Check server logs for webhook processing errors
- Verify payment recording in database

### **Payment Analytics:**
- Track successful payments via webhook logs
- Monitor user life purchases in database
- Analyze payment conversion rates

## 🔒 **Security Notes**

- **Never trust client-side payment validation**
- **Always verify payments via webhooks**
- **Keep webhook secret secure and never expose it**
- **Validate webhook signatures to ensure authenticity**

## 📝 **Environment Variables**

Make sure you have all required environment variables:

```bash
# Whop Configuration
NEXT_PUBLIC_WHOP_APP_ID=your_app_id_here
WHOP_API_KEY=your_api_key_here
NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id_here
NEXT_PUBLIC_WHOP_AGENT_USER_ID=your_agent_user_id_here

# Whop Webhook Configuration
WHOP_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 🎉 **You're All Set!**

Your BubbleType game now has secure, webhook-based payment validation. Users can safely purchase lives, and you can trust that all payments are legitimate and properly recorded.

---

**Need help?** Check the server logs for webhook processing details and ensure all environment variables are properly configured.
