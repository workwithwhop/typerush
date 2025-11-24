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
		// Silently handle the error - this is expected when not in Whop iframe
		// Only log in development
		if (process.env.NODE_ENV === 'development') {
			console.error("Whop authentication error (expected outside iframe):", error);
		}
		
		// Show a proper message when accessed outside Whop
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
				<div className="text-center max-w-md">
					<h1 className="text-2xl font-bold mb-4">Access Required</h1>
					<p className="text-gray-400 mb-4">
						This app must be accessed through Whop. Please visit your Whop dashboard to use this application.
					</p>
					<a 
						href="https://whop.com/hub" 
						className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
					>
						Go to Whop
					</a>
				</div>
			</div>
		);
	}
}
