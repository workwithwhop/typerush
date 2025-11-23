# 🚀 Local Development Setup Guide

## Step 1: Create .env.local file

Create a file named `.env.local` in your project root with these contents:

```env
# Whop Integration - Local Development
WHOP_GAME_CONTINUE_PRODUCT_ID=plan_l7PoADRRTXgVM

# Whop API Key (get from Whop Dashboard → API Keys)
WHOP_API_KEY=your_api_key_here

# Whop App ID (get from Whop Dashboard → App Settings)
NEXT_PUBLIC_WHOP_APP_ID=your_app_id_here

# Whop Company ID (get from Whop Dashboard → Company Settings)
NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id_here

# Your local app URL (for development)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 2: Create .env.development file

Create a file named `.env.development` in your project root with the same contents:

```env
# Whop Integration - Development Environment
WHOP_GAME_CONTINUE_PRODUCT_ID=plan_l7PoADRRTXgVM

# Whop API Key (get from Whop Dashboard → API Keys)
WHOP_API_KEY=your_api_key_here

# Whop App ID (get from Whop Dashboard → App Settings)
NEXT_PUBLIC_WHOP_APP_ID=your_app_id_here

# Whop Company ID (get from Whop Dashboard → Company Settings)
NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id_here

# Your local app URL (for development)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 3: Get Your Whop Credentials

### From Whop Dashboard:

1. **API Key**: Go to Dashboard → API Keys → Create New Key
2. **App ID**: Go to Dashboard → App Settings → Copy App ID
3. **Company ID**: Go to Dashboard → Company Settings → Copy Company ID

### Replace in your .env files:
- Replace `your_api_key_here` with your actual API key
- Replace `your_app_id_here` with your actual App ID
- Replace `your_company_id_here` with your actual Company ID
- Replace `your_supabase_url` with your Supabase URL
- Replace `your_supabase_anon_key` with your Supabase anon key

## Step 4: Test the Checkout

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your app in browser: `http://localhost:3000`

3. Play the game until bubbles hit the bottom

4. Click "PAY $2 TO CONTINUE"

5. You should see the Whop checkout page open in a new tab

## Expected Flow:

1. 🎮 **Game Over** → Bubbles hit bottom
2. 💳 **Click "PAY $2 TO CONTINUE"** → Opens Whop checkout
3. 💰 **Complete Payment** → Pay $2 on Whop
4. ✅ **Payment Success** → Redirected back to your app
5. 🎮 **Game Continues** → User gets 3 lives (via webhook later)

## Troubleshooting:

### If checkout doesn't open:
- ✅ Check if API key is correct
- ✅ Verify App ID and Company ID
- ✅ Check browser console for errors
- ✅ Ensure plan ID `plan_l7PoADRRTXgVM` is correct

### If you get API errors:
- ✅ Verify your Whop API key has correct permissions
- ✅ Check if the plan ID exists in your Whop dashboard
- ✅ Ensure your app is properly configured in Whop

## Next Steps (After Local Testing):

Once the checkout is working locally:
1. ✅ Deploy to Vercel
2. ✅ Set up webhook URL in Whop dashboard
3. ✅ Configure webhook events
4. ✅ Test complete payment flow

**The plan ID `plan_l7PoADRRTXgVM` is already configured in the code!** 🚀
