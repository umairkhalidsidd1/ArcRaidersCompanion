import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import {WebView} from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import FilterModal from '../components/FilterModal';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import maps from '../data/maps.json';
import localMarkers from '../data/markers.json';
import {getWaypoints, saveWaypoint, deleteWaypoint, Waypoint} from '../utils/storage';

/* ─────────────── MAP URLs & DB NAMES ─────────────── */
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const BASE = 'https://arcmap-dun.vercel.app/index-flutter-collab.html?map=';
const MAP_URLS: Record<string, string> = {
  'dam-battlegrounds': `${BASE}Dam`,
  'buried-city': `${BASE}Buried_City_Map`,
  'the-spaceport': `${BASE}Spaceport_Map`,
  'blue-gate': `${BASE}Blue_Gate`,
  'stella-montis': `${BASE}Stella_Montis_Map`,
};

// Map inner ids to the keys used in our local markers.json
const DB_MAP_NAME: Record<string, string> = {
  'dam-battlegrounds': 'Dam',
  'buried-city': 'Buried_City_Map',
  'the-spaceport': 'Spaceport_Map',
  'blue-gate': 'Blue_Gate',
  'stella-montis': 'Stella_Montis_Map',
};

/* ─────── FILTER CATEGORIES  (labels = exact Supabase DB names) ─────── */
const FILTER_CATEGORIES = [
  {key: 'blueprint-heatmap', label: 'Blueprint Heatmap', icon: 'map-marker-radius', color: '#FF6B2C', premium: true},
  {key: 'agave', label: 'Agave', icon: 'leaf', color: '#4CAF50'},
  {key: 'ammo-crate', label: 'Ammo Crate', icon: 'ammunition', color: '#FF9800'},
  {key: 'apricot-tree', label: 'Apricot Tree', icon: 'fruit-cherries', color: '#FF7043'},
  {key: 'arc-courier', label: 'ARC Courier', icon: 'robot', color: '#FF1744'},
  {key: 'backpack', label: 'Backpack', icon: 'bag-personal', color: '#795548'},
  {key: 'baron-husk', label: 'Baron Husk', icon: 'skull-crossbones', color: '#E91E63'},
  {key: 'bastion', label: 'Bastion', icon: 'shield', color: '#9C27B0'},
  {key: 'bombardier', label: 'Bombardier', icon: 'bomb', color: '#FF5722'},
  {key: 'button', label: 'Button', icon: 'gesture-tap-button', color: '#607D8B'},
  {key: 'candleberries', label: 'Candleberries', icon: 'fruit-grapes', color: '#E040FB'},
  {key: 'cargo-elevator', label: 'Cargo Elevator', icon: 'elevator', color: '#607D8B'},
  {key: 'crashed-probe', label: 'Crashed Probe', icon: 'satellite-variant', color: '#00BCD4'},
  {key: 'download-console', label: 'Download Console', icon: 'monitor-arrow-down', color: '#2196F3'},
  {key: 'elevator', label: 'Elevator', icon: 'elevator-passenger', color: '#607D8B'},
  {key: 'field-crate', label: 'Field Crate', icon: 'package-variant-closed', color: '#8D6E63'},
  {key: 'field-depot', label: 'Field Depot', icon: 'store', color: '#FF9800'},
  {key: 'fireball', label: 'Fireball', icon: 'fire', color: '#FF3D00'},
  {key: 'fuel-cell', label: 'Fuel Cell', icon: 'battery-charging', color: '#FFEB3B'},
  {key: 'generator', label: 'Generator', icon: 'lightning-bolt', color: '#FFC107'},
  {key: 'great-mullen', label: 'Great Mullen', icon: 'flower', color: '#8BC34A'},
  {key: 'grenade-tube', label: 'Grenade Tube', icon: 'package-variant', color: '#795548'},
  {key: 'harvester', label: 'Harvester', icon: 'robot-industrial', color: '#B71C1C'},
  {key: 'hatch', label: 'Hatch', icon: 'door', color: '#546E7A'},
  {key: 'hurricane-cache', label: 'Hurricane Cache', icon: 'treasure-chest', color: '#00BCD4'},
  {key: 'key-card', label: 'Key Card', icon: 'card-account-details', color: '#FFD600'},
  {key: 'leaper', label: 'Leaper', icon: 'bug', color: '#4CAF50'},
  {key: 'lemon', label: 'Lemon', icon: 'fruit-citrus', color: '#CDDC39'},
  {key: 'locked-room', label: 'Locked Room', icon: 'lock', color: '#F44336'},
  {key: 'medicine-bag', label: 'Medicine Bag', icon: 'medical-bag', color: '#E91E63'},
  {key: 'metro-station', label: 'Metro Station', icon: 'train', color: '#3F51B5'},
  {key: 'mushrooms', label: 'Mushrooms', icon: 'mushroom', color: '#8D6E63'},
  {key: 'olive-tree', label: 'Olive Tree', icon: 'tree', color: '#689F38'},
  {key: 'player-spawn', label: 'Player Spawn', icon: 'account-plus', color: '#00E676'},
  {key: 'pop', label: 'Pop', icon: 'circle-small', color: '#FF4081'},
  {key: 'prickly-pear', label: 'Prickly Pear', icon: 'cactus', color: '#66BB6A'},
  {key: 'queen', label: 'Queen', icon: 'crown', color: '#FFD600'},
  {key: 'quest', label: 'Quest', icon: 'exclamation-thick', color: '#FFD600'},
  {key: 'raider-cache', label: 'Raider Cache', icon: 'treasure-chest', color: '#FF9800'},
  {key: 'raider-camp', label: 'Raider Camp', icon: 'campfire', color: '#BF360C'},
  {key: 'raider-hatch', label: 'Raider Hatch', icon: 'door-open', color: '#BF360C'},
  {key: 'rocketeer', label: 'Rocketeer', icon: 'rocket-launch', color: '#F44336'},
  {key: 'rocketeer-husk', label: 'Rocketeer Husk', icon: 'skull', color: '#D32F2F'},
  {key: 'security-locker', label: 'Security Locker', icon: 'safe', color: '#607D8B'},
  {key: 'sentinel', label: 'Sentinel', icon: 'robot-angry', color: '#9C27B0'},
  {key: 'spawn-point', label: 'Spawn Point', icon: 'map-marker-star', color: '#00E676'},
  {key: 'supply-call-station', label: 'Supply Call Station', icon: 'access-point', color: '#00BCD4'},
  {key: 'surveyor', label: 'Surveyor', icon: 'binoculars', color: '#78909C'},
  {key: 'tick', label: 'Tick', icon: 'spider', color: '#827717'},
  {key: 'turret', label: 'Turret', icon: 'tower-fire', color: '#FF6F00'},
  {key: 'wasp-husk', label: 'Wasp Husk', icon: 'bee', color: '#FFB300'},
  {key: 'weapon-case', label: 'Weapon Case', icon: 'briefcase', color: '#455A64'},
  {key: 'wicker-basket', label: 'Wicker Basket', icon: 'basket', color: '#A1887F'},
];

const ALL_KEYS = FILTER_CATEGORIES.map(c => c.key);

/* ─────── helper: key → DB label ─────── */
const keyToLabel = (key: string) =>
  FILTER_CATEGORIES.find(c => c.key === key)?.label ?? key;

/* ══════════════════════════════════════════════════════════════
   SCREEN
   ══════════════════════════════════════════════════════════════ */
const MapDetailScreen = ({route, navigation}: any) => {
  const insets = useSafeAreaInsets();
  const {mapId} = route.params;

  const [currentMapId, setCurrentMapId] = useState(mapId);
  const map = maps.find(m => m.id === currentMapId);
  const mapUrl = MAP_URLS[currentMapId];

  // Empty = no filter active = show all markers (matching reference app)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  // Waypoints
  const [waypointMode, setWaypointMode] = useState(false);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [wpModalVisible, setWpModalVisible] = useState(false);
  const [pendingWpCoords, setPendingWpCoords] = useState<{lat: number; lng: number} | null>(null);
  const [wpLabel, setWpLabel] = useState('');
  const [wpColor, setWpColor] = useState('#FF6B2C');

  const WP_COLORS = ['#FF6B2C', '#00FF88', '#00E5FF', '#FF4444', '#AB47BC', '#FFC107', '#FF80AB'];

  const webViewRef = useRef<WebView>(null);

  // Load waypoints
  useEffect(() => {
    getWaypoints(currentMapId).then(setWaypoints);
  }, [currentMapId]);

  /* ─── run JS inside the WebView ─── */
  const runJS = useCallback((js: string, debugTag = '') => {
    webViewRef.current?.injectJavaScript(`
      try {
        var res = undefined;
        ${js}
        if (window.ReactNativeWebView && res !== undefined) {
          window.ReactNativeWebView.postMessage(JSON.stringify({tag: '${debugTag}', result: res}));
        }
      } catch(e) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({tag: '${debugTag}', error: e.message}));
        }
      }
      true;
    `);
  }, []);

  /* ─── FILTER APPLY ─── */
  const handleFilterApply = useCallback(
    (newKeys: string[]) => {
      setSelectedCategories(newKeys);

      if (newKeys.length === ALL_KEYS.length) {
        runJS('res = MapAPI.showAll();', 'FILTER_ALL');
      } else if (newKeys.length === 0) {
        // User preference: No filter active = show NO markers
        runJS('res = MapAPI.hideAll();', 'FILTER_NONE');
      } else {
        // Convert our internal keys to the exact DB label strings
        const labels = newKeys.map(keyToLabel);
        runJS('res = MapAPI.showOnlyTypes(' + JSON.stringify(labels) + ');', 'FILTER_SPECIFIC');
      }
    },
    [runJS],
  );

  /* ─── ON MESSAGE FROM WEBVIEW ─── */
  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      // Handle waypoint placement tap
      if (data.tag === 'WAYPOINT_TAP') {
        setPendingWpCoords({lat: data.lat, lng: data.lng});
        setWpLabel('');
        setWpColor('#FF6B2C');
        setWpModalVisible(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  /* ─── INJECT SAVED WAYPOINTS INTO WEBVIEW ─── */
  const injectSavedWaypoints = useCallback(() => {
    waypoints.forEach(wp => {
      const safeLabel = (wp.label || 'Waypoint').replace(/'/g, "\\'");
      runJS(`
        (function() {
          var el = document.createElement('div');
          el.className = 'custom-waypoint';
          el.id = 'wp-${wp.id}';
          el.style.cssText = 'width:20px;height:20px;border-radius:10px;background:${wp.color};border:2px solid white;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.5);';
          el.title = '${safeLabel}';
          var m = new maplibregl.Marker({element: el, anchor: 'center'})
            .setLngLat([${wp.lng}, ${wp.lat}])
            .addTo(map);
          if (!window.__customWaypoints) window.__customWaypoints = [];
          window.__customWaypoints.push({id: '${wp.id}', marker: m});
        })();
      `, 'WP_ADD');
    });
  }, [waypoints, runJS]);

  /* ─── MAP LOADED ─── */
  const handleMapLoaded = useCallback(() => {
    const mapDbName = DB_MAP_NAME[currentMapId] || 'Dam';
    const currentMapMarkers = (localMarkers as Record<string, any>)[mapDbName] || [];

    // Inject our 100% offline local markers directly
    const injectLocalMarkers = `
      try {
        var cMap = '${mapDbName}';
        var data = ${JSON.stringify(currentMapMarkers)};
        
        data.forEach(function(markerData) {
          var typeName = markerData.type || 'Unknown';
          var svgFile = markerData.svg || null;
          
          if (typeof markerTypes !== 'undefined') {
            markerTypes.add(typeName);
          }
          
          var el = document.createElement('div');
          el.className = 'marker';
          
          if (svgFile) {
             el.style.cssText = 'width:24px;height:24px;background-size:contain;background-repeat:no-repeat;cursor:pointer;';
             el.style.backgroundImage = 'url("https://arcmap-dun.vercel.app/markers/' + svgFile + '")';
          } else {
             var img = document.createElement('img');
             img.src = 'https://arcmap-dun.vercel.app/markers/player-marker.svg';
             img.style.cssText = 'width:32px;height:48px;';
             el.style.cssText = 'border:none;background:transparent;cursor:pointer;';
             el.appendChild(img);
          }

          var markerObj = new maplibregl.Marker({ 
              element: el,
              anchor: svgFile ? 'bottom' : 'center'
          })
          .setLngLat([markerData.lng, markerData.lat])
          .addTo(map);

          markerObj._metadata = { 
             id: markerData.id,
             type: typeName,
             title: typeName,
             description: markerData.desc,
             color: '#3b82f6',
             marker_type_id: null,
             svg_filename: svgFile,
             lng: markerData.lng,
             lat: markerData.lat,
             map_name: cMap,
             isItemLocation: false
          };

          el.addEventListener('click', function(e) {
             e.stopPropagation();
             if (window.sendToFlutter) {
                 window.sendToFlutter('onMarkerClick', markerObj._metadata);
             }
          });

          if (typeof markers !== 'undefined') {
              markers.push(markerObj);
          }
        });
        
        if (typeof updateMarkerVisibility === 'function') updateMarkerVisibility();

        var m = document.getElementById('map');
        if (m) { m.style.cssText = 'width:100vw;height:100vh;position:fixed;top:0;left:0;'; }
        var sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.style.display = 'none';
        var coords = document.getElementById('coordinates');
        if (coords) coords.style.display = 'none';
        document.querySelectorAll('.maplibregl-ctrl').forEach(function(el){ el.style.display='none'; });

        if (typeof map !== 'undefined') { 
            // Unlock the hardcoded minZoom boundary set by their script (it was locked to 1.5)
            map.setMinZoom(0.1);
            map.resize(); 
            map.setCenter([-10, -50]); // Adjusted to frame the dam horizontally
            map.setZoom(0.6);          // Now that limits are unlocked, actually zoom out to match their app
        }
        if (typeof MapAPI !== 'undefined') { MapAPI.hideAll(); }
        
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({tag: 'INIT', result: 'Successfully injected ' + data.length + ' completely offline markers, hidden by default.'}));
        }
      } catch(e) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({tag: 'INIT', error: 'Script crash: ' + e.message}));
        }
      }
    `;
    
    setTimeout(() => {
      setMapLoading(false);
      runJS(injectLocalMarkers, 'LOCAL_MARKER_INJECT');
      // Inject waypoint click listener for the map
      runJS(`
        if (typeof map !== 'undefined') {
          map.on('click', function(e) {
            if (window.__waypointMode) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                tag: 'WAYPOINT_TAP',
                lat: e.lngLat.lat,
                lng: e.lngLat.lng
              }));
            }
          });
        }
      `, 'WP_LISTENER');
      // Inject existing waypoints
      injectSavedWaypoints();
    }, 1000);
  }, [runJS, injectSavedWaypoints]);

  /* ─── ADD WAYPOINT ─── */
  const handleAddWaypoint = useCallback(async () => {
    if (!pendingWpCoords || !wpLabel.trim()) return;
    const wp: Waypoint = {
      id: Date.now().toString(),
      lat: pendingWpCoords.lat,
      lng: pendingWpCoords.lng,
      mapId: currentMapId,
      label: wpLabel.trim(),
      color: wpColor,
    };
    await saveWaypoint(wp);
    setWaypoints(prev => [...prev, wp]);
    setWpModalVisible(false);
    setPendingWpCoords(null);

    // Inject the new waypoint marker
    const safeLabel = wp.label.replace(/'/g, "\\'");
    runJS(`
      (function() {
        var el = document.createElement('div');
        el.className = 'custom-waypoint';
        el.id = 'wp-${wp.id}';
        el.style.cssText = 'width:20px;height:20px;border-radius:10px;background:${wp.color};border:2px solid white;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.5);';
        el.title = '${safeLabel}';
        var m = new maplibregl.Marker({element: el, anchor: 'center'})
          .setLngLat([${wp.lng}, ${wp.lat}])
          .addTo(map);
        if (!window.__customWaypoints) window.__customWaypoints = [];
        window.__customWaypoints.push({id: '${wp.id}', marker: m});
      })();
    `, 'WP_ADD');
  }, [pendingWpCoords, wpLabel, wpColor, currentMapId, runJS]);

  /* ─── DELETE WAYPOINT ─── */
  const handleDeleteWaypoint = useCallback(async (id: string) => {
    await deleteWaypoint(id);
    setWaypoints(prev => prev.filter(w => w.id !== id));
    runJS(`
      if (window.__customWaypoints) {
        var wp = window.__customWaypoints.find(function(w) { return w.id === '${id}'; });
        if (wp) { wp.marker.remove(); }
        window.__customWaypoints = window.__customWaypoints.filter(function(w) { return w.id !== '${id}'; });
      }
    `, 'WP_DEL');
  }, [runJS]);

  /* ─── TOGGLE WAYPOINT MODE ─── */
  const toggleWaypointMode = useCallback(() => {
    const newMode = !waypointMode;
    setWaypointMode(newMode);
    runJS(`window.__waypointMode = ${newMode};`, 'WP_MODE');
  }, [waypointMode, runJS]);

  /* ─── SWITCH MAP ─── */
  const handleSwitchMap = useCallback(
    (newMapId: string) => {
      if (newMapId === currentMapId) return;
      setCurrentMapId(newMapId);
      setMapLoading(true);
      // Reset filter
      setSelectedCategories([]);
    },
    [currentMapId],
  );


  if (!map) return null;

  /* ═════════════════════ RENDER ═════════════════════ */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── WebView Map (Edge to Edge) ── */}
      <View style={StyleSheet.absoluteFillObject}>
        {mapUrl && (
          <WebView
            key={currentMapId}
            ref={webViewRef}
            source={{uri: mapUrl}}
            style={styles.webView}
            onLoadStart={() => setMapLoading(true)}
            onLoadEnd={handleMapLoaded}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
          />
        )}

        {mapLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.orange} />
            <Text style={styles.loadingText}>Loading map…</Text>
          </View>
        )}
      </View>

      {/* ── Floating Header ── */}
      <View style={[styles.floatingHeader, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{map?.name.toUpperCase()}</Text>
        
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerBtn, waypointMode && styles.headerBtnActive]}
            onPress={toggleWaypointMode}>
            <Icon
              name="map-marker-plus-outline"
              size={20}
              color={waypointMode ? colors.green : colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Icon name="routes" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Waypoint Mode Banner */}
      {waypointMode && (
        <View style={[styles.wpBanner, {top: Math.max(insets.top, 20) + 56}]}>
          <Icon name="map-marker-plus" size={16} color={colors.green} />
          <Text style={styles.wpBannerText}>TAP MAP TO PLACE WAYPOINT</Text>
          <TouchableOpacity onPress={toggleWaypointMode}>
            <Icon name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Waypoints List (small floating panel) */}
      {waypoints.length > 0 && !waypointMode && (
        <View style={[styles.wpListPanel, {top: Math.max(insets.top, 20) + 56}]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 6}}>
            {waypoints.map(wp => (
              <TouchableOpacity
                key={wp.id}
                style={styles.wpChip}
                onLongPress={() => {
                  Alert.alert('Delete Waypoint', `Remove "${wp.label}"?`, [
                    {text: 'Cancel', style: 'cancel'},
                    {text: 'Delete', style: 'destructive', onPress: () => handleDeleteWaypoint(wp.id)},
                  ]);
                }}>
                <View style={[styles.wpDot, {backgroundColor: wp.color}]} />
                <Text style={styles.wpChipText}>{wp.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Floating Filter Button ── */}
      <View style={[styles.floatingFilterWrap, { bottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity
          style={styles.floatingFilterBtn}
          activeOpacity={0.8}
          onPress={() => setFilterVisible(true)}>
          <Icon name="filter-variant" size={20} color={colors.textInverse} />
          <Text style={styles.filterBtnText}>FILTER</Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter Modal ── */}
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        categories={FILTER_CATEGORIES}
        selected={selectedCategories}
        onApply={handleFilterApply}
      />

      {/* ── Waypoint Creation Modal ── */}
      <Modal visible={wpModalVisible} transparent animationType="fade">
        <View style={styles.wpModalOverlay}>
          <View style={styles.wpModalContent}>
            <Text style={styles.wpModalTitle}>ADD WAYPOINT</Text>
            <TextInput
              style={styles.wpInput}
              value={wpLabel}
              onChangeText={setWpLabel}
              placeholder="Waypoint name..."
              placeholderTextColor={colors.textMuted}
              autoFocus
              maxLength={30}
            />
            <Text style={styles.wpColorLabel}>COLOR</Text>
            <View style={styles.wpColorRow}>
              {WP_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.wpColorBtn, {backgroundColor: c}, wpColor === c && styles.wpColorBtnActive]}
                  onPress={() => setWpColor(c)}
                />
              ))}
            </View>
            <View style={styles.wpModalActions}>
              <TouchableOpacity
                style={styles.wpCancelBtn}
                onPress={() => {setWpModalVisible(false); setPendingWpCoords(null);}}>
                <Text style={styles.wpCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.wpSaveBtn, !wpLabel.trim() && {opacity: 0.4}]}
                onPress={handleAddWaypoint}
                disabled={!wpLabel.trim()}>
                <Icon name="map-marker-check" size={16} color={colors.textInverse} />
                <Text style={styles.wpSaveText}>PLACE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

/* ═══════════════════════════ STYLES ═══════════════════════════ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  /* Floating Header */
  floatingHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(15, 16, 28, 0.75)', // Glassy effect
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 100,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, 
    fontSize: fonts.sizes.md,
    fontWeight: '800', 
    letterSpacing: 1, 
    textAlign: 'center',
    color: colors.textPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerRight: { flexDirection: 'row', gap: spacing.sm },

  /* Map */
  webView: { flex: 1, backgroundColor: '#1a1a2e' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 16, 28, 0.9)',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  loadingText: {
    fontSize: fonts.sizes.sm, color: colors.textMuted,
    marginTop: spacing.md, fontWeight: '600',
  },

  /* Floating Filter */
  floatingFilterWrap: {
    position: 'absolute',
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  floatingFilterBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.orange,
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.md,
    borderRadius: borderRadius.md, 
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  filterBtnText: {
    fontSize: fonts.sizes.md, fontWeight: '800',
    color: colors.textInverse, letterSpacing: 2,
  },
  mapTab: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgElevated,
    borderWidth: 1, borderColor: colors.border,
  },
  mapTabActive: {backgroundColor: colors.orange, borderColor: colors.orange},
  mapTabText: {
    fontSize: 10, fontWeight: '700',
    color: colors.textMuted, letterSpacing: 0.5,
  },
  mapTabTextActive: {color: colors.textInverse},

  // Waypoint mode
  headerBtnActive: {
    backgroundColor: colors.green + '30',
    borderWidth: 1,
    borderColor: colors.green,
  },
  wpBanner: {
    position: 'absolute',
    left: spacing.lg, right: spacing.lg,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.green + '18',
    borderWidth: 1, borderColor: colors.green + '40',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md, zIndex: 99,
  },
  wpBannerText: {
    flex: 1, fontSize: 11, fontWeight: '800',
    color: colors.green, letterSpacing: 1, textAlign: 'center',
  },
  wpListPanel: {
    position: 'absolute',
    left: spacing.md, right: spacing.md,
    zIndex: 98,
  },
  wpChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(15, 16, 28, 0.85)',
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  wpDot: {width: 8, height: 8, borderRadius: 4},
  wpChipText: {fontSize: 10, fontWeight: '700', color: colors.textPrimary},

  // Waypoint modal
  wpModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  wpModalContent: {
    width: SCREEN_WIDTH - 60,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.lg, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border,
  },
  wpModalTitle: {
    fontSize: fonts.sizes.md, fontWeight: '900',
    color: colors.textPrimary, letterSpacing: 2, marginBottom: spacing.lg,
  },
  wpInput: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md, padding: spacing.md,
    fontSize: fonts.sizes.sm, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  wpColorLabel: {
    fontSize: 10, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1, marginBottom: spacing.sm,
  },
  wpColorRow: {
    flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl,
  },
  wpColorBtn: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: 'transparent',
  },
  wpColorBtnActive: {borderColor: '#FFFFFF'},
  wpModalActions: {
    flexDirection: 'row', gap: spacing.md,
  },
  wpCancelBtn: {
    flex: 1, alignItems: 'center',
    paddingVertical: spacing.md, borderRadius: borderRadius.md,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  wpCancelText: {
    fontSize: 12, fontWeight: '800', color: colors.textMuted, letterSpacing: 1,
  },
  wpSaveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 4,
    paddingVertical: spacing.md, borderRadius: borderRadius.md,
    backgroundColor: colors.orange,
  },
  wpSaveText: {
    fontSize: 12, fontWeight: '800', color: colors.textInverse, letterSpacing: 1,
  },
});

export default MapDetailScreen;
