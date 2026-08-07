import type { Metadata } from 'next';
import Script from 'next/script';

import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { GA_MEASUREMENT_ID } from '@/lib/analytics/gtagConfig';

import './globals.css';

export const metadata: Metadata = {
	title: 'kratai',
	description: 'Architecture diagrams for your GitHub repos, generated from real code structure.',
	icons: {
		icon: [
			{ url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
			{ url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
		],
		apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			{GA_MEASUREMENT_ID && (
				// A beforeInteractive Script rendered as a sibling of <body> (inside
				// <html> but outside any <head>) doesn't get hoisted correctly here -
				// confirmed by inspecting the production build's actual HTML: the
				// script never appears as a literal early <script> tag, only inside
				// the RSC hydration payload, so it runs no earlier than an
				// afterInteractive one would. An explicit <head> is what makes the
				// hoist reliable. This has to run before hydration so dataLayer/config
				// are queued before any component's own useEffect can push an 'event'
				// entry ahead of them - with afterInteractive, a page's own
				// trackEvent() call (e.g. TrackEvent on the landing page) could win
				// the race and land in dataLayer BEFORE this script's 'js'/'config'
				// calls, and gtag.js silently drops an event it has no measurement
				// context for yet. Every one of the six tracked events fires on a
				// fresh full-page load (landing page, or a hard redirect back from
				// GitHub/Stripe), so this isn't a one-off first-load fluke - it's the
				// same race on every page.
				<head>
					<Script id="ga4-init" strategy="beforeInteractive">
						{`
							window.dataLayer = window.dataLayer || [];
							function gtag(){dataLayer.push(arguments);}
							gtag('js', new Date());
							gtag('set', 'transport_type', 'beacon');
							gtag('config', '${GA_MEASUREMENT_ID}');
						`}
					</Script>
				</head>
			)}
			<body className="min-h-screen bg-surface text-ink antialiased">
				<ThemeProvider>{children}</ThemeProvider>
			</body>
			{GA_MEASUREMENT_ID && (
				<Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
			)}
		</html>
	);
}
