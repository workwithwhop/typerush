import { whopApiSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import MobileGamePage from "@/components/MobileGamePage";

// Force dynamic rendering to prevent build-time issues
export const dynamic = 'force-dynamic';

export default async function ExperiencePage() {
	try {
		// Try to get user info from headers
		const headersList = await headers();
		const { userId } = await whopApiSdk.verifyUserToken(headersList);
		
		// If we have a user, show the mobile game app interface
		// Note: We don't need to fetch full user details for the game
		return <MobileGamePage user={{ 
			name: "Player", 
			username: "player", 
			id: userId 
		}} />;
	} catch (error) {
		console.error("Experience page error:", error);
		// If no user token, show simple access message
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
				<div className="text-center">
					<img 
						src="/icon/icon.png" 
						alt="BubbleType" 
						className="w-16 h-16 mx-auto mb-4"
					/>
					<h1 className="text-2xl font-bold text-white mb-2">BubbleType</h1>
					<p className="text-slate-300">Access this game through your Whop experience link to start playing.</p>
				</div>
			</div>
		);
	}
}
