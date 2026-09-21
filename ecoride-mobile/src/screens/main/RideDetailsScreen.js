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
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Screen from '../../components/Screen';
import { colors, spacing } from '../../utils/theme';
import { currency, formatDateTime, getErrorMessage } from '../../utils/format';

export default function RideDetailsScreen({ route, navigation }) {
  const { ride, searchSeats = 1 } = route.params || {};

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
        <Badge label={matchScore} variant="green" icon="sparkles-outline" />
        <Badge label="Direct Route" variant="blue" icon="navigate-outline" />
        <Badge label="Carbon Offset" variant="purple" icon="leaf-outline" />
      </View>

      {/* ── Route Timeline Card ── */}
      <Card style={styles.routeCard}>
        <Text style={styles.sectionHeading}>Trip Route</Text>

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
              <View style={styles.waypointBox}>
                <Ionicons name="git-commit-outline" size={14} color={colors.muted} />
                <Text style={styles.waypointText}>Via {ride.routeWaypoints}</Text>
              </View>
            ) : null}

            <View style={{ marginTop: 14 }}>
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
        </View>
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
      <Card style={styles.bookingCard}>
        <View style={styles.seatSelectorRow}>
          <View>
            <Text style={styles.seatSelectorTitle}>Reserve Seats</Text>
            <Text style={styles.seatSelectorSub}>
              {ride.availableSeats ?? 0} seats remaining
            </Text>
          </View>

          <View style={styles.stepper}>
            <TouchableOpacity
              onPress={() => setSelectedSeats((s) => Math.max(1, s - 1))}
              disabled={selectedSeats <= 1}
              style={[styles.stepperBtn, selectedSeats <= 1 && styles.stepperBtnDisabled]}
            >
              <Ionicons name="remove" size={18} color={selectedSeats <= 1 ? colors.subtle : colors.text} />
            </TouchableOpacity>

            <Text style={styles.stepperCount}>{selectedSeats}</Text>

            <TouchableOpacity
              onPress={() =>
                setSelectedSeats((s) => Math.min(ride.availableSeats || 4, s + 1))
              }
              disabled={selectedSeats >= (ride.availableSeats || 1)}
              style={[
                styles.stepperBtn,
                selectedSeats >= (ride.availableSeats || 1) && styles.stepperBtnDisabled,
              ]}
            >
              <Ionicons
                name="add"
                size={18}
                color={
                  selectedSeats >= (ride.availableSeats || 1)
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
          <Text style={styles.totalFareAmount}>{currency(totalFare)}</Text>
        </View>

        <Button
          title={`Confirm Booking (${currency(totalFare)})`}
          icon="ticket-outline"
          loading={loading}
          size="lg"
          onPress={handleBookRide}
        />
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
});
