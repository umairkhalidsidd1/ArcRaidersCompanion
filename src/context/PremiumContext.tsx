import React, {createContext, useContext, useState, useCallback, useEffect} from 'react';
import {ensureRevenueCatConfigured} from '../utils/revenueCat';

type PremiumContextType = {
  isPremium: boolean;
  isLoading: boolean;
  checkPremiumStatus: () => Promise<void>;
};

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  isLoading: true,
  checkPremiumStatus: async () => {},
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

  const checkPremiumStatus = useCallback(async () => {
    try {
      const configured = await ensureRevenueCatConfigured();
      if (!configured) {
        setIsPremium(false);
        return;
      }

      const Purchases = require('react-native-purchases').default;
      const info = await Purchases.getCustomerInfo();
      setIsPremium(hasEntitlement(info));
    } catch {
      setIsPremium(false);
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
          setIsPremium(hasEntitlement(info));
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
    <PremiumContext.Provider value={{isPremium, isLoading, checkPremiumStatus}}>
      {children}
    </PremiumContext.Provider>
  );
};
