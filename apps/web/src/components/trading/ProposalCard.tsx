'use client';

import type { TradeProposal } from '@pocket-trade-hub/shared/src/schemas/proposal';
import { useProposalStore } from '@/stores/proposals';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[rgba(241,196,15,0.2)] text-[var(--color-warning)]',
  accepted: 'bg-[rgba(46,204,113,0.2)] text-[var(--color-success)]',
  rejected: 'bg-[rgba(231,76,60,0.2)] text-[var(--color-error)]',
  countered: 'bg-[rgba(52,152,219,0.2)] text-[#3498db]',
  completed: 'bg-[rgba(46,204,113,0.2)] text-[var(--color-success)]',
  cancelled: 'bg-[var(--color-surface-light)] text-[var(--color-on-surface-muted)]',
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

function fairnessLabel(score: number): { text: string; color: string } {
  if (score >= 80) return { text: 'Great', color: 'text-[var(--color-success)]' };
  if (score >= 60) return { text: 'Fair', color: 'text-[var(--color-warning)]' };
  if (score >= 40) return { text: 'Uneven', color: 'text-[var(--color-warning)]' };
  return { text: 'Poor', color: 'text-[var(--color-error)]' };
}

interface ProposalCardProps {
  proposal: TradeProposal;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const selectProposal = useProposalStore((s) => s.selectProposal);
  const fairness = fairnessLabel(proposal.fairnessScore);

  return (
    <button
      onClick={() => selectProposal(proposal)}
      className="flex w-full flex-col gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-all hover:ring-1 hover:ring-gold/30 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[proposal.status] ?? ''}`}
        >
          {proposal.status}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${fairness.color}`}>
            {fairness.text}
          </span>
          <span className="text-xs text-text-muted">{timeAgo(proposal.createdAt)}</span>
        </div>
      </div>

      {/* Cards exchange */}
      <div className="flex items-center gap-3">
        {/* Gives */}
        <div className="flex-1">
          <p className="mb-1 text-[10px] uppercase text-text-muted">Gives</p>
          <div className="flex gap-1.5 overflow-hidden">
            {proposal.senderGives.slice(0, 3).map((card, i) => (
              <img
                key={`${card.cardId}-${i}`}
                src={card.imageUrl}
                alt={card.cardName}
                className="h-14 w-10 rounded-md object-cover"
                loading="lazy"
              />
            ))}
            {proposal.senderGives.length > 3 && (
              <div className="flex h-14 w-10 items-center justify-center rounded-md bg-surface-hover text-[10px] text-text-muted">
                +{proposal.senderGives.length - 3}
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="text-text-muted">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>

        {/* Gets */}
        <div className="flex-1">
          <p className="mb-1 text-[10px] uppercase text-text-muted">Gets</p>
          <div className="flex gap-1.5 overflow-hidden">
            {proposal.senderGets.slice(0, 3).map((card, i) => (
              <img
                key={`${card.cardId}-${i}`}
                src={card.imageUrl}
                alt={card.cardName}
                className="h-14 w-10 rounded-md object-cover"
                loading="lazy"
              />
            ))}
            {proposal.senderGets.length > 3 && (
              <div className="flex h-14 w-10 items-center justify-center rounded-md bg-surface-hover text-[10px] text-text-muted">
                +{proposal.senderGets.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
