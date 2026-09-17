import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { rideApi } from '../../api/rideApi';
import { bookingApi } from '../../api/bookingApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import RideCard from '../../components/RideCard';
import Screen from '../../components/Screen';
import Stat from '../../components/Stat';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../utils/theme';
import { getErrorMessage, initials } from '../../utils/format';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [trips, setTrips] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [myRides, myTrips] = await Promise.all([rideApi.mine(), bookingApi.myTrips()]);
      setRides(myRides);
      setTrips(myTrips);
    } catch (error) {
      Alert.alert('Could not load dashboard', getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen
      contentStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
    >
      <Card style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials(user)}</Text></View>
        <View style={styles.profileText}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.company}>{user?.companyName || user?.email}</Text>
        </View>
      </Card>
      <View style={styles.stats}>
        <Stat label="Published" value={rides.length} />
        <Stat label="Bookings" value={trips.length} />
      </View>
      <View style={styles.quick}>
        <Button title="Find ride" onPress={() => navigation.navigate('Find')} style={styles.quickButton} />
        <Button title="Publish" variant="ghost" onPress={() => navigation.getParent()?.navigate('PublishRide')} style={styles.quickButton} />
      </View>
      <Text style={styles.section}>My published rides</Text>
      {rides.length ? (
        rides.slice(0, 3).map((ride) => <RideCard key={ride.id} ride={ride} />)
      ) : (
        <EmptyState title="No rides published" body="Publish a ride when you have a registered vehicle ID." action="Publish ride" onAction={() => navigation.getParent()?.navigate('PublishRide')} />
      )}
      <Button title="Manage driver requests" variant="ghost" onPress={() => navigation.getParent()?.navigate('DriverTrips')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 90,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
  },
  profileText: {
    flex: 1,
  },
  greeting: {
    color: colors.muted,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  company: {
    color: colors.green,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  quick: {
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: {
    flex: 1,
  },
  section: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
});
