import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { apiFetch } from '@/src/hooks/useApi';
import { useMetaStore } from '@/src/stores/meta';
import { useTierListStore } from '@/src/stores/tierlists';
import { TierRow } from './TierRow';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import type { Tiers, TierList, TierEntry } from '@pocket-trade-hub/shared';

const TIER_KEYS: Array<keyof Tiers> = ['S', 'A', 'B', 'C', 'D'];

interface DeckItem {
  id: string;
  name: string;
}

export function TierListCreator() {
  const { t } = useTranslation();
  const decks = useMetaStore((s) => s.decks);
  const fetchDecks = useMetaStore((s) => s.fetchDecks);
  const fetchTierLists = useTierListStore((s) => s.fetchTierLists);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tiers, setTiers] = useState<Record<keyof Tiers, DeckItem[]>>({
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
  });
  const [unranked, setUnranked] = useState<DeckItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (decks.length === 0) {
      fetchDecks();
    }
  }, [decks.length, fetchDecks]);

  // Add deck to unranked pool
  const addToUnranked = useCallback(
    (deck: DeckItem) => {
      // Check if already in unranked or any tier
      const allPlaced = [
        ...unranked,
        ...tiers.S,
        ...tiers.A,
        ...tiers.B,
        ...tiers.C,
        ...tiers.D,
      ];
      if (allPlaced.some((d) => d.id === deck.id)) return;
      setUnranked((prev) => [...prev, deck]);
    },
    [unranked, tiers],
  );

  // Move deck from unranked to a tier
  const addToTier = useCallback(
    (tier: keyof Tiers, deck: DeckItem) => {
      setUnranked((prev) => prev.filter((d) => d.id !== deck.id));
      // Also remove from any other tier
      setTiers((prev) => {
        const updated = { ...prev };
        for (const key of TIER_KEYS) {
          updated[key] = updated[key].filter((d) => d.id !== deck.id);
        }
        updated[tier] = [...updated[tier], deck];
        return updated;
      });
    },
    [],
  );

  // Remove deck from a tier back to unranked
  const handleRemoveFromTier = useCallback((tier: keyof Tiers, deckId: string) => {
    setTiers((prev) => {
      const item = prev[tier].find((d) => d.id === deckId);
      if (item) {
        setUnranked((u) => [...u, item]);
      }
      return {
        ...prev,
        [tier]: prev[tier].filter((d) => d.id !== deckId),
      };
    });
  }, []);

  // Remove from unranked pool entirely
  const removeFromUnranked = useCallback((deckId: string) => {
    setUnranked((prev) => prev.filter((d) => d.id !== deckId));
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('tierlists.titleRequired'));
      return;
    }

    const totalDecks = TIER_KEYS.reduce((sum, key) => sum + tiers[key].length, 0);
    if (totalDecks === 0) {
      Alert.alert(t('common.error'), t('tierlists.needDecks'));
      return;
    }

    setSaving(true);
    try {
      const tierData: Tiers = {
        S: tiers.S.map((d): TierEntry => ({ deckId: d.id, deckName: d.name })),
        A: tiers.A.map((d): TierEntry => ({ deckId: d.id, deckName: d.name })),
        B: tiers.B.map((d): TierEntry => ({ deckId: d.id, deckName: d.name })),
        C: tiers.C.map((d): TierEntry => ({ deckId: d.id, deckName: d.name })),
        D: tiers.D.map((d): TierEntry => ({ deckId: d.id, deckName: d.name })),
      };

      await apiFetch<TierList>('/tierlists', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          tiers: tierData,
        }),
      });

      await fetchTierLists();
      router.back();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('common.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  }, [title, description, tiers, t, fetchTierLists]);

  // Available decks (not yet added)
  const placedIds = new Set([
    ...unranked.map((d) => d.id),
    ...TIER_KEYS.flatMap((key) => tiers[key].map((d) => d.id)),
  ]);
  const availableDecks = decks
    .filter((d) => !placedIds.has(d.id))
    .map((d) => ({ id: d.id, name: d.name }));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('tierlists.create')}</Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>{t('tierlists.save')}</Text>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={styles.label}>{t('tierlists.title')}</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={t('tierlists.title')}
          placeholderTextColor={colors.textMuted}
          maxLength={100}
        />

        {/* Description */}
        <Text style={styles.label}>{t('tierlists.description')}</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('tierlists.description')}
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          maxLength={500}
        />

        {/* Tier rows */}
        <Text style={[styles.label, { marginTop: spacing.md }]}>Tiers</Text>
        {TIER_KEYS.map((tier) => (
          <TierRow
            key={tier}
            tier={tier}
            items={tiers[tier]}
            onRemoveItem={(id) => handleRemoveFromTier(tier, id)}
          />
        ))}

        {/* Unranked pool */}
        {unranked.length > 0 && (
          <View style={styles.unrankedSection}>
            <Text style={styles.label}>{t('tierlists.unranked')}</Text>
            <View style={styles.chipGrid}>
              {unranked.map((deck) => (
                <Pressable key={deck.id} style={styles.unrankedChip}>
                  <Text style={styles.unrankedChipText} numberOfLines={1}>
                    {deck.name}
                  </Text>
                  {/* Tier assignment buttons */}
                  <View style={styles.tierButtons}>
                    {TIER_KEYS.map((tier) => (
                      <Pressable
                        key={tier}
                        style={styles.miniTierButton}
                        onPress={() => addToTier(tier, deck)}
                      >
                        <Text style={styles.miniTierText}>{tier}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Pressable onPress={() => removeFromUnranked(deck.id)} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Available decks to add */}
        <View style={styles.addSection}>
          <Text style={styles.label}>{t('tierlists.addDecks')}</Text>
          {availableDecks.length === 0 && decks.length > 0 ? (
            <Text style={styles.allAddedText}>{t('common.done')}</Text>
          ) : (
            <View style={styles.chipGrid}>
              {availableDecks.map((deck) => (
                <Pressable
                  key={deck.id}
                  style={styles.addChip}
                  onPress={() => addToUnranked(deck)}
                >
                  <Ionicons name="add" size={14} color={colors.primary} />
                  <Text style={styles.addChipText} numberOfLines={1}>
                    {deck.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {decks.length === 0 && (
            <View style={styles.loadingDecks}>
              <ActivityIndicator size="small" color={colors.textMuted} />
              <Text style={styles.loadingDecksText}>{t('meta.loadingDecks')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.subheading,
    fontSize: 18,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.background,
    fontWeight: '600',
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  unrankedSection: {
    marginTop: spacing.md,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  unrankedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unrankedChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    maxWidth: 80,
  },
  tierButtons: {
    flexDirection: 'row',
    gap: 2,
  },
  miniTierButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTierText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  addSection: {
    marginTop: spacing.lg,
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  addChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    maxWidth: 120,
  },
  allAddedText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  loadingDecks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  loadingDecksText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
