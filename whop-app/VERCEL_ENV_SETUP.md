# Vercel Environment Variables Setup

## Required Environment Variables

Make sure these are set in your Vercel project settings:

### Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add the following variables for **Production**, **Preview**, and **Development**:

```
WHOP_API_KEY=apik_VtO6d7uxwExQ3_A2019097_b9d2213d96bd8fde839049feb8e36e91c8a2f07938d54f182ade0f2991b4ca7d
NEXT_PUBLIC_WHOP_APP_ID=app_WvWq7Ku5EDAZOJ
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_lZMbIALgdMKh9
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_uZiRprltnzfGUs
WHOP_WEBHOOK_SECRET=ws_479fc6acae1ab5e22841f89ec2ad5df6a78a6a2b313a04800d59f028111dc323
NEXT_PUBLIC_SUPABASE_URL=https://grhuhmrwwuvxbvvkvlle.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyaHVobXJ3d3V2eGJ2dmt2bGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTM4MDcsImV4cCI6MjA3OTQ2OTgwN30.2yOB2_D-tabUaLc4W1-gUPR79EjtYT7_bUPkNoobxA4
```

## Important Notes

1. **The error is expected** when someone accesses your Vercel URL directly (not through Whop iframe)
2. The app will now show a friendly message instead of crashing
3. The error will only log in development mode, not in production
4. Users must access the app through Whop's platform for authentication to work

## How to Access Your App Properly

1. Go to [Whop Developer Dashboard](https://whop.com/apps)
2. Find your app: TypeRush (app_WvWq7Ku5EDAZOJ)
3. Set your production URL to your Vercel deployment URL
4. Access the app through Whop's interface

## Testing in Development

For local development with Whop iframe:
1. Run `npm run dev` in the whop-app directory
2. Use Whop's dev proxy to test in iframe context
3. Or use the debug fallback for local testing without Whop

## Redeploy After Changes

After updating the code, redeploy to Vercel:
```bash
git add .
git commit -m "Fix Whop authentication error handling"
git push
```

Vercel will automatically redeploy your app.
