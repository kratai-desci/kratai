import { LoadingState } from '@/components/ui/loading-state';

// Next.js only wraps this route segment's page.tsx in the Suspense
// boundary this fallback belongs to - the parent layout (the sidebar,
// app/(app)/diagrams/layout.tsx) renders immediately, unaffected. h-full
// so this fills the content pane next to the sidebar rather than the
// whole viewport.
export default function Loading() {
	return <LoadingState message="Cloning and analyzing the repository..." className="h-full" />;
}
