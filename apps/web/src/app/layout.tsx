import type { Metadata } from 'next';

import { ThemeProvider } from '@/components/theme/ThemeProvider';

import './globals.css';

export const metadata: Metadata = {
	title: 'kratai',
	description: 'Architecture diagrams for your GitHub repos, generated from real code structure.',
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
