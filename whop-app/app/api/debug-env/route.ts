import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envCheck = {
      // Check if environment variables are set (without exposing values)
      WHOP_API_KEY: process.env.WHOP_API_KEY ? '✅ Set' : '❌ Missing',
      WHOP_GAME_CONTINUE_PRODUCT_ID: process.env.WHOP_GAME_CONTINUE_PRODUCT_ID || 'plan_l7PoADRRTXgVM (fallback)',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000 (fallback)',
      NEXT_PUBLIC_WHOP_APP_ID: process.env.NEXT_PUBLIC_WHOP_APP_ID ? '✅ Set' : '❌ Missing',
      NEXT_PUBLIC_WHOP_COMPANY_ID: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID ? '✅ Set' : '❌ Missing',
      
      // Show actual values for debugging (be careful in production)
      apiKeyLength: process.env.WHOP_API_KEY?.length || 0,
      productId: process.env.WHOP_GAME_CONTINUE_PRODUCT_ID || 'plan_l7PoADRRTXgVM',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    };

    return NextResponse.json(envCheck);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check environment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
