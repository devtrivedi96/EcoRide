import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { bookingApi } from '../../api/bookingApi';
import { paymentApi } from '../../api/paymentApi';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import Screen from '../../components/Screen';
import TripCard from '../../components/TripCard';
import { SkeletonRideCard } from '../../components/Skeleton';
import { colors, spacing } from '../../utils/theme';
import { getErrorMessage } from '../../utils/format';

const TABS = [
  { id: 'ALL', label: 'All Rides' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'UPCOMING', label: 'Upcoming' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export default function TripsScreen({ navigation }) {
  const [trips, setTrips] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isPull = false) => {
    if (isPull) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await bookingApi.myTrips();
      setTrips(data || []);
    } catch (error) {
      Alert.alert('Could not load trips', getErrorMessage(error));
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

  async function cancel(tripId) {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this carpool request?',
      [
        { text: 'No, Keep', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingApi.cancel(tripId);
              await load();
            } catch (error) {
              Alert.alert('Cancel failed', getErrorMessage(error));
            }
          },
        },
      ]
    );
  }

  async function pay(trip) {
    try {
      await paymentApi.payTrip({ tripId: trip.id, paymentMethod: 'WALLET' });
      Alert.alert('Payment Successful', 'Trip fare was deducted from your EcoRide wallet.');
      await load();
    } catch (error) {
      Alert.alert('Payment failed', getErrorMessage(error));
    }
  }

  // Filter trips by status tab
  const filteredTrips = trips.filter((t) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ACTIVE') return t.status === 'ACCEPTED' || t.status === 'STARTED';
    if (activeTab === 'UPCOMING') return t.status === 'PENDING';
    if (activeTab === 'COMPLETED') return t.status === 'COMPLETED' || t.status === 'PAID';
    if (activeTab === 'CANCELLED') return t.status === 'CANCELLED' || t.status === 'REJECTED';
    return true;
  });

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      contentStyle={{ paddingBottom: 90, gap: 14 }}
    >
      {/* ── Driver Switch Banner ── */}
      <TouchableOpacity
        style={styles.driverBanner}
        onPress={() => navigation.getParent()?.navigate('DriverTrips')}
      >
        <View style={styles.driverBannerLeft}>
          <Ionicons name="car-sport" size={20} color={colors.green} />
          <View>
            <Text style={styles.driverBannerTitle}>Offering rides as a driver?</Text>
            <Text style={styles.driverBannerSub}>View passenger booking requests</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </TouchableOpacity>

      {/* ── Status Segmented Filter Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabChip, isActive && styles.tabChipActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Loading Skeleton ── */}
      {loading && !refreshing ? (
        <View style={{ gap: 12 }}>
          <SkeletonRideCard />
          <SkeletonRideCard />
        </View>
      ) : filteredTrips.length ? (
        filteredTrips.map((trip) => {
          const isActive = trip.status === 'STARTED' || trip.status === 'ACCEPTED';
          const isPayable = trip.status === 'COMPLETED' || trip.status === 'PAYMENT_PENDING';
          const canCancel = trip.status === 'PENDING' || trip.status === 'ACCEPTED';

          return (
            <TripCard
              key={trip.id}
              trip={trip}
              actions={[
                ...(isActive
                  ? [
                      {
                        title: 'Track Live Trip',
                        icon: 'navigate-outline',
                        onPress: () => navigation.navigate('Map'),
                      },
                    ]
                  : []),
                ...(isPayable
                  ? [
                      {
                        title: 'Pay via Wallet',
                        icon: 'wallet-outline',
                        onPress: () => pay(trip),
                      },
                    ]
                  : []),
                {
                  title: 'Chat',
                  variant: 'ghost',
                  icon: 'chatbubble-ellipses-outline',
                  onPress: () =>
                    navigation.getParent()?.navigate('Chat', { tripId: trip.id }),
                },
                ...(canCancel
                  ? [
                      {
                        title: 'Cancel',
                        variant: 'ghost',
                        icon: 'close-circle-outline',
                        onPress: () => cancel(trip.id),
                      },
                    ]
                  : []),
              ]}
            />
          );
        })
      ) : (
        <EmptyState
          icon="ticket-outline"
          title={
            activeTab === 'ALL'
              ? 'No Bookings Yet'
              : `No ${activeTab.toLowerCase()} rides`
          }
          body="Book a corporate carpool from the Find tab to see your commute schedule here."
          action="Find a Ride"
          actionIcon="search-outline"
          onAction={() => navigation.navigate('Find')}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  driverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    padding: 12,
    borderRadius: spacing.radius,
  },
  driverBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  driverBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  driverBannerSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabChipActive: {
    backgroundColor: colors.green,
    borderColor: colors.greenHover,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
