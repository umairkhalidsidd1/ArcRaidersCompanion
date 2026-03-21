/**
 * AsyncStorage helpers for item tracking persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FOUND_ITEMS_KEY = '@arc_raiders_found_items';

export const getFoundItems = async (): Promise<string[]> => {
  try {
    const json = await AsyncStorage.getItem(FOUND_ITEMS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

export const toggleFoundItem = async (itemId: string): Promise<boolean> => {
  try {
    const items = await getFoundItems();
    const index = items.indexOf(itemId);
    let isNowFound: boolean;

    if (index > -1) {
      items.splice(index, 1);
      isNowFound = false;
    } else {
      items.push(itemId);
      isNowFound = true;
    }

    await AsyncStorage.setItem(FOUND_ITEMS_KEY, JSON.stringify(items));
    return isNowFound;
  } catch {
    return false;
  }
};

export const isItemFound = async (itemId: string): Promise<boolean> => {
  const items = await getFoundItems();
  return items.includes(itemId);
};

export const getFoundCount = async (): Promise<number> => {
  const items = await getFoundItems();
  return items.length;
};
