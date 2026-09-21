import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { rideApi } from '../../api/rideApi';
import { bookingApi } from '../../api/bookingApi';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import RideCard from '../../components/RideCard';
import Screen from '../../components/Screen';
import Stat from '../../components/Stat';
import { SkeletonDashboard } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../utils/theme';
import { currency, formatDateTime, getErrorMessage, initials } from '../../utils/format';
import { MOCK_RIDES } from '../../mock/mockData';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [myRides, myTrips] = await Promise.all([
        rideApi.mine(),
        bookingApi.myTrips(),
      ]);
      setRides(myRides || []);
      setTrips(myTrips || []);
    } catch (error) {
      Alert.alert('Could not load dashboard', getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Identify active or upcoming trip for the central hub banner
  const activeTrip = trips.find((t) => t.status === 'STARTED' || t.status === 'ACCEPTED');
  const upcomingTrip = !activeTrip ? trips.find((t) => t.status === 'PENDING') : null;
  const spotlightTrip = activeTrip || upcomingTrip;

  if (loading && !refreshing) {
    return (
      <Screen contentStyle={styles.content}>
        <SkeletonDashboard />
      </Screen>
    );
  }

  return (
    <Screen
      contentStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      {/* ── 1. CORPORATE HEADER / PROFILE HUB ───────────────────────────────── */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user)}</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <View style={styles.companyRow}>
            <Ionicons name="business-outline" size={13} color={colors.green} />
            <Text style={styles.company}>{user?.companyName || user?.email}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle-outline" size={28} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── 2. ACTIVE / UPCOMING RIDE SPOTLIGHT ─────────────────────────────── */}
      {spotlightTrip ? (
        <Card style={[styles.spotlightCard, activeTrip && styles.activeTripGlow]}>
          <View style={styles.spotlightHeader}>
            <Badge
              label={activeTrip ? 'Active Live Trip' : 'Upcoming Booking'}
              variant={activeTrip ? 'green' : 'amber'}
              icon={activeTrip ? 'radio-outline' : 'time-outline'}
              size="sm"
            />
            {spotlightTrip.startOtp ? (
              <Badge
                label={`OTP: ${spotlightTrip.startOtp}`}
                variant="amber"
                icon="key-outline"
                size="sm"
              />
            ) : null}
          </View>

          <View style={styles.spotlightRoute}>
            <View style={styles.spotlightVisual}>
              <View style={[styles.dot, styles.pickupDot]} />
              <View style={styles.spotlightLine} />
              <View style={[styles.dot, styles.dropDot]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.spotlightLocation} numberOfLines={1}>
                {spotlightTrip.ride?.pickupLocation || 'Pickup location'}
              </Text>
              <Text style={[styles.spotlightLocation, { marginTop: 10 }]} numberOfLines={1}>
                {spotlightTrip.ride?.destination || 'Destination'}
              </Text>
            </View>
          </View>

          <View style={styles.spotlightFooter}>
            <Text style={styles.spotlightTime}>
              {formatDateTime(spotlightTrip.ride?.departureTime)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {activeTrip ? (
                <Button
                  title="Track Live Trip"
                  icon="navigate"
                  size="sm"
                  onPress={() => navigation.navigate('Map')}
                />
              ) : (
                <Button
                  title="Trip Details"
                  variant="ghost"
                  size="sm"
                  onPress={() => navigation.navigate('Trips')}
                />
              )}
            </View>
          </View>
        </Card>
      ) : null}

      {/* ── 3. PRIMARY QUICK ACTION CTAS ────────────────────────────────────── */}
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={[styles.quickTile, styles.findTile]}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Find')}
        >
          <View style={[styles.tileIconCircle, { backgroundColor: '#FFFFFF' }]}>
            <Ionicons name="search" size={22} color={colors.green} />
          </View>
          <View>
            <Text style={styles.findTileTitle}>Find Ride</Text>
            <Text style={styles.findTileSub}>Carpool with colleagues</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.tileArrow} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickTile, styles.offerTile]}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('PublishRide')}
        >
          <View style={[styles.tileIconCircle, { backgroundColor: colors.panelSoft }]}>
            <Ionicons name="car-sport" size={22} color={colors.text} />
          </View>
          <View>
            <Text style={styles.offerTileTitle}>Offer Ride</Text>
            <Text style={styles.offerTileSub}>Publish spare seats</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.muted} style={styles.tileArrow} />
        </TouchableOpacity>
      </View>

      {/* ── 4. KEY METRICS STATS ────────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <Stat
          label="Published Rides"
          value={rides.length}
          icon="car-outline"
          color={colors.blue}
        />
        <Stat
          label="My Bookings"
          value={trips.length}
          icon="ticket-outline"
          color={colors.green}
        />
        <Stat
          label="CO₂ Saved"
          value="84 kg"
          icon="leaf-outline"
          color={colors.green}
        />
      </View>

      {/* ── 5. SUSTAINABILITY WIDGET ────────────────────────────────────────── */}
      <Card
        style={styles.ecoCard}
        onPress={() => navigation.navigate('Sustainability')}
      >
        <View style={styles.ecoRow}>
          <View style={styles.ecoIconWrap}>
            <Ionicons name="leaf" size={22} color={colors.green} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.ecoTitle}>Green Commute Impact</Text>
              <Badge label="Active Eco Leader" variant="green" size="sm" />
            </View>
            <Text style={styles.ecoSub}>
              84.2 kg CO₂ prevented · ~4 trees planted equivalent
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </Card>

      {/* ── 6. LIVE MAP & ROUTE FINDER SHORTCUT ──────────────────────────────── */}
      <TouchableOpacity
        style={styles.mapBanner}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Map')}
      >
        <View style={styles.mapBannerContent}>
          <View style={styles.mapIconWrap}>
            <Ionicons name="map" size={24} color={colors.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.mapBannerTitle}>Live Map & Real-time GPS</Text>
            <Text style={styles.mapBannerSub}>Track nearby corporate rides & live route</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </TouchableOpacity>

      {/* ── 7. RECOMMENDED / AVAILABLE RIDES ───────────────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recommended For You</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Find')}>
          <Text style={styles.viewAllText}>Search All</Text>
        </TouchableOpacity>
      </View>

      {MOCK_RIDES.slice(0, 2).map((ride) => (
        <RideCard
          key={ride.id}
          ride={ride}
          actionTitle="View Details"
          onPress={() => navigation.navigate('RideDetails', { ride })}
          onAction={() => navigation.navigate('RideDetails', { ride })}
        />
      ))}

      {/* ── 8. MY PUBLISHED RIDES / DRIVER REQUESTS ─────────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>My Offered Rides</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DriverTrips')}>
          <Text style={styles.viewAllText}>Driver Requests</Text>
        </TouchableOpacity>
      </View>

      {rides.length ? (
        rides.slice(0, 2).map((ride) => (
          <RideCard
            key={ride.id}
            ride={ride}
            actionTitle="View Details"
            onPress={() => navigation.navigate('RideDetails', { ride })}
            onAction={() => navigation.navigate('RideDetails', { ride })}
          />
        ))
      ) : (
        <EmptyState
          icon="car-outline"
          title="No Published Rides"
          body="Have empty seats on your daily commute? Offer a ride to colleagues."
          action="Offer a Ride"
          onAction={() => navigation.navigate('PublishRide')}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 90,
    gap: 16,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    padding: 16,
    borderRadius: spacing.radius,
    borderWidth: 1,
    borderColor: colors.line,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.greenLight,
    borderWidth: 1.5,
    borderColor: colors.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: colors.green,
    fontWeight: '900',
    fontSize: 18,
  },
  profileText: {
    flex: 1,
  },
  greeting: {
    color: colors.muted,
    fontSize: 12,
  },
  name: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  company: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '700',
  },
  notifBtn: {
    padding: 4,
  },
  spotlightCard: {
    padding: 16,
    gap: 12,
    borderColor: colors.greenBorder,
    backgroundColor: '#FFFFFF',
  },
  activeTripGlow: {
    borderWidth: 2,
    borderColor: colors.green,
  },
  spotlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotlightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panelSoft,
    padding: 10,
    borderRadius: spacing.radiusSm,
  },
  spotlightVisual: {
    alignItems: 'center',
    width: 18,
    marginRight: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pickupDot: {
    backgroundColor: colors.green,
  },
  dropDot: {
    backgroundColor: colors.amber,
  },
  spotlightLine: {
    width: 2,
    height: 16,
    backgroundColor: colors.lineDark,
    marginVertical: 2,
  },
  spotlightLocation: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  spotlightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotlightTime: {
    fontSize: 12,
    color: colors.muted,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickTile: {
    flex: 1,
    padding: 14,
    borderRadius: spacing.radius,
    justifyContent: 'space-between',
    minHeight: 110,
  },
  findTile: {
    backgroundColor: colors.green,
  },
  offerTile: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tileIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findTileTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    marginTop: 8,
  },
  findTileSub: {
    color: '#D1FAE5',
    fontSize: 11,
    marginTop: 1,
  },
  offerTileTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
    marginTop: 8,
  },
  offerTileSub: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 1,
  },
  tileArrow: {
    alignSelf: 'flex-end',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ecoCard: {
    padding: 14,
  },
  ecoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ecoIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ecoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  ecoSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  mapBanner: {
    backgroundColor: colors.panel,
    borderRadius: spacing.radius,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  mapBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mapIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  mapBannerSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  viewAllText: {
    fontSize: 13,
    color: colors.green,
    fontWeight: '700',
  },
});
