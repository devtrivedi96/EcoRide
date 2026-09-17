import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../utils/theme';
import { getErrorMessage } from '../../utils/format';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('alice@acme.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      Alert.alert('Login failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.brand}>EcoRide</Text>
        <Text style={styles.copy}>Corporate rides, shared cleanly.</Text>
      </View>
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Sign in" onPress={submit} loading={loading} />
      <Button title="Create account" variant="ghost" onPress={() => navigation.navigate('Register')} />
      <Button title="Forgot password" variant="ghost" onPress={() => navigation.navigate('ForgotPassword')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  hero: {
    marginBottom: 12,
    gap: 8,
  },
  brand: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '900',
  },
  copy: {
    color: colors.muted,
    fontSize: 16,
  },
});
