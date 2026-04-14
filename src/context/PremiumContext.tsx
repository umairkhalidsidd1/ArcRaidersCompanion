import React, {createContext, useContext, useState, useCallback, useEffect} from 'react';

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

// TEMP switch: force-unlock all premium-gated features during development/testing.
// Set to false to restore normal RevenueCat entitlement behavior.
export const TEMP_UNLOCK_ALL_PREMIUM = true;

const ENTITLEMENT_ID = 'pro';

const hasEntitlement = (info: any): boolean => {
  const active = info?.entitlements?.active;
  if (!active) return false;
  return active[ENTITLEMENT_ID] !== undefined;
};

export const PremiumProvider = ({children}: {children: React.ReactNode}) => {
  const [isPremium, setIsPremium] = useState(TEMP_UNLOCK_ALL_PREMIUM);
  const [isLoading, setIsLoading] = useState(!TEMP_UNLOCK_ALL_PREMIUM);

  const checkPremiumStatus = useCallback(async () => {
    if (TEMP_UNLOCK_ALL_PREMIUM) {
      setIsPremium(true);
      setIsLoading(false);
      return;
    }

    try {
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
    if (TEMP_UNLOCK_ALL_PREMIUM) {
      setIsPremium(true);
      setIsLoading(false);
      return;
    }

    checkPremiumStatus();

    // Auto-update on any customer info change (purchase, restore, expiry)
    try {
      const Purchases = require('react-native-purchases').default;
      const listener = (info: any) => {
        setIsPremium(hasEntitlement(info));
      };
      Purchases.addCustomerInfoUpdateListener(listener);
      return () => Purchases.removeCustomerInfoUpdateListener(listener);
    } catch {}
  }, [checkPremiumStatus]);

  return (
    <PremiumContext.Provider value={{isPremium, isLoading, checkPremiumStatus}}>
      {children}
    </PremiumContext.Provider>
  );
};
