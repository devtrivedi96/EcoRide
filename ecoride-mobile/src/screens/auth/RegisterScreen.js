import React, { useState } from 'react';
import { Alert } from 'react-native';
import Button from '../../components/Button';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/format';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  function setValue(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      Alert.alert('Missing details', 'First name, last name, email and password are required.');
      return;
    }
    setLoading(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        password: form.password,
      });
    } catch (error) {
      Alert.alert('Registration failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Field label="First name" value={form.firstName} onChangeText={(v) => setValue('firstName', v)} />
      <Field label="Last name" value={form.lastName} onChangeText={(v) => setValue('lastName', v)} />
      <Field label="Work email" value={form.email} onChangeText={(v) => setValue('email', v)} keyboardType="email-address" />
      <Field label="Phone number" value={form.phoneNumber} onChangeText={(v) => setValue('phoneNumber', v)} keyboardType="phone-pad" />
      <Field label="Password" value={form.password} onChangeText={(v) => setValue('password', v)} secureTextEntry />
      <Button title="Create account" onPress={submit} loading={loading} />
    </Screen>
  );
}
