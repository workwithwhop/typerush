import { whopApiSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";

// Force dynamic rendering to prevent build-time issues
export const dynamic = 'force-dynamic';

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	// The headers contains the user token
	const headersList = await headers();

	// The companyId is a path param
	const { companyId } = await params;

	// The user token is in the headers
	const { userId } = await whopApiSdk.verifyUserToken(headersList);

	return (
		<div className="flex justify-center items-center h-screen px-8">
			<h1 className="text-xl">
				Hi <strong>User</strong>! <br />
				<br />
				Your user ID is <strong>{userId}</strong>.<br />
				<br />
				You are viewing company: <strong>{companyId}</strong>
			</h1>
		</div>
	);
}
