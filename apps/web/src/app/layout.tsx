import type { Metadata } from 'next';

import { ThemeProvider } from '@/components/theme/ThemeProvider';

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
			<body className="min-h-screen bg-surface text-ink antialiased">
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	);
}
