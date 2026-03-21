import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, fonts, spacing } from '../theme/theme';

// Screens
import MapListScreen from '../screens/MapListScreen';
import MapDetailScreen from '../screens/MapDetailScreen';
import ItemListScreen from '../screens/ItemListScreen';
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
import MaterialsScreen from '../screens/MaterialsScreen';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const MapsStack = createNativeStackNavigator();
const CatalogStack = createNativeStackNavigator();
const SubmitStack = createNativeStackNavigator();
const ToolsStack = createNativeStackNavigator();

function MapsStackScreen() {
  return (
    <MapsStack.Navigator screenOptions={{ headerShown: false }}>
      <MapsStack.Screen name="MapList" component={MapListScreen} />
    </MapsStack.Navigator>
  );
}

function CatalogStackScreen() {
  return (
    <CatalogStack.Navigator screenOptions={{ headerShown: false }}>
      <CatalogStack.Screen name="ItemList" component={ItemListScreen} />
      <CatalogStack.Screen name="ItemDetail" component={ItemDetailScreen} />
    </CatalogStack.Navigator>
  );
}

function SubmitStackScreen() {
  return (
    <SubmitStack.Navigator screenOptions={{ headerShown: false }}>
      <SubmitStack.Screen name="SubmitMain" component={SubmitScreen} />
    </SubmitStack.Navigator>
  );
}

function ToolsStackScreen() {
  return (
    <ToolsStack.Navigator screenOptions={{ headerShown: false }}>
      <ToolsStack.Screen name="ToolsMain" component={ToolsScreen} />
      <ToolsStack.Screen name="TraderList" component={TraderListScreen} />
      <ToolsStack.Screen name="TraderDetail" component={TraderDetailScreen} />
      <ToolsStack.Screen name="BlueprintTracker" component={BlueprintTrackerScreen} />
      <ToolsStack.Screen name="QuestList" component={QuestListScreen} />
      <ToolsStack.Screen name="ArcList" component={ArcListScreen} />
      <ToolsStack.Screen name="EventTimers" component={EventTimerScreen} />
      <ToolsStack.Screen name="SkillTree" component={SkillTreeScreen} />
      <ToolsStack.Screen name="ArcDetail" component={ArcDetailScreen} />
      <ToolsStack.Screen name="Expedition" component={ExpeditionScreen} />
      <ToolsStack.Screen name="Trials" component={TrialsScreen} />
      <ToolsStack.Screen name="Guides" component={GuidesScreen} />
      <ToolsStack.Screen name="GuideDetail" component={GuideDetailScreen} />
      <ToolsStack.Screen name="Materials" component={MaterialsScreen} />
    </ToolsStack.Navigator>
  );
}

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Maps: { active: 'map', inactive: 'map-outline' },
  Catalog: { active: 'package-variant-closed', inactive: 'package-variant' },
  Submit: { active: 'plus-circle', inactive: 'plus-circle-outline' },
  Tools: { active: 'wrench', inactive: 'wrench-outline' },
};

/* ── Tab Navigator (with bottom bar) ── */
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return (
            <Icon name={iconName} size={24} color={color} />
          );
        },
      })}>
      <Tab.Screen name="Maps" component={MapsStackScreen} />
      <Tab.Screen name="Catalog" component={CatalogStackScreen} />
      <Tab.Screen name="Submit" component={SubmitStackScreen} />
      <Tab.Screen name="Tools" component={ToolsStackScreen} />
    </Tab.Navigator>
  );
}

/* ── Root Navigator (MapDetail lives here — completely outside tabs) ── */
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs" component={TabNavigator} />
        <RootStack.Screen name="MapDetail" component={MapDetailScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 75,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});

export default AppNavigator;
