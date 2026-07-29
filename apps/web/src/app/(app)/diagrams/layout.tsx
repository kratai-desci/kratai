import { DiagramSidebar } from '@/components/diagram/DiagramSidebar';
import { listViews } from '@/lib/data';

export default async function DiagramsLayout({ children }: { children: React.ReactNode }) {
	const views = await listViews();

	return (
		<div className="flex h-full min-h-0">
			<DiagramSidebar views={views} />
			<div className="min-h-0 flex-1 overflow-hidden">{children}</div>
		</div>
	);
}
