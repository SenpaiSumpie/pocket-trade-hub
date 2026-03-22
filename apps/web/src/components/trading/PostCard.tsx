'use client';

import type { MarketPost } from '@/stores/posts';
import { usePostStore } from '@/stores/posts';

const TYPE_STYLES: Record<string, string> = {
  offering: 'bg-[rgba(46,204,113,0.2)] text-[var(--color-success)]',
  seeking: 'bg-[rgba(52,152,219,0.2)] text-[#3498db]',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface PostCardProps {
  post: MarketPost;
}

export function PostCard({ post }: PostCardProps) {
  const selectPost = usePostStore((s) => s.selectPost);

  return (
    <button
      onClick={() => selectPost(post)}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface p-4 text-left transition-all hover:ring-1 hover:ring-gold/30 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
    >
      {/* Header: type badge + time */}
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${TYPE_STYLES[post.type] ?? ''}`}
        >
          {post.type}
        </span>
        <span className="text-xs text-text-muted">{timeAgo(post.createdAt)}</span>
      </div>

      {/* Card thumbnails row */}
      <div className="mb-3 flex gap-2 overflow-hidden">
        {post.cards.slice(0, 4).map((card, i) => (
          <img
            key={`${card.cardId}-${i}`}
            src={card.imageUrl}
            alt={card.name}
            className="h-20 w-14 rounded-md object-cover"
            loading="lazy"
          />
        ))}
        {post.cards.length > 4 && (
          <div className="flex h-20 w-14 items-center justify-center rounded-md bg-surface-hover text-xs text-text-muted">
            +{post.cards.length - 4}
          </div>
        )}
      </div>

      {/* Card names */}
      <p className="mb-2 truncate text-sm font-medium text-text">
        {post.cards.map((c) => c.name).join(', ')}
      </p>

      {/* Poster info */}
      {post.poster && (
        <div className="mt-auto flex items-center gap-2 text-xs text-text-muted">
          <span>{post.poster.username}</span>
          {post.poster.reputation !== undefined && (
            <span className="text-gold">
              {'*'.repeat(Math.min(Math.round(post.poster.reputation), 5))}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
