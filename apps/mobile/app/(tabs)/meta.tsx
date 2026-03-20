import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import { DeckRankingList } from '@/src/components/meta/DeckRankingList';
import { TierListBrowser } from '@/src/components/meta/TierListBrowser';

type ActiveTab = 'rankings' | 'tierlists';

const SEGMENTS: Array<{ key: ActiveTab; labelKey: string }> = [
  { key: 'rankings', labelKey: 'meta.rankings' },
  { key: 'tierlists', labelKey: 'meta.tierLists' },
];

export default function MetaScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ActiveTab>('rankings');

  const handleSegmentSwitch = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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

      {/* Content */}
      {activeTab === 'rankings' ? <DeckRankingList /> : <TierListBrowser />}
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
});
