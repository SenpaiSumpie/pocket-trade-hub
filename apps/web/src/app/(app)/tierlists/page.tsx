'use client';

import { useEffect } from 'react';
import { useTierListStore } from '@/stores/tierlists';
import { TierListBrowser } from '@/components/meta/TierListBrowser';
import { TierListDetailModal } from '@/components/meta/TierListDetailModal';
import { TierListCreator } from '@/components/meta/TierListCreator';

export default function TierListsPage() {
  const fetchTierLists = useTierListStore((s) => s.fetchTierLists);

  useEffect(() => {
    fetchTierLists();
  }, [fetchTierLists]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text">Tier Lists</h1>
      <TierListBrowser />
      <TierListDetailModal />
      <TierListCreator />
    </div>
  );
}
