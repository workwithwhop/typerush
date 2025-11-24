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

		let whopUser: any = null;
		try {
			whopUser = await whopApiSdk.users.getUser({ userId });
		} catch (userError) {
			console.warn("Unable to fetch Whop user profile:", userError);
		}

		const displayName =
			whopUser?.name ||
			whopUser?.display_name ||
			whopUser?.username ||
			"Player";

		const usernameBase =
			whopUser?.username ||
			whopUser?.handle ||
			whopUser?.name ||
			`player`;

		const normalizedBase =
			usernameBase
				.toString()
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "") || "player";

		const uniqueSuffix =
			typeof userId === "string" && userId.length >= 4
				? userId.slice(-6)
				: "guest";

		const uniqueUsername = `${normalizedBase}-${uniqueSuffix}`;

		// If we have a user, show the mobile game app interface
		return (
			<MobileGamePage
				user={{ name: displayName, username: uniqueUsername, id: userId }}
			/>
		);
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
