'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCardStore } from '@/stores/cards';
import { useCollectionStore } from '@/stores/collection';
import type { Card } from '@pocket-trade-hub/shared/src/schemas/card';
import { Minus, Plus, Trash2 } from 'lucide-react';

const RARITY_LABELS: Record<string, string> = {
  diamond1: '1 Diamond',
  diamond2: '2 Diamond',
  diamond3: '3 Diamond',
  diamond4: '4 Diamond',
  star1: '1 Star',
  star2: '2 Star',
  star3: '3 Star',
  crown: 'Crown',
};

interface CardDetailModalProps {
  mode?: 'browse' | 'collection';
  card?: Card | null;
  quantity?: number;
  onClose?: () => void;
}

export function CardDetailModal({
  mode = 'browse',
  card: externalCard,
  quantity = 0,
  onClose: externalOnClose,
}: CardDetailModalProps) {
  const storeCard = useCardStore((s) => s.selectedCard);
  const clearSelection = useCardStore((s) => s.clearSelection);
  const { addToCollection, removeFromCollection, updateQuantity } =
    useCollectionStore();

  const card = externalCard ?? storeCard;
  const handleClose = externalOnClose ?? clearSelection;
  const isOpen = card !== null && card !== undefined;

  if (!card) return null;

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <div className="flex flex-col gap-6 sm:flex-row">
        {/* Card image */}
        <div className="flex-shrink-0">
          <img
            src={card.imageUrl}
            alt={card.name}
            className="mx-auto w-48 rounded-lg sm:w-56"
          />
        </div>

        {/* Card details */}
        <div className="flex-1 space-y-3">
          <h2 className="text-xl font-bold text-text">{card.name}</h2>

          <div className="space-y-2 text-sm">
            <DetailRow label="Set" value={card.setId} />
            <DetailRow
              label="Rarity"
              value={
                card.rarity ? (RARITY_LABELS[card.rarity] ?? card.rarity) : 'None'
              }
            />
            <DetailRow label="Card Number" value={card.cardNumber} />
            {card.hp && <DetailRow label="HP" value={String(card.hp)} />}
            {card.type && <DetailRow label="Type" value={card.type} />}
            {card.weakness && (
              <DetailRow label="Weakness" value={card.weakness} />
            )}
            {card.resistance && (
              <DetailRow label="Resistance" value={card.resistance} />
            )}
            {card.illustrator && (
              <DetailRow label="Illustrator" value={card.illustrator} />
            )}
          </div>

          {/* Attacks */}
          {card.attacks && card.attacks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text-muted">Attacks</h3>
              {card.attacks.map((atk, i) => (
                <div key={i} className="rounded-lg bg-bg p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text">
                      {atk.name}
                    </span>
                    {atk.damage && (
                      <span className="text-sm font-bold text-gold">
                        {atk.damage}
                      </span>
                    )}
                  </div>
                  {atk.description && (
                    <p className="mt-1 text-xs text-text-muted">
                      {atk.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2">
            {mode === 'browse' && (
              <Button
                variant="primary"
                onClick={() => {
                  addToCollection(card.id);
                  handleClose();
                }}
              >
                Add to Collection
              </Button>
            )}

            {mode === 'collection' && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={quantity <= 1}
                    onClick={() => updateQuantity(card.id, quantity - 1)}
                  >
                    <Minus size={14} />
                  </Button>
                  <span className="min-w-[2rem] text-center text-sm font-medium text-text">
                    {quantity}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => updateQuantity(card.id, quantity + 1)}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    removeFromCollection(card.id);
                    handleClose();
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} />
                  Remove
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text">{value}</span>
    </div>
  );
}
