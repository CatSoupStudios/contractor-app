import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../theme/DesignSystem';

// --- SCREENS ---
import HomeScreen from '../screens/HomeScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import TeamScreen from '../screens/TeamScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddProjectScreen from '../screens/AddProjectScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';
import ProjectDetailsScreen from '../screens/ProjectDetailsScreen';
import CreateEstimateScreen from '../screens/CreateEstimateScreen';
import EstimateDetailsScreen from '../screens/EstimateDetailsScreen';
import CompanySettingsScreen from '../screens/CompanySettingsScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import ArchivedProjectsScreen from '../screens/ArchivedProjectsScreen';
import ChatScreen from '../screens/ChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 1. TAB GROUP
function TabGroup() {
  const { currentTheme } = useTheme();
  const { colors: COLORS } = currentTheme;
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 90 : 60 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? 30 : (insets.bottom > 0 ? insets.bottom : 10),
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' }
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }: any) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProjectsTab"
        component={ProjectsScreen}
        options={{
          tabBarLabel: 'Projects',
          tabBarIcon: ({ color, size }: any) => <Ionicons name="briefcase" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="TeamTab"
        component={TeamScreen}
        options={{
          tabBarLabel: 'Crew',
          tabBarIcon: ({ color, size }: any) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }: any) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// 2. MAIN STACK NAVIGATOR
export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* BASE: TABS */}
      <Stack.Screen name="Tabs" component={TabGroup} />

      {/* --- MODAL SCREENS --- */}

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />

      <Stack.Screen
        name="AddProject"
        component={AddProjectScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: false,
        }}
      />

      <Stack.Screen
        name="CreateEstimate"
        component={CreateEstimateScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: false,
        }}
      />

      <Stack.Screen
        name="CompanySettings"
        component={CompanySettingsScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: false,
        }}
      />

      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />

      {/* --- PUSH SCREENS --- */}

      <Stack.Screen
        name="PublicProfile"
        component={PublicProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="ProjectDetails"
        component={ProjectDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="EstimateDetails"
        component={EstimateDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="ArchivedProjects"
        component={ArchivedProjectsScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ animation: 'slide_from_right' }}
      />

    </Stack.Navigator>
  );
}