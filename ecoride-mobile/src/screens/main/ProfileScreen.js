import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { userApi } from '../../api/userApi';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../utils/theme';
import { getErrorMessage, initials } from '../../utils/format';

export default function ProfileScreen({ navigation }) {
  const { user, refreshMe, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);
  const [passMsg, setPassMsg] = useState(null);

  async function handleResetPassword() {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Invalid Password', 'New password must be at least 6 characters.');
      return;
    }
    setLoadingPass(true);
    try {
      await userApi.resetPassword(newPassword);
      setNewPassword('');
      setPassMsg('✓ Password updated successfully. Use it on your next sign-in.');
      setTimeout(() => setPassMsg(null), 5000);
    } catch (error) {
      Alert.alert('Could not update password', getErrorMessage(error));
    } finally {
      setLoadingPass(false);
    }
  }

  async function handleRefresh() {
    try {
      await refreshMe();
      Alert.alert('Profile Refreshed', 'Your account data is up to date.');
    } catch (error) {
      Alert.alert('Refresh failed', getErrorMessage(error));
    }
  }

  function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from EcoRide?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  }

  return (
    <Screen contentStyle={{ paddingBottom: 90, gap: 16 }}>
      {/* ── Employee Profile Header ── */}
      <Card style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>{initials(user)}</Text>
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Ionicons name="shield-checkmark" size={18} color={colors.green} />
          </View>

          <Text style={styles.metaText}>{user?.email}</Text>
          <Text style={styles.metaText}>{user?.phoneNumber || '+91 98765 43210'}</Text>

          <View style={styles.badgeRow}>
            <Badge label={user?.role || 'EMPLOYEE'} variant="green" size="sm" />
            <Badge
              label={user?.companyName || 'Corporate Member'}
              variant="blue"
              icon="business-outline"
              size="sm"
            />
          </View>
        </View>
      </Card>

      {/* ── Quick Corporate Links ── */}
      <View style={styles.linksCard}>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('Vehicles')}
        >
          <View style={[styles.linkIconWrap, { backgroundColor: colors.blueLight }]}>
            <Ionicons name="car-sport-outline" size={20} color={colors.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>My Registered Vehicles</Text>
            <Text style={styles.linkSub}>Manage electric and corporate vehicles</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>

        <View style={styles.linkDivider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('Sustainability')}
        >
          <View style={[styles.linkIconWrap, { backgroundColor: colors.greenLight }]}>
            <Ionicons name="leaf-outline" size={20} color={colors.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>Sustainability & Eco Impact</Text>
            <Text style={styles.linkSub}>View carbon saved and green commute metrics</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* ── Saved Places ── */}
      <Card style={styles.placesCard}>
        <Text style={styles.sectionHeading}>Saved Workplaces & Corridors</Text>
        <View style={styles.placeItem}>
          <Ionicons name="home-outline" size={18} color={colors.green} />
          <View style={{ flex: 1 }}>
            <Text style={styles.placeTitle}>Home</Text>
            <Text style={styles.placeSub}>Koramangala 4th Block, Bengaluru</Text>
          </View>
          <Badge label="Primary" variant="neutral" size="sm" />
        </View>
        <View style={styles.placeItem}>
          <Ionicons name="briefcase-outline" size={18} color={colors.blue} />
          <View style={{ flex: 1 }}>
            <Text style={styles.placeTitle}>Office</Text>
            <Text style={styles.placeSub}>Electronic City Phase 1, Bengaluru</Text>
          </View>
          <Badge label="Workplace" variant="neutral" size="sm" />
        </View>
      </Card>

      {/* ── Security / Password ── */}
      <Card style={styles.securityCard}>
        <Text style={styles.sectionHeading}>Account Security</Text>
        <Text style={styles.securitySub}>
          Change your password to keep your corporate commute account safe.
        </Text>

        {passMsg ? (
          <View style={styles.passSuccessBox}>
            <Text style={styles.passSuccessText}>{passMsg}</Text>
          </View>
        ) : null}

        <Field
          label="New Password"
          placeholder="Enter minimum 6 characters"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          icon="lock-closed-outline"
        />

        <Button
          title="Update Password"
          icon="key-outline"
          loading={loadingPass}
          onPress={handleResetPassword}
        />
      </Card>

      {/* ── Refresh & Sign Out ── */}
      <View style={styles.bottomActions}>
        <Button
          title="Refresh Profile Data"
          variant="ghost"
          icon="refresh-outline"
          onPress={handleRefresh}
        />
        <Button
          title="Sign Out"
          variant="danger"
          icon="log-out-outline"
          onPress={handleSignOut}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.greenLight,
    borderWidth: 2,
    borderColor: colors.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    color: colors.green,
    fontSize: 22,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  metaText: {
    fontSize: 13,
    color: colors.muted,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  linksCard: {
    backgroundColor: colors.panel,
    borderRadius: spacing.radius,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  linkIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  linkSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  linkDivider: {
    height: 1,
    backgroundColor: colors.line,
    marginLeft: 66,
  },
  placesCard: {
    padding: 16,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.panelSoft,
    padding: 10,
    borderRadius: spacing.radiusSm,
  },
  placeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  placeSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  securityCard: {
    padding: 16,
    gap: 12,
  },
  securitySub: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
  },
  passSuccessBox: {
    backgroundColor: colors.greenLight,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    padding: 10,
    borderRadius: spacing.radiusSm,
  },
  passSuccessText: {
    fontSize: 12,
    color: colors.greenText,
    fontWeight: '600',
  },
  bottomActions: {
    gap: 10,
    marginTop: 4,
  },
});
