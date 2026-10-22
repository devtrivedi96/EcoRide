import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { io } from 'socket.io-client';
import {
  initNotifications,
  sendDriverBookingNotification,
  sendRouteMatchNotification,
  sendRideExpiredNotification,
} from '../services/notificationService';
import { bookingApi } from '../api/bookingApi';
import { rideApi } from '../api/rideApi';
import { SOCKET_URL, MOCK_MODE } from '../api/config';
import { useAuth } from './AuthContext';
import { navigate } from '../navigation/navigationRef';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [activeDriverAlert, setActiveDriverAlert] = useState(null);
  const [activeRouteMatch, setActiveRouteMatch] = useState(null);

  const socketRef = useRef(null);
  const seenDriverTripIdsRef = useRef(new Set());
  const hasInitializedDriverTripsRef = useRef(false);
  const knownPassengerTripStatusRef = useRef(new Map());
  const notifiedExpiredRidesRef = useRef(new Set());

  // Initialize notifications on mount
  useEffect(() => {
    initNotifications();
  }, []);

  /**
   * ── 1. REAL-TIME SOCKET.IO CLIENT CONNECTION ─────────────────────────────────
   * Connects to EcoRide WebSocket server, registers user/driver rooms,
   * and listens for incoming ride bookings, route matches, and trip status updates.
   */
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    try {
      const socket = io(SOCKET_URL, {
        path: '/ws',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        if (user?.id) {
          socket.emit('join-user', user.id);
          socket.emit('join-driver', user.id);
        }
      });

      // Listen for incoming booking request broadcasted in real-time
      socket.on('incoming-ride-request', (data) => {
        if (!data) return;
        // Verify this booking is for this driver (or broad test broadcast)
        const isForMe = !data.driverId || data.driverId === user?.id || data.driverEmail === user?.email;
        if (isForMe && data.tripId && !seenDriverTripIdsRef.current.has(data.tripId)) {
          seenDriverTripIdsRef.current.add(data.tripId);
          triggerDriverAlert(data);
        }
      });

      // Listen for real-time route matches when another user offers a ride
      socket.on('route-match-found', (data) => {
        if (!data) return;
        if (data.driverId && data.driverId === user?.id) return; // Ignore own rides
        triggerRouteMatch(data);
      });

      // Listen for ride expiration broadcasts
      socket.on('ride-expired', (data) => {
        if (data?.rideId) {
          notifiedExpiredRidesRef.current.add(data.rideId);
        }
      });

      // Listen for passenger booking confirmations
      socket.on('trip-updated', (data) => {
        if (data?.status === 'ACCEPTED') {
          Alert.alert(
            '🚗 Carpool Confirmed!',
            `Your driver ${data.driverName || 'colleague'} accepted your booking. You can view trip details in My Trips.`
          );
        }
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    } catch (err) {
      console.log('Socket initialization notice:', err?.message);
    }
  }, [isAuthenticated, user?.id, user?.email]);

  /**
   * ── 2. REAL-TIME DATABASE SYNC & DIFF ENGINE ────────────────────────────────
   * Periodically checks Firestore for live bookings and passenger confirmations.
   * Runs every 6 seconds to ensure sub-10s guaranteed alerts even across network drops.
   */
  useEffect(() => {
    if (!isAuthenticated || !user) {
      hasInitializedDriverTripsRef.current = false;
      seenDriverTripIdsRef.current.clear();
      knownPassengerTripStatusRef.current.clear();
      return;
    }

    let isMounted = true;

    async function syncRealtimeTrips() {
      try {
        // A. Driver Check: Poll for newly arrived PENDING bookings
        const driverTrips = await bookingApi.driverTrips();
        if (isMounted && Array.isArray(driverTrips)) {
          if (!hasInitializedDriverTripsRef.current) {
            // Seed existing pending trips on initial load so past trips don't re-trigger
            driverTrips.forEach((t) => {
              if (t?.id) seenDriverTripIdsRef.current.add(t.id);
            });
            hasInitializedDriverTripsRef.current = true;
          } else {
            // Find any fresh PENDING trip created by a passenger
            const newPending = driverTrips.filter(
              (t) => t.status === 'PENDING' && !seenDriverTripIdsRef.current.has(t.id)
            );

            for (const trip of newPending) {
              seenDriverTripIdsRef.current.add(trip.id);
              triggerDriverAlert({
                tripId: trip.id,
                rideId: trip.rideId,
                passengerName:
                  `${trip.passenger?.firstName || ''} ${trip.passenger?.lastName || ''}`.trim() ||
                  trip.passenger?.email ||
                  'Colleague Passenger',
                pickup: trip.ride?.pickupLocation || 'Pickup Point',
                destination: trip.ride?.destination || 'Destination',
                seats: trip.bookedSeats || 1,
                fare: trip.totalFare || 80,
              });
            }
          }
        }

        // B. Passenger Check: Detect when driver confirms a booking
        const myTrips = await bookingApi.myTrips();
        if (isMounted && Array.isArray(myTrips)) {
          myTrips.forEach((trip) => {
            if (!trip?.id) return;
            const prevStatus = knownPassengerTripStatusRef.current.get(trip.id);
            if (prevStatus === 'PENDING' && trip.status === 'ACCEPTED') {
              Alert.alert(
                '🎉 Ride Confirmed!',
                `Your driver ${trip.driver?.firstName || 'colleague'} accepted your booking to ${trip.ride?.destination || 'destination'}.`
              );
            }
            knownPassengerTripStatusRef.current.set(trip.id, trip.status);
          });
        }

        // C. Ride Expiration Check: Monitor driver's offered rides in real-time
        try {
          const myRides = await rideApi.mine();
          if (isMounted && Array.isArray(myRides)) {
            const now = Date.now();
            for (const ride of myRides) {
              if (!ride?.id || !ride?.departureTime) continue;
              const depMs = new Date(ride.departureTime).getTime();
              if (depMs <= now && !notifiedExpiredRidesRef.current.has(ride.id)) {
                notifiedExpiredRidesRef.current.add(ride.id);
                sendRideExpiredNotification({
                  destination: ride.destination || 'Destination',
                  pickup: ride.pickupLocation || 'Pickup Point',
                  rideId: ride.id,
                });
              }
            }
          }
        } catch {}
      } catch (err) {
        // Silent sync catch
      }
    }

    // Run initial sync immediately
    syncRealtimeTrips();

    // Repeat every 6 seconds
    const interval = setInterval(syncRealtimeTrips, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, user?.id]);

  /**
   * Broadcast helpers to instantly notify peer devices over WebSocket
   */
  function notifyRideBooked(bookingData) {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('ride-booked', bookingData);
    }
  }

  function notifyRidePublished(rideData) {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('ride-published', rideData);
    }
  }

  function notifyRideExpired(rideId) {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('ride-expired', { rideId });
    }
  }

  /**
   * Displays high-priority incoming booking notification
   * (OS system banner + in-app heads-up card with 30s countdown)
   */
  async function triggerDriverAlert({
    passengerName = 'Pooja Patel',
    pickup = 'Silk Board Junction',
    destination = 'Electronic City Phase 1',
    seats = 2,
    fare = 160,
    tripId = `trip-${Date.now()}`,
    rideId,
  }) {
    await sendDriverBookingNotification({
      passengerName,
      pickup,
      destination,
      seats,
      fare,
      tripId,
      rideId,
    });

    setActiveDriverAlert({
      id: `alert-${Date.now()}`,
      passengerName,
      pickup,
      destination,
      seats,
      fare,
      tripId,
      rideId,
    });
  }

  /**
   * Displays route match notification
   */
  async function triggerRouteMatch({
    driverName = 'Arjun Nair',
    pickup = 'Silk Board Junction',
    destination = 'Electronic City Phase 1',
    fare = 80,
    departureTime = 'Soon',
    rideId,
  }) {
    await sendRouteMatchNotification({
      driverName,
      pickup,
      destination,
      fare,
      departureTime,
      rideId,
    });

    setActiveRouteMatch({
      id: `match-${Date.now()}`,
      driverName,
      pickup,
      destination,
      fare,
      departureTime,
      rideId,
    });
  }

  async function acceptDriverAlert(alert) {
    setActiveDriverAlert(null);
    try {
      if (alert?.tripId && !alert.tripId.startsWith('trip-sim-')) {
        await bookingApi.accept(alert.tripId);
        if (socketRef.current?.connected) {
          socketRef.current.emit('trip-status-changed', {
            tripId: alert.tripId,
            status: 'ACCEPTED',
          });
        }
      }
    } catch {
      // Non-fatal
    }
    Alert.alert('Ride Accepted! 🎉', `You confirmed the booking for ${alert.passengerName}. Navigate to Driver Requests.`);
    navigate('DriverTrips');
  }

  async function declineDriverAlert(alert) {
    setActiveDriverAlert(null);
    try {
      if (alert?.tripId && !alert.tripId.startsWith('trip-sim-')) {
        await bookingApi.reject(alert.tripId);
        if (socketRef.current?.connected) {
          socketRef.current.emit('trip-status-changed', {
            tripId: alert.tripId,
            status: 'REJECTED',
          });
        }
      }
    } catch {
      // Non-fatal
    }
  }

  function dismissRouteMatch() {
    setActiveRouteMatch(null);
  }

  /**
   * Developer preview helpers
   */
  function simulateDriverAlert() {
    triggerDriverAlert({
      passengerName: 'Anjali Sharma (Acme Corp)',
      pickup: 'Koramangala 5th Block',
      destination: 'Electronic City Phase 1',
      seats: 2,
      fare: 160,
      tripId: `trip-sim-${Date.now()}`,
    });
  }

  function simulateRouteMatch() {
    triggerRouteMatch({
      driverName: 'Siddharth Malhotra',
      pickup: 'Indiranagar 100ft Road',
      destination: 'Whitefield ITPL',
      fare: 90,
      departureTime: '8:45 AM',
      rideId: 'sim-ride-1',
    });
  }

  return (
    <NotificationContext.Provider
      value={{
        activeDriverAlert,
        activeRouteMatch,
        triggerDriverAlert,
        triggerRouteMatch,
        acceptDriverAlert,
        declineDriverAlert,
        dismissRouteMatch,
        notifyRideBooked,
        notifyRidePublished,
        notifyRideExpired,
        simulateDriverAlert,
        simulateRouteMatch,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
