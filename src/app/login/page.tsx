
import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <LoginForm />
    </div>
  );
}
