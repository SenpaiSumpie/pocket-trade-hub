'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useProposalStore } from '@/stores/proposals';
import { useAuthStore } from '@/stores/auth';
import { apiFetch } from '@/lib/api';
import type { Card } from '@pocket-trade-hub/shared/src/schemas/card';
import type { ProposalCard } from '@pocket-trade-hub/shared/src/schemas/proposal';
import { Check, X as XIcon, RefreshCw, Search } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[rgba(241,196,15,0.2)] text-[var(--color-warning)]',
  accepted: 'bg-[rgba(46,204,113,0.2)] text-[var(--color-success)]',
  rejected: 'bg-[rgba(231,76,60,0.2)] text-[var(--color-error)]',
  countered: 'bg-[rgba(52,152,219,0.2)] text-[#3498db]',
  completed: 'bg-[rgba(46,204,113,0.2)] text-[var(--color-success)]',
  cancelled: 'bg-[var(--color-surface-light)] text-[var(--color-on-surface-muted)]',
};

function fairnessLabel(score: number): { text: string; color: string } {
  if (score >= 80) return { text: 'Great trade', color: 'text-[var(--color-success)]' };
  if (score >= 60) return { text: 'Fair trade', color: 'text-[var(--color-warning)]' };
  if (score >= 40) return { text: 'Uneven trade', color: 'text-[var(--color-warning)]' };
  return { text: 'Poor trade', color: 'text-[var(--color-error)]' };
}

export function ProposalDetailModal() {
  const { selectedProposal, selectProposal, acceptProposal, rejectProposal, counterProposal } =
    useProposalStore();
  const user = useAuthStore((s) => s.user);
  const [showCounter, setShowCounter] = useState(false);
  const [counterCards, setCounterCards] = useState<ProposalCard[]>([]);
  const [counterMessage, setCounterMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [confirmAction, setConfirmAction] = useState<'accept' | 'reject' | null>(null);

  if (!selectedProposal) return null;

  const isReceived = selectedProposal.receiverId === user?.id;
  const isPending = selectedProposal.status === 'pending';
  const fairness = fairnessLabel(selectedProposal.fairnessScore);

  const handleAccept = async () => {
    setActionLoading('accept');
    try {
      await acceptProposal(selectedProposal.id);
      selectProposal(null);
    } finally {
      setActionLoading('');
      setConfirmAction(null);
    }
  };

  const handleReject = async () => {
    setActionLoading('reject');
    try {
      await rejectProposal(selectedProposal.id);
      selectProposal(null);
    } finally {
      setActionLoading('');
      setConfirmAction(null);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({ q: searchQuery, limit: '20' });
      const data = await apiFetch<{ cards: Card[]; total: number }>(
        `/cards/search?${params.toString()}`,
      );
      setSearchResults(data.cards);
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  const addCounterCard = (card: Card) => {
    if (counterCards.some((c) => c.cardId === card.id)) return;
    setCounterCards((prev) => [
      ...prev,
      {
        cardId: card.id,
        cardName: card.name,
        imageUrl: card.imageUrl,
        rarity: card.rarity ?? '',
      },
    ]);
  };

  const removeCounterCard = (cardId: string) => {
    setCounterCards((prev) => prev.filter((c) => c.cardId !== cardId));
  };

  const handleCounter = async () => {
    if (counterCards.length === 0) return;
    setActionLoading('counter');
    try {
      await counterProposal(
        selectedProposal.id,
        counterCards,
        selectedProposal.senderGives,
        counterMessage || undefined,
      );
      selectProposal(null);
      setShowCounter(false);
      setCounterCards([]);
      setCounterMessage('');
    } finally {
      setActionLoading('');
    }
  };

  const handleClose = () => {
    selectProposal(null);
    setShowCounter(false);
    setCounterCards([]);
    setCounterMessage('');
    setConfirmAction(null);
    setSearchResults([]);
  };

  return (
    <Modal open={!!selectedProposal} onClose={handleClose}>
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[selectedProposal.status] ?? ''}`}
        >
          {selectedProposal.status}
        </span>
        <span className={`text-sm font-medium ${fairness.color}`}>
          {fairness.text}
        </span>
        <span className="text-xs text-text-muted">
          Score: {selectedProposal.fairnessScore}
        </span>
      </div>

      {/* Cards exchange */}
      <div className="mb-6 grid grid-cols-2 gap-6">
        {/* Sender gives */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-text-muted">
            {isReceived ? 'They offer' : 'You offer'}
          </p>
          <div className="space-y-2">
            {selectedProposal.senderGives.map((card, i) => (
              <div
                key={`${card.cardId}-${i}`}
                className="flex items-center gap-2 rounded-lg bg-surface-hover p-2"
              >
                <img
                  src={card.imageUrl}
                  alt={card.cardName}
                  className="h-16 w-11 rounded-md object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-text">{card.cardName}</p>
                  {card.rarity && (
                    <p className="text-xs text-text-muted">{card.rarity}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sender gets */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-text-muted">
            {isReceived ? 'They want' : 'You want'}
          </p>
          <div className="space-y-2">
            {selectedProposal.senderGets.map((card, i) => (
              <div
                key={`${card.cardId}-${i}`}
                className="flex items-center gap-2 rounded-lg bg-surface-hover p-2"
              >
                <img
                  src={card.imageUrl}
                  alt={card.cardName}
                  className="h-16 w-11 rounded-md object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-text">{card.cardName}</p>
                  {card.rarity && (
                    <p className="text-xs text-text-muted">{card.rarity}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Counter form */}
      {showCounter && (
        <div className="mb-4 rounded-xl border border-border p-4">
          <h3 className="mb-3 text-sm font-bold text-text">Counter Offer</h3>

          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <Input
                placeholder="Search cards to counter with..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button variant="secondary" size="sm" onClick={handleSearch} loading={searching}>
              Search
            </Button>
          </div>

          {/* Counter selected cards */}
          {counterCards.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {counterCards.map((card) => (
                <div
                  key={card.cardId}
                  className="flex items-center gap-1.5 rounded-full bg-gold/10 px-2.5 py-1"
                >
                  <img
                    src={card.imageUrl}
                    alt={card.cardName}
                    className="h-6 w-4 rounded-sm object-cover"
                  />
                  <span className="text-xs text-text">{card.cardName}</span>
                  <button
                    onClick={() => removeCounterCard(card.cardId)}
                    className="text-text-muted hover:text-text"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mb-3 max-h-36 space-y-1 overflow-auto rounded-lg border border-border p-2">
              {searchResults.map((card) => {
                const isSelected = counterCards.some((c) => c.cardId === card.id);
                return (
                  <button
                    key={card.id}
                    onClick={() => addCounterCard(card)}
                    disabled={isSelected}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors ${
                      isSelected ? 'opacity-50' : 'hover:bg-surface-hover'
                    }`}
                  >
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="h-10 w-7 rounded-sm object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-text">{card.name}</p>
                      {card.rarity && (
                        <p className="text-xs text-text-muted">{card.rarity}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <Input
            label="Message (optional)"
            placeholder="Add a note..."
            value={counterMessage}
            onChange={(e) => setCounterMessage(e.target.value)}
            className="mb-3"
          />

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCounter(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCounter}
              loading={actionLoading === 'counter'}
              disabled={counterCards.length === 0}
            >
              Send Counter
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation dialogs */}
      {confirmAction && (
        <div className="mb-4 rounded-xl border border-border bg-surface-hover p-4 text-center">
          <p className="mb-3 text-sm text-text">
            {confirmAction === 'accept'
              ? 'Accept this trade proposal?'
              : 'Reject this trade proposal?'}
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === 'accept' ? 'primary' : 'secondary'}
              size="sm"
              onClick={confirmAction === 'accept' ? handleAccept : handleReject}
              loading={actionLoading === confirmAction}
              className={confirmAction === 'reject' ? 'text-[var(--color-error)]' : ''}
            >
              {confirmAction === 'accept' ? 'Confirm Accept' : 'Confirm Reject'}
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      {isReceived && isPending && !showCounter && !confirmAction && (
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button
            variant="secondary"
            onClick={() => setConfirmAction('reject')}
            className="text-[var(--color-error)] hover:opacity-80"
          >
            <XIcon size={16} />
            Reject
          </Button>
          <Button variant="secondary" onClick={() => setShowCounter(true)}>
            <RefreshCw size={16} />
            Counter
          </Button>
          <Button onClick={() => setConfirmAction('accept')}>
            <Check size={16} />
            Accept
          </Button>
        </div>
      )}

      {/* Status-only display for sent proposals */}
      {!isReceived && (
        <div className="border-t border-border pt-4 text-center text-sm text-text-muted">
          {selectedProposal.status === 'pending'
            ? 'Waiting for response...'
            : `This proposal was ${selectedProposal.status}.`}
        </div>
      )}
    </Modal>
  );
}
