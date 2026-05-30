import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useLanguage } from '../services/LanguageContext';
import { useTheme } from '../services/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

// Screen imports
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import AgendaScreen from '../screens/AgendaScreen';
import ClientsScreen from '../screens/ClientsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ServicesScreen from '../screens/ServicesScreen';
import BarbersScreen from '../screens/BarbersScreen';
import AvailabilityScreen from '../screens/AvailabilityScreen';
import RevenueScreen from '../screens/RevenueScreen';

// Types for navigation
export type RootStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  MainApp: undefined;
  Services: undefined;
  Barbers: undefined;
  Availability: undefined;
  Revenue: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Agenda: undefined;
  Clientes: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Custom premium vector icons using Ionicons
const TabIcon = ({ name, color, size }: { name: string; color: string; size: number }) => {
  let iconName = 'square-outline';
  if (name === 'dashboard') {
    iconName = 'grid-outline';
  } else if (name === 'calendar') {
    iconName = 'calendar-outline';
  } else if (name === 'people') {
    iconName = 'people-outline';
  } else if (name === 'settings') {
    iconName = 'settings-outline';
  }
  return <Icon name={iconName} size={size + 2} color={color} />;
};

function MainTabNavigator() {
  const { t } = useLanguage();
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.cardBackground,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: 'bold',
          fontSize: 18,
        },
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{
          title: t('tabPanel'),
          tabBarIcon: ({ color, size }) => <TabIcon name="dashboard" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Agenda"
        component={AgendaScreen}
        options={{
          title: t('tabAgenda'),
          tabBarIcon: ({ color, size }) => <TabIcon name="calendar" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Clientes"
        component={ClientsScreen}
        options={{
          title: t('tabClients'),
          tabBarIcon: ({ color, size }) => <TabIcon name="people" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('tabSettings'),
          tabBarIcon: ({ color, size }) => <TabIcon name="settings" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
        <Stack.Screen name="Services" component={ServicesScreen} />
        <Stack.Screen name="Barbers" component={BarbersScreen} />
        <Stack.Screen name="Availability" component={AvailabilityScreen} />
        <Stack.Screen name="Revenue" component={RevenueScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
