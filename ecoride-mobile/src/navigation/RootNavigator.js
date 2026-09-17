import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/theme';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import SearchRidesScreen from '../screens/main/SearchRidesScreen';
import PublishRideScreen from '../screens/main/PublishRideScreen';
import TripsScreen from '../screens/main/TripsScreen';
import DriverTripsScreen from '../screens/main/DriverTripsScreen';
import WalletScreen from '../screens/main/WalletScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ChatScreen from '../screens/main/ChatScreen';
import AdminScreen from '../screens/main/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.green} />
      <Text style={styles.loadingText}>Loading EcoRide</Text>
    </View>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create account' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Password help' }} />
    </Stack.Navigator>
  );
}

function Tabs() {
  const { user } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.ink },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.panel, borderTopColor: colors.line },
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, size }) => <Ionicons name={iconFor(route.name)} color={color} size={size} />,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Find" component={SearchRidesScreen} options={{ title: 'Find rides' }} />
      <Tab.Screen name="Trips" component={TripsScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {user?.role === 'ADMIN' ? <Tab.Screen name="Admin" component={AdminScreen} /> : null}
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MainTabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="PublishRide" component={PublishRideScreen} options={{ title: 'Publish ride' }} />
      <Stack.Screen name="DriverTrips" component={DriverTripsScreen} options={{ title: 'Driver trips' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Trip chat' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { booting, isAuthenticated } = useAuth();
  if (booting) return <Loading />;
  return isAuthenticated ? <AppStack /> : <AuthStack />;
}

function iconFor(name) {
  const icons = {
    Home: 'home-outline',
    Find: 'search-outline',
    Trips: 'ticket-outline',
    Wallet: 'wallet-outline',
    Profile: 'person-outline',
    Admin: 'shield-checkmark-outline',
  };
  return icons[name] || 'ellipse-outline';
}

const screenOptions = {
  headerStyle: { backgroundColor: colors.ink },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '900' },
  contentStyle: { backgroundColor: colors.ink },
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
  },
});
