import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { StatusBar, Platform, Text } from 'react-native';

// Screens
import HomeScreen from './screens/HomeScreen';
import AlertsScreen from './screens/AlertsScreen';
import ReportScreen from './screens/ReportScreen';
import TrainingScreen from './screens/TrainingScreen';
import SettingsScreen from './screens/SettingsScreen';
import AnalysisResultScreen from './screens/AnalysisResultScreen';

// Services
import { PiiScrubber } from './services/PiiScrubber';
import { RiskEngine } from './services/RiskEngine';
import { StorageService } from './services/StorageService';

// Simple icon component for tab navigation
const TabIcon = ({ name, color, size }: { name: string; color: string; size: number }) => {
  const icons: { [key: string]: string } = {
    'shield-check': '🛡️',
    'alert-triangle': '⚠️',
    'plus-circle': '➕',
    'book-open': '📚',
    'settings': '⚙️',
  };
  
  return (
    <Text style={{ fontSize: size, color }}>
      {icons[name] || '●'}
    </Text>
  );
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const queryClient = new QueryClient();

// Initialize core services
PiiScrubber.initialize();
RiskEngine.initialize();
StorageService.initialize();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#17948E',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="shield-check" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="alert-triangle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Report" 
        component={ReportScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="plus-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Training" 
        component={TrainingScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="book-open" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <StatusBar
              barStyle="dark-content"
              backgroundColor="#FFFFFF"
              translucent={false}
            />
            <Stack.Navigator
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#17948E',
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              <Stack.Screen 
                name="Main" 
                component={TabNavigator}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="AnalysisResult"
                component={AnalysisResultScreen}
                options={{
                  title: 'Analysis Result',
                  presentation: 'modal',
                }}
              />
            </Stack.Navigator>
          </SafeAreaView>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};

export default App;