import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import Card from './Card';
import { colors } from '../utils/theme';
import { currency, formatDateTime } from '../utils/format';

export default function TripCard({ trip, actions = [] }) {
  const ride = trip.ride || {};
  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.status}>{trip.status}</Text>
        <Text style={styles.fare}>{currency(trip.totalFare)}</Text>
      </View>
      <Text style={styles.route}>{ride.pickupLocation || 'Pickup'} to {ride.destination || 'Destination'}</Text>
      <Text style={styles.meta}>{formatDateTime(ride.departureTime)} · {trip.bookedSeats} seat(s)</Text>
      {ride.driver ? <Text style={styles.meta}>Driver: {ride.driver.firstName} {ride.driver.lastName}</Text> : null}
      {trip.passenger ? <Text style={styles.meta}>Passenger: {trip.passenger.firstName} {trip.passenger.lastName}</Text> : null}
      {trip.startOtp ? <Text style={styles.otp}>Start OTP: {trip.startOtp}</Text> : null}
      {actions.length ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <Button key={action.title} title={action.title} variant={action.variant} onPress={action.onPress} style={styles.action} />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  status: {
    color: colors.amber,
    fontWeight: '900',
  },
  fare: {
    color: colors.green,
    fontWeight: '900',
  },
  route: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  meta: {
    color: colors.muted,
  },
  otp: {
    color: colors.text,
    fontWeight: '900',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 10,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  action: {
    flexGrow: 1,
    minWidth: 120,
  },
});
