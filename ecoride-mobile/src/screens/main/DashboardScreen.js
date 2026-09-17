import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
      {/* ── Profile card ────────────────────────────────────────────────── */}
      <Card style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials(user)}</Text></View>
        <View style={styles.profileText}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.company}>{user?.companyName || user?.email}</Text>
        </View>
      </Card>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <View style={styles.stats}>
        <Stat label="Published" value={rides.length} />
        <Stat label="Bookings" value={trips.length} />
      </View>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <View style={styles.quick}>
        <Button title="Find ride" onPress={() => navigation.navigate('Find')} style={styles.quickButton} />
        <Button title="Publish" variant="ghost" onPress={() => navigation.getParent()?.navigate('PublishRide')} style={styles.quickButton} />
      </View>

      {/* ── Map shortcut card ────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.mapCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Map')}
      >
        <View style={styles.mapCardContent}>
          <View style={styles.mapIconWrap}>
            <Ionicons name="map" size={28} color={colors.green} />
          </View>
          <View style={styles.mapCardText}>
            <Text style={styles.mapCardTitle}>Live Map & Route Finder</Text>
            <Text style={styles.mapCardSub}>Real-time GPS · Route finder · Ride markers</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </View>
        {/* Fake map grid preview */}
        <View style={styles.mapPreview}>
          {[0,1,2].map(i => <View key={`h${i}`} style={[styles.gridLine, { top: `${33*(i+1)}%`, width:'100%', height:1 }]} />)}
          {[0,1,2,3].map(i => <View key={`v${i}`} style={[styles.gridLine, { left: `${25*(i+1)}%`, height:'100%', width:1 }]} />)}
          {[
            { left:'25%', top:'30%', color: colors.green },
            { left:'65%', top:'60%', color: colors.amber },
            { left:'45%', top:'20%', color: colors.blue },
            { left:'75%', top:'40%', color: colors.green },
          ].map((p, i) => (
            <View key={i} style={[styles.mapDot, { left:p.left, top:p.top, backgroundColor:p.color }]} />
          ))}
          <View style={styles.mapOverlay}>
            <Text style={styles.mapOverlayText}>Tap to open map</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── My published rides ───────────────────────────────────────────── */}
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
  content: { paddingBottom: 90 },
  profile: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.text, fontWeight: '900', fontSize: 18 },
  profileText: { flex: 1 },
  greeting: { color: colors.muted },
  name: { color: colors.text, fontSize: 22, fontWeight: '900' },
  company: { color: colors.green },
  stats: { flexDirection: 'row', gap: 12 },
  quick: { flexDirection: 'row', gap: 12 },
  quickButton: { flex: 1 },
  // ── Map card
  mapCard: {
    borderRadius: 12, borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.panel, overflow: 'hidden',
  },
  mapCardContent: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },
  mapIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(16,185,129,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  mapCardText: { flex: 1 },
  mapCardTitle: { color: colors.text, fontWeight: '900', fontSize: 15 },
  mapCardSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  mapPreview: {
    height: 80, backgroundColor: '#0a1628',
    position: 'relative', overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute', backgroundColor: 'rgba(51,65,85,0.5)',
  },
  mapDot: {
    position: 'absolute', width: 10, height: 10, borderRadius: 5,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(10,22,40,0.35)',
  },
  mapOverlayText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  section: { color: colors.text, fontSize: 18, fontWeight: '900' },
});
