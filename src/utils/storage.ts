/**
 * AsyncStorage helpers for item tracking persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FOUND_ITEMS_KEY = '@arc_raiders_found_items';
const FAVORITES_KEY = '@arc_raiders_favorites';
const WAYPOINTS_KEY = '@arc_raiders_waypoints';
const COLLECTIBLES_KEY = '@arc_raiders_collectibles';
const LOADOUTS_KEY = '@arc_raiders_loadouts';

/* ═══════ FOUND ITEMS ═══════ */
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

/* ═══════ FAVORITES / WISHLIST ═══════ */
export const getFavorites = async (): Promise<string[]> => {
  try {
    const json = await AsyncStorage.getItem(FAVORITES_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

export const toggleFavorite = async (itemId: string): Promise<boolean> => {
  try {
    const favs = await getFavorites();
    const idx = favs.indexOf(itemId);
    const isNowFav = idx === -1;
    if (isNowFav) {
      favs.push(itemId);
    } else {
      favs.splice(idx, 1);
    }
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return isNowFav;
  } catch {
    return false;
  }
};

/* ═══════ CUSTOM WAYPOINTS ═══════ */
export type Waypoint = {
  id: string;
  lat: number;
  lng: number;
  mapId: string;
  label: string;
  color: string;
};

export const getWaypoints = async (mapId: string): Promise<Waypoint[]> => {
  try {
    const json = await AsyncStorage.getItem(WAYPOINTS_KEY);
    const all: Waypoint[] = json ? JSON.parse(json) : [];
    return all.filter(w => w.mapId === mapId);
  } catch {
    return [];
  }
};

export const saveWaypoint = async (wp: Waypoint): Promise<void> => {
  const json = await AsyncStorage.getItem(WAYPOINTS_KEY);
  const all: Waypoint[] = json ? JSON.parse(json) : [];
  all.push(wp);
  await AsyncStorage.setItem(WAYPOINTS_KEY, JSON.stringify(all));
};

export const deleteWaypoint = async (id: string): Promise<void> => {
  const json = await AsyncStorage.getItem(WAYPOINTS_KEY);
  const all: Waypoint[] = json ? JSON.parse(json) : [];
  await AsyncStorage.setItem(
    WAYPOINTS_KEY,
    JSON.stringify(all.filter(w => w.id !== id)),
  );
};

/* ═══════ COLLECTIBLES ═══════ */
export const getCollectibles = async (): Promise<string[]> => {
  try {
    const json = await AsyncStorage.getItem(COLLECTIBLES_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

export const toggleCollectible = async (itemId: string): Promise<boolean> => {
  try {
    const items = await getCollectibles();
    const idx = items.indexOf(itemId);
    const isNowCollected = idx === -1;
    if (isNowCollected) {
      items.push(itemId);
    } else {
      items.splice(idx, 1);
    }
    await AsyncStorage.setItem(COLLECTIBLES_KEY, JSON.stringify(items));
    return isNowCollected;
  } catch {
    return false;
  }
};

/* ═══════ LOADOUTS ═══════ */
export type Loadout = {
  id: string;
  name: string;
  slots: Record<string, string | null>; // slot key → item id
};

export const getLoadouts = async (): Promise<Loadout[]> => {
  try {
    const json = await AsyncStorage.getItem(LOADOUTS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

export const saveLoadouts = async (loadouts: Loadout[]): Promise<void> => {
  await AsyncStorage.setItem(LOADOUTS_KEY, JSON.stringify(loadouts));
};

/* ═══════ COMPLETED QUESTS ═══════ */
const COMPLETED_QUESTS_KEY = '@arc_raiders_completed_quests';

export const getCompletedQuests = async (): Promise<number[]> => {
  try {
    const json = await AsyncStorage.getItem(COMPLETED_QUESTS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

export const toggleCompletedQuest = async (questId: number): Promise<boolean> => {
  try {
    const ids = await getCompletedQuests();
    const idx = ids.indexOf(questId);
    const isNowCompleted = idx === -1;
    if (isNowCompleted) {
      ids.push(questId);
    } else {
      ids.splice(idx, 1);
    }
    await AsyncStorage.setItem(COMPLETED_QUESTS_KEY, JSON.stringify(ids));
    return isNowCompleted;
  } catch {
    return false;
  }
};

export const resetCompletedQuests = async (): Promise<void> => {
  await AsyncStorage.setItem(COMPLETED_QUESTS_KEY, JSON.stringify([]));
};
