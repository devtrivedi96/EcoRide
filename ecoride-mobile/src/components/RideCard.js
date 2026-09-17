import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import Card from './Card';
import { colors } from '../utils/theme';
import { currency, formatDateTime } from '../utils/format';

export default function RideCard({ ride, actionTitle, onAction, secondaryTitle, onSecondary }) {
  return (
    <Card>
      <View style={styles.top}>
        <View style={styles.route}>
          <Text style={styles.location}>{ride.pickupLocation}</Text>
          <Text style={styles.arrow}>to</Text>
          <Text style={styles.location}>{ride.destination}</Text>
        </View>
        <Text style={styles.price}>{currency(ride.farePerSeat)}</Text>
      </View>
      <Text style={styles.meta}>{formatDateTime(ride.departureTime)}</Text>
      <Text style={styles.meta}>
        {ride.availableSeats ?? 0} seats left
        {ride.vehicle?.model ? ` · ${ride.vehicle.model}` : ''}
      </Text>
      {ride.driver ? (
        <Text style={styles.driver}>
          {ride.driver.firstName} {ride.driver.lastName}
          {ride.driver.companyName ? ` · ${ride.driver.companyName}` : ''}
        </Text>
      ) : null}
      {ride.routeWaypoints ? <Text style={styles.meta}>Via {ride.routeWaypoints}</Text> : null}
      {(actionTitle || secondaryTitle) ? (
        <View style={styles.actions}>
          {secondaryTitle ? <Button title={secondaryTitle} variant="ghost" onPress={onSecondary} style={styles.action} /> : null}
          {actionTitle ? <Button title={actionTitle} onPress={onAction} style={styles.action} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  route: {
    flex: 1,
    gap: 2,
  },
  location: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  arrow: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  price: {
    color: colors.green,
    fontSize: 18,
    fontWeight: '900',
  },
  meta: {
    color: colors.muted,
    lineHeight: 20,
  },
  driver: {
    color: colors.text,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  action: {
    flex: 1,
  },
});
