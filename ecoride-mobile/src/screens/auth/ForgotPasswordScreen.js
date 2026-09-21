import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../api/authApi';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import { colors, spacing } from '../../utils/theme';
import { getErrorMessage } from '../../utils/format';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    if (!email.trim()) {
      Alert.alert('Missing Email', 'Enter your registered work email.');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (error) {
      Alert.alert('Request Failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="key-outline" size={28} color={colors.green} />
        </View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your corporate email and we will send you instructions to reset your password.
        </Text>
      </View>

      <Card style={styles.card}>
        {submitted ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={24} color={colors.green} />
            <Text style={styles.successTitle}>Reset link sent!</Text>
            <Text style={styles.successSub}>
              If an account exists for {email}, you will receive an email shortly with instructions.
            </Text>
          </View>
        ) : (
          <>
            <Field
              label="Work Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              icon="mail-outline"
              placeholder="e.g. employee@company.com"
            />
            <Button
              title="Send Reset Instructions"
              icon="paper-plane-outline"
              onPress={submit}
              loading={loading}
              size="lg"
            />
          </>
        )}
      </Card>

      <Button
        title="Back to Sign In"
        variant="ghost"
        icon="arrow-back"
        onPress={() => navigation.goBack()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 30,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.greenLight,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 18,
  },
  card: {
    padding: 20,
    gap: 14,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  successSub: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
