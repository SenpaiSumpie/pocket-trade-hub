import LoginForm from '@/components/auth/LoginForm';
import GoogleSignIn from '@/components/auth/GoogleSignIn';

export default function LoginPage() {
  return (
    <div className="rounded-xl bg-surface p-6">
      <h2 className="mb-6 text-xl font-semibold text-text">Log In</h2>
      <LoginForm />
      <GoogleSignIn />
    </div>
  );
}
