"use server";

import { headers } from "next/headers";
import { verifyUserToken } from "@/lib/whop-api";
import { addHeartsToUser } from "@/lib/database-optimized";

// Server action to add hearts (for testing when webhook doesn't fire)
export async function addHeartsAction(hearts: number) {
  try {
    const { userId } = await verifyUserToken(await headers());
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    console.log(`[addHeartsAction] Adding ${hearts} hearts to user ${userId}`);
    
    const success = await addHeartsToUser(userId, hearts);
    
    if (!success) {
      throw new Error("Failed to add hearts");
    }

    return { success: true, hearts };
  } catch (error) {
    console.error("[addHeartsAction] Error:", error);
    throw error;
  }
}

