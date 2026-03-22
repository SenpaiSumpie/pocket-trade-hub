import { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useCollapsibleHeader } from '@/src/hooks/useCollapsibleHeader';
import { useStaggeredList } from '@/src/hooks/useStaggeredList';
import { useToast } from '@/src/hooks/useToast';
import { CollapsibleHeader } from '@/src/components/navigation/CollapsibleHeader';
import { Button } from '@/src/components/ui/Button';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import { DeckRankingList } from '@/src/components/meta/DeckRankingList';
import { TierListBrowser } from '@/src/components/meta/TierListBrowser';
import { apiFetch } from '@/src/hooks/useApi';
import { useMetaStore } from '@/src/stores/meta';
import { useTierListStore } from '@/src/stores/tierlists';

type ActiveTab = 'rankings' | 'tierlists';

const SEGMENTS: Array<{ key: ActiveTab; labelKey: string }> = [
  { key: 'rankings', labelKey: 'meta.rankings' },
  { key: 'tierlists', labelKey: 'meta.tierLists' },
];

export default function MetaScreen() {
  const { scrollHandler, headerStyle, searchRowStyle, titleStyle, borderStyle, HEADER_MAX } = useCollapsibleHeader();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ActiveTab>('rankings');
  const [scraping, setScraping] = useState(false);
  const toast = useToast();

  // Stagger hooks for both views (called unconditionally for Rules of Hooks)
  const decks = useMetaStore((s) => s.decks);
  const deckLoading = useMetaStore((s) => s.loading);
  const tierLists = useTierListStore((s) => s.tierLists);
  const tierLoading = useTierListStore((s) => s.loading);

  const deckStaggerCount = deckLoading ? 0 : decks.length;
  const { onLayout: onDeckStaggerLayout, getItemStyle: getDeckItemStyle } = useStaggeredList(deckStaggerCount);

  const tierStaggerCount = tierLoading ? 0 : tierLists.length;
  const { onLayout: onTierStaggerLayout, getItemStyle: getTierItemStyle } = useStaggeredList(tierStaggerCount);

  const handleSegmentSwitch = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
  }, []);

  const handleScrape = async () => {
    setScraping(true);
    try {
      const res = await apiFetch<{ ok: boolean; deckCount: number }>('/meta/scrape', { method: 'POST' });
      await useMetaStore.getState().fetchDecks();
      await useTierListStore.getState().fetchTierLists();
      toast.success(`Loaded ${res.deckCount} decks`);
    } catch (err: any) {
      toast.error('Scrape failed: ' + err.message);
    } finally {
      setScraping(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CollapsibleHeader
        title={t('tabs.meta', { defaultValue: 'Meta' })}
        headerStyle={headerStyle}
        searchRowStyle={searchRowStyle}
        titleStyle={titleStyle}
        borderStyle={borderStyle}
      >
        {/* Segmented control */}
        <View style={styles.segmentBar}>
          {SEGMENTS.map((seg) => {
            const active = activeTab === seg.key;
            return (
              <Button
                key={seg.key}
                label={t(seg.labelKey)}
                variant={active ? 'secondary' : 'ghost'}
                size="md"
                onPress={() => handleSegmentSwitch(seg.key)}
                style={styles.segmentButton}
              />
            );
          })}
        </View>
      </CollapsibleHeader>

      {/* Dev scrape button */}
      {__DEV__ && (
        <TouchableOpacity
          style={[styles.devScrapeButton, { marginTop: HEADER_MAX }]}
          onPress={handleScrape}
          disabled={scraping}
        >
          {scraping ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.devScrapeText}>Fetch Meta Data (Dev)</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Content */}
      {activeTab === 'rankings' ? (
        <DeckRankingList
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyleExtra={!__DEV__ ? { paddingTop: HEADER_MAX } : undefined}
          getItemStyle={getDeckItemStyle}
          onStaggerLayout={onDeckStaggerLayout}
        />
      ) : (
        <TierListBrowser
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyleExtra={!__DEV__ ? { paddingTop: HEADER_MAX } : undefined}
          getItemStyle={getTierItemStyle}
          onStaggerLayout={onTierStaggerLayout}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  segmentBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  segmentButton: {
    flex: 1,
  },
  devScrapeButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  devScrapeText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
});
