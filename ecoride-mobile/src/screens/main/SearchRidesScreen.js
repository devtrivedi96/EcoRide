import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { bookingApi } from '../../api/bookingApi';
import { rideApi } from '../../api/rideApi';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import Field from '../../components/Field';
import RideCard from '../../components/RideCard';
import Screen from '../../components/Screen';
import { colors } from '../../utils/theme';
import { getErrorMessage } from '../../utils/format';

export default function SearchRidesScreen() {
  const [pickupLocation, setPickupLocation] = useState('Koramangala');
  const [destination, setDestination] = useState('Electronic City');
  const [departureTime, setDepartureTime] = useState(new Date(Date.now() + 60 * 60 * 1000).toISOString());
  const [seats, setSeats] = useState('1');
  const [rides, setRides] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!pickupLocation || !destination || !departureTime) {
      Alert.alert('Missing search details', 'Pickup, destination and departure time are required.');
      return;
    }
    setLoading(true);
    try {
      const result = await rideApi.search({
        pickupLocation: pickupLocation.trim(),
        destination: destination.trim(),
        departureTime: new Date(departureTime).toISOString(),
        seats: Number(seats || 1),
      });
      setRides(result);
      setSearched(true);
    } catch (error) {
      Alert.alert('Search failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function book(ride) {
    try {
      const trip = await bookingApi.book({ rideId: ride.id, bookedSeats: Number(seats || 1) });
      Alert.alert('Trip requested', `Status: ${trip.status}. The driver can accept your request from Driver Trips.`);
      setRides((current) => current.map((item) => item.id === ride.id ? { ...item, availableSeats: item.availableSeats - Number(seats || 1) } : item));
    } catch (error) {
      Alert.alert('Booking failed', getErrorMessage(error));
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.row}>
        <Field label="Pickup" value={pickupLocation} onChangeText={setPickupLocation} style={styles.flex} />
        <Field label="Seats" value={seats} onChangeText={setSeats} keyboardType="number-pad" style={styles.seats} />
      </View>
      <Field label="Destination" value={destination} onChangeText={setDestination} />
      <Field label="Departure time ISO" value={departureTime} onChangeText={setDepartureTime} />
      <Button title="Search rides" onPress={search} loading={loading} />
      <Text style={styles.hint}>Use ISO time format. Example: {new Date(Date.now() + 7200000).toISOString()}</Text>
      {rides.map((ride) => (
        <RideCard key={ride.id} ride={ride} actionTitle="Book" onAction={() => book(ride)} />
      ))}
      {searched && rides.length === 0 ? (
        <EmptyState title="No rides found" body="Try a later time, fewer seats, or broader location text." />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 90,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  seats: {
    width: 92,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
