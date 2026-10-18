import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import SearchRidesScreen from '../screens/main/SearchRidesScreen';
import MapScreen from '../screens/main/MapScreen';
import PublishRideScreen from '../screens/main/PublishRideScreen';
import TripsScreen from '../screens/main/TripsScreen';
import DriverTripsScreen from '../screens/main/DriverTripsScreen';
import WalletScreen from '../screens/main/WalletScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ChatScreen from '../screens/main/ChatScreen';
import AdminScreen from '../screens/main/AdminScreen';

// New Flow Screens
import RideDetailsScreen from '../screens/main/RideDetailsScreen';
import BookingSuccessScreen from '../screens/main/BookingSuccessScreen';
import SustainabilityScreen from '../screens/main/SustainabilityScreen';
import VehiclesScreen from '../screens/main/VehiclesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.green} />
      <Text style={styles.loadingText}>Connecting to EcoRide</Text>
    </View>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Create Account' }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: 'Reset Password' }}
      />
    </Stack.Navigator>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 17,
          color: colors.text,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={iconFor(route.name, focused)}
            color={color}
            size={22}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ title: 'EcoRide', tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Find"
        component={SearchRidesScreen}
        options={{ title: 'Find Rides', tabBarLabel: 'Find' }}
      />
      <Tab.Screen
        name="Trips"
        component={TripsScreen}
        options={{ title: 'My Rides', tabBarLabel: 'Trips' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Account Hub', tabBarLabel: 'Account' }}
      />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="MainTabs"
        component={Tabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'Live Route Map', headerShown: false }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ title: 'EcoRide Wallet' }}
      />
      <Stack.Screen
        name="Admin"
        component={AdminScreen}
        options={{ title: 'Admin Console' }}
      />
      <Stack.Screen
        name="RideDetails"
        component={RideDetailsScreen}
        options={{ title: 'Ride Details' }}
      />
      <Stack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
        options={{ title: 'Booking Confirmed', headerBackVisible: false }}
      />
      <Stack.Screen
        name="PublishRide"
        component={PublishRideScreen}
        options={{ title: 'Offer a Ride' }}
      />
      <Stack.Screen
        name="DriverTrips"
        component={DriverTripsScreen}
        options={{ title: 'Driver Requests' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Trip Discussion' }}
      />
      <Stack.Screen
        name="Sustainability"
        component={SustainabilityScreen}
        options={{ title: 'Eco Impact' }}
      />
      <Stack.Screen
        name="Vehicles"
        component={VehiclesScreen}
        options={{ title: 'My Vehicles' }}
      />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { booting, isAuthenticated } = useAuth();
  if (booting) return <Loading />;
  return isAuthenticated ? <AppStack /> : <AuthStack />;
}

function iconFor(name, focused) {
  const icons = {
    Home: focused ? 'home' : 'home-outline',
    Find: focused ? 'search' : 'search-outline',
    Trips: focused ? 'ticket' : 'ticket-outline',
    Profile: focused ? 'person-circle' : 'person-circle-outline',
  };
  return icons[name] || 'ellipse-outline';
}

const screenOptions = {
  headerStyle: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTintColor: colors.text,
  headerTitleStyle: {
    fontWeight: '800',
    fontSize: 17,
    color: colors.text,
  },
  contentStyle: {
    backgroundColor: colors.ink,
  },
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    gap: 14,
  },
  loadingText: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 14,
  },
});
