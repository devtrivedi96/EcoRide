import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { adminApi } from '../../api/adminApi';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import Screen from '../../components/Screen';
import Stat from '../../components/Stat';
import { colors } from '../../utils/theme';
import { getErrorMessage } from '../../utils/format';

export default function AdminScreen() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [statsData, usersData, vehiclesData] = await Promise.all([
        adminApi.stats(),
        adminApi.users(),
        adminApi.vehicles(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setVehicles(vehiclesData);
    } catch (error) {
      Alert.alert('Admin data unavailable', getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function setRole(userId, role) {
    try {
      await adminApi.setRole(userId, role);
      await load();
    } catch (error) {
      Alert.alert('Role update failed', getErrorMessage(error));
    }
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />} contentStyle={{ paddingBottom: 90 }}>
      <View style={styles.grid}>
        <Stat label="Users" value={stats?.totalUsers ?? '-'} />
        <Stat label="Drivers" value={stats?.totalDrivers ?? '-'} />
      </View>
      <View style={styles.grid}>
        <Stat label="Vehicles" value={stats?.totalVehicles ?? '-'} />
        <Stat label="Trips" value={stats?.totalTrips ?? '-'} />
      </View>
      <Text style={styles.section}>Users</Text>
      {users.length ? users.map((user) => (
        <Card key={user.id}>
          <Text style={styles.title}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.meta}>{user.email} · {user.companyName || 'No company'}</Text>
          <Text style={styles.role}>{user.role}</Text>
          <View style={styles.actions}>
            <Button title="Employee" variant="ghost" onPress={() => setRole(user.id, 'EMPLOYEE')} style={styles.action} />
            <Button title="Admin" variant="ghost" onPress={() => setRole(user.id, 'ADMIN')} style={styles.action} />
          </View>
        </Card>
      )) : <EmptyState title="No users found" />}
      <Text style={styles.section}>Vehicles</Text>
      {vehicles.length ? vehicles.map((vehicle) => (
        <Card key={vehicle.id}>
          <Text style={styles.title}>{vehicle.model || 'Vehicle'}</Text>
          <Text style={styles.meta}>ID: {vehicle.id}</Text>
          <Text style={styles.meta}>Owner: {vehicle.userId}</Text>
          <Text style={styles.meta}>{vehicle.registrationNumber} · {vehicle.seatingCapacity} seats</Text>
        </Card>
      )) : <EmptyState title="No vehicles found" />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  section: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  meta: {
    color: colors.muted,
  },
  role: {
    color: colors.green,
    fontWeight: '900',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
  },
});
