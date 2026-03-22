'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePostStore } from '@/stores/posts';
import { apiFetch } from '@/lib/api';
import type { Card } from '@pocket-trade-hub/shared/src/schemas/card';
import type { PostType } from '@pocket-trade-hub/shared/src/schemas/post';
import { Search, X, ArrowRight, ArrowLeft } from 'lucide-react';

type Step = 1 | 2 | 3;

interface SelectedCard {
  cardId: string;
  name: string;
  imageUrl: string;
  rarity: string | null;
  language: string;
}

export function CreatePostModal() {
  const { showCreateModal, toggleCreateModal, createPost } = usePostStore();
  const [step, setStep] = useState<Step>(1);
  const [postType, setPostType] = useState<PostType>('offering');
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep(1);
    setPostType('offering');
    setSelectedCards([]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleClose = () => {
    reset();
    toggleCreateModal();
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
    if (selectedCards.some((c) => c.cardId === card.id)) return;
    setSelectedCards((prev) => [
      ...prev,
      {
        cardId: card.id,
        name: card.name,
        imageUrl: card.imageUrl,
        rarity: card.rarity,
        language: 'en',
      },
    ]);
  };

  const removeCard = (cardId: string) => {
    setSelectedCards((prev) => prev.filter((c) => c.cardId !== cardId));
  };

  const handleSubmit = async () => {
    if (selectedCards.length === 0) return;
    setSubmitting(true);
    try {
      await createPost(postType, selectedCards);
      reset();
    } catch {
      // error handled in store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={showCreateModal} onClose={handleClose}>
      <h2 className="mb-4 text-lg font-bold text-text">Create Trade Post</h2>

      {/* Step indicators */}
      <div className="mb-6 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              s <= step ? 'bg-gold' : 'bg-surface-hover'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Select type */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">What type of post?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPostType('offering')}
              className={`rounded-xl border-2 p-4 text-center transition-colors ${
                postType === 'offering'
                  ? 'border-[var(--color-success)] bg-[rgba(46,204,113,0.1)]'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <p className="font-semibold text-[var(--color-success)]">Offering</p>
              <p className="mt-1 text-xs text-text-muted">Cards you want to trade away</p>
            </button>
            <button
              onClick={() => setPostType('seeking')}
              className={`rounded-xl border-2 p-4 text-center transition-colors ${
                postType === 'seeking'
                  ? 'border-[#3498db] bg-[rgba(52,152,219,0.1)]'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <p className="font-semibold text-[#3498db]">Seeking</p>
              <p className="mt-1 text-xs text-text-muted">Cards you are looking for</p>
            </button>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)}>
              Next
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Search and select cards */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">Search and select cards for your post.</p>

          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <Input
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button variant="secondary" onClick={handleSearch} loading={searching}>
              Search
            </Button>
          </div>

          {/* Selected cards */}
          {selectedCards.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-text-muted">
                Selected ({selectedCards.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedCards.map((card) => (
                  <div
                    key={card.cardId}
                    className="flex items-center gap-1.5 rounded-full bg-gold/10 px-2.5 py-1"
                  >
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="h-6 w-4 rounded-sm object-cover"
                    />
                    <span className="text-xs text-text">{card.name}</span>
                    <button
                      onClick={() => removeCard(card.cardId)}
                      className="text-text-muted hover:text-text"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="max-h-48 space-y-1 overflow-auto rounded-lg border border-border p-2">
              {searchResults.map((card) => {
                const isSelected = selectedCards.some((c) => c.cardId === card.id);
                return (
                  <button
                    key={card.id}
                    onClick={() => addCard(card)}
                    disabled={isSelected}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors ${
                      isSelected
                        ? 'opacity-50'
                        : 'hover:bg-surface-hover'
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

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft size={16} />
              Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={selectedCards.length === 0}>
              Next
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review and submit */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">Review your trade post before submitting.</p>

          <div className="rounded-xl border border-border p-4">
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                  postType === 'offering'
                    ? 'bg-[rgba(46,204,113,0.2)] text-[var(--color-success)]'
                    : 'bg-[rgba(52,152,219,0.2)] text-[#3498db]'
                }`}
              >
                {postType}
              </span>
              <span className="text-xs text-text-muted">
                {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {selectedCards.map((card) => (
                <div key={card.cardId} className="flex flex-col items-center gap-1">
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="aspect-[2/3] w-full rounded-md object-cover"
                  />
                  <p className="text-center text-[10px] text-text-muted">{card.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft size={16} />
              Back
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              Create Post
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
