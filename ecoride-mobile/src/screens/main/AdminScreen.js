import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../api/adminApi';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import Screen from '../../components/Screen';
import Stat from '../../components/Stat';
import { colors, spacing } from '../../utils/theme';
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
      setUsers(usersData || []);
      setVehicles(vehiclesData || []);
    } catch (error) {
      Alert.alert('Admin data unavailable', getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function setRole(userId, role) {
    try {
      await adminApi.setRole(userId, role);
      await load();
    } catch (error) {
      Alert.alert('Role update failed', getErrorMessage(error));
    }
  }

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      contentStyle={{ paddingBottom: 90, gap: 16 }}
    >
      {/* ── Admin Overview Metrics ── */}
      <View style={styles.grid}>
        <Stat
          label="Total Users"
          value={stats?.totalUsers ?? '-'}
          icon="people-outline"
          color={colors.blue}
        />
        <Stat
          label="Drivers"
          value={stats?.totalDrivers ?? '-'}
          icon="car-sport-outline"
          color={colors.green}
        />
      </View>
      <View style={styles.grid}>
        <Stat
          label="Vehicles"
          value={stats?.totalVehicles ?? '-'}
          icon="shield-checkmark-outline"
          color={colors.purple}
        />
        <Stat
          label="Total Trips"
          value={stats?.totalTrips ?? '-'}
          icon="ticket-outline"
          color={colors.amber}
        />
      </View>

      {/* ── User Management Section ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.section}>Employee Directory ({users.length})</Text>
        <Badge label="Role Management" variant="blue" size="sm" />
      </View>

      {users.length ? (
        users.map((u) => (
          <Card key={u.id} style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {u.firstName?.[0] || 'U'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>
                  {u.firstName} {u.lastName}
                </Text>
                <Text style={styles.userEmail}>{u.email}</Text>
                <Text style={styles.userCompany}>{u.companyName || 'Corporate Partner'}</Text>
              </View>
              <Badge
                label={u.role}
                variant={u.role === 'ADMIN' ? 'purple' : u.role === 'DRIVER' ? 'green' : 'neutral'}
                size="sm"
              />
            </View>

            <View style={styles.userActions}>
              <Button
                title="Set Employee"
                variant={u.role === 'EMPLOYEE' ? 'primary' : 'ghost'}
                size="sm"
                onPress={() => setRole(u.id, 'EMPLOYEE')}
                style={styles.actionBtn}
              />
              <Button
                title="Set Driver"
                variant={u.role === 'DRIVER' ? 'primary' : 'ghost'}
                size="sm"
                onPress={() => setRole(u.id, 'DRIVER')}
                style={styles.actionBtn}
              />
              <Button
                title="Set Admin"
                variant={u.role === 'ADMIN' ? 'primary' : 'ghost'}
                size="sm"
                onPress={() => setRole(u.id, 'ADMIN')}
                style={styles.actionBtn}
              />
            </View>
          </Card>
        ))
      ) : (
        <EmptyState title="No users found" />
      )}

      {/* ── Registered Corporate Vehicles ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.section}>Registered Fleet ({vehicles.length})</Text>
        <Badge label="Vehicle Inspection" variant="green" size="sm" />
      </View>

      {vehicles.length ? (
        vehicles.map((v) => (
          <Card key={v.id} style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleTitle}>{v.model || 'Vehicle'}</Text>
                <Text style={styles.vehicleReg}>{v.registrationNumber}</Text>
              </View>
              <Badge
                label={v.vehicleType || 'ELECTRIC'}
                variant={v.vehicleType === 'ELECTRIC' ? 'green' : 'neutral'}
                size="sm"
              />
            </View>
            <View style={styles.vehicleMetaRow}>
              <Text style={styles.vehicleMeta}>ID: {v.id}</Text>
              <Text style={styles.vehicleMeta}>Owner: {v.userId}</Text>
              <Text style={styles.vehicleMeta}>{v.seatingCapacity} seats</Text>
            </View>
          </Card>
        ))
      ) : (
        <EmptyState title="No vehicles found" />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  section: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  userCard: {
    padding: 14,
    gap: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.panelSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: colors.muted,
  },
  userCompany: {
    fontSize: 11,
    color: colors.green,
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  actionBtn: {
    flex: 1,
  },
  vehicleCard: {
    padding: 14,
    gap: 8,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  vehicleReg: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  vehicleMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  vehicleMeta: {
    fontSize: 11,
    color: colors.muted,
  },
});
