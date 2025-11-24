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
				user={{
					name: displayName,
					username: uniqueUsername,
					id: userId,
				}}
			/>
		);
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
