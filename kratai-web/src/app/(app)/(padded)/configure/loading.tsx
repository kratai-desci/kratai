import { LoadingState } from '@/components/ui/loading-state';

export default function Loading() {
	return <LoadingState message="Scanning repository structure..." className="min-h-[50vh]" />;
}
