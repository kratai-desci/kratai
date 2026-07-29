export default function PaddedLayout({ children }: { children: React.ReactNode }) {
	return <div className="mx-auto w-full max-w-6xl px-6 py-10">{children}</div>;
}
