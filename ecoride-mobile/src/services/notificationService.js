import { Platform, Vibration } from 'react-native';
import { navigate } from '../navigation/navigationRef';

// Dynamically load expo-notifications safely to prevent crashes in Expo Go / Hermes
// where ExpoPushTokenManager native module is omitted
let Notifications = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
} catch (e) {
  // Expo Go (Hermes) does not bundle ExpoPushTokenManager. Fall back gracefully.
  Notifications = null;
}

// Configure how notifications appear when app is in foreground
if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch {
    // Non-fatal if handler setup fails
  }
}

let isInitialized = false;

export async function initNotifications() {
  if (isInitialized) return true;
  if (!Notifications) {
    isInitialized = true;
    return true;
  }

  try {
    if (typeof Notifications.getPermissionsAsync === 'function') {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted' && typeof Notifications.requestPermissionsAsync === 'function') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
      }
    }

    // Set up Android High-Priority channels (for lock screen & heads-up notifications outside app)
    if (Platform.OS === 'android' && typeof Notifications.setNotificationChannelAsync === 'function') {
      await Notifications.setNotificationChannelAsync('driver-alerts', {
        name: 'EcoRide Driver Alerts',
        importance: Notifications.AndroidImportance ? Notifications.AndroidImportance.MAX : 5,
        vibrationPattern: [0, 500, 250, 500, 250, 500],
        lightColor: '#10B981',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility ? Notifications.AndroidNotificationVisibility.PUBLIC : 1,
        bypassDnd: true,
      });

      await Notifications.setNotificationChannelAsync('route-matches', {
        name: 'Route Match Notifications',
        importance: Notifications.AndroidImportance ? Notifications.AndroidImportance.HIGH : 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility ? Notifications.AndroidNotificationVisibility.PUBLIC : 1,
      });
    }

    // Handle deep-linking when driver or rider taps system notification outside the app
    if (typeof Notifications.addNotificationResponseReceivedListener === 'function') {
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response?.notification?.request?.content?.data;
        if (!data) return;

        if (data.type === 'driver-booking') {
          navigate('DriverTrips', { tripId: data.tripId });
        } else if (data.type === 'route-match') {
          navigate('Find', { pickup: data.pickup, destination: data.destination });
        }
      });
    }

    isInitialized = true;
    return true;
  } catch (error) {
    console.log('Notice: Notifications initialization fallback:', error?.message);
    isInitialized = true;
    return false;
  }
}

/**
 * EcoRide Driver Alert: Sends an OS-level high-priority notification
 * with distinct vibration pattern, visible whether the driver is inside or outside the app.
 */
export async function sendDriverBookingNotification({
  passengerName = 'Colleague Passenger',
  pickup = 'Pickup Point',
  destination = 'Destination',
  seats = 1,
  fare = 80,
  tripId,
  rideId,
}) {
  try {
    // 1. Trigger urgent driver loud haptic vibration loop (native in React Native)
    Vibration.vibrate([0, 500, 250, 500, 250, 500]);

    if (!Notifications || typeof Notifications.scheduleNotificationAsync !== 'function') {
      return;
    }

    await initNotifications();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 New Ride Booking! · ₹${fare}`,
        body: `${passengerName} booked ${seats} seat(s) on your route to ${destination}. Tap to accept!`,
        data: {
          type: 'driver-booking',
          tripId,
          rideId,
          passengerName,
          pickup,
          destination,
          seats,
          fare,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority ? Notifications.AndroidNotificationPriority.MAX : 'max',
        channelId: 'driver-alerts',
      },
      trigger: null, // Display immediately
    });
  } catch (err) {
    console.log('Driver booking notification notice:', err?.message);
  }
}

/**
 * Route Match Notification: Notifies riders when a driver is available along their commute.
 */
export async function sendRouteMatchNotification({
  driverName = 'Verified Corporate Driver',
  pickup = 'Pickup Point',
  destination = 'Destination',
  fare = 80,
  departureTime = 'Soon',
  rideId,
}) {
  try {
    // 1. Trigger route match subtle haptic buzz
    Vibration.vibrate([0, 200, 100, 200]);

    if (!Notifications || typeof Notifications.scheduleNotificationAsync !== 'function') {
      return;
    }

    await initNotifications();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚗 Route Match Found! · ₹${fare}/seat`,
        body: `${driverName} is offering a ride along ${pickup} → ${destination} departing ${departureTime}. Tap to view!`,
        data: {
          type: 'route-match',
          rideId,
          driverName,
          pickup,
          destination,
          fare,
          departureTime,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority ? Notifications.AndroidNotificationPriority.HIGH : 'high',
        channelId: 'route-matches',
      },
      trigger: null, // Display immediately
    });
  } catch (err) {
    console.log('Route match notification notice:', err?.message);
  }
}

/**
 * Ride Expired Notification: Notifies driver or commuters when a ride reaches expiration.
 */
export async function sendRideExpiredNotification({
  destination = 'Destination',
  pickup = 'Pickup Point',
  rideId,
}) {
  try {
    Vibration.vibrate([0, 150, 100, 150]);

    if (!Notifications || typeof Notifications.scheduleNotificationAsync !== 'function') {
      return;
    }

    await initNotifications();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ Ride Departed & Closed`,
        body: `Your corporate ride ${pickup} → ${destination} has reached departure time and is now expired.`,
        data: {
          type: 'ride-expired',
          rideId,
        },
        sound: 'default',
        channelId: 'route-matches',
      },
      trigger: null,
    });
  } catch (err) {
    console.log('Ride expired notification notice:', err?.message);
  }
}
