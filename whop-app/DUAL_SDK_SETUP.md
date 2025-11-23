# Dual SDK Setup - @whop/sdk + @whop/api

## Why Two Packages?

Your app now uses **both** Whop packages because they serve different purposes:

### @whop/sdk (Payment Operations)
- ✅ `checkoutConfigurations.create()` - Create payment checkouts
- ✅ Payment management
- ✅ Full payment API

### @whop/api (Authentication & GraphQL)
- ✅ `verifyUserToken()` - Authenticate users
- ✅ `checkAccess()` - Verify user access
- ✅ GraphQL mutations
- ✅ Webhook validation

## Current Setup

### lib/whop-sdk.ts
```typescript
import Whop from "@whop/sdk";
import { WhopServerSdk } from "@whop/api";

// For payments
export const whopSdk = new Whop({
  apiKey: process.env.WHOP_API_KEY!,
  appID: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
});

// For authentication
export const whopApiSdk = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "",
  appApiKey: process.env.WHOP_API_KEY ?? "",
  onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,
  companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
});
```

### lib/whop-api.ts
```typescript
import { whopSdk, whopApiSdk } from "./whop-sdk";

export async function verifyUserToken(headers: any) {
  // Uses whopApiSdk for authentication
  const { userId } = await whopApiSdk.verifyUserToken(headers);
  return { userId };
}

export { whopSdk, whopApiSdk };
```

### lib/actions/charge-user.ts
```typescript
import { whopSdk } from "@/lib/whop-api";

export async function createCheckoutConfig() {
  // Uses whopSdk for payments
  const result = await whopSdk.checkoutConfigurations.create({ ... });
  return { checkoutId: result.id, planId: result.plan.id };
}
```

## Usage Guide

### For Payments
```typescript
import { whopSdk } from "@/lib/whop-api";

// Create checkout
const checkout = await whopSdk.checkoutConfigurations.create({ ... });
```

### For Authentication
```typescript
import { whopApiSdk } from "@/lib/whop-api";

// Verify user
const { userId } = await whopApiSdk.verifyUserToken(headers);

// Check access
const access = await whopApiSdk.users.checkAccess(experienceId, { id: userId });
```

### For Webhooks
```typescript
import { makeWebhookValidator } from "@whop/api";

const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "",
});
```

## Why This Works

1. **Payment checkout** requires `@whop/sdk` API
2. **User authentication** requires `@whop/api` methods
3. **Webhooks** use `@whop/api` validation
4. Both packages work together seamlessly

## Troubleshooting

### "Access this game through your whop experience link"
This means authentication is failing. Check:
- Dev proxy is running: `npm run dev`
- Environment variables are set
- You're accessing through Whop's iframe

### "Cannot read properties of undefined (reading 'create')"
This means you're using the wrong SDK. Use:
- `whopSdk` for payments
- `whopApiSdk` for authentication

### Localhost Access Issues
Make sure:
1. Dev proxy is running
2. Accessing via Whop's localhost URL
3. User token is being passed correctly
4. Fallback user ID is set for development

## Package.json
```json
{
  "dependencies": {
    "@whop/api": "^0.0.50",    // For auth & webhooks
    "@whop/sdk": "^0.0.8",     // For payments
    "@whop/react": "0.2.36"    // For iframe SDK
  }
}
```

## Summary

- ✅ Use `@whop/sdk` for payment operations
- ✅ Use `@whop/api` for authentication & webhooks
- ✅ Both packages are properly initialized
- ✅ Authentication should work in localhost mode
- ✅ Payments should work with checkout modal

Your app now has the best of both packages!
