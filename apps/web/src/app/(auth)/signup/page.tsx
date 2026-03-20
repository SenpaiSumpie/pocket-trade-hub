import SignupForm from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="rounded-xl bg-surface p-6">
      <h2 className="mb-6 text-xl font-semibold text-text">Sign Up</h2>
      <SignupForm />
    </div>
  );
}
