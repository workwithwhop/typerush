"use server";

import { headers } from "next/headers";
import { verifyUserToken, whopSdk } from "@/lib/whop-api";

export async function createCheckoutConfig(hearts: number = 1) {
  try {
    // Get user ID from token verification
    const { userId } = await verifyUserToken(await headers());
    
    // Calculate price: $1.00 per heart
    const pricePerHeart = 1; // $1 in dollars
    const totalPrice = hearts * pricePerHeart;
    
    // Create a checkout configuration for one-time payment
    // TESTING: Set initial_price to 0 for testing purposes
    const result = await whopSdk.checkoutConfigurations.create({
      plan: {
        company_id: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!,
        initial_price: totalPrice, // TESTING: Set to 0 for testing. Change back to totalPrice for production
        plan_type: "one_time",
        currency: "usd",
      },
      metadata: {
        payment_type: 'hearts_purchase',
        hearts_count: hearts.toString(),
        price_per_heart: pricePerHeart.toString(),
        userId: userId
      },
    });

    if (!result || !result.id || !result.plan?.id) {
      throw new Error("Failed to create checkout configuration");
    }

    return {
      checkoutId: result.id,
      planId: result.plan.id,
      hearts: hearts,
      totalPrice: totalPrice, // Already in dollars
    };
  } catch (error) {
    console.error("Error creating checkout config:", error);
    throw error;
  }
}
