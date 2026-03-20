'use client';

import { useCardStore } from '@/stores/cards';
import { CardThumbnail } from './CardThumbnail';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function CardGrid() {
  const { cards, total, page, limit, loading, setPage } = useCardStore();
  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <p className="text-lg font-medium">No cards found</p>
        <p className="text-sm">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {cards.map((card) => (
          <CardThumbnail key={card.id} card={card} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={16} />
            Previous
          </Button>
          <span className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
