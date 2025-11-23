import Whop from "@whop/sdk";
import { WhopServerSdk } from "@whop/api";

// Initialize Whop SDK for payments (from @whop/sdk)
export const whopSdk = new Whop({
	apiKey: process.env.WHOP_API_KEY!,
	appID: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
});

// Initialize Whop API SDK for authentication (from @whop/api)
export const whopApiSdk = WhopServerSdk({
	appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "",
	appApiKey: process.env.WHOP_API_KEY ?? "",
	onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,
	companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
});

// Create an in-app purchase for $2 game continue
export const createGameContinuePayment = async (params: {
  userId: string;
  gameSessionId?: string;
}) => {
  try {
    // Create charge using Whop SDK for in-app purchase
    const response = await fetch('/api/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        gameSessionId: params.gameSessionId || 'current_session'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create charge');
    }

    const inAppPurchaseSession = await response.json();

    // Return the in-app purchase session for the client to handle
    return inAppPurchaseSession;
  } catch (error) {
    throw error;
  }
};

// Verify payment status
export const verifyPaymentStatus = async (paymentId: string) => {
  try {
    const response = await fetch(`https://api.whop.com/api/v2/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Get user's payment history
export const getUserPaymentHistory = async (userId: string) => {
  try {
    const response = await fetch(`https://api.whop.com/api/v2/payments?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    throw error;
  }
};
