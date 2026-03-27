import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, fonts, spacing } from '../theme/theme';

// Screens
import HomeScreen from '../screens/HomeScreen';
import MapListScreen from '../screens/MapListScreen';
import MapDetailScreen from '../screens/MapDetailScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import SubmitScreen from '../screens/SubmitScreen';
import ToolsScreen from '../screens/ToolsScreen';
import TraderListScreen from '../screens/TraderListScreen';
import TraderDetailScreen from '../screens/TraderDetailScreen';
import BlueprintTrackerScreen from '../screens/BlueprintTrackerScreen';
import QuestListScreen from '../screens/QuestListScreen';
import ArcListScreen from '../screens/ArcListScreen';
import EventTimerScreen from '../screens/EventTimerScreen';
import SkillTreeScreen from '../screens/SkillTreeScreen';
import ArcDetailScreen from '../screens/ArcDetailScreen';
import ExpeditionScreen from '../screens/ExpeditionScreen';
import TrialsScreen from '../screens/TrialsScreen';
import GuidesScreen from '../screens/GuidesScreen';
import GuideDetailScreen from '../screens/GuideDetailScreen';
import TierListScreen from '../screens/TierListScreen';
import LoadoutBuilderScreen from '../screens/LoadoutBuilderScreen';
import WeaponsScreen from '../screens/WeaponsScreen';
import QuestTreeScreen from '../screens/QuestTreeScreen';
import CosmeticsScreen from '../screens/CosmeticsScreen';
import CollectibleTrackerScreen from '../screens/CollectibleTrackerScreen';
import QuestDetailScreen from '../screens/QuestDetailScreen';
import MaterialsScreen from '../screens/MaterialsScreen';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const BunkerStack = createNativeStackNavigator();
const TrialsStack = createNativeStackNavigator();
const MaterialsStack = createNativeStackNavigator();
const EnemiesStack = createNativeStackNavigator();
const GuidesStack = createNativeStackNavigator();

function BunkerStackScreen() {
  return (
    <BunkerStack.Navigator screenOptions={{ headerShown: false }}>
      <BunkerStack.Screen name="BunkerHome" component={HomeScreen} />
    </BunkerStack.Navigator>
  );
}

function TrialsStackScreen() {
  return (
    <TrialsStack.Navigator screenOptions={{ headerShown: false }}>
      <TrialsStack.Screen name="TrialsMain" component={TrialsScreen} />
    </TrialsStack.Navigator>
  );
}

function MaterialsStackScreen() {
  return (
    <MaterialsStack.Navigator screenOptions={{ headerShown: false, freezeOnBlur: false }}>
      <MaterialsStack.Screen name="MaterialsMain" component={MaterialsScreen} />
    </MaterialsStack.Navigator>
  );
}

function EnemiesStackScreen() {
  return (
    <EnemiesStack.Navigator screenOptions={{ headerShown: false }}>
      <EnemiesStack.Screen name="ArcList" component={ArcListScreen} />
    </EnemiesStack.Navigator>
  );
}

function GuidesStackScreen() {
  return (
    <GuidesStack.Navigator screenOptions={{ headerShown: false }}>
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

/* ── Tab Navigator (with bottom bar) ── */
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <Icon name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}>
      <Tab.Screen name="Bunker" component={BunkerStackScreen} />
      <Tab.Screen name="Trials" component={TrialsStackScreen} />
      <Tab.Screen name="Materials" component={MaterialsStackScreen} options={{ lazy: false }} />
      <Tab.Screen name="Enemies" component={EnemiesStackScreen} />
      <Tab.Screen name="Guides" component={GuidesStackScreen} />
    </Tab.Navigator>
  );
}

/* ── Root Navigator (MapDetail lives here — completely outside tabs) ── */
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs" component={TabNavigator} />
        <RootStack.Screen name="MapList" component={MapListScreen} />
        <RootStack.Screen name="MapDetail" component={MapDetailScreen} />
        <RootStack.Screen name="ItemDetail" component={ItemDetailScreen} />
        <RootStack.Screen name="BlueprintTracker" component={BlueprintTrackerScreen} />
        <RootStack.Screen name="LoadoutBuilder" component={LoadoutBuilderScreen} />
        <RootStack.Screen name="TraderList" component={TraderListScreen} />
        <RootStack.Screen name="TraderDetail" component={TraderDetailScreen} />
        <RootStack.Screen name="QuestList" component={QuestListScreen} />
        <RootStack.Screen name="QuestDetail" component={QuestDetailScreen} />
        <RootStack.Screen name="EventTimers" component={EventTimerScreen} />
        <RootStack.Screen name="Expedition" component={ExpeditionScreen} />
        <RootStack.Screen name="TierList" component={TierListScreen} />
        <RootStack.Screen name="QuestTree" component={QuestTreeScreen} />
        <RootStack.Screen name="Cosmetics" component={CosmeticsScreen} />
        <RootStack.Screen name="CollectibleTracker" component={CollectibleTrackerScreen} />
        <RootStack.Screen name="Submit" component={SubmitScreen} />
        <RootStack.Screen name="Weapons" component={WeaponsScreen} />
        <RootStack.Screen name="SkillTree" component={SkillTreeScreen} options={{ gestureEnabled: false }} />
        <RootStack.Screen name="ArcDetail" component={ArcDetailScreen} />
        <RootStack.Screen name="GuideDetail" component={GuideDetailScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 80,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg + 2,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  activeIconWrap: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});

export default AppNavigator;
