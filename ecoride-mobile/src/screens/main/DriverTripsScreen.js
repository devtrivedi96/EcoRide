import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { bookingApi } from '../../api/bookingApi';
import EmptyState from '../../components/EmptyState';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import TripCard from '../../components/TripCard';
import { getErrorMessage } from '../../utils/format';

export default function DriverTripsScreen({ navigation }) {
  const [trips, setTrips] = useState([]);
  const [otps, setOtps] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setTrips(await bookingApi.driverTrips());
    } catch (error) {
      Alert.alert('Could not load driver trips', getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function act(label, action) {
    try {
      await action();
      await load();
    } catch (error) {
      Alert.alert(`${label} failed`, getErrorMessage(error));
    }
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}>
      {trips.length ? trips.map((trip) => (
        <React.Fragment key={trip.id}>
          {trip.status === 'ACCEPTED' ? (
            <Field
              label={`OTP for ${trip.id}`}
              value={otps[trip.id] || ''}
              onChangeText={(value) => setOtps((current) => ({ ...current, [trip.id]: value }))}
              keyboardType="number-pad"
            />
          ) : null}
          <TripCard
            trip={trip}
            actions={[
              ...(trip.status === 'PENDING' ? [
                { title: 'Accept', onPress: () => act('Accept', () => bookingApi.accept(trip.id)) },
                { title: 'Reject', variant: 'ghost', onPress: () => act('Reject', () => bookingApi.reject(trip.id)) },
              ] : []),
              ...(trip.status === 'ACCEPTED' ? [{ title: 'Start trip', onPress: () => act('OTP verification', () => bookingApi.verifyOtp(trip.id, otps[trip.id])) }] : []),
              ...(trip.status === 'STARTED' ? [{ title: 'Complete', onPress: () => act('Complete', () => bookingApi.updateStatus(trip.id, 'COMPLETED')) }] : []),
              { title: 'Chat', variant: 'ghost', onPress: () => navigation.navigate('Chat', { tripId: trip.id }) },
            ]}
          />
        </React.Fragment>
      )) : (
        <EmptyState title="No passenger requests" body="Requests appear here when employees book your rides." />
      )}
    </Screen>
  );
}
