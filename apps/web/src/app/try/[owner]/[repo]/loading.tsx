import { LoadingState } from '@/components/ui/loading-state';

export default function Loading() {
	return <LoadingState message="Cloning and analyzing the repository..." className="h-full" />;
}
