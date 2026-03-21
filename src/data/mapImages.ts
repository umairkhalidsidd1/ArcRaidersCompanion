// Map image registry
// React Native requires static require() calls for bundled images

const MAP_IMAGES: Record<string, any> = {
  'dam-battlegrounds': require('../assets/maps/dambattleground.png'),
  'buried-city': require('../assets/maps/buriedcity.png'),
  'the-spaceport': require('../assets/maps/spaceportt.png'),
  'blue-gate': require('../assets/maps/bluegate.png'),
  'stella-montis': require('../assets/maps/stellamontis.png'),
};

export const getMapImage = (mapId: string) => MAP_IMAGES[mapId] || null;

export default MAP_IMAGES;
