// Map image registry
// React Native requires static require() calls for bundled images

// Thumbnail images for map list cards
const MAP_IMAGES: Record<string, any> = {
  'dam-battlegrounds': require('../assets/maps/dambattleground.png'),
  'buried-city': require('../assets/maps/buriedcity.png'),
  'the-spaceport': require('../assets/maps/spaceportt.png'),
  'blue-gate': require('../assets/maps/bluegate.png'),
  'stella-montis': require('../assets/maps/stellamontis.png'),
};

// High-resolution map tiles for the native offline map viewer
export const MAP_TILES: Record<string, any> = {
  'dam-battlegrounds': require('../assets/maps/tiles/dam_battlegrounds.png'),
  'buried-city': require('../assets/maps/tiles/buried_city.png'),
  'the-spaceport': require('../assets/maps/tiles/spaceport.png'),
  'blue-gate': require('../assets/maps/tiles/the_blue_gate.png'),
  'stella-montis': require('../assets/maps/tiles/stella_montis.png'),
};

export const getMapImage = (mapId: string) => MAP_IMAGES[mapId] || null;
export const getMapTile = (mapId: string) => MAP_TILES[mapId] || null;

export default MAP_IMAGES;
