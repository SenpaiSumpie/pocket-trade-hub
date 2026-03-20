'use client';

import { useEffect } from 'react';
import { useProposalStore } from '@/stores/proposals';
import { ProposalList } from '@/components/trading/ProposalList';
import { ProposalDetailModal } from '@/components/trading/ProposalDetailModal';

export default function ProposalsPage() {
  const { fetchProposals, received } = useProposalStore();
  const pendingCount = received.filter((p) => p.status === 'pending').length;

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-text">Trade Proposals</h1>
        {pendingCount > 0 && (
          <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-sm font-semibold text-gold">
            {pendingCount}
          </span>
        )}
      </div>
      <ProposalList />
      <ProposalDetailModal />
    </div>
  );
}
