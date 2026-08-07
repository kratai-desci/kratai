import type { Metadata } from 'next';

import { LandingPageContent } from '../page';

// Temporary comparison route for the all-blue accent variant (CTAs
// included) - see discussion on / vs this before deciding. Not linked from
// anywhere, safe to delete once a direction is picked.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'kratai — Blue accent preview',
	robots: { index: false, follow: false },
};

export default function PreviewBluePage() {
	return <LandingPageContent accent="blue" trackVisit={false} />;
}
