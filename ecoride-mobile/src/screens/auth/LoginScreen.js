import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import Badge from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../utils/theme';
import { getErrorMessage } from '../../utils/format';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('alice@acme.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  async function submit() {
    setErrorMessage(null);
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both work email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function prefill(testEmail) {
    setEmail(testEmail);
    setPassword('password123');
    setErrorMessage(null);
  }

  return (
    <Screen contentStyle={styles.content}>
      {/* ── Brand Hero ── */}
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Ionicons name="leaf" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.brandName}>EcoRide</Text>
        <Text style={styles.tagline}>Intelligent Corporate Ride Sharing</Text>
        <Badge label="Enterprise Commute Platform" variant="green" size="sm" />
      </View>

      {/* ── Login Form Card ── */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Sign in to your account</Text>

        {/* Inline Error Display (Requirement 4) */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={colors.red} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Field
          label="Corporate Email"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (errorMessage) setErrorMessage(null);
          }}
          keyboardType="email-address"
          icon="mail-outline"
          placeholder="e.g. employee@company.com"
        />

        <Field
          label="Password"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (errorMessage) setErrorMessage(null);
          }}
          secureTextEntry
          icon="lock-closed-outline"
          placeholder="••••••••"
        />

        <Button
          title="Sign in"
          icon="log-in-outline"
          onPress={submit}
          loading={loading}
          size="lg"
        />

        {/* Quick Test Logins */}
        <View style={styles.demoSection}>
          <Text style={styles.demoLabel}>Quick demo login:</Text>
          <View style={styles.demoChips}>
            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => prefill('alice@acme.com')}
            >
              <Text style={styles.demoChipText}>Alice (Employee)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => prefill('rajan@acme.com')}
            >
              <Text style={styles.demoChipText}>Rajan (Driver)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* ── Auth Navigation Links ── */}
      <View style={styles.links}>
        <Button
          title="New to EcoRide? Create account"
          variant="ghost"
          onPress={() => navigation.navigate('Register')}
        />
        <Button
          title="Forgot password?"
          variant="ghost"
          onPress={() => navigation.navigate('ForgotPassword')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 4,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 4,
  },
  card: {
    padding: 20,
    gap: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.redLight,
    borderColor: colors.redBorder,
    borderWidth: 1,
    padding: 10,
    borderRadius: spacing.radiusSm,
  },
  errorText: {
    color: colors.redText,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  demoSection: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: 6,
  },
  demoLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  demoChips: {
    flexDirection: 'row',
    gap: 8,
  },
  demoChip: {
    backgroundColor: colors.panelSoft,
    borderColor: colors.line,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: spacing.radiusFull,
  },
  demoChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  links: {
    gap: 8,
  },
});
