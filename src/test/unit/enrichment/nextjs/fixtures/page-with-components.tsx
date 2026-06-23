// Next.js Page that renders multiple components
// This fixture tests JSX component detection

import Header from '@/components/Header';
import UserList from '@/components/UserList';
import Footer from '@/components/Footer';

export default function UsersPage() {
	const users = [
		{ id: 1, name: 'Alice' },
		{ id: 2, name: 'Bob' }
	];
	
	return (
		<div>
			<Header />
			<h1>Users</h1>
			<UserList users={users} />
			<Footer />
		</div>
	);
}
