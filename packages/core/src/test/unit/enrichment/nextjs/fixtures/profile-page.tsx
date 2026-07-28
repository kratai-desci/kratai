// Profile page that renders Avatar component
// Used to test scoping - Profile should NOT link to Header/UserList/Footer
// even though they're in the same workspace

import Avatar from '@/components/Avatar';

export default function ProfilePage() {
	return (
		<div>
			<h1>Profile</h1>
			<Avatar size="large" />
		</div>
	);
}
