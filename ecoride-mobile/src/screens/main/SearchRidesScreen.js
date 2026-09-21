import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rideApi } from '../../api/rideApi';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import Field from '../../components/Field';
import RideCard from '../../components/RideCard';
import Screen from '../../components/Screen';
import { SkeletonRideCard } from '../../components/Skeleton';
import { colors, spacing } from '../../utils/theme';
import { getErrorMessage } from '../../utils/format';
import { getCurrentUserAddress } from '../../utils/location';

const QUICK_LOCATIONS = [
  'Koramangala',
  'Electronic City',
  'Indiranagar',
  'Whitefield',
  'HSR Layout',
];

export default function SearchRidesScreen({ navigation }) {
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('Electronic City');
  const [departureTime, setDepartureTime] = useState(
    new Date(Date.now() + 60 * 60 * 1000).toISOString()
  );
  const [seats, setSeats] = useState('1');
  const [rides, setRides] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    (async () => {
      setLocating(true);
      let detected = '';
      try {
        const res = await getCurrentUserAddress();
        if (res?.address) {
          detected = res.address;
          setPickupLocation(res.address);
        }
      } catch (err) {
        console.warn('Could not auto-fetch user location:', err);
      } finally {
        setLocating(false);
        handleSearch(detected);
      }
    })();
  }, []);

  async function handleSearch(pickupOverride) {
    setLoading(true);
    try {
      const activePickup = typeof pickupOverride === 'string' ? pickupOverride : pickupLocation;
      const result = await rideApi.search({
        pickupLocation: activePickup.trim(),
        destination: destination.trim(),
        departureTime: new Date(departureTime).toISOString(),
        seats: Number(seats || 1),
      });
      setRides(result || []);
      setSearched(true);
    } catch (error) {
      Alert.alert('Search failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleUseCurrentLocation() {
    setLocating(true);
    try {
      const res = await getCurrentUserAddress();
      if (res?.address) {
        setPickupLocation(res.address);
      } else {
        Alert.alert('Location Notice', 'Could not detect your current GPS location. Please ensure location services are enabled.');
      }
    } catch {
      Alert.alert('Location Error', 'Unable to retrieve your current location.');
    } finally {
      setLocating(false);
    }
  }

  function swapLocations() {
    const temp = pickupLocation;
    setPickupLocation(destination);
    setDestination(temp);
  }

  return (
    <Screen contentStyle={styles.content}>
      {/* ── Search Form Card ── */}
      <Card style={styles.searchCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="search" size={18} color={colors.green} />
          <Text style={styles.cardTitle}>Search Corporate Rides</Text>
        </View>

        {/* Pickup Field with Current Location Action */}
        <Field
          label="Pickup Location"
          icon="location-outline"
          placeholder="e.g. Koramangala"
          value={pickupLocation}
          onChangeText={setPickupLocation}
          onLocationPress={handleUseCurrentLocation}
        />

        {/* Dedicated Non-colliding Swap Action Row */}
        <View style={styles.swapActionRow}>
          <View style={styles.swapDivider} />
          <TouchableOpacity
            style={styles.swapBtn}
            onPress={swapLocations}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-vertical" size={16} color={colors.green} />
            <Text style={styles.swapText}>Swap Locations</Text>
          </TouchableOpacity>
          <View style={styles.swapDivider} />
        </View>

        {/* Destination Field */}
        <Field
          label="Destination"
          icon="flag-outline"
          placeholder="e.g. Electronic City"
          value={destination}
          onChangeText={setDestination}
        />

        {/* Quick location chips */}
        <View style={styles.chipsSection}>
          <Text style={styles.chipsLabel}>Corridor Shortcuts:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {QUICK_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={styles.chip}
                onPress={() => {
                  if (!pickupLocation) setPickupLocation(loc);
                  else setDestination(loc);
                }}
              >
                <Text style={styles.chipText}>{loc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Departure and Seats */}
        <View style={styles.row}>
          <Field
            label="Departure Time (ISO)"
            icon="time-outline"
            value={departureTime}
            onChangeText={setDepartureTime}
            style={styles.flex}
          />
          <Field
            label="Seats"
            icon="people-outline"
            value={seats}
            onChangeText={setSeats}
            keyboardType="number-pad"
            style={styles.seatsField}
          />
        </View>

        <Button
          title="Find Matching Rides"
          icon="search"
          loading={loading || locating}
          size="lg"
          onPress={handleSearch}
        />
      </Card>

      {/* ── Results Header ── */}
      {searched && (
        <View style={styles.resultsHeaderRow}>
          <Text style={styles.resultsTitle}>
            Available Carpool ({rides.length})
          </Text>
          <Badge label="AI Ranked" variant="green" icon="sparkles-outline" size="sm" />
        </View>
      )}

      {/* ── Skeleton Loading State ── */}
      {loading ? (
        <View style={{ gap: 14 }}>
          <SkeletonRideCard />
        </View>
      ) : (
        /* ── Single Connected Ride Card ── */
        rides.map((ride) => (
          <RideCard
            key={ride.id}
            ride={ride}
            matchScore="98% Route Match"
            actionTitle="View Ride"
            onPress={() =>
              navigation.navigate('RideDetails', {
                ride,
                searchSeats: Number(seats || 1),
              })
            }
            onAction={() =>
              navigation.navigate('RideDetails', {
                ride,
                searchSeats: Number(seats || 1),
              })
            }
          />
        ))
      )}

      {searched && !loading && rides.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No Matching Rides Found"
          body="Try adjusting your departure time or seats."
          action="Reset Search"
          onAction={() => {
            setSeats('1');
            setPickupLocation('Koramangala');
            setDestination('Electronic City');
            handleSearch();
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 90,
    gap: 16,
  },
  searchCard: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  swapActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -2,
  },
  swapDivider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: colors.line,
    marginHorizontal: 10,
  },
  swapText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.green,
  },
  chipsSection: {
    gap: 6,
  },
  chipsLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: colors.panelSoft,
    borderColor: colors.line,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: spacing.radiusFull,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  seatsField: {
    width: 90,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
});
