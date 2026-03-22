'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { usePostStore } from '@/stores/posts';
import { useAuthStore } from '@/stores/auth';
import { Trash2, Send } from 'lucide-react';

const TYPE_STYLES: Record<string, string> = {
  offering: 'bg-[rgba(46,204,113,0.2)] text-[var(--color-success)]',
  seeking: 'bg-[rgba(52,152,219,0.2)] text-[#3498db]',
};

interface PostDetailModalProps {
  onSendProposal?: () => void;
}

export function PostDetailModal({ onSendProposal }: PostDetailModalProps) {
  const { selectedPost, selectPost, deletePost } = usePostStore();
  const user = useAuthStore((s) => s.user);
  const [deleting, setDeleting] = useState(false);

  if (!selectedPost) return null;

  const isOwn = user?.id === selectedPost.userId;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePost(selectedPost.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal open={!!selectedPost} onClose={() => selectPost(null)}>
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${TYPE_STYLES[selectedPost.type] ?? ''}`}
        >
          {selectedPost.type}
        </span>
        {selectedPost.poster && (
          <span className="text-sm text-text-muted">
            by {selectedPost.poster.username}
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {selectedPost.cards.map((card, i) => (
          <div key={`${card.cardId}-${i}`} className="flex flex-col items-center gap-1">
            <img
              src={card.imageUrl}
              alt={card.name}
              className="aspect-[2/3] w-full rounded-lg object-cover"
            />
            <p className="text-center text-xs font-medium text-text">{card.name}</p>
            {card.language && (
              <span className="text-[10px] uppercase text-text-muted">
                {card.language}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        {isOwn ? (
          <Button
            variant="secondary"
            onClick={handleDelete}
            loading={deleting}
            className="text-[var(--color-error)] hover:opacity-80"
          >
            <Trash2 size={16} />
            Delete Post
          </Button>
        ) : (
          <Button onClick={onSendProposal}>
            <Send size={16} />
            Send Proposal
          </Button>
        )}
      </div>
    </Modal>
  );
}
