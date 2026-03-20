import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-gold">404</h1>
      <p className="text-text-muted">Page not found</p>
      <Link
        href="/cards"
        className="rounded-lg bg-gold px-4 py-2 text-bg font-medium hover:bg-gold-hover transition-colors"
      >
        Back to Cards
      </Link>
    </div>
  );
}
