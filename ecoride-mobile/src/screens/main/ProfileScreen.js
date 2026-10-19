import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userApi } from '../../api/userApi';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../utils/theme';
import { getErrorMessage, initials } from '../../utils/format';
import { getCurrentUserAddress } from '../../utils/location';

export default function ProfileScreen({ navigation }) {
  const { user, refreshMe, updateUserProfile, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);
  const [passMsg, setPassMsg] = useState(null);

  // Edit Profile Details State
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    homeAddress: '',
    officeAddress: '',
  });

  // Sync profile details when user loads or updates
  useEffect(() => {
    if (user) {
      setEditForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        homeAddress: user.homeAddress || '',
        officeAddress: user.officeAddress || '',
      });
    }
  }, [user]);

  // Load saved places & account cache on mount to supplement addresses
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const userKey = user?.id || user?.email;
        let localHome = '';
        let localOffice = '';
        if (userKey) {
          const [h, o] = await AsyncStorage.multiGet([
            `@ecoride_home_${userKey}`,
            `@ecoride_office_${userKey}`,
          ]);
          localHome = h[1] || '';
          localOffice = o[1] || '';
        }

        const places = await userApi.savedPlaces().catch(() => []);
        let serverHome = '';
        let serverOffice = '';
        if (Array.isArray(places) && places.length > 0) {
          const homePlaces = places.filter((p) => (p.name || '').toLowerCase() === 'home');
          const officePlaces = places.filter((p) => (p.name || '').toLowerCase() === 'office');
          serverHome = homePlaces[homePlaces.length - 1]?.address || '';
          serverOffice = officePlaces[officePlaces.length - 1]?.address || '';
        }

        const resolvedHome = user?.homeAddress || serverHome || localHome || '';
        const resolvedOffice = user?.officeAddress || serverOffice || localOffice || '';

        if (isMounted) {
          setEditForm((prev) => ({
            ...prev,
            homeAddress: resolvedHome,
            officeAddress: resolvedOffice,
          }));
        }

        if (
          user &&
          (resolvedHome !== user.homeAddress || resolvedOffice !== user.officeAddress) &&
          (resolvedHome || resolvedOffice)
        ) {
          updateUserProfile({
            homeAddress: resolvedHome,
            officeAddress: resolvedOffice,
          }).catch(() => {});
        }
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.email]);

  async function handleUseGpsForHome() {
    setDetectingGps(true);
    try {
      const res = await getCurrentUserAddress();
      if (res?.address) {
        setEditForm((prev) => ({ ...prev, homeAddress: res.address }));
        Alert.alert('GPS Location Set', `Home address set to:\n${res.address}`);
      } else {
        Alert.alert('Location Notice', 'Could not detect current GPS coordinates. Please type your address.');
      }
    } catch {
      Alert.alert('GPS Error', 'Unable to retrieve your current location.');
    } finally {
      setDetectingGps(false);
    }
  }

  async function handleSaveProfile() {
    if (!editForm.firstName.trim()) {
      Alert.alert('Required Field', 'Please enter your first name.');
      return;
    }
    setSavingProfile(true);
    try {
      const payload = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
        homeAddress: editForm.homeAddress.trim(),
        officeAddress: editForm.officeAddress.trim(),
      };

      // 1. Update backend profile
      await userApi.updateProfile(payload).catch((err) => {
        console.warn('Backend updateProfile notice:', err?.message);
      });

      // 2. Update AuthContext & persistent AsyncStorage (account-scoped)
      await updateUserProfile(payload);

      // 3. Sync to saved-places table: purge old entries for Home and Office so stale duplicates don't linger
      try {
        const existingPlaces = await userApi.savedPlaces().catch(() => []);
        if (Array.isArray(existingPlaces)) {
          for (const p of existingPlaces) {
            const nameLower = (p.name || '').toLowerCase();
            if ((nameLower === 'home' || nameLower === 'office') && p.id) {
              await userApi.deleteSavedPlace(p.id).catch(() => {});
            }
          }
        }
        if (payload.homeAddress) {
          await userApi.addSavedPlace({ name: 'Home', address: payload.homeAddress }).catch(() => {});
        }
        if (payload.officeAddress) {
          await userApi.addSavedPlace({ name: 'Office', address: payload.officeAddress }).catch(() => {});
        }
      } catch (err) {
        console.warn('Saved places sync notice:', err?.message);
      }

      setIsEditing(false);
      Alert.alert('Profile Updated', 'Your personal and commute address details have been saved.');
    } catch (error) {
      Alert.alert('Could not update profile', getErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  }

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
      const fresh = await refreshMe();

      let resolvedHome = fresh?.homeAddress || '';
      let resolvedOffice = fresh?.officeAddress || '';

      try {
        const places = await userApi.savedPlaces();
        if (Array.isArray(places) && places.length > 0) {
          const homePlaces = places.filter((p) => (p.name || '').toLowerCase() === 'home');
          const officePlaces = places.filter((p) => (p.name || '').toLowerCase() === 'office');
          const lastHome = homePlaces[homePlaces.length - 1]?.address;
          const lastOffice = officePlaces[officePlaces.length - 1]?.address;

          if (lastHome) resolvedHome = lastHome;
          if (lastOffice) resolvedOffice = lastOffice;
        }
      } catch {}

      setEditForm({
        firstName: fresh?.firstName || '',
        lastName: fresh?.lastName || '',
        phoneNumber: fresh?.phoneNumber || '',
        homeAddress: resolvedHome,
        officeAddress: resolvedOffice,
      });

      if (resolvedHome !== fresh?.homeAddress || resolvedOffice !== fresh?.officeAddress) {
        await updateUserProfile({
          homeAddress: resolvedHome,
          officeAddress: resolvedOffice,
        });
      }

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

  const officeQuickChips = ['Electronic City', 'Whitefield', 'SG Highway', 'Prahlad Nagar', 'Cyber City'];

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

        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => setIsEditing(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={15} color={colors.green} />
          <Text style={styles.editProfileBtnText}>Edit</Text>
        </TouchableOpacity>
      </Card>

      {/* ── Corporate Hub & Services ── */}
      <View style={styles.linksCard}>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('Wallet')}
        >
          <View style={[styles.linkIconWrap, { backgroundColor: colors.amberLight }]}>
            <Ionicons name="wallet-outline" size={20} color={colors.amber} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>EcoRide Wallet & Payments</Text>
            <Text style={styles.linkSub}>Add funds, view balance & corporate fare subsidy</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>

        <View style={styles.linkDivider} />

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

        <View style={styles.linkDivider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('Map')}
        >
          <View style={[styles.linkIconWrap, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="map-outline" size={20} color="#0284C7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>Live Route Map & GPS</Text>
            <Text style={styles.linkSub}>Explore live carpool routes and traffic</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>

        {user?.role === 'ADMIN' ? (
          <>
            <View style={styles.linkDivider} />
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation.navigate('Admin')}
            >
              <View style={[styles.linkIconWrap, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>Admin Console & Operations</Text>
                <Text style={styles.linkSub}>Enterprise analytics, verification & ride management</Text>
              </View>
              <Badge label="ADMIN" variant="purple" size="sm" />
              <Ionicons name="chevron-forward" size={18} color={colors.muted} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      {/* ── Saved Workplaces & Corridors (Editable Home & Office) ── */}
      <Card style={styles.placesCard}>
        <View style={styles.placesHeader}>
          <Text style={styles.sectionHeading}>Saved Workplaces & Corridors</Text>
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={styles.editActionText}>Change Addresses</Text>
          </TouchableOpacity>
        </View>

        {/* Home */}
        <TouchableOpacity
          style={styles.placeItem}
          onPress={() => setIsEditing(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.placeIconWrap, { backgroundColor: colors.greenLight }]}>
            <Ionicons name="home-outline" size={18} color={colors.green} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.placeTitle}>Home</Text>
              <Badge
                label={editForm.homeAddress || user?.homeAddress ? 'Primary' : 'Not Set'}
                variant={editForm.homeAddress || user?.homeAddress ? 'neutral' : 'warning'}
                size="sm"
              />
            </View>
            <Text
              style={[
                styles.placeSub,
                !(editForm.homeAddress || user?.homeAddress) && {
                  color: colors.muted,
                  fontStyle: 'italic',
                },
              ]}
              numberOfLines={2}
            >
              {editForm.homeAddress || user?.homeAddress || 'Not set • Tap to add Home location'}
            </Text>
          </View>
          <Ionicons name="pencil-outline" size={16} color={colors.muted} />
        </TouchableOpacity>

        {/* Office */}
        <TouchableOpacity
          style={styles.placeItem}
          onPress={() => setIsEditing(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.placeIconWrap, { backgroundColor: colors.blueLight }]}>
            <Ionicons name="briefcase-outline" size={18} color={colors.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.placeTitle}>Office / Workplace</Text>
              <Badge
                label={editForm.officeAddress || user?.officeAddress ? 'Workplace' : 'Not Set'}
                variant={editForm.officeAddress || user?.officeAddress ? 'neutral' : 'warning'}
                size="sm"
              />
            </View>
            <Text
              style={[
                styles.placeSub,
                !(editForm.officeAddress || user?.officeAddress) && {
                  color: colors.muted,
                  fontStyle: 'italic',
                },
              ]}
              numberOfLines={2}
            >
              {editForm.officeAddress || user?.officeAddress || 'Not set • Tap to add Workplace location'}
            </Text>
          </View>
          <Ionicons name="pencil-outline" size={16} color={colors.muted} />
        </TouchableOpacity>
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

      {/* ── Edit Profile & Addresses Modal ── */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Profile & Commute</Text>
                <Text style={styles.modalSub}>Update your personal info, home and office address</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingBottom: 20 }}
            >
              {/* Names */}
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="First Name"
                    placeholder="First name"
                    value={editForm.firstName}
                    onChangeText={(val) => setEditForm((p) => ({ ...p, firstName: val }))}
                    icon="person-outline"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Last Name"
                    placeholder="Last name"
                    value={editForm.lastName}
                    onChangeText={(val) => setEditForm((p) => ({ ...p, lastName: val }))}
                  />
                </View>
              </View>

              {/* Phone */}
              <Field
                label="Phone Number"
                placeholder="+91 98765 43210"
                value={editForm.phoneNumber}
                onChangeText={(val) => setEditForm((p) => ({ ...p, phoneNumber: val }))}
                keyboardType="phone-pad"
                icon="call-outline"
              />

              {/* Home Address */}
              <View>
                <View style={styles.labelWithGps}>
                  <Text style={styles.inputLabel}>Home Address</Text>
                  <TouchableOpacity
                    style={styles.gpsPill}
                    onPress={handleUseGpsForHome}
                    disabled={detectingGps}
                  >
                    {detectingGps ? (
                      <ActivityIndicator size="small" color={colors.green} />
                    ) : (
                      <>
                        <Ionicons name="locate" size={13} color={colors.green} />
                        <Text style={styles.gpsPillText}>Use Current GPS</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                <Field
                  placeholder="e.g. Koramangala 4th Block, Bengaluru"
                  value={editForm.homeAddress}
                  onChangeText={(val) => setEditForm((p) => ({ ...p, homeAddress: val }))}
                  icon="home-outline"
                />
              </View>

              {/* Office Address */}
              <View>
                <Text style={styles.inputLabel}>Office / Workplace Address</Text>
                <Field
                  placeholder="e.g. Electronic City Phase 1, Bengaluru"
                  value={editForm.officeAddress}
                  onChangeText={(val) => setEditForm((p) => ({ ...p, officeAddress: val }))}
                  icon="briefcase-outline"
                />

                {/* Quick corridor chips */}
                <View style={styles.quickChipsWrap}>
                  {officeQuickChips.map((chip) => (
                    <TouchableOpacity
                      key={chip}
                      style={[
                        styles.corridorChip,
                        editForm.officeAddress.includes(chip) && styles.corridorChipActive,
                      ]}
                      onPress={() => setEditForm((p) => ({ ...p, officeAddress: `${chip}, Bengaluru` }))}
                    >
                      <Text
                        style={[
                          styles.corridorChipText,
                          editForm.officeAddress.includes(chip) && styles.corridorChipTextActive,
                        ]}
                      >
                        {chip}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Actions */}
              <View style={styles.modalActionButtons}>
                <Button
                  title="Save Profile Details"
                  icon="checkmark-circle-outline"
                  loading={savingProfile}
                  onPress={handleSaveProfile}
                />
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={() => setIsEditing(false)}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.greenLight,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.green,
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
  placesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.green,
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
    padding: 12,
    borderRadius: spacing.radiusSm,
  },
  placeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  placeSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  modalSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  labelWithGps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.greenBorder,
  },
  gpsPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.greenText,
  },
  quickChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  corridorChip: {
    backgroundColor: colors.panelSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  corridorChipActive: {
    backgroundColor: colors.greenLight,
    borderColor: colors.green,
  },
  corridorChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  corridorChipTextActive: {
    color: colors.greenText,
    fontWeight: '700',
  },
  modalActionButtons: {
    gap: 8,
    marginTop: 10,
  },
});

