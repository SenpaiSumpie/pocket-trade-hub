import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg text-text">
      <h1 className="text-6xl font-bold text-gold mb-4">404</h1>
      <p className="text-xl text-text-muted mb-8">Page not found</p>
      <Link
        href="/cards"
        className="px-6 py-3 bg-gold text-bg font-semibold rounded-lg hover:bg-gold-hover transition-colors"
      >
        Back to Cards
      </Link>
    </div>
  );
}
