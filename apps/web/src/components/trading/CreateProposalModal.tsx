'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useProposalStore } from '@/stores/proposals';
import { apiFetch } from '@/lib/api';
import type { Card } from '@pocket-trade-hub/shared/src/schemas/card';
import type { MarketPost } from '@/stores/posts';
import type { ProposalCard } from '@pocket-trade-hub/shared/src/schemas/proposal';
import { Search, X } from 'lucide-react';

interface CreateProposalModalProps {
  open: boolean;
  onClose: () => void;
  post: MarketPost;
}

export function CreateProposalModal({ open, onClose, post }: CreateProposalModalProps) {
  const { createProposal } = useProposalStore();
  const [offeredCards, setOfferedCards] = useState<ProposalCard[]>([]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setOfferedCards([]);
    setMessage('');
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleClose = () => {
    reset();
    onClose();
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

  const addCard = (card: Card) => {
    if (offeredCards.some((c) => c.cardId === card.id)) return;
    setOfferedCards((prev) => [
      ...prev,
      {
        cardId: card.id,
        cardName: card.name,
        imageUrl: card.imageUrl,
        rarity: card.rarity ?? '',
      },
    ]);
  };

  const removeCard = (cardId: string) => {
    setOfferedCards((prev) => prev.filter((c) => c.cardId !== cardId));
  };

  const handleSubmit = async () => {
    if (offeredCards.length === 0) return;
    setSubmitting(true);
    try {
      const requestedCards: ProposalCard[] = post.cards.map((c) => ({
        cardId: c.cardId,
        cardName: c.name,
        imageUrl: c.imageUrl,
        rarity: c.rarity ?? '',
      }));

      await createProposal(
        post.id,
        post.userId,
        offeredCards,
        requestedCards,
        50, // Default fairness score
        message || undefined,
      );
      handleClose();
    } catch {
      // error handled in store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <h2 className="mb-4 text-lg font-bold text-text">Send Proposal</h2>

      {/* Target post cards */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-medium text-text-muted">
          {post.type === 'offering' ? 'They are offering' : 'They are seeking'}
        </p>
        <div className="flex gap-2 overflow-auto">
          {post.cards.map((card, i) => (
            <div
              key={`${card.cardId}-${i}`}
              className="flex flex-col items-center gap-1"
            >
              <img
                src={card.imageUrl}
                alt={card.name}
                className="h-16 w-11 rounded-md object-cover"
              />
              <p className="max-w-[60px] truncate text-[10px] text-text-muted">
                {card.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Cards you offer */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-medium text-text-muted">
          Your offered cards
        </p>

        {/* Search */}
        <div className="mb-2 flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <Input
              placeholder="Search your cards..."
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

        {/* Selected offered cards */}
        {offeredCards.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {offeredCards.map((card) => (
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
                  onClick={() => removeCard(card.cardId)}
                  className="text-text-muted hover:text-text"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="max-h-36 space-y-1 overflow-auto rounded-lg border border-border p-2">
            {searchResults.map((card) => {
              const isSelected = offeredCards.some((c) => c.cardId === card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => addCard(card)}
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
      </div>

      {/* Message */}
      <div className="mb-4">
        <Input
          label="Message (optional)"
          placeholder="Add a note to your proposal..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          loading={submitting}
          disabled={offeredCards.length === 0}
        >
          Send Proposal
        </Button>
      </div>
    </Modal>
  );
}
