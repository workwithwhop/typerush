import { whopApiSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import MobileGamePage from "@/components/MobileGamePage";

// Force dynamic rendering to prevent build-time issues
export const dynamic = 'force-dynamic';

export default async function Page() {
	try {
		// Try to get user info from headers
		const headersList = await headers();
		const { userId } = await whopApiSdk.verifyUserToken(headersList);
		
		// Use simple user data (full user details not needed for game)
		const user = {
			name: "Player",
			username: "player",
		};
		
		// If we have a user, show the mobile game app interface
		return <MobileGamePage user={{ name: user.name, username: user.username, id: userId }} />;
	} catch (error) {
		console.error("Main page error:", error);
		
		// For debugging, let's show the game even if there's an error
		// This will help us see what's happening
		return <MobileGamePage user={{ name: "Debug Player", username: "debug_player", id: "debug_user" }} />;
	}
}
