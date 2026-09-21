import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import Card from './Card';
import Badge from './Badge';
import { colors, spacing } from '../utils/theme';
import { currency, formatDateTime } from '../utils/format';

export default function RideCard({
  ride,
  onPress,
  actionTitle = 'View Ride',
  onAction,
  secondaryTitle,
  onSecondary,
  matchScore,
}) {
  const driverName = ride.driver
    ? `${ride.driver.firstName || ''} ${ride.driver.lastName || ''}`.trim()
    : 'EcoRide Verified Driver';

  const driverInitials = ride.driver
    ? `${ride.driver.firstName?.[0] || ''}${ride.driver.lastName?.[0] || ''}`.toUpperCase() || 'ER'
    : 'ED';

  const driverRating = ride.driverRating || ride.rating || '4.9';
  const score = matchScore || ride.matchScore || '96% Match';
  const isElectric = ride.vehicle?.vehicleType === 'ELECTRIC' || ride.vehicle?.model?.toLowerCase?.().includes('ev');

  return (
    <Card style={styles.card} onPress={onPress}>
      {/* Top row: AI match score + Price */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <Badge label={score} variant="green" icon="sparkles-outline" size="sm" />
          {isElectric ? (
            <Badge label="Electric" variant="blue" icon="flash-outline" size="sm" />
          ) : null}
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{currency(ride.farePerSeat)}</Text>
          <Text style={styles.priceSub}>/ seat</Text>
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
            <Text style={styles.locationTitle} numberOfLines={1}>{ride.pickupLocation}</Text>
            <Text style={styles.locationSub}>Pickup Point</Text>
          </View>

          <View style={[styles.locationItem, { marginTop: 10 }]}>
            <Text style={styles.locationTitle} numberOfLines={1}>{ride.destination}</Text>
            <Text style={styles.locationSub}>Destination</Text>
          </View>
        </View>
      </View>

      {/* Ride Specs / Time */}
      <View style={styles.specsRow}>
        <View style={styles.specItem}>
          <Ionicons name="time-outline" size={14} color={colors.muted} />
          <Text style={styles.specText}>{formatDateTime(ride.departureTime)}</Text>
        </View>

        <View style={styles.specItem}>
          <Ionicons name="people-outline" size={14} color={colors.muted} />
          <Text style={styles.specText}>
            <Text style={styles.boldText}>{ride.availableSeats ?? 0}</Text> seats left
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Driver and Actions */}
      <View style={styles.footerRow}>
        <View style={styles.driverInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{driverInitials}</Text>
          </View>
          <View style={styles.driverMeta}>
            <View style={styles.driverNameRow}>
              <Text style={styles.driverName} numberOfLines={1}>{driverName}</Text>
              <Ionicons name="checkmark-circle" size={13} color={colors.green} />
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={11} color="#EAB308" />
              <Text style={styles.ratingText}>{driverRating}</Text>
              {ride.vehicle?.model ? (
                <Text style={styles.vehicleModel} numberOfLines={1}>
                  · {ride.vehicle.model}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {secondaryTitle ? (
            <Button
              title={secondaryTitle}
              variant="ghost"
              size="sm"
              onPress={onSecondary}
            />
          ) : null}
          {actionTitle ? (
            <Button
              title={actionTitle}
              icon="chevron-forward"
              iconPosition="right"
              size="sm"
              onPress={onAction || onPress}
            />
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  priceSub: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
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
    paddingTop: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pickupDot: {
    backgroundColor: colors.green,
  },
  dropDot: {
    backgroundColor: colors.amber,
  },
  routeDashedLine: {
    width: 2,
    height: 22,
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
  locationSub: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 1,
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
  boldText: {
    fontWeight: '700',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.greenLight,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.green,
    fontWeight: '700',
    fontSize: 12,
  },
  driverMeta: {
    flex: 1,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  driverName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  ratingText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  vehicleModel: {
    color: colors.muted,
    fontSize: 11,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
});
