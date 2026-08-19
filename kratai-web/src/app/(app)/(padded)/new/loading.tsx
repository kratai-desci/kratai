import { LoadingState } from '@/components/ui/loading-state';

export default function Loading() {
	return <LoadingState message="Loading your repositories from GitHub..." className="min-h-[50vh]" />;
}
