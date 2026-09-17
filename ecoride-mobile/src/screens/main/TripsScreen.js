import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { bookingApi } from '../../api/bookingApi';
import { paymentApi } from '../../api/paymentApi';
import EmptyState from '../../components/EmptyState';
import Screen from '../../components/Screen';
import TripCard from '../../components/TripCard';
import { getErrorMessage } from '../../utils/format';

export default function TripsScreen({ navigation }) {
  const [trips, setTrips] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setTrips(await bookingApi.myTrips());
    } catch (error) {
      Alert.alert('Could not load trips', getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function cancel(tripId) {
    try {
      await bookingApi.cancel(tripId);
      await load();
    } catch (error) {
      Alert.alert('Cancel failed', getErrorMessage(error));
    }
  }

  async function pay(trip) {
    try {
      await paymentApi.payTrip({ tripId: trip.id, paymentMethod: 'WALLET' });
      Alert.alert('Paid', 'Trip payment completed from wallet.');
      await load();
    } catch (error) {
      Alert.alert('Payment failed', getErrorMessage(error));
    }
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />} contentStyle={{ paddingBottom: 90 }}>
      {trips.length ? trips.map((trip) => (
        <TripCard
          key={trip.id}
          trip={trip}
          actions={[
            ...(trip.status === 'PENDING' || trip.status === 'ACCEPTED' ? [{ title: 'Cancel', variant: 'ghost', onPress: () => cancel(trip.id) }] : []),
            ...(trip.status === 'COMPLETED' || trip.status === 'PAYMENT_PENDING' ? [{ title: 'Pay wallet', onPress: () => pay(trip) }] : []),
            { title: 'Chat', variant: 'ghost', onPress: () => navigation.getParent()?.navigate('Chat', { tripId: trip.id }) },
          ]}
        />
      )) : (
        <EmptyState title="No trips yet" body="Book a ride from the Find tab to see it here." />
      )}
    </Screen>
  );
}
