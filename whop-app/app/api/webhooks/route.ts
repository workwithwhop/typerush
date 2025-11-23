import { makeWebhookValidator, type PaymentWebhookData } from "@whop/api";
import { after } from "next/server";
import { recordPayment } from "@/lib/database-optimized";

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
  console.log("[PAYMENT SUCCEEDED]", data);

  try {
    // Record the payment in your database
    // final_amount is already in dollars
    await recordPayment({
      user_id: data.user_id ?? "unknown",
      amount: data.final_amount
    });

    console.log(`Payment recorded: $${data.final_amount} for user ${data.user_id}`);
  } catch (error) {
    console.error("Error recording payment:", error);
  }
}

