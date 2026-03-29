import i18n from '../i18n/i18n';

// English data (always loaded)
import arcsEn from './arcs.json';
import arcLootEn from './arcLoot.json';
import guidesEn from './guides.json';
import trialsEn from './trials.json';
import questsEn from './quests.json';
import tradersEn from './traders.json';
import itemsEn from './items.json';
import mapsEn from './maps.json';
import eventsEn from './events.json';
import expeditionsEn from './expeditions.json';

// Chinese data overlays
import arcsZh from './zh/arcs_zh.json';
import arcLootZh from './zh/arcLoot_zh.json';
import guidesZh from './zh/guides_zh.json';
import trialsZh from './zh/trials_zh.json';
import questsZh from './zh/quests_zh.json';
import tradersZh from './zh/traders_zh.json';
import itemsZh from './zh/items_zh.json';
import mapsZh from './zh/maps_zh.json';
import eventsZh from './zh/events_zh.json';
import expeditionsZh from './zh/expeditions_zh.json';

const isZh = () => i18n.language === 'zh';

export const getArcs = () => (isZh() ? arcsZh : arcsEn) as typeof arcsEn;
export const getArcLoot = () => (isZh() ? arcLootZh : arcLootEn) as typeof arcLootEn;
export const getGuides = () => (isZh() ? guidesZh : guidesEn) as typeof guidesEn;
export const getTrials = () => (isZh() ? trialsZh : trialsEn) as typeof trialsEn;
export const getQuests = () => (isZh() ? questsZh : questsEn) as typeof questsEn;
export const getTraders = () => (isZh() ? tradersZh : tradersEn) as typeof tradersEn;
export const getItems = () => (isZh() ? itemsZh : itemsEn) as typeof itemsEn;
export const getMaps = () => (isZh() ? mapsZh : mapsEn) as typeof mapsEn;
export const getEvents = () => (isZh() ? eventsZh : eventsEn) as typeof eventsEn;
export const getExpeditions = () => (isZh() ? expeditionsZh : expeditionsEn) as typeof expeditionsEn;
