import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TierListCreator } from '@/src/components/meta/TierListCreator';

export default function CreateTierListScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <TierListCreator />
    </>
  );
}
