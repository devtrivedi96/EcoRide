import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../utils/theme';

export default function Field({ label, error, style, inputStyle, ...props }) {
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#64748B"
        autoCapitalize="none"
        style={[styles.input, inputStyle]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 7,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panelSoft,
    color: colors.text,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  error: {
    color: colors.red,
    fontSize: 12,
  },
});
