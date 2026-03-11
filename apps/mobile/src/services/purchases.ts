import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
} from 'react-native-purchases';

const RC_IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '';
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';

let isConfigured = false;

/**
 * Initialize RevenueCat with platform-specific API keys.
 * No-ops on web or when keys are missing (Expo Go / dev).
 */
export async function initPurchases(appUserId?: string): Promise<void> {
  if (isConfigured) return;

  const apiKey = Platform.OS === 'ios' ? RC_IOS_KEY : Platform.OS === 'android' ? RC_ANDROID_KEY : '';

  if (!apiKey) {
    // Web platform or missing keys -- gracefully skip
    return;
  }

  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    }

    Purchases.configure({ apiKey, appUserID: appUserId ?? null });
    isConfigured = true;
  } catch (err) {
    console.warn('[Purchases] Failed to configure:', err);
  }
}

/**
 * Check if the current user has an active 'premium' entitlement.
 */
export async function checkPremiumStatus(): Promise<boolean> {
  if (!isConfigured) return false;

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch {
    return false;
  }
}

/**
 * Purchase the 'premium' subscription package.
 * Returns success flag and customer info on success.
 */
export async function purchasePremium(): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  cancelled?: boolean;
}> {
  if (!isConfigured) {
    return { success: false };
  }

  try {
    const offerings = await Purchases.getOfferings();
    const premiumPackage = offerings.current?.availablePackages[0];

    if (!premiumPackage) {
      console.warn('[Purchases] No premium package available');
      return { success: false };
    }

    const { customerInfo } = await Purchases.purchasePackage(premiumPackage);
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;

    return { success: isPremium, customerInfo };
  } catch (err: any) {
    if (err?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { success: false, cancelled: true };
    }
    console.warn('[Purchases] Purchase error:', err);
    return { success: false };
  }
}

/**
 * Restore previous purchases (e.g. after reinstall).
 * Returns whether premium is now active.
 */
export async function restorePurchases(): Promise<boolean> {
  if (!isConfigured) return false;

  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch {
    return false;
  }
}
