'use client';

import type { Card } from '@pocket-trade-hub/shared/src/schemas/card';
import { useCardStore } from '@/stores/cards';

const RARITY_COLORS: Record<string, string> = {
  diamond1: 'bg-zinc-400',
  diamond2: 'bg-zinc-300',
  diamond3: 'bg-blue-400',
  diamond4: 'bg-purple-400',
  star1: 'bg-yellow-400',
  star2: 'bg-yellow-300',
  star3: 'bg-amber-300',
  crown: 'bg-gold',
};

interface CardThumbnailProps {
  card: Card;
}

export function CardThumbnail({ card }: CardThumbnailProps) {
  const selectCard = useCardStore((s) => s.selectCard);

  return (
    <button
      onClick={() => selectCard(card)}
      className="group relative overflow-hidden rounded-lg transition-transform hover:scale-105 hover:shadow-lg hover:ring-1 hover:ring-gold/30 focus:outline-none focus:ring-2 focus:ring-gold/50"
    >
      <img
        src={card.imageUrl}
        alt={card.name}
        className="aspect-[2/3] w-full object-cover"
        loading="lazy"
      />
      {card.rarity && (
        <span
          className={`absolute right-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-bg ${RARITY_COLORS[card.rarity] ?? 'bg-zinc-500'}`}
        >
          {card.rarity}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-xs font-medium text-white">{card.name}</p>
      </div>
    </button>
  );
}
