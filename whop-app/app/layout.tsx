import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WhopProvider from "@/components/WhopProvider";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "BubbleType - Type Rush Game",
	description: "A fast-paced typing game where you type words in bubbles before they reach the bottom!",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "BubbleType",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
	themeColor: "#10b981",
};

// Force dynamic rendering to prevent build-time Whop SDK issues
export const dynamic = 'force-dynamic';

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark" suppressHydrationWarning>
			<head>
				<style dangerouslySetInnerHTML={{__html: `
					body{background:#1a1a1a !important; color:#ffffff !important;}
					*{background-color:inherit; color:inherit;}
					div,section,article,main,header,footer,nav,aside{background-color:transparent; color:#ffffff;}
					button{background-color:transparent; color:#ffffff;}
					input,textarea,select{background-color:#1f1f1f; color:#ffffff; border-color:#2e2e2e;}
					.card,[class*="card"]{background-color:#1f1f1f; color:#ffffff;}
					h1,h2,h3,h4,h5,h6,p,span,a,li{color:#ffffff;}
				`}} />
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased text-white min-h-screen`}
				style={{background: '#1a1a1a'}}
			>
				<WhopProvider>{children}</WhopProvider>
			</body>
		</html>
	);
}
