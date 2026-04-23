import i18n from '../../i18n/i18n';
import {getItems, getTraders, getQuests} from '../../data/localizedData';
import recycleOutputsData from '../../data/recycleOutputs.json';
import craftingRecipesData from '../../data/craftingRecipes.json';
import enemyDropsData from '../../data/enemyDrops.json';
import expeditionData from '../../data/expeditions.json';
import trophyDisplayData from '../../data/trophyDisplay.json';
import {
  type RawItem,
  type ItemRef,
  type SavedEntry,
  WORKBENCH_UPGRADES,
} from './constants';

/* ═══════════════ ALL ITEMS SORTED ═══════════════ */
let _matLang = '';
export let allItems: RawItem[] = [];
export function refreshMaterialItems() {
  const lang = i18n.language;
  if (_matLang === lang && allItems.length > 0) return;
  _matLang = lang;
  allItems = (getItems() as RawItem[]).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}
refreshMaterialItems();

/* ═══════════════ ITEM BY NAME LOOKUP ═══════════════ */
let _itemByNameLang = '';
export let itemByName: Map<string, RawItem>;
export function ensureItemByName() {
  const lang = i18n.language;
  if (_itemByNameLang === lang) return;
  _itemByNameLang = lang;
  itemByName = new Map<string, RawItem>();
  const source = allItems.length > 0 ? allItems : (getItems() as RawItem[]);
  source.forEach(item => {
    itemByName.set(item.name.toLowerCase(), item);
  });
}

/* ═══════════════ PRE-BUILT LOOKUP INDEXES ═══════════════ */
let _indexesLang = '';
let _allByNameLower: Map<string, RawItem>;
export let _recyclesFromIdx: Map<string, ItemRef[]>;
export let _recycleOutputsIdx: Map<string, ItemRef[]>;
export let _craftedFromIdx: Map<string, ItemRef[]>;
export let _usedInIdx: Map<string, ItemRef[]>;
export let _savedIdx: Map<string, SavedEntry[]>;

export function ensureIndexes() {
  const lang = i18n.language;
  if (_indexesLang === lang) return;
  _indexesLang = lang;

  _allByNameLower = new Map<string, RawItem>();
  allItems.forEach(i => _allByNameLower.set(i.name.toLowerCase(), i));

  const recycleMap = recycleOutputsData as Record<string, {name: string; quantity: number}[]>;

  _recyclesFromIdx = new Map<string, ItemRef[]>();
  Object.entries(recycleMap).forEach(([inputName, outputs]) => {
    const inputItem = _allByNameLower.get(inputName.toLowerCase());
    if (!inputItem) return;
    outputs.forEach(out => {
      const k = out.name.toLowerCase();
      if (!_recyclesFromIdx.has(k)) _recyclesFromIdx.set(k, []);
      _recyclesFromIdx.get(k)!.push({item: inputItem, quantity: out.quantity});
    });
  });

  _recycleOutputsIdx = new Map<string, ItemRef[]>();
  Object.entries(recycleMap).forEach(([inputName, outputs]) => {
    const results: ItemRef[] = [];
    outputs.forEach(out => {
      const found = _allByNameLower.get(out.name.toLowerCase());
      if (found) results.push({item: found, quantity: out.quantity});
    });
    if (results.length > 0) _recycleOutputsIdx.set(inputName, results);
  });

  const craftData = craftingRecipesData as {crafted_from: Record<string, {name: string; quantity: number}[]>; used_in: Record<string, {name: string; quantity: number}[]>};

  _craftedFromIdx = new Map<string, ItemRef[]>();
  Object.entries(craftData.crafted_from).forEach(([itemName, entries]) => {
    const results: ItemRef[] = [];
    entries.forEach(e => {
      const found = _allByNameLower.get(e.name.toLowerCase());
      if (found) results.push({item: found, quantity: e.quantity});
    });
    if (results.length > 0) _craftedFromIdx.set(itemName, results);
  });

  _usedInIdx = new Map<string, ItemRef[]>();
  Object.entries(craftData.used_in).forEach(([itemName, entries]) => {
    const results: ItemRef[] = [];
    const seen = new Set<string>();
    entries.forEach(e => {
      const found = _allByNameLower.get(e.name.toLowerCase());
      if (found && !seen.has(found.id)) {
        seen.add(found.id);
        results.push({item: found, quantity: e.quantity});
      }
    });
    if (results.length > 0) _usedInIdx.set(itemName, results);
  });

  _savedIdx = new Map<string, SavedEntry[]>();
  const pushSaved = (key: string, entry: SavedEntry) => {
    if (!_savedIdx.has(key)) _savedIdx.set(key, []);
    _savedIdx.get(key)!.push(entry);
  };
  WORKBENCH_UPGRADES.forEach(station => {
    station.materials.forEach(mat => {
      pushSaved(mat.name.toLowerCase(), {listName: 'Workbench Upgrades', quantity: mat.quantity, icon: 'hammer-wrench', color: '#AB47BC'});
    });
  });
  (expeditionData as any).stages?.forEach((stage: any) => {
    stage.objectives?.forEach((obj: any) => {
      const k = (obj.item || '').toLowerCase();
      if (k) pushSaved(k, {listName: 'Expedition', detail: stage.name, quantity: obj.quantity, icon: 'compass', color: '#42A5F5'});
    });
  });
  (getTraders() as any[]).forEach((t: any) => {
    if (t.item_name) pushSaved(t.item_name.toLowerCase(), {listName: 'Sold by Trader', detail: t.trader_name, quantity: t.trader_price, icon: 'storefront-outline', color: '#4DB6AC'});
  });
  const allQuestsData = (getQuests() as any).quests || [];
  allQuestsData.forEach((q: any) => {
    (q.rewards || []).forEach((r: any) => {
      if (r.name) pushSaved(r.name.toLowerCase(), {listName: 'Quest Reward', detail: q.name, quantity: r.quantity, icon: 'gift-outline', color: '#FFD54F'});
    });
  });
  (trophyDisplayData as any).stages?.forEach((stage: any) => {
    stage.objectives?.forEach((obj: any) => {
      const k = (obj.item || '').toLowerCase();
      if (k) pushSaved(k, {listName: 'Trophy Display', detail: stage.name, quantity: obj.quantity, icon: 'trophy', color: '#26C6DA'});
    });
  });
  const objEntries: {lower: string; questName: string}[] = [];
  allQuestsData.forEach((q: any) => {
    (q.objectives || []).forEach((obj: any) => {
      const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
      objEntries.push({lower: str.toLowerCase(), questName: q.name});
    });
  });
  allItems.forEach(ai => {
    const nameLower = ai.name.toLowerCase();
    for (const entry of objEntries) {
      if (entry.lower.includes(nameLower)) {
        pushSaved(nameLower, {listName: 'Quest Objective', detail: entry.questName, icon: 'map-marker-check', color: '#FF8A65'});
      }
    }
  });
}

/* ═══════════════ ENEMY DROPS LOOKUP ═══════════════ */
export function getDroppedBy(itemName: string): {name: string; icon: string}[] {
  return (enemyDropsData as Record<string, {name: string; icon: string}[]>)[itemName] || [];
}
