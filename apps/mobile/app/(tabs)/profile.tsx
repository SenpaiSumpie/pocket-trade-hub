import { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Star, StarHalf, User, GoogleLogo, AppleLogo, CaretRight, PencilSimple, SignOut } from 'phosphor-react-native';
import { BlurView } from 'expo-blur';
import Animated from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { UI_LANGUAGES } from '@pocket-trade-hub/shared';
import { useAuthStore } from '@/src/stores/auth';
import { useLanguageStore } from '@/src/stores/language';
import { getAvatarById } from '@/src/constants/avatars';
import FriendCodeBadge from '@/src/components/FriendCodeBadge';
import { apiFetch } from '@/src/hooks/useApi';
import { signInWithGoogle } from '@/src/services/google-auth';
import { signInWithApple, isAppleSignInAvailable } from '@/src/services/apple-auth';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import { PaywallCard } from '@/src/components/premium/PaywallCard';
import { usePremiumStore } from '@/src/stores/premium';
import RedeemCodeForm from '@/src/components/promo/RedeemCodeForm';
import { LanguageSelector } from '@/src/components/LanguageSelector';
import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { ProfileHeaderSkeleton } from '@/src/components/skeleton/ProfileHeaderSkeleton';
import { useStaggeredList } from '@/src/hooks/useStaggeredList';
import { useToast } from '@/src/hooks/useToast';

interface UserReputation {
  avgRating: number;
  tradeCount: number;
}

function ReputationStars({ avgRating, tradeCount, t }: UserReputation & { t: (key: string, opts?: Record<string, unknown>) => string }) {
  if (tradeCount === 0) {
    return <Text preset="label" color={colors.textMuted}>{t('profile.noRatings')}</Text>;
  }

  const fullStars = Math.floor(avgRating);
  const hasHalf = avgRating - fullStars >= 0.25 && avgRating - fullStars < 0.75;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <View style={styles.reputationRow}>
      <View style={styles.starsRow}>
        {Array.from({ length: fullStars }, (_, i) => (
          <Star key={`f${i}`} size={18} color="#f0c040" weight="fill" />
        ))}
        {hasHalf && <StarHalf size={18} color="#f0c040" weight="fill" />}
        {Array.from({ length: emptyStars }, (_, i) => (
          <Star key={`e${i}`} size={18} color={colors.textMuted} weight="regular" />
        ))}
      </View>
      <Text preset="label" color={colors.textSecondary}>
        {avgRating.toFixed(1)} ({t('trades.tradeCount', { count: tradeCount })})
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const linkedProviders = useAuthStore((s) => s.linkedProviders);
  const setLinkedProviders = useAuthStore((s) => s.setLinkedProviders);
  const linkAccount = useAuthStore((s) => s.linkAccount);
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const [languageVisible, setLanguageVisible] = useState(false);
  const [reputation, setReputation] = useState<UserReputation>({ avgRating: 0, tradeCount: 0 });
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isPremium = usePremiumStore((s) => s.isPremium);
  const fetchPremiumStatus = usePremiumStore((s) => s.fetchStatus);

  // Info sections for stagger animation
  const infoSections = [
    'friendCode',
    'premium',
    'redeem',
    'linkedAccounts',
    'memberInfo',
    'language',
  ] as const;

  const sectionCount = loading ? 0 : infoSections.length;
  const { onLayout, getItemStyle } = useStaggeredList(sectionCount);

  const fetchData = useCallback(async () => {
    if (!isLoggedIn || !user?.id) return;
    try {
      const [userData, providerData] = await Promise.all([
        apiFetch<{ avgRating: number; tradeCount: number }>(`/users/${user.id}`),
        apiFetch<{ providers: string[] }>('/auth/providers'),
      ]);
      setReputation({ avgRating: userData.avgRating, tradeCount: userData.tradeCount });
      setLinkedProviders(providerData.providers);
    } catch {
      // Silently handle errors
    }
    await fetchPremiumStatus();
    setLoading(false);
  }, [isLoggedIn, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleLinkGoogle = async () => {
    setLinkingProvider('google');
    try {
      const idToken = await signInWithGoogle();
      if (!idToken) return;
      if (Platform.OS === 'web') {
        const password = window.prompt(t('profile.enterPasswordToConfirm'));
        if (!password) return;
        await linkAccount('google', idToken, password);
      } else {
        Alert.prompt(
          t('profile.linkGoogleAccount'),
          t('profile.enterPasswordToConfirm'),
          async (password) => {
            if (!password) return;
            try {
              await linkAccount('google', idToken, password);
              setLinkedProviders([...linkedProviders, 'google']);
              toast.success(t('profile.googleAccountLinked'));
            } catch (err) {
              toast.error(t('profile.linkFailed'));
            }
          },
          'secure-text',
        );
      }
    } catch (err) {
      toast.error(t('profile.googleSignInFailed'));
    } finally {
      setLinkingProvider(null);
    }
  };

  const handleLinkApple = async () => {
    setLinkingProvider('apple');
    try {
      const result = await signInWithApple();
      if (!result) return;
      if (Platform.OS === 'web') return;
      Alert.prompt(
        t('profile.linkAppleAccount'),
        t('profile.enterPasswordToConfirm'),
        async (password) => {
          if (!password) return;
          try {
            await linkAccount('apple', result.idToken, password);
            setLinkedProviders([...linkedProviders, 'apple']);
            toast.success(t('profile.appleAccountLinked'));
          } catch (err) {
            toast.error(t('profile.linkFailed'));
          }
        },
        'secure-text',
      );
    } catch (err) {
      toast.error(t('profile.appleSignInFailed'));
    } finally {
      setLinkingProvider(null);
    }
  };

  const handleUnlink = (provider: string) => {
    const hasPassword = true;
    if (linkedProviders.length <= 1 && !hasPassword) {
      Alert.alert(
        t('profile.cannotUnlink'),
        t('profile.cannotUnlinkMessage'),
      );
      return;
    }

    const label = provider === 'google' ? 'Google' : 'Apple';
    Alert.alert(t('profile.unlinkAccount'), t('profile.unlinkConfirm', { provider: label }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.unlinkAccount'),
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/auth/unlink/${provider}`, { method: 'DELETE' });
            setLinkedProviders(linkedProviders.filter((p) => p !== provider));
            toast.success(t('profile.accountUnlinked', { provider: label }));
          } catch (err) {
            toast.error(t('profile.unlinkFailed'));
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('profile.logOutConfirm'))) {
        logout();
      }
      return;
    }
    Alert.alert(t('profile.logOut'), t('profile.logOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logOut'),
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return t('common.noResults');
    return new Date(dateStr).toLocaleDateString(currentLanguage, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const currentLanguageName = UI_LANGUAGES.find((l) => l.code === currentLanguage)?.nativeName ?? currentLanguage;

  const avatar = getAvatarById(user?.avatarId);

  // Initial load skeleton
  if (!user && loading) return <ProfileHeaderSkeleton />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#f0c040"
          colors={["#f0c040"]}
        />
      }
    >
      {/* Glassmorphism Header */}
      <BlurView intensity={40} tint="dark" style={styles.glassHeader}>
        <View style={styles.goldOverlay} pointerEvents="none" />
        <View style={styles.headerContent}>
          {/* Avatar */}
          <View style={[styles.avatarCircle, avatar && { borderColor: avatar.color }]}>
            {avatar ? (
              <Text preset="heading" style={styles.avatarEmoji}>{avatar.emoji}</Text>
            ) : (
              <User size={48} color={colors.textMuted} weight="regular" />
            )}
          </View>

          {/* Display Name + Premium Badge */}
          <View style={styles.nameRow}>
            <Text preset="subheading">{user?.displayName || t('profile.noDisplayName')}</Text>
            {isPremium && <Badge variant="premium" label="PRO" />}
          </View>

          {/* Email */}
          <Text preset="label" color={colors.textSecondary} style={styles.emailText}>{user?.email}</Text>

          {/* Reputation Stars (unchanged per D-25) */}
          <View style={styles.reputationSection}>
            <ReputationStars avgRating={reputation.avgRating} tradeCount={reputation.tradeCount} t={t} />
          </View>
        </View>
      </BlurView>

      {/* Staggered Info Sections */}
      <View onLayout={onLayout} style={styles.sectionsContainer}>
        {/* Friend Code */}
        {user?.friendCode && (
          <Animated.View style={getItemStyle(0)}>
            <Card style={styles.sectionCard}>
              <View style={styles.friendCodeInner}>
                <FriendCodeBadge code={user.friendCode} />
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Premium Section */}
        <Animated.View style={getItemStyle(1)}>
          <PaywallCard />
        </Animated.View>

        {/* Redeem Code */}
        <Animated.View style={getItemStyle(2)}>
          <RedeemCodeForm />
        </Animated.View>

        {/* Linked Accounts */}
        <Animated.View style={getItemStyle(3)}>
          <Card style={styles.sectionCard}>
            <Text preset="subheading" style={styles.sectionTitle}>{t('profile.linkedAccounts')}</Text>
            <View style={styles.divider} />

            {/* Google */}
            <View style={styles.providerRow}>
              <View style={styles.providerInfo}>
                <GoogleLogo size={20} color={colors.text} weight="regular" />
                <Text preset="body">Google</Text>
              </View>
              {linkedProviders.includes('google') ? (
                <Button variant="secondary" label={t('profile.unlinkAccount')} onPress={() => handleUnlink('google')} size="sm" />
              ) : (
                <Button
                  variant="secondary"
                  label={t('profile.linkAccount')}
                  onPress={handleLinkGoogle}
                  disabled={linkingProvider !== null}
                  loading={linkingProvider === 'google'}
                  size="sm"
                />
              )}
            </View>

            {/* Apple (iOS only) */}
            {isAppleSignInAvailable() && (
              <>
                <View style={styles.divider} />
                <View style={styles.providerRow}>
                  <View style={styles.providerInfo}>
                    <AppleLogo size={20} color={colors.text} weight="regular" />
                    <Text preset="body">Apple</Text>
                  </View>
                  {linkedProviders.includes('apple') ? (
                    <Button variant="secondary" label={t('profile.unlinkAccount')} onPress={() => handleUnlink('apple')} size="sm" />
                  ) : (
                    <Button
                      variant="secondary"
                      label={t('profile.linkAccount')}
                      onPress={handleLinkApple}
                      disabled={linkingProvider !== null}
                      loading={linkingProvider === 'apple'}
                      size="sm"
                    />
                  )}
                </View>
              </>
            )}
          </Card>
        </Animated.View>

        {/* Member Info */}
        <Animated.View style={getItemStyle(4)}>
          <Card style={styles.sectionCard}>
            {!user?.friendCode && (
              <>
                <View style={styles.infoRow}>
                  <Text preset="label">{t('profile.friendCode')}</Text>
                  <Text preset="body">{t('profile.friendCodeNotSet')}</Text>
                </View>
                <View style={styles.divider} />
              </>
            )}
            <View style={styles.infoRow}>
              <Text preset="label">{t('profile.memberSince')}</Text>
              <Text preset="body">{formatDate(user?.createdAt)}</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Language */}
        <Animated.View style={getItemStyle(5)}>
          <Card style={styles.sectionCard}>
            <Text preset="subheading" style={styles.sectionTitle}>{t('profile.language')}</Text>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => setLanguageVisible(true)}
            >
              <Text preset="label">{t('profile.currentLanguage')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Text preset="body">{currentLanguageName}</Text>
                <CaretRight size={16} color={colors.textMuted} weight="regular" />
              </View>
            </TouchableOpacity>
          </Card>
        </Animated.View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Button variant="primary" label={t('profile.editProfile')} onPress={() => router.push('/edit-profile')} Icon={PencilSimple} />
        <Button variant="destructive" label={t('profile.logOut')} onPress={handleLogout} Icon={SignOut} />
      </View>

      <LanguageSelector visible={languageVisible} onClose={() => setLanguageVisible(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  // Glassmorphism header
  glassHeader: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginHorizontal: 0,
    marginBottom: spacing.xl,
  },
  goldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(240, 192, 64, 0.08)',
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  avatarEmoji: {
    fontSize: 44,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emailText: {
    marginTop: spacing.xs,
  },
  reputationSection: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  reputationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  // Sections
  sectionsContainer: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionCard: {
    width: '100%',
  },
  friendCodeInner: {
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  // Actions
  actionsContainer: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
});
