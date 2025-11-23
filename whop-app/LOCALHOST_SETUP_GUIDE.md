# Localhost Setup Guide - Running in Whop Platform

## The Issue

When you see "Access this game through your Whop experience link" in the Whop platform, it means the authentication headers aren't being passed to your app.

## Why This Happens

The Whop dev proxy injects authentication headers (`x-whop-user-token`) that your app needs to verify users. Without these headers, authentication fails.

## ✅ Correct Setup

### Step 1: Make Sure Dev Proxy is Running

Your `package.json` already has the correct configuration:
```json
{
  "scripts": {
    "dev": "whop-proxy --command=\"next dev\""
  }
}
```

### Step 2: Start Your Dev Server

Run this command (NOT `next dev` directly):
```bash
npm run dev
```

This will:
1. Start the Whop dev proxy
2. Start your Next.js app on port 3000
3. Inject authentication headers from Whop

### Step 3: Access Through Whop Platform

1. **Open your Whop app** in the Whop dashboard
2. **Click on your experience** to open it in the iframe
3. **Allow localhost connection** if browser shows security warning
4. **Your app should now load** with proper authentication

## Common Issues & Solutions

### Issue 1: "Access denied" message in Whop iframe

**Cause:** Dev proxy not running or not injecting headers

**Solution:**
```bash
# Stop any running servers
# Then restart with:
npm run dev
```

### Issue 2: App works on direct localhost but not in Whop

**Cause:** You're accessing `http://localhost:3000` directly instead of through Whop

**Solution:**
- Don't access `localhost:3000` directly
- Access through Whop's experience link
- The Whop iframe will load your localhost app with auth headers

### Issue 3: Browser security warning

**Cause:** Browser blocking localhost in iframe

**Solution:**
1. Click "Advanced" or "Details"
2. Click "Proceed to localhost" or "Reload"
3. Allow the connection

### Issue 4: Port already in use

**Cause:** Another process using port 3000

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Then restart
npm run dev
```

## How Authentication Works

### With Dev Proxy (Correct)
```
Whop Platform → Dev Proxy → Your App (localhost:3000)
                    ↓
            Injects x-whop-user-token header
                    ↓
            whopApiSdk.verifyUserToken() succeeds
                    ↓
            Game loads ✅
```

### Without Dev Proxy (Wrong)
```
Direct Access → Your App (localhost:3000)
                    ↓
            No x-whop-user-token header
                    ↓
            whopApiSdk.verifyUserToken() fails
                    ↓
            "Access denied" message ❌
```

## Verification Checklist

- [ ] Running `npm run dev` (not `next dev`)
- [ ] Dev proxy started successfully
- [ ] Accessing through Whop platform (not direct localhost)
- [ ] Browser allowed localhost connection
- [ ] Port 3000 is available
- [ ] Environment variables are set in `.env.local`

## Expected Console Output

When dev proxy is running correctly, you should see:
```
> whop-proxy --command="next dev"

Starting Whop dev proxy...
Proxy listening on port 3000
Starting Next.js...
✓ Ready on http://localhost:3000
```

## Testing Authentication

Once your app loads in Whop, check the browser console:
```javascript
// Should NOT see:
"Token verification error: ..."

// Should see:
"User authenticated: user_xxxxx"
```

## Environment Variables Required

Make sure these are in your `.env.local`:
```env
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxx
WHOP_API_KEY=UkL-xxxxx
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_xxxxx
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_xxxxx
WHOP_WEBHOOK_SECRET=ws_xxxxx
```

## Debug Mode

If still having issues, add console logs to see what's happening:

```typescript
// In app/experiences/[experienceId]/page.tsx
export default async function ExperiencePage() {
  try {
    const headersList = await headers();
    console.log("Headers:", Object.fromEntries(headersList.entries()));
    
    const { userId } = await whopApiSdk.verifyUserToken(headersList);
    console.log("User authenticated:", userId);
    
    // ... rest of code
  } catch (error) {
    console.error("Authentication failed:", error);
    // ... error handling
  }
}
```

## Summary

1. ✅ Always run `npm run dev` (uses dev proxy)
2. ✅ Access through Whop platform, not direct localhost
3. ✅ Allow browser to connect to localhost
4. ✅ Check console for authentication logs
5. ✅ Verify environment variables are set

Your app should now work properly in the Whop platform with full authentication!

## Quick Start

```bash
# 1. Make sure environment variables are set
# Check .env.local file

# 2. Start dev server with proxy
npm run dev

# 3. Open Whop platform
# Navigate to your experience

# 4. Your game should load!
```

If you still see "access denied", check the browser console for error messages and verify the dev proxy is running.
