import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
	title: 'kratai',
	description: 'Architecture diagrams for your GitHub repos, generated from real code structure.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-surface text-ink antialiased">{children}</body>
		</html>
	);
}
