'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg text-text">
      <h1 className="text-4xl font-bold text-gold mb-4">Something went wrong</h1>
      <p className="text-text-muted mb-8">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-gold text-bg font-semibold rounded-lg hover:bg-gold-hover transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
