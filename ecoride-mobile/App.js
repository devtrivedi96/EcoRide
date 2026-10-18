import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider, useNotification } from './src/context/NotificationContext';
import { navigationRef } from './src/navigation/navigationRef';
import RootNavigator from './src/navigation/RootNavigator';
import EcoRideDriverAlert from './src/components/RapidoDriverAlert';
import RouteMatchBanner from './src/components/RouteMatchBanner';

function NotificationRootOverlay() {
  const {
    activeDriverAlert,
    activeRouteMatch,
    acceptDriverAlert,
    declineDriverAlert,
    dismissRouteMatch,
  } = useNotification();

  return (
    <>
      <RouteMatchBanner match={activeRouteMatch} onDismiss={dismissRouteMatch} />
      <EcoRideDriverAlert
        alert={activeDriverAlert}
        onAccept={acceptDriverAlert}
        onDecline={declineDriverAlert}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="dark" />
          <RootNavigator />
          <NotificationRootOverlay />
        </NavigationContainer>
      </NotificationProvider>
    </AuthProvider>
  );
}
