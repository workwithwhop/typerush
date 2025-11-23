# Quick Fix Checklist - App Not Showing in Whop Platform

## ✅ Follow These Steps in Order

### 1. Stop All Running Servers
```bash
# Press Ctrl+C in all terminal windows
# Make sure nothing is running on port 3000
```

### 2. Verify Environment Variables
Check `.env.local` has these (no quotes on webhook secret):
```env
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxx
WHOP_API_KEY=UkL-xxxxx
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_xxxxx
WHOP_WEBHOOK_SECRET=ws_xxxxx
```

### 3. Start Dev Server with Proxy
```bash
npm run dev
```

**Expected output:**
```
> whop-proxy --command="next dev"
Starting Whop dev proxy...
✓ Ready on http://localhost:3000
```

### 4. Access Through Whop Platform

**❌ DON'T DO THIS:**
- Open `http://localhost:3000` directly in browser

**✅ DO THIS:**
1. Go to Whop dashboard
2. Open your app
3. Click on your experience
4. Let Whop load your localhost app in iframe

### 5. Allow Browser Connection

If you see a security warning:
1. Click "Advanced" or "Details"
2. Click "Proceed to localhost" or "Reload"
3. Allow the connection

### 6. Check Browser Console

Press F12 and look for:
- ✅ No authentication errors
- ✅ User ID logged
- ❌ Any red error messages

## Common Mistakes

### ❌ Mistake 1: Running `next dev` instead of `npm run dev`
**Fix:** Always use `npm run dev` to start the dev proxy

### ❌ Mistake 2: Accessing localhost:3000 directly
**Fix:** Access through Whop platform only

### ❌ Mistake 3: Dev proxy not installed
**Fix:** 
```bash
npm install
# This installs @whop-apps/dev-proxy
```

### ❌ Mistake 4: Wrong port
**Fix:** Make sure app runs on port 3000 (default)

### ❌ Mistake 5: Environment variables missing
**Fix:** Copy from `.env.development` to `.env.local`

## Visual Guide

### ✅ Correct Flow:
```
You → Whop Dashboard → Experience Link → Whop Iframe → localhost:3000 (with auth headers)
                                                              ↓
                                                        Game loads! ✅
```

### ❌ Wrong Flow:
```
You → Direct to localhost:3000 (no auth headers)
                ↓
        "Access denied" message ❌
```

## Still Not Working?

### Check These:

1. **Is dev proxy running?**
   ```bash
   # Should see "whop-proxy" in the output
   npm run dev
   ```

2. **Is port 3000 free?**
   ```bash
   # Windows
   netstat -ano | findstr :3000
   ```

3. **Are environment variables loaded?**
   ```bash
   # Add this to your page temporarily:
   console.log("App ID:", process.env.NEXT_PUBLIC_WHOP_APP_ID);
   ```

4. **Is browser blocking localhost?**
   - Check for security warnings
   - Try different browser (Chrome recommended)

5. **Is Whop iframe loading?**
   - Check Whop dashboard console
   - Verify experience is published

## Success Indicators

You'll know it's working when:
- ✅ Game loads in Whop iframe
- ✅ No "access denied" message
- ✅ User is authenticated
- ✅ Can click "Start Game"
- ✅ Payment checkout works

## Final Check

Run through this one more time:
1. [ ] Stopped all servers
2. [ ] Verified `.env.local` exists and has correct values
3. [ ] Running `npm run dev` (not `next dev`)
4. [ ] Accessing through Whop platform (not direct localhost)
5. [ ] Allowed browser to connect to localhost
6. [ ] Checked browser console for errors

If all checked, your app should work! 🎉

## Need More Help?

Check these files:
- `LOCALHOST_SETUP_GUIDE.md` - Detailed setup instructions
- `PATH_FIX_SUMMARY.md` - Authentication fix details
- `DUAL_SDK_SETUP.md` - SDK configuration guide

Your app is now properly configured. The issue is just about running it correctly with the dev proxy!
