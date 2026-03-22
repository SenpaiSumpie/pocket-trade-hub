'use client';

import { useEffect, useState } from 'react';
import { usePostStore } from '@/stores/posts';
import { PostFilters } from '@/components/trading/PostFilters';
import { PostList } from '@/components/trading/PostList';
import { PostDetailModal } from '@/components/trading/PostDetailModal';
import { CreatePostModal } from '@/components/trading/CreatePostModal';
import { CreateProposalModal } from '@/components/trading/CreateProposalModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Store } from 'lucide-react';

export default function MarketPage() {
  const { fetchPosts, selectedPost, posts, loading, toggleCreateModal } = usePostStore();
  const [showProposalModal, setShowProposalModal] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSendProposal = () => {
    setShowProposalModal(true);
  };

  return (
    <div>
      <h1 className="mb-6 text-[var(--font-size-heading)] font-bold text-[var(--color-on-surface)]">Marketplace</h1>
      <PostFilters />
      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-32" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No posts yet"
          subtitle="Be the first to post a trade offer."
          ctaLabel="Create Post"
          onCta={() => toggleCreateModal()}
        />
      ) : (
        <PostList />
      )}
      <PostDetailModal onSendProposal={handleSendProposal} />
      <CreatePostModal />
      {selectedPost && (
        <CreateProposalModal
          open={showProposalModal}
          onClose={() => setShowProposalModal(false)}
          post={selectedPost}
        />
      )}
    </div>
  );
}
