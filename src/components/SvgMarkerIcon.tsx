import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {SvgProps} from 'react-native-svg';
import {colors} from '../theme/theme';

// Static require map for all marker SVGs
// Each SVG is imported as a React component via react-native-svg-transformer
import AgaveSvg from '../assets/icons/markers/agave.svg';
import AmmoCrateSvg from '../assets/icons/markers/ammo-crate.svg';
import AntennaSvg from '../assets/icons/markers/antenna.svg';
import ApricotTreeSvg from '../assets/icons/markers/apricot-tree.svg';
import ArcCourierSvg from '../assets/icons/markers/arc-courier.svg';
import BackpackSvg from '../assets/icons/markers/backpack.svg';
import BaronHuskSvg from '../assets/icons/markers/baron-husk.svg';
import BastionSvg from '../assets/icons/markers/bastion.svg';
import BombardierSvg from '../assets/icons/markers/bombardier.svg';
import ButtonSvg from '../assets/icons/markers/button.svg';
import CandleberriesSvg from '../assets/icons/markers/candleberries.svg';
import CrashedProbeSvg from '../assets/icons/markers/crash-pobe.svg';
import DownloadConsoleSvg from '../assets/icons/markers/download-console.svg';
import ElevatorSvg from '../assets/icons/markers/elevator.svg';
import FieldCrateSvg from '../assets/icons/markers/field-crate.svg';
import FieldDepotSvg from '../assets/icons/markers/field-depot.svg';
import FireballSvg from '../assets/icons/markers/fireball.svg';
import FuelCellSvg from '../assets/icons/markers/fuel-cell.svg';
import GeneratorSvg from '../assets/icons/markers/generator.svg';
import GreatMullenSvg from '../assets/icons/markers/great-mullen.svg';
import GrenadeTubeSvg from '../assets/icons/markers/grenade-tube.svg';
import HarvesterSvg from '../assets/icons/markers/harvester.svg';
import HatchSvg from '../assets/icons/markers/hatch.svg';
import KeyCardSvg from '../assets/icons/markers/key-card.svg';
import LeaperSvg from '../assets/icons/markers/leaper.svg';
import LemonSvg from '../assets/icons/markers/lemon.svg';
import LockedRoomSvg from '../assets/icons/markers/locked-room.svg';
import MedicineBagSvg from '../assets/icons/markers/medicine-bag.svg';
import MetroEntranceSvg from '../assets/icons/markers/metro-entrance.svg';
import MetroStationSvg from '../assets/icons/markers/metro-station.svg';
import MossSvg from '../assets/icons/markers/moss.svg';
import MushroomsSvg from '../assets/icons/markers/mushrooms.svg';
import OliveTreeSvg from '../assets/icons/markers/olive-tree.svg';
import PlayerMarkerSvg from '../assets/icons/markers/player-marker.svg';
import PopSvg from '../assets/icons/markers/pop.svg';
import PricklyPearSvg from '../assets/icons/markers/prickly-pear.svg';
import QueenSvg from '../assets/icons/markers/queen.svg';
import QuestSvg from '../assets/icons/markers/quest.svg';
import RaiderCacheSvg from '../assets/icons/markers/raider-cache.svg';
import RaiderCampSvg from '../assets/icons/markers/raider-camp.svg';
import RocketeerHuskSvg from '../assets/icons/markers/rocketeer-husk.svg';
import RocketeerSvg from '../assets/icons/markers/rocketeer.svg';
import SecurityLockerSvg from '../assets/icons/markers/security-locker.svg';
import SentinelSvg from '../assets/icons/markers/sentinel.svg';
import SpawnPointSvg from '../assets/icons/markers/spawn-point.svg';
import SupplyCallStation1Svg from '../assets/icons/markers/supply-call-station-1.svg';
import SupplyCallStation2Svg from '../assets/icons/markers/supply-call-station-2.svg';
import SupplyCallStationSvg from '../assets/icons/markers/supply-call-station.svg';
import SurveyorSvg from '../assets/icons/markers/surveyor.svg';
import TickSvg from '../assets/icons/markers/tick.svg';
import TurretSvg from '../assets/icons/markers/turret.svg';
import WaspHuskSvg from '../assets/icons/markers/wasp-husk.svg';
import WeaponCaseSvg from '../assets/icons/markers/weapon-case.svg';
import WickerBasketSvg from '../assets/icons/markers/wicker-basket.svg';

type SvgComponent = React.FC<SvgProps>;

const SVG_REGISTRY: Record<string, SvgComponent> = {
  'agave.svg': AgaveSvg,
  'ammo-crate.svg': AmmoCrateSvg,
  'antenna.svg': AntennaSvg,
  'apricot-tree.svg': ApricotTreeSvg,
  'arc-courier.svg': ArcCourierSvg,
  'backpack.svg': BackpackSvg,
  'baron-husk.svg': BaronHuskSvg,
  'bastion.svg': BastionSvg,
  'bombardier.svg': BombardierSvg,
  'button.svg': ButtonSvg,
  'candleberries.svg': CandleberriesSvg,
  'crash-pobe.svg': CrashedProbeSvg,
  'download-console.svg': DownloadConsoleSvg,
  'elevator.svg': ElevatorSvg,
  'field-crate.svg': FieldCrateSvg,
  'field-depot.svg': FieldDepotSvg,
  'fireball.svg': FireballSvg,
  'fuel-cell.svg': FuelCellSvg,
  'generator.svg': GeneratorSvg,
  'great-mullen.svg': GreatMullenSvg,
  'grenade-tube.svg': GrenadeTubeSvg,
  'harvester.svg': HarvesterSvg,
  'hatch.svg': HatchSvg,
  'key-card.svg': KeyCardSvg,
  'leaper.svg': LeaperSvg,
  'lemon.svg': LemonSvg,
  'locked-room.svg': LockedRoomSvg,
  'medicine-bag.svg': MedicineBagSvg,
  'metro-entrance.svg': MetroEntranceSvg,
  'metro-station.svg': MetroStationSvg,
  'moss.svg': MossSvg,
  'mushrooms.svg': MushroomsSvg,
  'olive-tree.svg': OliveTreeSvg,
  'player-marker.svg': PlayerMarkerSvg,
  'pop.svg': PopSvg,
  'prickly-pear.svg': PricklyPearSvg,
  'queen.svg': QueenSvg,
  'quest.svg': QuestSvg,
  'raider-cache.svg': RaiderCacheSvg,
  'raider-camp.svg': RaiderCampSvg,
  'rocketeer-husk.svg': RocketeerHuskSvg,
  'rocketeer.svg': RocketeerSvg,
  'security-locker.svg': SecurityLockerSvg,
  'sentinel.svg': SentinelSvg,
  'spawn-point.svg': SpawnPointSvg,
  'supply-call-station-1.svg': SupplyCallStation1Svg,
  'supply-call-station-2.svg': SupplyCallStation2Svg,
  'supply-call-station.svg': SupplyCallStationSvg,
  'surveyor.svg': SurveyorSvg,
  'tick.svg': TickSvg,
  'turret.svg': TurretSvg,
  'wasp-husk.svg': WaspHuskSvg,
  'weapon-case.svg': WeaponCaseSvg,
  'wicker-basket.svg': WickerBasketSvg,
};

// Also map by type name (for filter bar etc.)
const TYPE_TO_SVG: Record<string, string> = {
  'Agave': 'agave.svg',
  'Ammo Crate': 'ammo-crate.svg',
  'Antenna': 'antenna.svg',
  'Apricot Tree': 'apricot-tree.svg',
  'ARC Courier': 'arc-courier.svg',
  'Backpack': 'backpack.svg',
  'Baron Husk': 'baron-husk.svg',
  'Bastion': 'bastion.svg',
  'Bombardier': 'bombardier.svg',
  'Button': 'button.svg',
  'Candleberries': 'candleberries.svg',
  'Crashed Probe': 'crash-pobe.svg',
  'Download Console': 'download-console.svg',
  'Cargo Elevator': 'elevator.svg',
  'Elevator': 'elevator.svg',
  'Field Crate': 'field-crate.svg',
  'Field Depot': 'field-depot.svg',
  'Fireball': 'fireball.svg',
  'Fuel Cell': 'fuel-cell.svg',
  'Generator': 'generator.svg',
  'Great Mullen': 'great-mullen.svg',
  'Grenade Tube': 'grenade-tube.svg',
  'Harvester': 'harvester.svg',
  'Hatch': 'hatch.svg',
  'Key Card': 'key-card.svg',
  'Leaper': 'leaper.svg',
  'Lemon': 'lemon.svg',
  'Locked Room': 'locked-room.svg',
  'Medicine Bag': 'medicine-bag.svg',
  'Metro Entrance': 'metro-entrance.svg',
  'Metro Station': 'metro-station.svg',
  'Moss': 'moss.svg',
  'Mushrooms': 'mushrooms.svg',
  'Olive Tree': 'olive-tree.svg',
  'Player Spawn': 'player-marker.svg',
  'Pop': 'pop.svg',
  'Prickly Pear': 'prickly-pear.svg',
  'Queen': 'queen.svg',
  'Quest': 'quest.svg',
  'Raider Cache': 'raider-cache.svg',
  'Raider Camp': 'raider-camp.svg',
  'Rocketeer Husk': 'rocketeer-husk.svg',
  'Rocketeer': 'rocketeer.svg',
  'Security Locker': 'security-locker.svg',
  'Sentinel': 'sentinel.svg',
  'Spawn Point': 'spawn-point.svg',
  'Supply Call Station': 'supply-call-station.svg',
  'Surveyor': 'surveyor.svg',
  'Tick': 'tick.svg',
  'Turret': 'turret.svg',
  'Wasp Husk': 'wasp-husk.svg',
  'Weapon Case': 'weapon-case.svg',
  'Wicker Basket': 'wicker-basket.svg',
};

/**
 * Get SVG component by filename (e.g. "agave.svg")
 */
export const getMarkerSvg = (svgFilename: string): SvgComponent | null => {
  return SVG_REGISTRY[svgFilename] || null;
};

/**
 * Get SVG component by marker type name (e.g. "Agave")
 */
export const getMarkerSvgByType = (typeName: string): SvgComponent | null => {
  const filename = TYPE_TO_SVG[typeName];
  if (!filename) return null;
  return SVG_REGISTRY[filename] || null;
};

interface SvgMarkerIconProps {
  svgFilename?: string | null;
  typeName?: string;
  size?: number;
}

/**
 * Renders a local SVG marker icon.
 * Falls back to a colored dot if the SVG is not found.
 */
const SvgMarkerIcon: React.FC<SvgMarkerIconProps> = ({
  svgFilename,
  typeName,
  size = 24,
}) => {
  const SvgComp = useMemo(() => {
    if (svgFilename) return getMarkerSvg(svgFilename);
    if (typeName) return getMarkerSvgByType(typeName);
    return null;
  }, [svgFilename, typeName]);

  if (SvgComp) {
    return <SvgComp width={size} height={size} />;
  }

  return (
    <View
      style={[
        styles.fallbackDot,
        {width: size, height: size, borderRadius: size / 2},
      ]}
    />
  );
};

const styles = StyleSheet.create({
  fallbackDot: {
    backgroundColor: colors.orange,
    opacity: 0.7,
  },
});

export default SvgMarkerIcon;
