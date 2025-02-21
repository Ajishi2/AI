import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const cookieStore = await cookies(); // ✅ Await cookies() before accessing .get()
  const authToken = cookieStore.get('auth-token')?.value;

  if (authToken) {
    redirect('/dashboard');
  }

  return <LoginForm />;
}
