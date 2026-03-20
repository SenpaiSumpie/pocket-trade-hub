'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-gold">Something went wrong</h1>
      <p className="text-text-muted">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-gold px-4 py-2 text-bg font-medium hover:bg-gold-hover transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
