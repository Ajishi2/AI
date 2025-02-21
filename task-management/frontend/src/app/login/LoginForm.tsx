'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Add your login API call here
    router.push('/dashboard');
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form inputs */}
    </form>
  );
} 