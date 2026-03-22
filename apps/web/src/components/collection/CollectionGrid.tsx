'use client';

import { useState, useMemo } from 'react';
import { useCollectionStore } from '@/stores/collection';
import { CardDetailModal } from '@/components/cards/CardDetailModal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { Card } from '@pocket-trade-hub/shared/src/schemas/card';

export function CollectionGrid() {
  const { items, loading, filter, updateQuantity, removeFromCollection } =
    useCollectionStore();
  const [selectedItem, setSelectedItem] = useState<{
    card: Card;
    quantity: number;
  } | null>(null);

  const filteredItems = useMemo(() => {
    let result = items;
    if (filter.query) {
      const q = filter.query.toLowerCase();
      result = result.filter(
        (item) => item.card && item.card.name.toLowerCase().includes(q),
      );
    }
    if (filter.setId) {
      result = result.filter(
        (item) => item.card && item.card.setId === filter.setId,
      );
    }
    return result;
  }, [items, filter]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
        ))}
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <p className="text-lg font-medium">No cards in collection</p>
        <p className="text-sm">
          Browse the cards page to add cards to your collection.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filteredItems.map((item) => {
          if (!item.card) return null;
          const card = item.card;

          return (
            <div
              key={item.cardId}
              className="group relative overflow-hidden rounded-lg"
            >
              <button
                onClick={() =>
                  setSelectedItem({ card, quantity: item.quantity })
                }
                className="w-full focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="aspect-[2/3] w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </button>

              {/* Quantity badge */}
              <span className="absolute left-1 top-1 rounded bg-gold px-1.5 py-0.5 text-xs font-bold text-bg">
                x{item.quantity}
              </span>

              {/* Language badge */}
              <span className="absolute right-1 top-1 rounded bg-surface/90 px-1.5 py-0.5 text-[10px] font-medium text-text-muted uppercase">
                {item.language}
              </span>

              {/* Hover overlay with controls */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/80 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={item.quantity <= 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuantity(item.cardId, item.quantity - 1);
                  }}
                >
                  <Minus size={12} />
                </Button>
                <span className="min-w-[1.5rem] text-center text-xs font-medium text-text">
                  {item.quantity}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuantity(item.cardId, item.quantity + 1);
                  }}
                >
                  <Plus size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromCollection(item.cardId);
                  }}
                  className="text-[var(--color-error)] hover:opacity-80"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedItem && (
        <CardDetailModal
          mode="collection"
          card={selectedItem.card}
          quantity={selectedItem.quantity}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
