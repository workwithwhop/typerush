"use server";

import { headers } from "next/headers";
import { verifyUserToken, whopSdk } from "@/lib/whop-api";

export async function createCheckoutConfig() {
  try {
    // Get user ID from token verification
    const { userId } = await verifyUserToken(await headers());
    
    // Create a checkout configuration for one-time payment
    const result = await whopSdk.checkoutConfigurations.create({
      plan: {
        company_id: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!,
        initial_price: 1, // $2.00
        plan_type: "one_time",
        currency: "usd",
      },
      metadata: {
        payment_type: 'game_continue',
        game_session: 'current_session',
        userId: userId
      },
    });

    if (!result || !result.id || !result.plan?.id) {
      throw new Error("Failed to create checkout configuration");
    }

    return {
      checkoutId: result.id,
      planId: result.plan.id,
    };
  } catch (error) {
    console.error("Error creating checkout config:", error);
    throw error;
  }
}
