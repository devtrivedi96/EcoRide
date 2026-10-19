import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Screen from '../../components/Screen';
import MiniRouteMap from '../../components/MiniRouteMap';
import { colors, spacing } from '../../utils/theme';
import { currency, formatDateTime } from '../../utils/format';

export default function BookingSuccessScreen({ route, navigation }) {
  const { trip, ride, bookedSeats = 1 } = route.params || {};

  const pickup = ride?.pickupLocation || trip?.ride?.pickupLocation || 'Pickup location';
  const destination = ride?.destination || trip?.ride?.destination || 'Destination';
  const rawWaypoints = ride?.routeWaypoints || trip?.ride?.routeWaypoints || '';
  const waypointsList = rawWaypoints
    ? rawWaypoints.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const departureTime = ride?.departureTime || trip?.ride?.departureTime;
  const totalFare = trip?.totalFare || ((ride?.farePerSeat || 0) * bookedSeats);

  return (
    <Screen contentStyle={styles.content}>
      {/* ── Success Graphic & Header ── */}
      <View style={styles.heroWrap}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark-sharp" size={42} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Ride Booked Successfully</Text>
        <Text style={styles.subtitle}>
          Your request has been submitted. The corporate driver has been notified.
        </Text>
      </View>

      {/* ── Trip Summary Card ── */}
      <Card style={styles.summaryCard}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>REQUEST CONFIRMED</Text>
        </View>

        {/* Route Details with Written Wayout Points */}
        <View style={styles.routeContainer}>
          <View style={styles.routeVisual}>
            <View style={[styles.dot, styles.pickupDot]} />
            <View style={styles.timelineLine} />
            {waypointsList.map((_, i) => (
              <React.Fragment key={`dot-${i}`}>
                <View style={[styles.dot, styles.waypointDot]} />
                <View style={styles.timelineLine} />
              </React.Fragment>
            ))}
            <View style={[styles.dot, styles.dropDot]} />
          </View>

          <View style={styles.locationDetails}>
            <View>
              <Text style={styles.locationTitle}>{pickup}</Text>
              <Text style={styles.locationSub}>Pickup Point</Text>
            </View>

            {/* Written Wayout Points */}
            {waypointsList.map((wp, idx) => (
              <View key={`wp-${idx}`} style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={styles.waypointLabel}>WAYOUT POINT {idx + 1}</Text>
                </View>
                <Text style={styles.locationTitle}>{wp}</Text>
                <Text style={styles.locationSub}>Corridor Stop {idx + 1}</Text>
              </View>
            ))}

            <View style={{ marginTop: 12 }}>
              <Text style={styles.locationTitle}>{destination}</Text>
              <Text style={styles.locationSub}>Destination Point</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Schedule & Seats */}
        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Departure</Text>
            <Text style={styles.metaVal}>{formatDateTime(departureTime)}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Reserved Seats</Text>
            <Text style={styles.metaVal}>{bookedSeats} seat(s)</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Estimated Fare</Text>
            <Text style={styles.metaValHighlight}>{currency(totalFare)}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Payment Status</Text>
            <Text style={styles.metaVal}>Pay via Wallet after trip</Text>
          </View>
        </View>

        {/* Mini Route Map on Booked Ride Card (Req: little map in down) */}
        <View style={{ marginTop: 14 }}>
          <View style={styles.mapTitleRow}>
            <Text style={styles.mapTitleText}>Booked Route Map</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Map', {
                  pickup,
                  destination,
                })
              }
            >
              <Text style={styles.mapExpandLink}>Live GPS ↗</Text>
            </TouchableOpacity>
          </View>
          <MiniRouteMap
            pickup={pickup}
            destination={destination}
            waypoints={rawWaypoints}
            height={175}
            navigation={navigation}
            style={{ marginTop: 6 }}
          />
        </View>
      </Card>

      {/* ── What happens next tips ── */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={colors.green} />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoBody}>
            When the driver accepts your booking, you can track their live location in the Live Map and chat anytime from My Rides.
          </Text>
        </View>
      </View>

      {/* ── Action Buttons ── */}
      <View style={styles.actions}>
        <Button
          title="Track Live Route on Map"
          icon="navigate-outline"
          variant="outline"
          size="lg"
          onPress={() => {
            navigation.navigate('Map', { pickup, destination });
          }}
        />
        <Button
          title="View My Ride"
          icon="ticket-outline"
          size="lg"
          onPress={() => {
            navigation.navigate('MainTabs', { screen: 'Trips' });
          }}
        />
        <Button
          title="Back to Dashboard"
          variant="ghost"
          icon="home-outline"
          size="lg"
          onPress={() => {
            navigation.navigate('MainTabs', { screen: 'Home' });
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 32,
    justifyContent: 'center',
    gap: 16,
  },
  heroWrap: {
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
    marginBottom: 8,
  },
  checkCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  summaryCard: {
    padding: 18,
    gap: 14,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.greenLight,
    borderColor: colors.greenBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.radiusSm,
  },
  statusBadgeText: {
    color: colors.greenText,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  routeVisual: {
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
  waypointDot: {
    backgroundColor: colors.blue,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  dropDot: {
    backgroundColor: colors.amber,
  },
  timelineLine: {
    width: 2,
    height: 36,
    backgroundColor: colors.lineDark,
    marginVertical: 4,
  },
  waypointLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.blue,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  mapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mapExpandLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.green,
  },
  locationDetails: {
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
  divider: {
    height: 1,
    backgroundColor: colors.line,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metaVal: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '700',
    marginTop: 3,
  },
  metaValHighlight: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.green,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.panelSoft,
    borderRadius: spacing.radius,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  infoBody: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
    marginTop: 2,
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
});
