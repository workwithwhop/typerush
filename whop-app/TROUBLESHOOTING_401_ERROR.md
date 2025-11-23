# 🚨 Fixing 401 Error - Whop API Authentication

## The Problem
You're getting a `401 Unauthorized` error when trying to create the checkout. This means your Whop API key is either missing or incorrect.

## ✅ **Solution Steps**

### **Step 1: Check Your Environment Variables**

1. **Go to**: `http://localhost:3000/debug-env`
2. **Click**: "Check Environment Variables"
3. **Look for**: 
   - ✅ `WHOP_API_KEY: Set` (should show "Set", not "Missing")
   - ✅ `WHOP_GAME_CONTINUE_PRODUCT_ID: plan_l7PoADRRTXgVM`

### **Step 2: Verify Your .env.local File**

Make sure your `.env.local` file in the project root contains:

```env
# REQUIRED - Your Whop API Key
WHOP_API_KEY=whop_live_your_actual_api_key_here

# REQUIRED - Your plan ID
WHOP_GAME_CONTINUE_PRODUCT_ID=plan_l7PoADRRTXgVM

# REQUIRED - Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OPTIONAL - Other Whop settings
NEXT_PUBLIC_WHOP_APP_ID=your_app_id_here
NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id_here

# EXISTING - Your Supabase settings
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Step 3: Get Your Whop API Key**

1. **Go to**: [Whop Dashboard](https://whop.com/dashboard)
2. **Navigate to**: API Keys section
3. **Create New Key** or copy existing key
4. **Format**: Should look like `whop_live_xxxxxxxxxxxxx` or `whop_test_xxxxxxxxxxxxx`
5. **Copy the key** and paste it in your `.env.local` file

### **Step 4: Restart Your Development Server**

After updating `.env.local`:

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

### **Step 5: Test Again**

1. **Go to**: `http://localhost:3000/debug-env`
2. **Check**: Environment variables are now showing "Set"
3. **Test**: Go back to your game and try "PAY $2 TO CONTINUE"

## 🔍 **Common Issues & Solutions**

### **Issue 1: API Key Format**
- ❌ **Wrong**: `your_api_key_here`
- ✅ **Correct**: `whop_live_xxxxxxxxxxxxx`

### **Issue 2: Missing .env.local File**
- Make sure `.env.local` exists in your project root
- Not in a subfolder, not named differently

### **Issue 3: Server Not Restarted**
- Environment variables only load when server starts
- Must restart after changing `.env.local`

### **Issue 4: Wrong API Key Type**
- Make sure you're using the **API Key**, not App ID or Company ID
- API Key should start with `whop_live_` or `whop_test_`

## 🧪 **Testing Steps**

### **Test 1: Environment Check**
```
http://localhost:3000/debug-env
```
Should show all variables as "Set"

### **Test 2: Checkout Test**
```
http://localhost:3000/test-checkout
```
Should open Whop checkout page

### **Test 3: Game Integration**
1. Play game until bubbles hit bottom
2. Click "PAY $2 TO CONTINUE"
3. Should open Whop checkout page

## 📋 **Checklist**

- [ ] `.env.local` file exists in project root
- [ ] `WHOP_API_KEY` is set with actual API key (not placeholder)
- [ ] API key starts with `whop_live_` or `whop_test_`
- [ ] `WHOP_GAME_CONTINUE_PRODUCT_ID=plan_l7PoADRRTXgVM`
- [ ] Development server restarted after env changes
- [ ] Debug page shows all variables as "Set"

## 🚨 **If Still Getting 401 Error**

1. **Double-check API key** in Whop dashboard
2. **Try creating a new API key** in Whop
3. **Check API key permissions** in Whop dashboard
4. **Verify plan ID** exists in your Whop account
5. **Check browser console** for more detailed error messages

## 🎯 **Expected Success Flow**

1. ✅ Environment variables loaded correctly
2. ✅ API key authenticated with Whop
3. ✅ Checkout session created successfully
4. ✅ Whop checkout page opens in new tab
5. ✅ User can complete $2 payment

**The 401 error should be resolved once you have the correct API key in your .env.local file!** 🚀
