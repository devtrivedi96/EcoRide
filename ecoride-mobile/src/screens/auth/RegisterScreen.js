import React, { useState } from 'react';
import {
  Alert,
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

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: 'Acme Corp',
    phoneNumber: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  function setValue(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    if (errorMsg) setErrorMsg(null);
  }

  async function submit() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password) {
      setErrorMsg('First name, last name, work email, and password are required.');
      return;
    }
    setLoading(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        companyName: form.companyName.trim() || undefined,
        phoneNumber: form.phoneNumber.trim() || undefined,
        password: form.password,
      });
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Create Corporate Account</Text>
        <Text style={styles.subtitle}>
          Join colleagues on Bengaluru's intelligent corporate carpool network.
        </Text>
      </View>

      {/* ── Progress Stepper Indicator (Req 5) ── */}
      <View style={styles.stepsRow}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepNum}>1</Text>
          <Text style={styles.stepText}>Profile</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepBadge}>
          <Text style={styles.stepNum}>2</Text>
          <Text style={styles.stepText}>Company</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepBadge}>
          <Text style={styles.stepNum}>3</Text>
          <Text style={styles.stepText}>Security</Text>
        </View>
      </View>

      {/* ── Form Card ── */}
      <Card style={styles.card}>
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={colors.red} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <Field
            label="First Name"
            placeholder="John"
            value={form.firstName}
            onChangeText={(v) => setValue('firstName', v)}
            style={styles.flex}
          />
          <Field
            label="Last Name"
            placeholder="Doe"
            value={form.lastName}
            onChangeText={(v) => setValue('lastName', v)}
            style={styles.flex}
          />
        </View>

        <Field
          label="Corporate Work Email"
          placeholder="john.doe@company.com"
          value={form.email}
          onChangeText={(v) => setValue('email', v)}
          keyboardType="email-address"
          icon="mail-outline"
        />

        <Field
          label="Company Name"
          placeholder="e.g. Acme Corp, Infosys, TCS"
          value={form.companyName}
          onChangeText={(v) => setValue('companyName', v)}
          icon="business-outline"
        />

        <Field
          label="Phone Number"
          placeholder="+91 98765 43210"
          value={form.phoneNumber}
          onChangeText={(v) => setValue('phoneNumber', v)}
          keyboardType="phone-pad"
          icon="call-outline"
        />

        <Field
          label="Password"
          placeholder="Minimum 6 characters"
          value={form.password}
          onChangeText={(v) => setValue('password', v)}
          secureTextEntry
          icon="lock-closed-outline"
        />

        <Button
          title="Create account"
          icon="checkmark-circle-outline"
          onPress={submit}
          loading={loading}
          size="lg"
        />
      </Card>

      <Button
        title="Already have an account? Sign in"
        variant="ghost"
        onPress={() => navigation.navigate('Login')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 24,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.panel,
    padding: 12,
    borderRadius: spacing.radius,
    borderWidth: 1,
    borderColor: colors.line,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.greenLight,
    color: colors.green,
    fontWeight: '800',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
    marginHorizontal: 8,
  },
  card: {
    padding: 20,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex: {
    flex: 1,
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
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
