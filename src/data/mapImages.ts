// Map image registry
// React Native requires static require() calls for bundled images

// Thumbnail images for map list cards
const MAP_IMAGES: Record<string, any> = {
  'dam-battlegrounds': require('../assets/maps/dambattleground.webp'),
  'buried-city': require('../assets/maps/buriedcity.webp'),
  'the-spaceport': require('../assets/maps/spaceportt.webp'),
  'blue-gate': require('../assets/maps/bluegate.webp'),
  'stella-montis': require('../assets/maps/stellamontis.webp'),
};

// Full game map images (from desktop - wiki-quality annotated maps)
const MAP_FULL_IMAGES: Record<string, any> = {
  'dam-battlegrounds': require('../assets/maps/dam_bg.webp'),
  'buried-city': require('../assets/maps/buried_city_bg.webp'),
  'the-spaceport': require('../assets/maps/spaceport_bg.webp'),
  'blue-gate': require('../assets/maps/blue_gate_bg.webp'),
  'stella-montis': require('../assets/maps/stella_montis_bg.webp'),
};

export const getMapFullImage = (mapId: string) => MAP_FULL_IMAGES[mapId] || MAP_IMAGES[mapId] || null;

// High-resolution map tiles for the native offline map viewer
export const MAP_TILES: Record<string, any> = {
  'dam-battlegrounds': require('../assets/maps/tiles/dam_battlegrounds.webp'),
  'buried-city': require('../assets/maps/tiles/buried_city.webp'),
  'the-spaceport': require('../assets/maps/tiles/spaceport.webp'),
  'blue-gate': require('../assets/maps/tiles/the_blue_gate.webp'),
  'stella-montis': require('../assets/maps/tiles/stella_montis.webp'),
};

export const getMapImage = (mapId: string) => MAP_IMAGES[mapId] || null;
export const getMapTile = (mapId: string) => MAP_TILES[mapId] || null;

export default MAP_IMAGES;
