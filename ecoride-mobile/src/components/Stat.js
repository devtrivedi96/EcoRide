import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/theme';

export default function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stat: {
    flex: 1,
    minHeight: 72,
    borderRadius: 8,
    backgroundColor: colors.panelSoft,
    padding: 12,
    justifyContent: 'center',
  },
  value: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  label: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 12,
  },
});
