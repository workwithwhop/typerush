# 🎯 iframe SDK Setup - The Correct Whop Approach

## 🚨 **Why This Will Work**

According to the Whop documentation, the **iframe SDK** is the correct way to handle in-app purchases. This approach:

- ✅ **No API permissions needed** - iframe SDK handles everything
- ✅ **No server-side complexity** - Direct client-side payment
- ✅ **Built-in UI** - Whop's native payment modal
- ✅ **Automatic webhooks** - Whop handles webhook delivery
- ✅ **Follows Whop's recommended pattern** - This is exactly what the docs show

## 🔧 **What We've Implemented**

### **1. Installed iframe SDK**
```bash
npm install @whop/react
```

### **2. Updated whop-sdk.ts**
```typescript
import { iframeSdk } from "@whop/react";

// Simple iframe SDK approach
export const createGameContinuePayment = async (params: {
  userId: string;
  gameSessionId?: string;
}) => {
  const planId = process.env.NEXT_PUBLIC_GAME_CONTINUE_PLAN_ID || 'plan_l7PoADRRTXgVM';
  
  const result = await iframeSdk.inAppPurchase({ 
    planId: planId,
    metadata: {
      payment_type: 'game_continue',
      game_session: params.gameSessionId || 'current_session',
      timestamp: new Date().toISOString()
    }
  });
  
  return result;
};
```

### **3. Updated BubbleTypeGame Component**
```typescript
// Use iframe SDK for direct plan purchase
const result = await createGameContinuePayment({
  userId: user.username,
  gameSessionId: `game_${Date.now()}`
});

console.log('✅ Payment initiated successfully:', result);
```

## 📋 **Required Setup**

### **1. Environment Variables**
Add this to your `.env.local`:

```env
# Your $2 game continue plan ID
NEXT_PUBLIC_GAME_CONTINUE_PLAN_ID=plan_l7PoADRRTXgVM

# Make sure these are also set:
NEXT_PUBLIC_WHOP_APP_ID=your_app_id_here
NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **2. Create Plan in Whop Dashboard**
1. **Go to**: [Whop Dashboard](https://whop.com/dashboard)
2. **Navigate to**: Plans section
3. **Create New Plan**:
   - **Name**: "Game Continue - $2"
   - **Price**: $2.00
   - **Type**: One-time payment
   - **Description**: "Continue your game from where you left off"
4. **Copy the Plan ID** (should look like `plan_xxxxx`)

### **3. Webhook Events (Still Needed)**
Enable these webhook events in your Whop app:

```
✅ payment.succeeded
✅ payment.failed
✅ payment.pending
✅ refund_created
✅ refund_updated
```

## 🧪 **Testing the iframe SDK**

### **Step 1: Test iframe SDK**
Go to: `http://localhost:3000/debug-checkout`
- Click "Test iframe SDK"
- Should open Whop's payment modal
- Complete the payment flow

### **Step 2: Test in Game**
1. Play game until bubbles hit bottom
2. Click "PAY $2 TO CONTINUE"
3. Should open Whop's payment modal
4. Complete payment
5. Return to game - should have 3 new lives

### **Step 3: Check Webhooks**
- Check your webhook logs in Whop dashboard
- Should see `payment.succeeded` event
- Check your app logs for webhook processing

## 🎯 **How It Works**

### **Step 1: User Clicks "PAY $2 TO CONTINUE"**
```typescript
// Opens Whop's payment modal
const result = await iframeSdk.inAppPurchase({ 
  planId: 'plan_l7PoADRRTXgVM',
  metadata: { payment_type: 'game_continue' }
});
```

### **Step 2: User Completes Payment**
- Whop processes the payment
- Sends `payment.succeeded` webhook
- App receives webhook and adds 3 lives to user

### **Step 3: User Returns to Game**
- Game continues with 3 new lives
- User can play until bubbles hit bottom again

## 🚨 **No More API Permissions Needed!**

With the iframe SDK approach:
- ❌ No need for `access_pass:create` permission
- ❌ No need for `company:manage_checkout` permission
- ❌ No need for complex server-side API calls
- ✅ Just the iframe SDK handles everything

## 🎉 **Expected Results**

After implementing this fix:
- ✅ No more 403 Forbidden errors
- ✅ Whop's payment modal opens
- ✅ Users can complete $2 payments
- ✅ Webhooks received for payment success
- ✅ Lives added to user accounts automatically
- ✅ Game continues with 3 new lives

## 🚀 **Key Benefits**

1. **Simple**: Just one function call
2. **No Permissions**: iframe SDK handles everything
3. **Built-in UI**: Whop's native payment modal
4. **Automatic**: Webhooks handled automatically
5. **Official**: This is Whop's recommended approach

**This is the correct way according to Whop's official documentation!** 🎯

## 📝 **Quick Checklist**

- [ ] `@whop/react` package installed
- [ ] Plan created in Whop dashboard ($2 one-time payment)
- [ ] Plan ID set in `NEXT_PUBLIC_GAME_CONTINUE_PLAN_ID`
- [ ] Webhook events enabled
- [ ] Test iframe SDK works
- [ ] Test in-game payment works
- [ ] Webhooks received and processed

**This approach should resolve your 403 error completely!** 🚀
