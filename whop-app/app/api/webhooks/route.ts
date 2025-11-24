import { makeWebhookValidator, type PaymentWebhookData } from "@whop/api";
import { after } from "next/server";
import { recordPayment, addHeartsToUser } from "@/lib/database-optimized";

const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "",
});

export async function POST(request: Request) {
  try {
    // Validate webhook is from Whop
    const webhook = await validateWebhook(request);

    // Handle payment.succeeded event
    if (webhook.action === "payment.succeeded") {
      after(handlePaymentSucceeded(webhook.data));
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook Error", { status: 500 });
  }
}

async function handlePaymentSucceeded(data: PaymentWebhookData) {
  console.log("[PAYMENT SUCCEEDED] Full webhook data:", JSON.stringify(data, null, 2));

  try {
    // Record the payment in your database
    // final_amount is already in dollars
    await recordPayment({
      user_id: data.user_id ?? "unknown",
      amount: data.final_amount
    });

    console.log(`Payment recorded: ${data.final_amount} for user ${data.user_id}`);

    // Check if this is a hearts purchase
    // Metadata might be in different places in the webhook payload
    let metadata: any = null;
    
    // Try different possible locations for metadata
    if (data.metadata) {
      metadata = data.metadata;
    } else if ((data as any).checkout_configuration?.metadata) {
      metadata = (data as any).checkout_configuration.metadata;
    } else if ((data as any).plan?.metadata) {
      metadata = (data as any).plan.metadata;
    }

    console.log("[WEBHOOK METADATA]", metadata);

    if (metadata?.payment_type === 'hearts_purchase' && metadata?.hearts_count) {
      const heartsCount = parseInt(metadata.hearts_count);
      const userId = metadata.userId || data.user_id;

      console.log(`[HEARTS PURCHASE DETECTED] Adding ${heartsCount} hearts to user ${userId}`);

      if (userId && heartsCount > 0) {
        const success = await addHeartsToUser(userId, heartsCount);
        if (success) {
          console.log(`✅ Successfully added ${heartsCount} hearts to user ${userId}`);
        } else {
          console.error(`❌ Failed to add hearts to user ${userId}`);
        }
      } else {
        console.warn(`⚠️ Invalid hearts purchase: userId=${userId}, heartsCount=${heartsCount}`);
      }
    } else {
      console.log("[NOT A HEARTS PURCHASE] Metadata:", metadata);
    }
  } catch (error) {
    console.error("Error recording payment:", error);
  }
}
