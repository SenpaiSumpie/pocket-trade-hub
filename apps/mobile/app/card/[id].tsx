import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WarningCircle } from 'phosphor-react-native';
import { CardDetailScreen } from '@/src/components/cards/CardDetailScreen';
import { useCollectionStore } from '@/src/stores/collection';
import { useAddToCollection, useRemoveFromCollection, useUpdateQuantity } from '@/src/hooks/useCollection';
import { useAddToWanted, useRemoveFromWanted, useUpdatePriority } from '@/src/hooks/useWanted';
import { apiFetch } from '@/src/hooks/useApi';
import { colors, spacing } from '@/src/constants/theme';
import type { Card } from '@pocket-trade-hub/shared';

export default function CardDetailRoute() {
  const { id, setName } = useLocalSearchParams<{ id: string; setName?: string }>();
  const router = useRouter();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const collectionByCardId = useCollectionStore((s) => s.collectionByCardId);
  const wantedByCardId = useCollectionStore((s) => s.wantedByCardId);
  const addToCollection = useAddToCollection();
  const removeFromCollection = useRemoveFromCollection();
  const updateQuantity = useUpdateQuantity();
  const addToWanted = useAddToWanted();
  const removeFromWanted = useRemoveFromWanted();
  const updatePriority = useUpdatePriority();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch<Card>(`/cards/${id}`, { skipAuth: true })
      .then((data) => { setCard(data); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !card) {
    return (
      <SafeAreaView style={styles.center}>
        <WarningCircle size={48} color={colors.textMuted} weight="regular" />
        <Text style={styles.errorText}>{error || 'Card not found'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <CardDetailScreen
      card={card}
      setName={setName}
      collectionQuantity={(cardId) => collectionByCardId[cardId] ?? 0}
      wantedPriority={(cardId) => wantedByCardId[cardId]}
      onAddToCollection={(cardId) => addToCollection(cardId)}
      onRemoveFromCollection={(cardId) => removeFromCollection(cardId)}
      onUpdateQuantity={(cardId, qty) => updateQuantity(cardId, qty)}
      onAddToWanted={(cardId) => addToWanted(cardId)}
      onRemoveFromWanted={(cardId) => removeFromWanted(cardId)}
      onUpdatePriority={(cardId, p) => updatePriority(cardId, p)}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  backText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
});
