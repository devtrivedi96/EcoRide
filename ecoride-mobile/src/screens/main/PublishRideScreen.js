import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { rideApi } from '../../api/rideApi';
import Button from '../../components/Button';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import { colors } from '../../utils/theme';
import { getErrorMessage } from '../../utils/format';

export default function PublishRideScreen({ navigation }) {
  const [form, setForm] = useState({
    vehicleId: '',
    pickupLocation: '',
    destination: '',
    departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    availableSeats: '1',
    farePerSeat: '',
    routeWaypoints: '',
  });
  const [loading, setLoading] = useState(false);

  function setValue(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    const required = ['vehicleId', 'pickupLocation', 'destination', 'departureTime', 'availableSeats', 'farePerSeat'];
    if (required.some((key) => !form[key])) {
      Alert.alert('Missing details', 'Vehicle, route, time, seats and fare are required.');
      return;
    }
    setLoading(true);
    try {
      await rideApi.publish({
        vehicleId: form.vehicleId.trim(),
        pickupLocation: form.pickupLocation.trim(),
        destination: form.destination.trim(),
        departureTime: new Date(form.departureTime).toISOString(),
        availableSeats: Number(form.availableSeats),
        farePerSeat: Number(form.farePerSeat),
        routeWaypoints: form.routeWaypoints.trim() || undefined,
      });
      Alert.alert('Ride published', 'Your ride is now searchable.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not publish ride', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Publishing requires a vehicle document owned by you. Admins can inspect vehicle IDs from the Admin tab.</Text>
      </View>
      <Field label="Vehicle ID" value={form.vehicleId} onChangeText={(v) => setValue('vehicleId', v)} />
      <Field label="Pickup location" value={form.pickupLocation} onChangeText={(v) => setValue('pickupLocation', v)} />
      <Field label="Destination" value={form.destination} onChangeText={(v) => setValue('destination', v)} />
      <Field label="Departure time ISO" value={form.departureTime} onChangeText={(v) => setValue('departureTime', v)} />
      <View style={styles.row}>
        <Field label="Seats" value={form.availableSeats} onChangeText={(v) => setValue('availableSeats', v)} keyboardType="number-pad" style={styles.flex} />
        <Field label="Fare per seat" value={form.farePerSeat} onChangeText={(v) => setValue('farePerSeat', v)} keyboardType="decimal-pad" style={styles.flex} />
      </View>
      <Field label="Waypoints" value={form.routeWaypoints} onChangeText={(v) => setValue('routeWaypoints', v)} placeholder="Optional comma-separated stops" />
      <Button title="Publish ride" onPress={submit} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panelSoft,
    padding: 12,
  },
  bannerText: {
    color: colors.muted,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
});
