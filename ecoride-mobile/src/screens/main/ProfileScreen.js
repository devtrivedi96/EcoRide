import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { userApi } from '../../api/userApi';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../utils/theme';
import { getErrorMessage } from '../../utils/format';

export default function ProfileScreen() {
  const { user, refreshMe, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');

  async function resetPassword() {
    if (!newPassword) return;
    try {
      await userApi.resetPassword(newPassword);
      setNewPassword('');
      Alert.alert('Password updated', 'Use the new password next time you sign in.');
    } catch (error) {
      Alert.alert('Could not update password', getErrorMessage(error));
    }
  }

  async function refresh() {
    try {
      await refreshMe();
    } catch (error) {
      Alert.alert('Refresh failed', getErrorMessage(error));
    }
  }

  return (
    <Screen contentStyle={{ paddingBottom: 90 }}>
      <Card>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>{user?.phoneNumber || 'No phone number'}</Text>
        <Text style={styles.badge}>{user?.role || 'EMPLOYEE'} · {user?.companyName || 'No company'}</Text>
      </Card>
      <Card>
        <Text style={styles.section}>Security</Text>
        <Field label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        <Button title="Update password" onPress={resetPassword} />
      </Card>
      <Button title="Refresh profile" variant="ghost" onPress={refresh} />
      <Button title="Sign out" variant="ghost" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  meta: {
    color: colors.muted,
  },
  badge: {
    color: colors.green,
    fontWeight: '900',
  },
  section: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
  },
});
