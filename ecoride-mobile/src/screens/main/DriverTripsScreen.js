import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { bookingApi } from '../../api/bookingApi';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import TripCard from '../../components/TripCard';
import { colors, spacing } from '../../utils/theme';
import { getErrorMessage } from '../../utils/format';

export default function DriverTripsScreen({ navigation }) {
  const [trips, setTrips] = useState([]);
  const [otps, setOtps] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await bookingApi.driverTrips();
      setTrips(data || []);
    } catch (error) {
      Alert.alert('Could not load driver trips', getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function act(label, action) {
    try {
      await action();
      await load();
    } catch (error) {
      Alert.alert(`${label} failed`, getErrorMessage(error));
    }
  }

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      contentStyle={{ paddingBottom: 40, gap: 14 }}
    >
      {/* ── Driver Hub Banner ── */}
      <Card style={styles.bannerCard}>
        <View style={styles.bannerRow}>
          <View style={styles.bannerIconWrap}>
            <Ionicons name="car-sport" size={22} color={colors.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Driver Operations Hub</Text>
            <Text style={styles.bannerSub}>
              Accept ride requests from employees, verify passenger start OTP, and complete trips.
            </Text>
          </View>
        </View>
      </Card>

      {/* ── Requests List ── */}
      {trips.length ? (
        trips.map((trip) => (
          <View key={trip.id} style={styles.tripWrap}>
            {trip.status === 'ACCEPTED' ? (
              <Card style={styles.otpCard}>
                <View style={styles.otpHeader}>
                  <Ionicons name="key" size={16} color={colors.amberText} />
                  <Text style={styles.otpHeading}>Passenger Start OTP Verification</Text>
                </View>
                <Text style={styles.otpSub}>
                  Ask passenger for their 4-digit start OTP before commencing the carpool.
                </Text>
                <Field
                  placeholder="Enter 4-digit OTP"
                  value={otps[trip.id] || ''}
                  onChangeText={(value) =>
                    setOtps((current) => ({ ...current, [trip.id]: value }))
                  }
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </Card>
            ) : null}

            <TripCard
              trip={trip}
              actions={[
                ...(trip.status === 'PENDING'
                  ? [
                      {
                        title: 'Accept Request',
                        icon: 'checkmark-circle-outline',
                        onPress: () => act('Accept', () => bookingApi.accept(trip.id)),
                      },
                      {
                        title: 'Reject',
                        variant: 'ghost',
                        icon: 'close-circle-outline',
                        onPress: () => act('Reject', () => bookingApi.reject(trip.id)),
                      },
                    ]
                  : []),
                ...(trip.status === 'ACCEPTED'
                  ? [
                      {
                        title: 'Verify OTP & Start Trip',
                        icon: 'play-outline',
                        onPress: () => {
                          if (!otps[trip.id]) {
                            Alert.alert('Missing OTP', 'Please enter passenger OTP.');
                            return;
                          }
                          act('OTP verification', () =>
                            bookingApi.verifyOtp(trip.id, otps[trip.id])
                          );
                        },
                      },
                    ]
                  : []),
                ...(trip.status === 'STARTED'
                  ? [
                      {
                        title: 'Complete Trip',
                        icon: 'checkmark-done-outline',
                        onPress: () =>
                          act('Complete', () =>
                            bookingApi.updateStatus(trip.id, 'COMPLETED')
                          ),
                      },
                    ]
                  : []),
                {
                  title: 'Chat with Passenger',
                  variant: 'ghost',
                  icon: 'chatbubble-ellipses-outline',
                  onPress: () => navigation.navigate('Chat', { tripId: trip.id }),
                },
              ]}
            />
          </View>
        ))
      ) : (
        <EmptyState
          icon="people-outline"
          title="No Passenger Requests"
          body="Passenger booking requests will appear here when employees book your offered rides."
          action="Offer a New Ride"
          onAction={() => navigation.navigate('PublishRide')}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bannerCard: {
    backgroundColor: colors.panelSoft,
    padding: 14,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  bannerSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  tripWrap: {
    gap: 8,
  },
  otpCard: {
    backgroundColor: colors.amberLight,
    borderColor: colors.amberBorder,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  otpHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.amberText,
  },
  otpSub: {
    fontSize: 12,
    color: colors.amberText,
  },
});
