import React, {useRef} from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from '../utils/safeArea';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/theme';
import {logFirebaseScreenView} from '../utils/firebase';
const CONTENT_BG = Platform.OS === 'ios' ? 'transparent' : colors.bg;

import HomeScreen from '../screens/HomeScreen';
import TrialsScreen from '../screens/TrialsScreen';
import MaterialsScreen from '../screens/MaterialsScreen';
import ArcListScreen from '../screens/ArcListScreen';
import GuidesScreen from '../screens/GuidesScreen';
import MapListScreen from '../screens/MapListScreen';
import MapDetailScreen from '../screens/MapDetailScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import SubmitScreen from '../screens/SubmitScreen';
import TraderListScreen from '../screens/TraderListScreen';
import TraderDetailScreen from '../screens/TraderDetailScreen';
import BlueprintTrackerScreen from '../screens/BlueprintTrackerScreen';
import QuestListScreen from '../screens/QuestListScreen';
import EventTimerScreen from '../screens/EventTimerScreen';
import SkillTreeScreen from '../screens/SkillTreeScreen';
import ArcDetailScreen from '../screens/ArcDetailScreen';
import ExpeditionScreen from '../screens/ExpeditionScreen';
import GuideDetailScreen from '../screens/GuideDetailScreen';
import TierListScreen from '../screens/TierListScreen';
import LoadoutBuilderScreen from '../screens/LoadoutBuilderScreen';
import WeaponsScreen from '../screens/WeaponsScreen';
import QuestTreeScreen from '../screens/QuestTreeScreen';
import CosmeticsScreen from '../screens/CosmeticsScreen';
import CollectibleTrackerScreen from '../screens/CollectibleTrackerScreen';
import QuestDetailScreen from '../screens/QuestDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PaywallScreen from '../screens/PaywallScreen';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

export const navigationRef = createNavigationContainerRef();

const BunkerStack = createNativeStackNavigator();
const TrialsStack = createNativeStackNavigator();
const MaterialsStack = createNativeStackNavigator();
const EnemiesStack = createNativeStackNavigator();
const GuidesStack = createNativeStackNavigator();

function useStableAndroidBottomInset() {
  const {bottom} = useSafeAreaInsets();
  const [stableBottomInset, setStableBottomInset] = React.useState(bottom);

  React.useEffect(() => {
    if (Platform.OS === 'android') {
      setStableBottomInset(prev => Math.max(prev, bottom));
    }
  }, [bottom]);

  return Platform.OS === 'android' ? stableBottomInset : bottom;
}

function BunkerStackScreen() {
  return (
    <BunkerStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: CONTENT_BG },
        animation: Platform.OS === 'android' ? 'none' : 'slide_from_right',
        gestureEnabled: Platform.OS !== 'android',
      }}>
      <BunkerStack.Screen name="BunkerHome" component={HomeScreen} />
    </BunkerStack.Navigator>
  );
}

function TrialsStackScreen() {
  return (
    <TrialsStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: CONTENT_BG },
        animation: Platform.OS === 'android' ? 'none' : 'slide_from_right',
        gestureEnabled: Platform.OS !== 'android',
      }}>
      <TrialsStack.Screen name="TrialsMain" component={TrialsScreen} />
    </TrialsStack.Navigator>
  );
}

function MaterialsStackScreen() {
  return (
    <MaterialsStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: CONTENT_BG },
        animation: Platform.OS === 'android' ? 'none' : 'slide_from_right',
        gestureEnabled: Platform.OS !== 'android',
      }}>
      <MaterialsStack.Screen name="MaterialsMain" component={MaterialsScreen} />
    </MaterialsStack.Navigator>
  );
}

function EnemiesStackScreen() {
  return (
    <EnemiesStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: CONTENT_BG },
        animation: Platform.OS === 'android' ? 'none' : 'slide_from_right',
        gestureEnabled: Platform.OS !== 'android',
      }}>
      <EnemiesStack.Screen name="ArcList" component={ArcListScreen} />
    </EnemiesStack.Navigator>
  );
}

function GuidesStackScreen() {
  return (
    <GuidesStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: CONTENT_BG },
        animation: Platform.OS === 'android' ? 'none' : 'slide_from_right',
        gestureEnabled: Platform.OS !== 'android',
      }}>
      <GuidesStack.Screen name="GuidesMain" component={GuidesScreen} />
    </GuidesStack.Navigator>
  );
}

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Bunker: { active: 'shield-check', inactive: 'shield-check-outline' },
  Trials: { active: 'information', inactive: 'information-outline' },
  Materials: { active: 'flask', inactive: 'flask-outline' },
  Enemies: { active: 'lightning-bolt', inactive: 'lightning-bolt-outline' },
  Guides: { active: 'text-box', inactive: 'text-box-outline' },
};

/* ── Custom floating glass tab bar ── */
function GlassTabBar({ state, descriptors, navigation }: any) {
  const bottomInset = useStableAndroidBottomInset();
  const { t } = useTranslation();
  const bottomPad = Platform.OS === 'android'
    ? Math.max(bottomInset, 13)
    : (bottomInset > 0 ? Math.max(bottomInset - 8, 6) : 6);

  const TAB_LABELS: Record<string, string> = {
    Bunker: t('tabs.bunker'),
    Trials: t('tabs.trials'),
    Materials: t('tabs.materials'),
    Enemies: t('tabs.enemies'),
    Guides: t('tabs.guides'),
  };

  const TabBarWrapper = Platform.OS === 'android'
    ? ({children, style}: any) => <View style={[style, {backgroundColor: colors.bg}]}>{children}</View>
    : ({children, style}: any) => (
        <BlurView blurType="ultraThinMaterialDark" blurAmount={24}
          reducedTransparencyFallbackColor="rgba(17,24,39,0.85)" style={style}>
          {children}
        </BlurView>
      );

  return (
    <View style={[styles.tabBarOuter, { bottom: bottomPad }]}>
      <TabBarWrapper style={styles.blurWrap}>
        <View style={styles.tabBarInner}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label = TAB_LABELS[route.name] || route.name;
            const isFocused = state.index === index;
            const icons = TAB_ICONS[route.name];
            const iconName = isFocused ? icons.active : icons.inactive;
            const iconColor = isFocused ? colors.cyan : colors.textMuted;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                activeOpacity={0.7}
                style={styles.tabItem}>
                <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                  <Icon name={iconName} size={28} color={iconColor} />
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? colors.cyan : colors.textMuted },
                  ]}
                  numberOfLines={1}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TabBarWrapper>
    </View>
  );
}

/* ── Tab Navigator ── */
function TabNavigator() {
  const bottomInset = useStableAndroidBottomInset();
  const tabSceneBottomInset = Platform.OS === 'android' ? Math.max(bottomInset, 8) : 0;

  return (
    <Tab.Navigator
      tabBar={props => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
        sceneStyle: { backgroundColor: CONTENT_BG, paddingBottom: tabSceneBottomInset },
      }}>
      <Tab.Screen name="Bunker" component={BunkerStackScreen} />
      <Tab.Screen name="Trials" component={TrialsStackScreen} />
      <Tab.Screen name="Materials" component={MaterialsStackScreen} />
      <Tab.Screen name="Enemies" component={EnemiesStackScreen} />
      <Tab.Screen name="Guides" component={GuidesStackScreen} />
    </Tab.Navigator>
  );
}

/* ── Root Navigator (MapDetail lives here — completely outside tabs) ── */
const AppNavigator = () => {
  const navBackground = Platform.OS === 'ios' ? 'transparent' : colors.bg;
  const bottomInset = useStableAndroidBottomInset();
  const rootBottomInset = Platform.OS === 'android' ? Math.max(bottomInset, 8) : 0;
  const routeNameRef = useRef<string | undefined>(undefined);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        const initialRouteName = navigationRef.getCurrentRoute()?.name;
        routeNameRef.current = initialRouteName;
        if (initialRouteName) {
          logFirebaseScreenView(initialRouteName).catch(() => {});
        }
      }}
      onStateChange={() => {
        const currentRouteName = navigationRef.getCurrentRoute()?.name;
        if (currentRouteName && routeNameRef.current !== currentRouteName) {
          logFirebaseScreenView(currentRouteName).catch(() => {});
        }
        routeNameRef.current = currentRouteName;
      }}
      theme={{
        dark: true,
        colors: {
          primary: colors.cyan,
          background: navBackground,
          card: 'transparent',
          text: '#FFFFFF',
          border: 'transparent',
          notification: colors.cyan,
        },
        fonts: {
          regular: {fontFamily: 'System', fontWeight: '400' as const},
          medium: {fontFamily: 'System', fontWeight: '500' as const},
          bold: {fontFamily: 'System', fontWeight: '700' as const},
          heavy: {fontFamily: 'System', fontWeight: '900' as const},
        },
      }}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: Platform.OS !== 'android',
          animation: Platform.OS === 'android' ? 'none' : 'slide_from_right',
          contentStyle: { backgroundColor: navBackground, paddingBottom: rootBottomInset },
        }}>
          <RootStack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{contentStyle: {backgroundColor: navBackground, paddingBottom: 0}}}
          />
          <RootStack.Screen name="MapList" component={MapListScreen} />
          <RootStack.Screen
            name="MapDetail"
            component={MapDetailScreen}
            options={{contentStyle: {backgroundColor: navBackground, paddingBottom: 0}}}
          />
          <RootStack.Screen name="ItemDetail" component={ItemDetailScreen} />
          <RootStack.Screen
            name="BlueprintTracker"
            component={BlueprintTrackerScreen}
            options={{animation: 'none'}}
          />
          <RootStack.Screen name="LoadoutBuilder" component={LoadoutBuilderScreen} />
          <RootStack.Screen name="TraderList" component={TraderListScreen} />
          <RootStack.Screen name="TraderDetail" component={TraderDetailScreen} />
          <RootStack.Screen name="QuestList" component={QuestListScreen} />
          <RootStack.Screen name="QuestDetail" component={QuestDetailScreen} />
          <RootStack.Screen name="EventTimers" component={EventTimerScreen} />
          <RootStack.Screen name="Expedition" component={ExpeditionScreen} />
          <RootStack.Screen
            name="TierList"
            component={TierListScreen}
            options={{animation: Platform.OS === 'android' ? 'none' : 'slide_from_right'}}
          />
          <RootStack.Screen
            name="QuestTree"
            component={QuestTreeScreen}
            options={{animation: Platform.OS === 'android' ? 'none' : 'slide_from_right'}}
          />
          <RootStack.Screen name="Cosmetics" component={CosmeticsScreen} />
          <RootStack.Screen name="CollectibleTracker" component={CollectibleTrackerScreen} />
          <RootStack.Screen name="Submit" component={SubmitScreen} />
          <RootStack.Screen name="Weapons" component={WeaponsScreen} />
          <RootStack.Screen name="SkillTree" component={SkillTreeScreen} options={{gestureEnabled: false}} />
          <RootStack.Screen name="ArcDetail" component={ArcDetailScreen} />
          <RootStack.Screen name="GuideDetail" component={GuideDetailScreen} />
          <RootStack.Screen name="Settings" component={SettingsScreen} />
          <RootStack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{
              animation: 'none',
              gestureEnabled: false,
              contentStyle: {backgroundColor: 'transparent', paddingBottom: 0},
            }}
          />
        </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  /* floating glass bar */
  tabBarOuter: {
    position: 'absolute',
    left: 14,
    right: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.24)',
    backgroundColor: 'rgba(10,14,23,0.94)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 2,
  },
  blurWrap: {
    borderRadius: 29,
    overflow: 'hidden',
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(10,14,23,0.92)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(0,229,255,0.14)',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default AppNavigator;
