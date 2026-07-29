import { listViews } from '@/1_application/queries';
import { DiagramSidebar } from '@/components/diagram/DiagramSidebar';

export default async function DiagramsLayout({ children }: { children: React.ReactNode }) {
	const views = await listViews();

	return (
		<div className="flex h-full min-h-0">
			<DiagramSidebar views={views} />
			<div className="min-h-0 flex-1 overflow-hidden">{children}</div>
		</div>
	);
}
