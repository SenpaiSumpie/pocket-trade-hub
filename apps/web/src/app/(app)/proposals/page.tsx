'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProposalStore } from '@/stores/proposals';
import { ProposalList } from '@/components/trading/ProposalList';
import { ProposalDetailModal } from '@/components/trading/ProposalDetailModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeftRight } from 'lucide-react';

export default function ProposalsPage() {
  const router = useRouter();
  const { fetchProposals, received, sent, loading } = useProposalStore();
  const pendingCount = received.filter((p) => p.status === 'pending').length;

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-[var(--font-size-heading)] font-bold text-[var(--color-on-surface)]">Trade Proposals</h1>
        {pendingCount > 0 && (
          <Badge variant="premium">{pendingCount}</Badge>
        )}
      </div>
      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-32" />
          ))}
        </div>
      ) : sent.length === 0 && received.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No active proposals"
          subtitle="Browse the marketplace to find cards you want."
          ctaLabel="Go to Market"
          onCta={() => router.push('/market')}
        />
      ) : (
        <>
          <ProposalList />
          <ProposalDetailModal />
        </>
      )}
    </div>
  );
}
