import { Header } from '@/components/layout/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen flex-col">
			<Header />
			<main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
		</div>
	);
}
