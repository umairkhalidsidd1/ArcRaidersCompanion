import React, {useState, useRef, useCallback, useEffect} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Alert,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import Image from 'react-native-fast-image';
import {WebView} from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from '../utils/safeArea';
import FilterModal from '../components/FilterModal';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import {getMaps} from '../data/localizedData';
import localMarkers from '../data/markers.json';
import {getWaypoints, saveWaypoint, deleteWaypoint, Waypoint} from '../utils/storage';
import {MarkerIcons} from '../assets/icons/markers';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import blueprintHeatmapData from '../data/blueprintHeatmap.json';
import {usePremium} from '../context/PremiumContext';

/* ─────────────── MAP URLs & DB NAMES ─────────────── */

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
  {key: 'blueprint-heatmap', label: 'Blueprint Heatmap', icon: 'map-marker-radius', color: '#FF6B2C', description: 'Where players find blueprints most'},
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

/* ─────── MARKER TYPES for waypoint creation (matching reference app) ─────── */
const MARKER_TYPES = [
  // Loot & Containers
  {key: 'ammo-crate', label: 'Ammo Crate', category: 'Loot'},
  {key: 'backpack', label: 'Backpack', category: 'Loot'},
  {key: 'field-crate', label: 'Field Crate', category: 'Loot'},
  {key: 'field-depot', label: 'Field Depot', category: 'Loot'},
  {key: 'grenade-tube', label: 'Grenade Tube', category: 'Loot'},
  {key: 'medicine-bag', label: 'Medicine Bag', category: 'Loot'},
  {key: 'raider-cache', label: 'Raider Cache', category: 'Loot'},
  {key: 'security-locker', label: 'Security Locker', category: 'Loot'},
  {key: 'weapon-case', label: 'Weapon Case', category: 'Loot'},
  {key: 'wicker-basket', label: 'Wicker Basket', category: 'Loot'},
  // Navigation
  {key: 'elevator', label: 'Elevator', category: 'Navigation'},
  {key: 'hatch', label: 'Hatch', category: 'Navigation'},
  {key: 'locked-room', label: 'Locked Room', category: 'Navigation'},
  {key: 'metro-entrance', label: 'Metro Entrance', category: 'Navigation'},
  {key: 'metro-station', label: 'Metro Station', category: 'Navigation'},
  {key: 'spawn-point', label: 'Spawn Point', category: 'Navigation'},
  {key: 'player-marker', label: 'Player Marker', category: 'Navigation'},
  // Resources
  {key: 'fuel-cell', label: 'Fuel Cell', category: 'Resource'},
  {key: 'generator', label: 'Generator', category: 'Resource'},
  {key: 'key-card', label: 'Key Card', category: 'Resource'},
  // Objectives
  {key: 'antenna', label: 'Antenna', category: 'Objective'},
  {key: 'button', label: 'Button', category: 'Objective'},
  {key: 'crash-probe', label: 'Crashed Probe', category: 'Objective'},
  {key: 'download-console', label: 'Download Console', category: 'Objective'},
  {key: 'quest', label: 'Quest', category: 'Objective'},
  {key: 'supply-call-station', label: 'Supply Call Station', category: 'Objective'},
  {key: 'supply-call-station-1', label: 'Supply Call Station Lv.1', category: 'Objective'},
  {key: 'supply-call-station-2', label: 'Supply Call Station Lv.2', category: 'Objective'},
  // Enemies
  {key: 'arc-courier', label: 'ARC Courier', category: 'Enemy'},
  {key: 'baron-husk', label: 'Baron Husk', category: 'Enemy'},
  {key: 'bastion', label: 'Bastion', category: 'Enemy'},
  {key: 'bombardier', label: 'Bombardier', category: 'Enemy'},
  {key: 'fireball', label: 'Fireball', category: 'Enemy'},
  {key: 'harvester', label: 'Harvester', category: 'Enemy'},
  {key: 'leaper', label: 'Leaper', category: 'Enemy'},
  {key: 'queen', label: 'Queen', category: 'Enemy'},
  {key: 'rocketeer', label: 'Rocketeer', category: 'Enemy'},
  {key: 'rocketeer-husk', label: 'Rocketeer Husk', category: 'Enemy'},
  {key: 'sentinel', label: 'Sentinel', category: 'Enemy'},
  {key: 'surveyor', label: 'Surveyor', category: 'Enemy'},
  {key: 'tick', label: 'Tick', category: 'Enemy'},
  {key: 'turret', label: 'Turret', category: 'Enemy'},
  {key: 'wasp-husk', label: 'Wasp Husk', category: 'Enemy'},
  // POI
  {key: 'raider-camp', label: 'Raider Camp', category: 'POI'},
  // Flora
  {key: 'agave', label: 'Agave', category: 'Flora'},
  {key: 'apricot-tree', label: 'Apricot Tree', category: 'Flora'},
  {key: 'candleberries', label: 'Candleberries', category: 'Flora'},
  {key: 'great-mullen', label: 'Great Mullen', category: 'Flora'},
  {key: 'lemon', label: 'Lemon', category: 'Flora'},
  {key: 'moss', label: 'Moss', category: 'Flora'},
  {key: 'mushrooms', label: 'Mushrooms', category: 'Flora'},
  {key: 'olive-tree', label: 'Olive Tree', category: 'Flora'},
  {key: 'pop', label: 'Pop', category: 'Flora'},
  {key: 'prickly-pear', label: 'Prickly Pear', category: 'Flora'},
];

/* ─────── helper: key → DB label ─────── */
const keyToLabel = (key: string) =>
  FILTER_CATEGORIES.find(c => c.key === key)?.label ?? key;

const useStableMapInsets = () => {
  const {top, bottom, left, right} = useSafeAreaInsets();
  const [stableInsets, setStableInsets] = useState(() => ({
    top: Platform.OS === 'android' ? Math.max(top, StatusBar.currentHeight ?? 0) : top,
    bottom,
    left,
    right,
  }));

  useEffect(() => {
    if (Platform.OS !== 'android') {
      setStableInsets(prev => {
        if (
          prev.top === top &&
          prev.bottom === bottom &&
          prev.left === left &&
          prev.right === right
        ) {
          return prev;
        }
        return {top, bottom, left, right};
      });
      return;
    }

    setStableInsets(prev => {
      const next = {
        top: Math.max(prev.top, top, StatusBar.currentHeight ?? 0),
        bottom: Math.max(prev.bottom, bottom),
        left: Math.max(prev.left, left),
        right: Math.max(prev.right, right),
      };

      if (
        prev.top === next.top &&
        prev.bottom === next.bottom &&
        prev.left === next.left &&
        prev.right === next.right
      ) {
        return prev;
      }

      return next;
    });
  }, [top, bottom, left, right]);

  return stableInsets;
};

/* ══════════════════════════════════════════════════════════════
   SCREEN
   ══════════════════════════════════════════════════════════════ */
const MapDetailScreen = ({route, navigation}: any) => {
  const insets = useStableMapInsets();
  const {mapId} = route.params;
  const { t } = useTranslation();
  const maps = getMaps();
  const {isPremium} = usePremium();

  const [currentMapId, setCurrentMapId] = useState(mapId);
  const map = maps.find(m => m.id === currentMapId);
  const mapUrl = MAP_URLS[currentMapId];

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  // Marker/Waypoint states
  const [markerMode, setMarkerMode] = useState(false);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [pendingCoords, setPendingCoords] = useState<{lat: number; lng: number} | null>(null);

  // Bottom sheet states
  const [markerTypeSheetVisible, setMarkerTypeSheetVisible] = useState(false);
  const [addMarkerFormVisible, setAddMarkerFormVisible] = useState(false);
  const [markerInfoVisible, setMarkerInfoVisible] = useState(false);
  const [selectedMarkerInfo, setSelectedMarkerInfo] = useState<Waypoint | null>(null);

  // Add marker form states
  const [selectedMarkerType, setSelectedMarkerType] = useState<typeof MARKER_TYPES[0] | null>(null);
  const [customMarkerName, setCustomMarkerName] = useState('');
  const [markerNote, setMarkerNote] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [markerTypeSearch, setMarkerTypeSearch] = useState('');
  const [markerPhoto, setMarkerPhoto] = useState<string | null>(null);
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);

  // Heatmap
  const [heatmapActive, setHeatmapActive] = useState(false);

  // Snackbar
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarText, setSnackbarText] = useState('');
  const snackbarOpacity = useRef(new Animated.Value(0)).current;

  const webViewRef = useRef<WebView>(null);
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const [mapReady, setMapReady] = useState(false);

  // Pulsing loading animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Load waypoints
  useEffect(() => {
    getWaypoints(currentMapId).then(setWaypoints);
  }, [currentMapId]);

  /* ─── Show snackbar ─── */
  const showSnackbar = useCallback((text: string) => {
    setSnackbarText(text);
    setSnackbarVisible(true);
    snackbarOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(snackbarOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(snackbarOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setSnackbarVisible(false));
  }, [snackbarOpacity]);

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

  /* ─── HEATMAP: inject/remove (local data) ─── */
  const injectHeatmap = useCallback(() => {
    const mapSlug = DB_MAP_NAME[currentMapId] || 'Dam';
    const coords = (blueprintHeatmapData as Record<string, number[][]>)[mapSlug];
    if (!coords || coords.length === 0) {
      showSnackbar(t('maps.noBlueprintData'));
      return;
    }
    const features = coords.map((c: number[]) => ({
      type: 'Feature',
      geometry: {type: 'Point', coordinates: [c[0], c[1]]},
      properties: {},
    }));
    const geojson = {type: 'FeatureCollection', features};
    runJS(`
      (function(){
        if (map.getLayer('bp-heat-layer')) map.removeLayer('bp-heat-layer');
        if (map.getSource('bp-heat-src')) map.removeSource('bp-heat-src');
        map.addSource('bp-heat-src', {
          type: 'geojson',
          data: ${JSON.stringify(geojson)}
        });
        map.addLayer({
          id: 'bp-heat-layer',
          type: 'heatmap',
          source: 'bp-heat-src',
          paint: {
            'heatmap-weight': 1,
            'heatmap-intensity': ['interpolate',['linear'],['zoom'],0,0.6,5,1.2],
            'heatmap-color': [
              'interpolate',['linear'],['heatmap-density'],
              0,'rgba(0,0,0,0)',
              0.15,'rgba(0,229,255,0.25)',
              0.35,'rgba(0,229,255,0.5)',
              0.55,'rgba(255,200,0,0.65)',
              0.75,'rgba(255,120,0,0.8)',
              1,'rgba(255,40,0,0.9)'
            ],
            'heatmap-radius': ['interpolate',['linear'],['zoom'],0,25,3,40,5,55],
            'heatmap-opacity': 0.75
          }
        });
      })();
    `, 'HEATMAP_ON');
    setHeatmapActive(true);
    showSnackbar(t('maps.blueprintHeatmapCount', {count: coords.length}));
  }, [currentMapId, runJS, showSnackbar]);

  const removeHeatmap = useCallback(() => {
    runJS(`
      (function(){
        if (map.getLayer('bp-heat-layer')) map.removeLayer('bp-heat-layer');
        if (map.getSource('bp-heat-src')) map.removeSource('bp-heat-src');
      })();
    `, 'HEATMAP_OFF');
    setHeatmapActive(false);
  }, [runJS]);

  /* ─── FILTER APPLY ─── */
  const handleFilterApply = useCallback(
    (newKeys: string[]) => {
      setSelectedCategories(newKeys);

      const wantsHeatmap = newKeys.includes('blueprint-heatmap');
      const markerKeys = newKeys.filter(k => k !== 'blueprint-heatmap');

      // Handle heatmap toggle
      if (wantsHeatmap && !heatmapActive) {
        injectHeatmap();
      } else if (!wantsHeatmap && heatmapActive) {
        removeHeatmap();
      }

      // Handle regular marker filters
      if (markerKeys.length === ALL_KEYS.length - 1) {
        // All marker categories selected (excluding heatmap which isn't a real marker)
        runJS('res = MapAPI.showAll();', 'FILTER_ALL');
      } else if (markerKeys.length === 0) {
        runJS('res = MapAPI.hideAll();', 'FILTER_NONE');
      } else {
        const labels = markerKeys.map(keyToLabel);
        runJS('res = MapAPI.showOnlyTypes(' + JSON.stringify(labels) + ');', 'FILTER_SPECIFIC');
      }
    },
    [runJS, heatmapActive, injectHeatmap, removeHeatmap],
  );

  const openFilterModal = useCallback(() => {
    setFilterVisible(true);
  }, []);

  /* ─── ON MESSAGE FROM WEBVIEW ─── */
  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.tag === 'MAP_READY') {
        setMapReady(true);
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => setMapLoading(false));
        return;
      }
      // Map tap in marker mode → open marker type picker
      if (data.tag === 'WAYPOINT_TAP') {
        setPendingCoords({lat: data.lat, lng: data.lng});
        setSelectedMarkerType(null);
        setCustomMarkerName('');
        setMarkerNote('');
        setMarkerPhoto(null);
        setMarkerTypeSearch('');
        setAddMarkerFormVisible(true);
      }
      // Custom waypoint tapped → show marker info panel
      if (data.tag === 'CUSTOM_WP_TAP') {
        const wp = waypoints.find(w => w.id === data.id);
        if (wp) {
          setSelectedMarkerInfo(wp);
          setMarkerInfoVisible(true);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [waypoints]);

  /* ─── INJECT SAVED WAYPOINTS INTO WEBVIEW ─── */
  const injectSavedWaypoints = useCallback(() => {
    waypoints.forEach(wp => {
      const safeLabel = (wp.label || 'Marker').replace(/'/g, "\\'");
      const svgKey = wp.markerType && wp.markerType !== 'custom' ? wp.markerType : null;
      const markerInner = svgKey
        ? `<img src="https://arcmap-dun.vercel.app/markers/${svgKey}.svg" style="width:32px;height:32px;" />`
        : `<div style="width:24px;height:24px;background:#FF0000;border-radius:2px;display:flex;align-items:center;justify-content:center;"><span style="color:white;font-weight:bold;font-size:10px;line-height:1;font-family:sans-serif;">${(wp.label || 'M').substring(0, 2).toUpperCase()}</span></div>`;
      runJS(`
        (function() {
          var el = document.createElement('div');
          el.className = 'custom-waypoint';
          el.id = 'wp-${wp.id}';
el.style.cssText = 'width:32px;height:32px;border-radius:4px;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;';
          el.innerHTML = '${markerInner.replace(/'/g, "\\'")}';
          el.title = '${safeLabel}';
          el.addEventListener('click', function(e) {
            e.stopPropagation();
            window.ReactNativeWebView.postMessage(JSON.stringify({tag: 'CUSTOM_WP_TAP', id: '${wp.id}'}));
          });
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

        // Wait for the map to finish settling at the new zoom/center, then signal ready
        setTimeout(function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({tag: 'MAP_READY'}));
          }
        }, 300);
      } catch(e) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({tag: 'INIT', error: 'Script crash: ' + e.message}));
        }
        // Still reveal on error so user isn't stuck
        setTimeout(function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({tag: 'MAP_READY'}));
          }
        }, 500);
      }
    `;
    
    setTimeout(() => {
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

  /* ─── SELECT MARKER TYPE (from bottom sheet) ─── */
  const handleSelectMarkerType = useCallback((markerType: typeof MARKER_TYPES[0] | null) => {
    setMarkerTypeSheetVisible(false);
    setSelectedMarkerType(markerType);
    if (markerType) {
      setCustomMarkerName('');
    }
  }, []);

  /* ─── ADD MARKER (from form) ─── */
  const handleAddMarker = useCallback(async () => {
    if (!pendingCoords) return;
    const label = selectedMarkerType ? selectedMarkerType.label : customMarkerName.trim();
    if (!label) return;

    // If editing, delete the old marker first
    if (editingMarkerId) {
      await deleteWaypoint(editingMarkerId);
      setWaypoints(prev => prev.filter(w => w.id !== editingMarkerId));
      runJS(`
        if (window.__customWaypoints) {
          var wp = window.__customWaypoints.find(function(w) { return w.id === '${editingMarkerId}'; });
          if (wp) { wp.marker.remove(); }
          window.__customWaypoints = window.__customWaypoints.filter(function(w) { return w.id !== '${editingMarkerId}'; });
        }
      `, 'WP_DEL');
      setEditingMarkerId(null);
    }

    const wp: Waypoint = {
      id: Date.now().toString(),
      lat: pendingCoords.lat,
      lng: pendingCoords.lng,
      mapId: currentMapId,
      label,
      color: '#FF0000',
      markerType: selectedMarkerType?.key || 'custom',
      markerTypeLabel: selectedMarkerType?.label || customMarkerName.trim(),
      markerIcon: selectedMarkerType?.key || 'map-marker',
      note: markerNote.trim() || undefined,
      photo: markerPhoto || undefined,
      isPublished: isPublished,
    };
    await saveWaypoint(wp);
    setWaypoints(prev => [...prev, wp]);
    setAddMarkerFormVisible(false);
    setPendingCoords(null);

    // Inject marker on map
    const safeLabel = wp.label.replace(/'/g, "\\'");
    const svgKey = wp.markerType && wp.markerType !== 'custom' ? wp.markerType : null;
    const markerInner = svgKey
      ? `<img src="https://arcmap-dun.vercel.app/markers/${svgKey}.svg" style="width:32px;height:32px;" />`
      : `<div style="width:24px;height:24px;background:#FF0000;border-radius:2px;display:flex;align-items:center;justify-content:center;"><span style="color:white;font-weight:bold;font-size:10px;line-height:1;font-family:sans-serif;">${wp.label.substring(0, 2).toUpperCase()}</span></div>`;
    runJS(`
      (function() {
        var el = document.createElement('div');
        el.className = 'custom-waypoint';
        el.id = 'wp-${wp.id}';
        el.style.cssText = 'width:32px;height:32px;border-radius:4px;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;';
        el.innerHTML = '${markerInner.replace(/'/g, "\\'")}';
        el.title = '${safeLabel}';
        el.addEventListener('click', function(e) {
          e.stopPropagation();
          window.ReactNativeWebView.postMessage(JSON.stringify({tag: 'CUSTOM_WP_TAP', id: '${wp.id}'}));
        });
        var m = new maplibregl.Marker({element: el, anchor: 'center'})
          .setLngLat([${wp.lng}, ${wp.lat}])
          .addTo(map);
        if (!window.__customWaypoints) window.__customWaypoints = [];
        window.__customWaypoints.push({id: '${wp.id}', marker: m});
      })();
    `, 'WP_ADD');

    showSnackbar(t('maps.markerAdded'));
  }, [pendingCoords, selectedMarkerType, customMarkerName, markerNote, isPublished, currentMapId, runJS, showSnackbar, editingMarkerId]);

  /* ─── DELETE MARKER ─── */
  const handleDeleteMarker = useCallback(async (id: string) => {
    await deleteWaypoint(id);
    setWaypoints(prev => prev.filter(w => w.id !== id));
    setMarkerInfoVisible(false);
    setSelectedMarkerInfo(null);
    runJS(`
      if (window.__customWaypoints) {
        var wp = window.__customWaypoints.find(function(w) { return w.id === '${id}'; });
        if (wp) { wp.marker.remove(); }
        window.__customWaypoints = window.__customWaypoints.filter(function(w) { return w.id !== '${id}'; });
      }
    `, 'WP_DEL');
    showSnackbar(t('maps.markerDeleted'));
  }, [runJS, showSnackbar]);

  /* ─── TOGGLE MARKER MODE ─── */
  const toggleMarkerMode = useCallback(() => {
    const newMode = !markerMode;
    setMarkerMode(newMode);
    runJS(`window.__waypointMode = ${newMode};`, 'WP_MODE');
  }, [markerMode, runJS]);

  /* ─── SWITCH MAP ─── */
  const handleSwitchMap = useCallback(
    (newMapId: string) => {
      if (newMapId === currentMapId) return;
      setCurrentMapId(newMapId);
      setMapLoading(true);
      setMapReady(false);
      overlayOpacity.setValue(1);
      // Reset filter & heatmap
      setSelectedCategories([]);
      setHeatmapActive(false);
    },
    [currentMapId, overlayOpacity],
  );


  if (!map) return null;

  const filteredMarkerTypes = MARKER_TYPES.filter(mt =>
    mt.label.toLowerCase().includes(markerTypeSearch.toLowerCase()),
  );

  /* Helper to render a marker SVG icon */
  const renderMarkerSvg = (markerKey: string, size: number = 20) => {
    const SvgIcon = MarkerIcons[markerKey];
    if (SvgIcon) {
      return <SvgIcon width={size} height={size} />;
    }
    return <Icon name="map-marker" size={size} color="#FFF" />;
  };

  /* ═════════════════════ RENDER ═════════════════════ */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor={colors.bg} />

      {/* ── WebView Map (Edge to Edge) ── */}
      <View style={StyleSheet.absoluteFillObject}>
        {mapUrl && (
          <WebView
            key={currentMapId}
            ref={webViewRef}
            source={{uri: mapUrl}}
            style={[styles.webView, {opacity: mapReady ? 1 : 0}]}
            onLoadStart={() => setMapLoading(true)}
            onLoadEnd={handleMapLoaded}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
          />
        )}

        {mapLoading && (
          <Animated.View style={[styles.loadingOverlay, {opacity: overlayOpacity}]}>
            <Animated.View style={{opacity: pulseAnim, alignItems: 'center'}}>
              <Icon name="map-search-outline" size={48} color={colors.cyan} />
              <Text style={styles.loadingTitle}>{map?.name.toUpperCase()}</Text>
              <Text style={styles.loadingText}>{t('maps.preparingMap')}</Text>
            </Animated.View>
          </Animated.View>
        )}
      </View>

      {/* ── Floating Header ── */}
      <View style={[styles.floatingHeader, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Icon name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.headerTitle}>{map?.name.toUpperCase()}</Text>
        
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerBtn, markerMode && styles.headerBtnActive]}
            onPress={toggleMarkerMode}>
            <Icon
              name="map-marker-plus-outline"
              size={20}
              color={markerMode ? colors.cyan : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Marker Mode Banner ── */}
      {markerMode && (
        <View style={[styles.markerBanner, {top: Math.max(insets.top, 20) + 56}]}>
          <Icon name="map-marker-plus" size={16} color={colors.cyan} />
          <Text style={styles.markerBannerText}>{t('maps.tapToPlace')}</Text>
          <TouchableOpacity onPress={toggleMarkerMode}>
            <Icon name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Floating Filter Button ── */}
      {!markerInfoVisible && (
        <View style={[styles.floatingFilterWrap, { bottom: Math.max(insets.bottom, 24) }]}>
          <TouchableOpacity
            style={styles.floatingFilterBtn}
            activeOpacity={0.8}
            delayPressIn={0}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            onPressIn={openFilterModal}
            onPress={openFilterModal}>
            <Icon name="filter-variant" size={18} color={colors.textPrimary} />
            <Text style={styles.filterBtnText}>{t('maps.filter')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Filter Modal ── */}
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        categories={FILTER_CATEGORIES}
        selected={selectedCategories}
        onApply={handleFilterApply}
        lockedKeys={isPremium ? [] : ['blueprint-heatmap']}
        onLockedPress={() => navigation.navigate('Paywall')}
      />

      {/* ── ADD CUSTOM MARKER FORM ── */}
      <Modal visible={addMarkerFormVisible} transparent animationType={Platform.OS === 'android' ? 'fade' : 'slide'}>
        <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity style={styles.bottomSheetDismiss} onPress={() => {if (markerTypeSheetVisible) { setMarkerTypeSheetVisible(false); } else { setAddMarkerFormVisible(false); setPendingCoords(null); setEditingMarkerId(null); }}} />
          <View style={[styles.bottomSheet, {paddingBottom: Math.max(insets.bottom, 20), maxHeight: '85%'}]}>
            <View style={styles.sheetHandle} />
            
            <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
              {/* Title & Coords */}
              <Text style={styles.formTitle}>{t('maps.addCustomMarker')}</Text>
              {pendingCoords && (
                <Text style={styles.formCoords}>
                  {pendingCoords.lat.toFixed(3)}, {pendingCoords.lng.toFixed(3)}
                </Text>
              )}

              {/* Marker Type */}
              <Text style={styles.formSectionLabel}>{t('maps.markerType')}</Text>
              {selectedMarkerType ? (
                <TouchableOpacity
                  style={styles.formTypeSelectedActive}
                  onPress={() => setMarkerTypeSheetVisible(true)}>
                  <View style={styles.formTypeIconActive}>{renderMarkerSvg(selectedMarkerType.key, 22)}</View>
                  <View style={{flex: 1}}>
                    <Text style={styles.formTypeText}>{selectedMarkerType.label}</Text>
                    <Text style={styles.formTypeSub}>{t('filterCategories.' + selectedMarkerType.category.toLowerCase())}</Text>
                  </View>
                  <Icon name="chevron-down" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <View>
                  <TouchableOpacity
                    style={styles.formTypeSelected}
                    onPress={() => setMarkerTypeSheetVisible(true)}>
                    <Icon name="map-marker-outline" size={18} color={colors.textMuted} />
                    <Text style={[styles.formTypeText, {color: colors.textMuted}]}>{t('maps.searchMarkerType')}</Text>
                    <Icon name="chevron-down" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.formInput}
                    placeholder={t('maps.customMarkerName')}
                    placeholderTextColor={colors.textMuted}
                    value={customMarkerName}
                    onChangeText={setCustomMarkerName}
                    maxLength={40}
                  />
                </View>
              )}

              {/* Note */}
              <TextInput
                style={[styles.formInput, styles.formNoteInput]}
                placeholder={t('maps.noteOptional')}
                placeholderTextColor={colors.textMuted}
                value={markerNote}
                onChangeText={t => setMarkerNote(t.slice(0, 200))}
                multiline
                maxLength={200}
              />
              <Text style={styles.formCharCount}>{markerNote.length}/200</Text>

              {/* Add Photo */}
              <Text style={styles.formSectionLabel}>{t('maps.addPhoto')}</Text>
              {markerPhoto ? (
                <View style={styles.photoPreviewWrap}>
                  <Image source={{uri: markerPhoto}} style={styles.photoPreview} resizeMode="cover" />
                  <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => setMarkerPhoto(null)}>
                    <View style={styles.photoRemoveCircle}>
                      <Icon name="close" size={14} color="#FFF" />
                    </View>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoButtonsRow}>
                  <TouchableOpacity style={styles.photoBtn} onPress={async () => {
                    const response = await launchCamera({mediaType: 'photo', quality: 0.8});
                    if (!response.didCancel && response.assets?.[0]?.uri) setMarkerPhoto(response.assets[0].uri);
                  }}>
                    <Icon name="camera-outline" size={18} color={colors.cyan} />
                    <Text style={styles.photoBtnText}>{t('maps.camera')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoBtn} onPress={async () => {
                    const response = await launchImageLibrary({mediaType: 'photo', quality: 0.8});
                    if (!response.didCancel && response.assets?.[0]?.uri) setMarkerPhoto(response.assets[0].uri);
                  }}>
                    <Icon name="image-outline" size={18} color={colors.cyan} />
                    <Text style={styles.photoBtnText}>{t('maps.gallery')}</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.formPhotoLabel}>{t('maps.photoOptional')}</Text>
            </ScrollView>

            {/* Buttons - outside ScrollView so always visible */}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.formCancelBtn}
                onPress={() => {setAddMarkerFormVisible(false); setPendingCoords(null); setEditingMarkerId(null);}}>
                <Text style={styles.formCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formAddBtn, !(selectedMarkerType || customMarkerName.trim()) && styles.formAddBtnDisabled]}
                onPress={handleAddMarker}
                disabled={!(selectedMarkerType || customMarkerName.trim())}>
                <Text style={[styles.formAddText, !(selectedMarkerType || customMarkerName.trim()) && {color: colors.textMuted}]}>{t('maps.addMarkerBtn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── MARKER TYPE PICKER (overlay inside same modal) ── */}
        {markerTypeSheetVisible && (
          <View style={[StyleSheet.absoluteFill, {backgroundColor: 'rgba(0,0,0,0.5)'}]}>
            <View style={styles.bottomSheetOverlay}>
              <TouchableOpacity style={styles.bottomSheetDismiss} onPress={() => setMarkerTypeSheetVisible(false)} />
              <View style={[styles.bottomSheet, {paddingBottom: Math.max(insets.bottom, 20), flex: 0, maxHeight: '80%'}]}>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>{t('maps.markerType')}</Text>
                  <TouchableOpacity
                    style={styles.sheetCloseBtn}
                    onPress={() => setMarkerTypeSheetVisible(false)}>
                    <Icon name="close" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.sheetSearchWrap}>
                  <Icon name="magnify" size={18} color={colors.textMuted} />
                  <TextInput
                    style={styles.sheetSearchInput}
                    placeholder={t('maps.searchMarkerType')}
                    placeholderTextColor={colors.textMuted}
                    value={markerTypeSearch}
                    onChangeText={setMarkerTypeSearch}
                  />
                  {markerTypeSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setMarkerTypeSearch('')}>
                      <Icon name="close-circle" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Create Custom */}
                <TouchableOpacity
                  style={styles.createMarkerRow}
                  onPress={() => handleSelectMarkerType(null)}>
                  <View style={styles.markerIconBox}>
                    {renderMarkerSvg('player-marker', 40)}
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={[styles.createMarkerLabel, {color: colors.cyan}]}>{t('maps.createMarker')}</Text>
                    <Text style={styles.createMarkerSub}>{t('maps.nameCustomMarker')}</Text>
                  </View>
                  <Icon name="chevron-right" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.sheetDivider} />

                {/* Marker Type List */}
                <FlatList
                  data={filteredMarkerTypes}
                  keyExtractor={item => item.key}
                  style={{flexGrow: 1, flexShrink: 1}}
                  showsVerticalScrollIndicator={false}
                  renderItem={({item}) => {
                    const isSelected = selectedMarkerType?.key === item.key;
                    return (
                      <TouchableOpacity
                        style={[styles.markerTypeRow, isSelected && styles.markerTypeRowSelected]}
                        onPress={() => handleSelectMarkerType(item)}>
                        <View style={[styles.markerIconBox, isSelected && styles.markerIconBoxSelected]}>
                          {renderMarkerSvg(item.key, 40)}
                        </View>
                        <View style={{flex: 1}}>
                          <Text style={[styles.markerTypeLabel, isSelected && {color: colors.cyan}]}>{item.label}</Text>
                          <Text style={styles.markerTypeSub}>{t('filterCategories.' + item.category.toLowerCase())}</Text>
                        </View>
                        {isSelected && (
                          <View style={styles.checkCircle}>
                            <Icon name="check" size={14} color="#FFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        )}

        </KeyboardAvoidingView>
      </Modal>

      {/* ── MARKER INFO MODAL (on tap existing marker) ── */}
      <Modal visible={markerInfoVisible && !!selectedMarkerInfo} transparent animationType={Platform.OS === 'android' ? 'fade' : 'slide'}>
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity style={styles.bottomSheetDismiss} onPress={() => {setMarkerInfoVisible(false); setSelectedMarkerInfo(null);}} />
          <View style={[styles.bottomSheet, {paddingBottom: Math.max(insets.bottom, 20)}]}>
            <View style={styles.sheetHandle} />
            {selectedMarkerInfo && (
              <>
                <View style={styles.markerInfoHeader}>
                  <View style={styles.markerInfoIconWrap}>
                    {renderMarkerSvg(selectedMarkerInfo.markerType || selectedMarkerInfo.markerIcon || 'player-marker', 28)}
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.markerInfoName}>{selectedMarkerInfo.label}</Text>
                  </View>
                  <View style={styles.markerInfoBadge}>
                    <Text style={styles.markerInfoBadgeText}>{selectedMarkerInfo.isPublished ? t('common.public') : t('common.private')}</Text>
                  </View>
                </View>

                {selectedMarkerInfo.photo ? (
                  <Image source={{uri: selectedMarkerInfo.photo}} style={{width: '100%', height: 160, borderRadius: 8, marginBottom: spacing.md}} resizeMode="cover" />
                ) : null}

                {selectedMarkerInfo.note ? (
                  <View style={styles.markerInfoNoteWrap}>
                    <Icon name="note-text-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.markerInfoNote}>{selectedMarkerInfo.note}</Text>
                  </View>
                ) : null}
                
                <View style={styles.markerInfoActions}>
                  <TouchableOpacity style={styles.markerInfoActionBtn} onPress={() => {
                    setMarkerInfoVisible(false);
                    setPendingCoords({lat: selectedMarkerInfo.lat, lng: selectedMarkerInfo.lng});
                    const mt = MARKER_TYPES.find(m => m.key === selectedMarkerInfo.markerType);
                    setSelectedMarkerType(mt || null);
                    setCustomMarkerName(mt ? '' : selectedMarkerInfo.label);
                    setMarkerNote(selectedMarkerInfo.note || '');
                    setMarkerPhoto(selectedMarkerInfo.photo || null);
                    setIsPublished(selectedMarkerInfo.isPublished || false);
                    setEditingMarkerId(selectedMarkerInfo.id);
                    setSelectedMarkerInfo(null);
                    setAddMarkerFormVisible(true);
                  }}>
                    <View style={styles.actionIconWrap}>
                      <Icon name="pencil-outline" size={18} color={colors.cyan} />
                    </View>
                    <Text style={styles.markerInfoActionText}>{t('common.edit')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.markerInfoActionBtn} onPress={() => {
                    Alert.alert(t('maps.deleteMarker'), t('maps.removeMarkerConfirm', {label: selectedMarkerInfo.label}), [
                      {text: t('common.cancel'), style: 'cancel'},
                      {text: t('common.delete'), style: 'destructive', onPress: () => handleDeleteMarker(selectedMarkerInfo.id)},
                    ]);
                  }}>
                    <View style={[styles.actionIconWrap, {backgroundColor: 'rgba(244, 67, 54, 0.1)'}]}>
                      <Icon name="delete-outline" size={18} color="#F44336" />
                    </View>
                    <Text style={[styles.markerInfoActionText, {color: '#F44336'}]}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── SUCCESS SNACKBAR ── */}
      {snackbarVisible && (
        <Animated.View style={[styles.snackbar, {opacity: snackbarOpacity, bottom: Math.max(insets.bottom, 20)}]}>
          <Text style={styles.snackbarText}>{snackbarText}</Text>
        </Animated.View>
      )}
    </View>
  );
};

/* ═══════════════════════════ STYLES ═══════════════════════════ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },

  /* Floating Header */
  floatingHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(10, 14, 23, 0.55)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 100,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerBtnActive: {
    backgroundColor: colors.cyan + '30',
    borderWidth: 1,
    borderColor: colors.cyan,
  },
  headerTitle: {
    flex: 1,
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  headerLeft: { width: 80 },
  headerRight: { flexDirection: 'row', gap: spacing.sm, width: 80, justifyContent: 'flex-end' },

  /* Map */
  webView: { flex: 1, backgroundColor: '#0A0E17' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0E17',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  loadingTitle: {
    fontSize: fonts.sizes.xl, fontWeight: '700',
    color: colors.textPrimary, letterSpacing: 2,
    marginTop: spacing.lg, textAlign: 'center',
  },
  loadingText: {
    fontSize: fonts.sizes.sm, color: colors.textSecondary,
    marginTop: spacing.sm, fontWeight: '500',
  },

  /* Marker Mode Banner */
  markerBanner: {
    position: 'absolute',
    left: spacing.lg, right: spacing.lg,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.cyan + '18',
    borderWidth: 1, borderColor: colors.cyan + '40',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md, zIndex: 99,
  },
  markerBannerText: {
    flex: 1, fontSize: 11, fontWeight: '800',
    color: colors.cyan, letterSpacing: 1, textAlign: 'center',
  },

  /* Floating Filter */
  floatingFilterWrap: {
    position: 'absolute',
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 100,
    elevation: 16,
  },
  floatingFilterBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(10, 14, 23, 0.85)',
    paddingHorizontal: spacing.xl, paddingVertical: 12,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    minWidth: 160,
    overflow: 'hidden',
    elevation: 4,
  },
  filterBtnText: {
    fontSize: 13, fontWeight: '600',
    color: colors.textPrimary, letterSpacing: 1.5,
  },

  /* ─── Bottom Sheet (shared) ─── */
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  bottomSheetDismiss: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#0F1723',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.12)',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: fonts.sizes.md, fontWeight: '900',
    color: colors.textPrimary, letterSpacing: 2,
  },
  sheetCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: spacing.sm,
  },

  /* Sheet Search */
  sheetSearchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.md, marginBottom: spacing.md,
  },
  sheetSearchInput: {
    flex: 1, paddingVertical: 10,
    fontSize: fonts.sizes.sm, color: colors.textPrimary,
  },

  /* Create Marker Row */
  createMarkerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
  },
  createMarkerIconBox: {
    width: 40, height: 40, borderRadius: 6,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  createMarkerLabel: {
    fontSize: 13, fontWeight: '800', color: colors.textPrimary,
    letterSpacing: 1,
  },
  createMarkerSub: {
    fontSize: 11, color: colors.textMuted, marginTop: 2,
  },

  /* Marker Icon Box (shared) */
  markerIconBox: {
    width: 40, height: 40, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  markerIconBoxSelected: {
    width: 40, height: 40, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2, borderColor: colors.cyan,
  },

  /* Marker Type Rows */
  markerTypeRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: 10,
    borderRadius: 10,
  },
  markerTypeLabel: {
    fontSize: 13, fontWeight: '700', color: colors.textPrimary,
  },
  markerTypeSub: {
    fontSize: 11, color: colors.textMuted, marginTop: 1,
  },
  markerTypeRowSelected: {
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
  },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.cyan,
    alignItems: 'center', justifyContent: 'center',
  },

  /* ─── Add Marker Form ─── */
  formTitle: {
    fontSize: 22, fontWeight: '900',
    color: colors.textPrimary, letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  formCoords: {
    fontSize: 13, color: colors.textMuted, marginBottom: spacing.lg,
  },
  formSectionLabel: {
    fontSize: 12, fontWeight: '900', color: colors.textPrimary,
    letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.md,
  },
  formTypeSelected: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md, marginBottom: spacing.md,
  },
  formTypeSelectedActive: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
    borderRadius: 12, borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    padding: spacing.md, marginBottom: spacing.md,
  },
  formTypeText: {
    flex: 1, fontSize: fonts.sizes.sm, color: colors.textPrimary,
    fontWeight: '600',
  },
  formTypeSub: {
    fontSize: 11, color: colors.textMuted, marginTop: 1,
  },
  formTypeIcon: {
    width: 28, height: 28, borderRadius: 6, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  formTypeIconActive: {
    width: 32, height: 32, borderRadius: 8, overflow: 'hidden',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, padding: spacing.md,
    fontSize: fonts.sizes.sm, color: colors.textPrimary,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.sm,
  },
  formNoteInput: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  formCharCount: {
    fontSize: 10, color: colors.textMuted,
    textAlign: 'right', marginBottom: spacing.sm,
  },
  photoButtonsRow: {
    flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xs,
  },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: spacing.md, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  photoBtnText: {
    fontSize: 12, fontWeight: '800', color: colors.textSecondary, letterSpacing: 1,
  },
  photoPreviewWrap: {
    position: 'relative', marginBottom: spacing.xs,
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  photoPreview: {
    width: '100%', height: 150, borderRadius: 12,
  },
  photoRemoveBtn: {
    position: 'absolute', top: spacing.sm, right: spacing.sm,
  },
  photoRemoveCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  formPhotoLabel: {
    fontSize: 10, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1, marginBottom: spacing.md,
  },
  formPublishRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
    marginBottom: spacing.md,
  },
  formPublishLabel: {
    fontSize: 13, fontWeight: '600', color: colors.textPrimary,
  },
  formPublishSub: {
    fontSize: 11, color: colors.textMuted, marginTop: 2,
  },
  formActions: {
    flexDirection: 'row', gap: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: spacing.md,
  },
  formCancelBtn: {
    flex: 1, alignItems: 'center',
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  formCancelText: {
    fontSize: 12, fontWeight: '800', color: colors.textMuted, letterSpacing: 1,
  },
  formAddBtn: {
    flex: 1, alignItems: 'center',
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: colors.cyan,
  },
  formAddBtnDisabled: {
    flex: 1, alignItems: 'center',
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
  },
  formAddText: {
    fontSize: 12, fontWeight: '800', color: colors.textInverse, letterSpacing: 1,
  },

  /* ─── Marker Info Panel ─── */
  markerInfoPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0F1723',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, zIndex: 200,
    borderTopWidth: 1, borderColor: 'rgba(0, 229, 255, 0.12)',
  },
  markerInfoHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginBottom: spacing.md,
  },
  markerInfoIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  markerInfoName: {
    fontSize: 16, fontWeight: '800',
    color: colors.textPrimary, letterSpacing: 0.5,
  },
  markerInfoBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.15)',
  },
  markerInfoBadgeText: {
    fontSize: 9, fontWeight: '900', color: colors.cyan,
    letterSpacing: 1.5,
  },
  markerInfoNoteWrap: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10, padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  markerInfoNote: {
    flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18,
  },
  markerInfoActions: {
    flexDirection: 'row', gap: spacing.md,
    marginTop: spacing.xs,
  },
  markerInfoActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing.sm,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  actionIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  markerInfoActionText: {
    fontSize: 12, fontWeight: '800', color: colors.textSecondary,
    letterSpacing: 1,
  },
  markerInfoClose: {
    position: 'absolute', top: spacing.md, right: spacing.md,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* ─── Snackbar ─── */
  snackbar: {
    position: 'absolute',
    left: spacing.lg, right: spacing.lg,
    backgroundColor: 'rgba(0, 200, 83, 0.9)',
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center', zIndex: 300,
    borderWidth: 1, borderColor: 'rgba(0, 200, 83, 0.3)',
  },
  snackbarText: {
    fontSize: 13, fontWeight: '700', color: '#FFF', letterSpacing: 0.5,
  },
});

export default MapDetailScreen;
