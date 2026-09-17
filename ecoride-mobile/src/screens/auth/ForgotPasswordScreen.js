import React, { useState } from 'react';
import { Alert } from 'react-native';
import { authApi } from '../../api/authApi';
import Button from '../../components/Button';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import { getErrorMessage } from '../../utils/format';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const result = await authApi.forgotPassword(email.trim());
      Alert.alert('Request sent', result.message || 'If the email exists, reset instructions were created.');
    } catch (error) {
      Alert.alert('Could not request reset', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Field label="Work email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Button title="Request reset" onPress={submit} loading={loading} />
    </Screen>
  );
}
