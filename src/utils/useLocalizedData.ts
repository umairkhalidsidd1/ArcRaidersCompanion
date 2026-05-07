import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

// Quest guides come from the unified arcraiders.wiki dataset (English only
// for now), so they're served the same regardless of UI language.
import guidesEn from '../data/guides.json';

// English data
import arcsEn from '../data/arcs.json';
import trialsEn from '../data/trials.json';
import arcLootEn from '../data/arcLoot.json';
import questsEn from '../data/quests.json';

// Chinese data
import arcsZh from '../data/zh/arcs_zh.json';
import trialsZh from '../data/zh/trials_zh.json';
import arcLootZh from '../data/zh/arcLoot_zh.json';
import questsZh from '../data/zh/quests_zh.json';

const dataMap = {
  en: { guides: guidesEn, arcs: arcsEn, trials: trialsEn, arcLoot: arcLootEn, quests: questsEn },
  zh: { guides: guidesEn, arcs: arcsZh, trials: trialsZh, arcLoot: arcLootZh, quests: questsZh },
} as const;

type DataKey = keyof typeof dataMap.en;

export function useLocalizedData<K extends DataKey>(key: K): typeof dataMap.en[K] {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'zh' ? 'zh' : 'en';
  return useMemo(() => dataMap[lang][key], [lang, key]);
}

/** Translate rarity strings inline */
export function useRarityTranslator() {
  const { t, i18n } = useTranslation();
  if (i18n.language !== 'zh') return (r: string) => r;
  const map: Record<string, string> = {
    common: t('rarity.common'),
    uncommon: t('rarity.uncommon'),
    rare: t('rarity.rare'),
    epic: t('rarity.epic'),
    legendary: t('rarity.legendary'),
  };
  return (r: string) => map[r.toLowerCase()] || r;
}
