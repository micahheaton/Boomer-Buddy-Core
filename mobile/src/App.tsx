import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { StatusBar, Platform, Text } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

// Screens
import SimpleHomeScreen from './screens/SimpleHomeScreen';

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

// Services will be initialized when needed

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
        component={SimpleHomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="shield-check" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <ExpoStatusBar style="dark" backgroundColor="#FFFFFF" />
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
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;