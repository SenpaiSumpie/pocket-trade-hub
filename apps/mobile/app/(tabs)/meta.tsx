import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useCollapsibleHeader } from '@/src/hooks/useCollapsibleHeader';
import { CollapsibleHeader } from '@/src/components/navigation/CollapsibleHeader';
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

  const handleSegmentSwitch = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
  }, []);

  const handleScrape = async () => {
    setScraping(true);
    try {
      const res = await apiFetch<{ ok: boolean; deckCount: number }>('/meta/scrape', { method: 'POST' });
      await useMetaStore.getState().fetchDecks();
      await useTierListStore.getState().fetchTierLists();
      Alert.alert('Scrape Complete', `Loaded ${res.deckCount} decks.`);
    } catch (err: any) {
      Alert.alert('Scrape Failed', err.message);
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
          {SEGMENTS.map((seg, i) => {
            const active = activeTab === seg.key;
            return (
              <View key={seg.key} style={styles.segmentWrapper}>
                {i > 0 && <View style={styles.segmentDivider} />}
                <Pressable
                  style={[styles.segmentItem, active && styles.segmentItemActive]}
                  onPress={() => handleSegmentSwitch(seg.key)}
                >
                  <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                    {t(seg.labelKey)}
                  </Text>
                </Pressable>
              </View>
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
        />
      ) : (
        <TierListBrowser
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyleExtra={!__DEV__ ? { paddingTop: HEADER_MAX } : undefined}
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  segmentWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  segmentDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
  },
  segmentItemActive: {
    backgroundColor: colors.primary + '18',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  segmentLabelActive: {
    color: colors.primary,
    fontWeight: '700',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  devScrapeText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
});
