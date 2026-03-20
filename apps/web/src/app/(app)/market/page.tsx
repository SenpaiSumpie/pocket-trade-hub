'use client';

import { useEffect, useState } from 'react';
import { usePostStore } from '@/stores/posts';
import { PostFilters } from '@/components/trading/PostFilters';
import { PostList } from '@/components/trading/PostList';
import { PostDetailModal } from '@/components/trading/PostDetailModal';
import { CreatePostModal } from '@/components/trading/CreatePostModal';
import { CreateProposalModal } from '@/components/trading/CreateProposalModal';

export default function MarketPage() {
  const { fetchPosts, selectedPost } = usePostStore();
  const [showProposalModal, setShowProposalModal] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSendProposal = () => {
    setShowProposalModal(true);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text">Marketplace</h1>
      <PostFilters />
      <PostList />
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
