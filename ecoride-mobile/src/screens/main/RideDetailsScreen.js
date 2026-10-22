import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookingApi } from '../../api/bookingApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Screen from '../../components/Screen';
import MiniRouteMap from '../../components/MiniRouteMap';
import { colors, spacing } from '../../utils/theme';
import { currency, formatDateTime, getErrorMessage } from '../../utils/format';
import {
  useRideTicker,
  isRideExpired,
  getRideTimeRemaining,
  getRideStatus,
} from '../../utils/rideLifecycle';

export default function RideDetailsScreen({ route, navigation }) {
  const { user } = useAuth();
  const { notifyRideBooked } = useNotification();
  const { ride, searchSeats = 1 } = route.params || {};

  // Real-time ticker to re-evaluate ride departure and expiration every 10 seconds
  const now = useRideTicker(10000);
  const expired = isRideExpired(ride, now);
  const timeRemaining = getRideTimeRemaining(ride?.departureTime, now);
  const rideStatus = getRideStatus(ride, now);

  const isMyRide = Boolean(
    user &&
      ((ride?.driverId && user.id === ride.driverId) ||
        (ride?.driver?.id && user.id === ride.driver.id) ||
        (ride?.driver?.email &&
          user.email &&
          user.email.trim().toLowerCase() === ride.driver.email.trim().toLowerCase()))
  );

  const [selectedSeats, setSelectedSeats] = useState(
    Math.min(Number(searchSeats) || 1, ride?.availableSeats || 1)
  );
  const [loading, setLoading] = useState(false);

  if (!ride) {
    return (
      <Screen>
        <Card style={{ alignItems: 'center', padding: 30 }}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.muted} />
          <Text style={{ fontSize: 16, fontWeight: '700', marginTop: 12, color: colors.text }}>
            Ride details not found
          </Text>
          <Button
            title="Back to Search"
            variant="ghost"
            style={{ marginTop: 16 }}
            onPress={() => navigation.goBack()}
          />
        </Card>
      </Screen>
    );
  }

  const driverName = ride.driver
    ? `${ride.driver.firstName || ''} ${ride.driver.lastName || ''}`.trim()
    : 'EcoRide Corporate Driver';
  const driverCompany = ride.driver?.companyName || 'Verified Corporate Partner';
  const driverRating = ride.driverRating || ride.rating || '4.9';
  const matchScore = ride.matchScore || '98% Route Match';

  const farePerSeat = Number(ride.farePerSeat || 0);
  const totalFare = farePerSeat * selectedSeats;
  const co2SavedKg = (1.4 * (selectedSeats || 1) * 3.2).toFixed(1);

  async function handleBookRide() {
    if (expired) {
      Alert.alert(
        'Ride Departed / Expired',
        'This carpool has already departed its scheduled time. Bookings are closed.'
      );
      return;
    }
    if (isMyRide) {
      Alert.alert('Notice', 'You are the driver of this ride. You cannot book your own ride, but you can manage it from Driver Trips.');
      return;
    }
    if (selectedSeats > (ride.availableSeats || 1)) {
      Alert.alert('Seats Unavailable', 'Please reduce the number of requested seats.');
      return;
    }

    setLoading(true);
    try {
      const trip = await bookingApi.book({
        rideId: ride.id,
        bookedSeats: Number(selectedSeats),
      });

      // Broadcast real-time booking alert to driver's device
      notifyRideBooked({
        driverId: ride.driverId,
        driverEmail: ride.driver?.email,
        passengerName: user
          ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
          : 'Passenger Colleague',
        pickup: ride.pickupLocation,
        destination: ride.destination,
        seats: Number(selectedSeats),
        fare: totalFare,
        tripId: trip?.id,
        rideId: ride.id,
      });

      // Navigate to Booking Confirmation Screen
      navigation.navigate('BookingSuccess', {
        trip,
        ride,
        bookedSeats: selectedSeats,
      });
    } catch (error) {
      Alert.alert('Unable to book ride', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      {/* ── Top Match & Status Banner ── */}
      <View style={styles.topRow}>
        <Badge
          label={timeRemaining.label}
          variant={timeRemaining.badgeVariant}
          icon={timeRemaining.icon}
        />
        <Badge label={matchScore} variant="green" icon="sparkles-outline" />
        <Badge label="Direct Route" variant="blue" icon="navigate-outline" />
        <Badge label="Carbon Offset" variant="purple" icon="leaf-outline" />
      </View>

      {/* ── Expired / Departed Alert Banner ── */}
      {expired ? (
        <View style={styles.expiredNoticeBox}>
          <Ionicons name="alert-circle" size={24} color={colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.expiredNoticeTitle}>Carpool Departed / Expired</Text>
            <Text style={styles.expiredNoticeSub}>
              The departure time ({formatDateTime(ride.departureTime)}) has passed. Bookings and reservations are now closed.
            </Text>
          </View>
        </View>
      ) : null}

      {/* ── Route Timeline Card ── */}
      <Card style={styles.routeCard}>
        <Text style={styles.sectionHeading}>Trip Route & Wayout Points</Text>

        <View style={styles.timelineRow}>
          <View style={styles.timelineVisual}>
            <View style={[styles.dot, styles.pickupDot]} />
            <View style={styles.timelineLine} />
            <View style={[styles.dot, styles.dropDot]} />
          </View>

          <View style={styles.timelineDetails}>
            <View>
              <Text style={styles.locationTitle}>{ride.pickupLocation}</Text>
              <Text style={styles.locationSub}>Pickup Point</Text>
            </View>

            {ride.routeWaypoints ? (
              <View style={{ marginVertical: 8, gap: 4 }}>
                {ride.routeWaypoints
                  .split(',')
                  .map((w) => w.trim())
                  .filter(Boolean)
                  .map((stop, i) => (
                    <View key={`wp-${i}`} style={styles.waypointBox}>
                      <Ionicons name="git-commit-outline" size={14} color={colors.blue} />
                      <Text style={styles.waypointText}>
                        Wayout Point {i + 1}: {stop}
                      </Text>
                    </View>
                  ))}
              </View>
            ) : null}

            <View style={{ marginTop: 6 }}>
              <Text style={styles.locationTitle}>{ride.destination}</Text>
              <Text style={styles.locationSub}>Drop-off Location</Text>
            </View>
          </View>
        </View>

        <View style={styles.scheduleRow}>
          <View style={styles.schedulePill}>
            <Ionicons name="calendar-outline" size={15} color={colors.green} />
            <Text style={styles.scheduleText}>{formatDateTime(ride.departureTime)}</Text>
          </View>
          <TouchableOpacity
            style={styles.viewRouteMapBtn}
            onPress={() =>
              navigation.navigate('Map', {
                pickup: ride.pickupLocation,
                destination: ride.destination,
              })
            }
          >
            <Ionicons name="map-outline" size={14} color={colors.blue} />
            <Text style={styles.viewRouteMapBtnText}>Live Route Map</Text>
          </TouchableOpacity>
        </View>

        {/* Embedded Mini Route Map */}
        <MiniRouteMap
          pickup={ride.pickupLocation}
          destination={ride.destination}
          waypoints={ride.routeWaypoints}
          height={160}
          navigation={navigation}
          style={{ marginTop: 12 }}
        />
      </Card>

      {/* ── Driver Profile Card ── */}
      <Card>
        <Text style={styles.sectionHeading}>Driver Profile</Text>
        <View style={styles.driverRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {driverName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.driverName}>{driverName}</Text>
              <Ionicons name="shield-checkmark" size={16} color={colors.green} />
            </View>
            <Text style={styles.driverCompany}>{driverCompany}</Text>
            <View style={styles.driverMetaRow}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#EAB308" />
                <Text style={styles.ratingText}>{driverRating}</Text>
              </View>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.ridesCount}>50+ shared rides</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* ── Vehicle Specs ── */}
      <Card>
        <Text style={styles.sectionHeading}>Vehicle Information</Text>
        <View style={styles.vehicleGrid}>
          <View style={styles.vehicleItem}>
            <Text style={styles.vehicleLabel}>Model</Text>
            <Text style={styles.vehicleVal}>
              {ride.vehicle?.model || 'Tata Nexon EV'}
            </Text>
          </View>
          <View style={styles.vehicleItem}>
            <Text style={styles.vehicleLabel}>Registration</Text>
            <Text style={styles.vehicleVal}>
              {ride.vehicle?.registrationNumber || 'KA 01 AB 1234'}
            </Text>
          </View>
          <View style={styles.vehicleItem}>
            <Text style={styles.vehicleLabel}>Vehicle Type</Text>
            <Text style={styles.vehicleVal}>
              {ride.vehicle?.vehicleType || 'ELECTRIC'}
            </Text>
          </View>
          <View style={styles.vehicleItem}>
            <Text style={styles.vehicleLabel}>Available</Text>
            <Text style={styles.vehicleVal}>
              {ride.availableSeats ?? 0} seats left
            </Text>
          </View>
        </View>
      </Card>

      {/* ── Ride Preferences & Eco Impact ── */}
      <Card>
        <Text style={styles.sectionHeading}>Preferences & Impact</Text>
        <View style={styles.prefWrap}>
          <View style={styles.prefChip}>
            <Ionicons name="snow-outline" size={14} color={colors.green} />
            <Text style={styles.prefText}>Air Conditioned</Text>
          </View>
          <View style={styles.prefChip}>
            <Ionicons name="musical-notes-outline" size={14} color={colors.green} />
            <Text style={styles.prefText}>Pleasant Music</Text>
          </View>
          <View style={styles.prefChip}>
            <Ionicons name="volume-mute-outline" size={14} color={colors.green} />
            <Text style={styles.prefText}>Quiet Ride Friendly</Text>
          </View>
          <View style={styles.prefChip}>
            <Ionicons name="briefcase-outline" size={14} color={colors.green} />
            <Text style={styles.prefText}>Laptop Bag Space</Text>
          </View>
        </View>

        <View style={styles.ecoBanner}>
          <Ionicons name="leaf" size={20} color={colors.green} />
          <View style={{ flex: 1 }}>
            <Text style={styles.ecoTitle}>Eco Impact for this ride</Text>
            <Text style={styles.ecoSub}>
              Saves approx {co2SavedKg} kg CO₂ vs solo commute.
            </Text>
          </View>
        </View>
      </Card>

      {/* ── Seat Selection & Pricing ── */}
      <Card style={[styles.bookingCard, expired && styles.bookingCardExpired]}>
        <View style={styles.seatSelectorRow}>
          <View>
            <Text style={styles.seatSelectorTitle}>Reserve Seats</Text>
            <Text style={styles.seatSelectorSub}>
              {expired ? 'Booking closed (Ride expired)' : `${ride.availableSeats ?? 0} seats remaining`}
            </Text>
          </View>

          <View style={styles.stepper}>
            <TouchableOpacity
              onPress={() => setSelectedSeats((s) => Math.max(1, s - 1))}
              disabled={expired || selectedSeats <= 1}
              style={[styles.stepperBtn, (expired || selectedSeats <= 1) && styles.stepperBtnDisabled]}
            >
              <Ionicons name="remove" size={18} color={(expired || selectedSeats <= 1) ? colors.subtle : colors.text} />
            </TouchableOpacity>

            <Text style={styles.stepperCount}>{selectedSeats}</Text>

            <TouchableOpacity
              onPress={() =>
                setSelectedSeats((s) => Math.min(ride.availableSeats || 4, s + 1))
              }
              disabled={expired || selectedSeats >= (ride.availableSeats || 1)}
              style={[
                styles.stepperBtn,
                (expired || selectedSeats >= (ride.availableSeats || 1)) && styles.stepperBtnDisabled,
              ]}
            >
              <Ionicons
                name="add"
                size={18}
                color={
                  (expired || selectedSeats >= (ride.availableSeats || 1))
                    ? colors.subtle
                    : colors.text
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.priceSummaryRow}>
          <View>
            <Text style={styles.fareCalc}>
              {currency(farePerSeat)} × {selectedSeats} seat(s)
            </Text>
            <Text style={styles.totalFareText}>Total Contribution</Text>
          </View>
          <Text style={[styles.totalFareAmount, expired && { color: colors.muted }]}>
            {currency(totalFare)}
          </Text>
        </View>

        {isMyRide ? (
          <Button
            title="Manage in Driver Trips"
            icon="people-outline"
            size="lg"
            onPress={() => navigation.navigate('DriverTrips')}
          />
        ) : expired ? (
          <Button
            title="Ride Departed • Bookings Closed"
            icon="time-outline"
            variant="outline"
            disabled
            size="lg"
          />
        ) : (
          <Button
            title={`Confirm Booking (${currency(totalFare)})`}
            icon="ticket-outline"
            loading={loading}
            size="lg"
            onPress={handleBookRide}
          />
        )}
      </Card>

      {/* ── Secondary Actions ── */}
      <View style={styles.bottomNav}>
        <Button
          title="Back to Results"
          variant="ghost"
          icon="arrow-back"
          style={{ flex: 1 }}
          onPress={() => navigation.goBack()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  routeCard: {
    padding: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineVisual: {
    alignItems: 'center',
    width: 20,
    marginRight: 12,
    paddingTop: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pickupDot: {
    backgroundColor: colors.green,
  },
  dropDot: {
    backgroundColor: colors.amber,
  },
  timelineLine: {
    width: 2,
    height: 38,
    backgroundColor: colors.lineDark,
    marginVertical: 4,
  },
  timelineDetails: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  locationSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  waypointBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 8,
    backgroundColor: colors.panelSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  waypointText: {
    fontSize: 12,
    color: colors.muted,
  },
  scheduleRow: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  schedulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.greenLight,
    borderWidth: 2,
    borderColor: colors.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.green,
    fontWeight: '900',
    fontSize: 18,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  driverCompany: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  driverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.panelSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  metaDot: {
    color: colors.muted,
  },
  ridesCount: {
    fontSize: 12,
    color: colors.muted,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vehicleItem: {
    width: '47%',
    backgroundColor: colors.panelSoft,
    padding: 10,
    borderRadius: spacing.radiusSm,
  },
  vehicleLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  vehicleVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 3,
  },
  prefWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prefChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.greenLight,
    borderColor: colors.greenBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: spacing.radiusFull,
  },
  prefText: {
    color: colors.greenText,
    fontSize: 12,
    fontWeight: '600',
  },
  ecoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
    borderRadius: spacing.radiusSm,
    marginTop: 12,
  },
  ecoTitle: {
    fontWeight: '700',
    color: '#166534',
    fontSize: 13,
  },
  ecoSub: {
    color: '#15803D',
    fontSize: 11,
    marginTop: 2,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.greenBorder,
    gap: 16,
  },
  bookingCardExpired: {
    borderColor: colors.lineDark,
    backgroundColor: '#F9FAFB',
  },
  expiredNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1.5,
    padding: 12,
    borderRadius: spacing.radiusSm,
  },
  expiredNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B91C1C',
  },
  expiredNoticeSub: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 2,
    lineHeight: 16,
  },
  seatSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seatSelectorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  seatSelectorSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panelSoft,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.35,
  },
  stepperCount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    minWidth: 28,
    textAlign: 'center',
  },
  priceSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  fareCalc: {
    fontSize: 12,
    color: colors.muted,
  },
  totalFareText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  totalFareAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.green,
  },
  bottomNav: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  viewRouteMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.blueLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    borderColor: colors.blueBorder,
  },
  viewRouteMapBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.blue,
  },
});
