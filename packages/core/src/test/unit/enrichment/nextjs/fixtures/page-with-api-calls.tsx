// Next.js page that makes API calls and uses TypeScript types
// Tests: TypeScript type usage + fetch() API calls

'use client';

import { useState } from 'react';
import { PublicUserDTO } from '@/lib/l3_data/types/user.types';

export default function Home() {
  const [user, setUser] = useState<PublicUserDTO | null>(null);
  const [token, setToken] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'pass' }),
      });
      const data = await res.json();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'pass' }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setToken(data.token);
        const userRes = await fetch(`/api/users/${data.userId}`);
        const userData = await userRes.json();
        setUser(userData.user);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <button onClick={handleRegister}>Register</button>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
