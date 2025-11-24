import { NextRequest, NextResponse } from "next/server";
import { addHeartsToUser } from "@/lib/database-optimized";

// TEST ENDPOINT: Manually add hearts for testing
// Usage: POST /api/test-add-hearts?userId=xxx&hearts=5
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const hearts = parseInt(searchParams.get('hearts') || '1');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    console.log(`[TEST] Manually adding ${hearts} hearts to user ${userId}`);

    const success = await addHeartsToUser(userId, hearts);

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `Added ${hearts} hearts to user ${userId}` 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to add hearts' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[TEST] Error adding hearts:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

