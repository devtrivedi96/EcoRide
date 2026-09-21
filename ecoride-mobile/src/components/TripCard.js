import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Badge from './Badge';
import Button from './Button';
import Card from './Card';
import { colors, spacing } from '../utils/theme';
import { currency, formatDateTime } from '../utils/format';

export default function TripCard({ trip, actions = [], onPress }) {
  const ride = trip.ride || {};

  const getStatusVariant = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return { variant: 'green', label: 'Accepted · Ready', icon: 'checkmark-circle-outline' };
      case 'STARTED':
        return { variant: 'blue', label: 'In Transit · Live', icon: 'navigate-outline' };
      case 'PENDING':
        return { variant: 'amber', label: 'Pending Approval', icon: 'hourglass-outline' };
      case 'COMPLETED':
        return { variant: 'green', label: 'Completed', icon: 'checkmark-done-outline' };
      case 'PAID':
        return { variant: 'purple', label: 'Paid', icon: 'wallet-outline' };
      case 'CANCELLED':
      case 'REJECTED':
        return { variant: 'red', label: status, icon: 'close-circle-outline' };
      default:
        return { variant: 'neutral', label: status || 'Unknown', icon: 'information-circle-outline' };
    }
  };

  const statusInfo = getStatusVariant(trip.status);

  const partyName = trip.passenger
    ? `${trip.passenger.firstName || ''} ${trip.passenger.lastName || ''}`.trim()
    : ride.driver
    ? `${ride.driver.firstName || ''} ${ride.driver.lastName || ''}`.trim()
    : null;

  const partyRole = trip.passenger ? 'Passenger' : 'Driver';

  return (
    <Card style={styles.card} onPress={onPress}>
      {/* Header: Status badge & Total Fare */}
      <View style={styles.header}>
        <Badge
          label={statusInfo.label}
          variant={statusInfo.variant}
          icon={statusInfo.icon}
          size="sm"
        />
        <View style={styles.fareContainer}>
          <Text style={styles.fareLabel}>Total Fare</Text>
          <Text style={styles.fare}>{currency(trip.totalFare)}</Text>
        </View>
      </View>

      {/* Route Timeline */}
      <View style={styles.routeContainer}>
        <View style={styles.routeVisual}>
          <View style={[styles.dot, styles.pickupDot]} />
          <View style={styles.routeDashedLine} />
          <View style={[styles.dot, styles.dropDot]} />
        </View>

        <View style={styles.locationsColumn}>
          <View style={styles.locationItem}>
            <Text style={styles.locationTitle} numberOfLines={1}>
              {ride.pickupLocation || 'Pickup location'}
            </Text>
          </View>
          <View style={[styles.locationItem, { marginTop: 8 }]}>
            <Text style={styles.locationTitle} numberOfLines={1}>
              {ride.destination || 'Destination'}
            </Text>
          </View>
        </View>
      </View>

      {/* Meta Specs */}
      <View style={styles.specsRow}>
        <View style={styles.specItem}>
          <Ionicons name="calendar-outline" size={13} color={colors.muted} />
          <Text style={styles.specText}>{formatDateTime(ride.departureTime)}</Text>
        </View>
        <View style={styles.specItem}>
          <Ionicons name="people-outline" size={13} color={colors.muted} />
          <Text style={styles.specText}>{trip.bookedSeats} seat(s)</Text>
        </View>
      </View>

      {/* Driver/Passenger or OTP notice */}
      <View style={styles.infoRow}>
        {partyName ? (
          <View style={styles.partyWrap}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarTextMini}>{partyName[0] || 'U'}</Text>
            </View>
            <Text style={styles.partyText} numberOfLines={1}>
              <Text style={{ color: colors.muted }}>{partyRole}: </Text>
              {partyName}
            </Text>
          </View>
        ) : null}

        {trip.startOtp ? (
          <View style={styles.otpPill}>
            <Ionicons name="key-outline" size={12} color={colors.amberText} />
            <Text style={styles.otpText}>OTP: {trip.startOtp}</Text>
          </View>
        ) : null}
      </View>

      {/* Action Buttons */}
      {actions.length ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <Button
              key={action.title}
              title={action.title}
              variant={action.variant || 'primary'}
              size="sm"
              icon={action.icon}
              onPress={action.onPress}
              style={styles.actionBtn}
            />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareContainer: {
    alignItems: 'flex-end',
  },
  fareLabel: {
    color: colors.muted,
    fontSize: 11,
  },
  fare: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
  routeVisual: {
    alignItems: 'center',
    width: 18,
    marginRight: 10,
    paddingTop: 3,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  pickupDot: {
    backgroundColor: colors.green,
  },
  dropDot: {
    backgroundColor: colors.amber,
  },
  routeDashedLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.lineDark,
    marginVertical: 2,
  },
  locationsColumn: {
    flex: 1,
  },
  locationItem: {
    justifyContent: 'center',
  },
  locationTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.panelSoft,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: spacing.radiusSm,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  specText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  partyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  avatarMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextMini: {
    color: colors.green,
    fontWeight: '700',
    fontSize: 10,
  },
  partyText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  otpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.amberLight,
    borderColor: colors.amberBorder,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: spacing.radiusSm,
  },
  otpText: {
    color: colors.amberText,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  actionBtn: {
    flexGrow: 1,
    minWidth: 100,
  },
});
