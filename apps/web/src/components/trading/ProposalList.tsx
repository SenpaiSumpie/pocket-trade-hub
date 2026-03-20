'use client';

import { useProposalStore } from '@/stores/proposals';
import { ProposalCard } from './ProposalCard';
import { Skeleton } from '@/components/ui/Skeleton';

export function ProposalList() {
  const { sent, received, loading, activeTab, setActiveTab } = useProposalStore();
  const proposals = activeTab === 'received' ? received : sent;

  return (
    <div>
      {/* Tab toggle */}
      <div className="mb-6 flex rounded-lg border border-border">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors first:rounded-l-lg ${
            activeTab === 'received'
              ? 'bg-gold text-bg'
              : 'text-text-muted hover:bg-surface-hover hover:text-text'
          }`}
        >
          Received
          {received.length > 0 && (
            <span className="ml-1.5 rounded-full bg-gold/20 px-1.5 py-0.5 text-xs text-gold">
              {received.filter((p) => p.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors last:rounded-r-lg ${
            activeTab === 'sent'
              ? 'bg-gold text-bg'
              : 'text-text-muted hover:bg-surface-hover hover:text-text'
          }`}
        >
          Sent
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && proposals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <p className="text-lg font-medium">
            {activeTab === 'received' ? 'No proposals received' : 'No proposals sent'}
          </p>
          <p className="text-sm">
            {activeTab === 'received'
              ? 'When someone sends you a trade proposal, it will appear here.'
              : 'Send a proposal from the Marketplace to start trading.'}
          </p>
        </div>
      )}

      {/* Proposal list */}
      {!loading && proposals.length > 0 && (
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  );
}
