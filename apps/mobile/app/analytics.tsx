import { useEffect } from 'react';
import { router } from 'expo-router';
import { usePremiumStore } from '@/src/stores/premium';
import AnalyticsDashboard from '@/src/components/premium/AnalyticsDashboard';

export default function AnalyticsScreen() {
  const isPremium = usePremiumStore((s) => s.isPremium);

  // Safety gate: redirect non-premium users
  useEffect(() => {
    if (!isPremium) {
      router.replace('/(tabs)/profile');
    }
  }, [isPremium]);

  if (!isPremium) return null;

  return <AnalyticsDashboard />;
}
