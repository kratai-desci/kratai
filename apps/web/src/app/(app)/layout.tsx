import { Header } from '@/components/layout/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex h-screen flex-col">
			<Header />
			<main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
		</div>
	);
}
