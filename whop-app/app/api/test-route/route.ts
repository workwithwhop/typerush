import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'API route is working!',
    timestamp: new Date().toISOString(),
    env: {
      hasApiKey: !!process.env.WHOP_API_KEY,
      hasProductId: !!process.env.WHOP_GAME_CONTINUE_PRODUCT_ID,
      productId: process.env.WHOP_GAME_CONTINUE_PRODUCT_ID || 'plan_l7PoADRRTXgVM',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ 
      message: 'POST request received',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to parse request body',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}
