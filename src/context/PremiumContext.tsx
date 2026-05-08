import React, {createContext, useContext, useState, useCallback, useEffect} from 'react';
import {ensureRevenueCatConfigured} from '../utils/revenueCat';

type PremiumContextType = {
  isPremium: boolean;
  isLoading: boolean;
  canShowPaywall: boolean;
  checkPremiumStatus: () => Promise<boolean | null>;
};

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  isLoading: true,
  canShowPaywall: false,
  checkPremiumStatus: async () => null,
});

export const usePremium = () => useContext(PremiumContext);

const ENTITLEMENT_ID = 'pro';

const hasEntitlement = (info: any): boolean => {
  const active = info?.entitlements?.active;
  if (!active) return false;
  return active[ENTITLEMENT_ID] !== undefined;
};

export const PremiumProvider = ({children}: {children: React.ReactNode}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [canShowPaywall, setCanShowPaywall] = useState(false);

  const checkPremiumStatus = useCallback(async () => {
    try {
      const configured = await ensureRevenueCatConfigured();
      if (!configured) {
        setIsPremium(false);
        setCanShowPaywall(false);
        return null;
      }

      const Purchases = require('react-native-purchases').default;
      const info = await Purchases.getCustomerInfo();
      const premium = hasEntitlement(info);
      setIsPremium(premium);
      setCanShowPaywall(!premium);
      return premium;
    } catch {
      setCanShowPaywall(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPremiumStatus();

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    // Auto-update on any customer info change (purchase, restore, expiry)
    const setupListener = async () => {
      try {
        const configured = await ensureRevenueCatConfigured();
        if (!configured || cancelled) return;

        const Purchases = require('react-native-purchases').default;
        const listener = (info: any) => {
          const premium = hasEntitlement(info);
          setIsPremium(premium);
          setCanShowPaywall(!premium);
          setIsLoading(false);
        };
        Purchases.addCustomerInfoUpdateListener(listener);
        unsubscribe = () => Purchases.removeCustomerInfoUpdateListener(listener);
      } catch {}
    };

    setupListener();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [checkPremiumStatus]);

  return (
    <PremiumContext.Provider value={{isPremium, isLoading, canShowPaywall, checkPremiumStatus}}>
      {children}
    </PremiumContext.Provider>
  );
};
