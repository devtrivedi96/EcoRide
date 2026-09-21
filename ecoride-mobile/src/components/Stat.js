import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing } from '../utils/theme';

export default function Stat({ label, value, icon, subtext, color = colors.green, style }) {
  return (
    <View style={[styles.stat, shadows.sm, style]}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: `${color}15` }]}>
            <Ionicons name={icon} size={15} color={color} />
          </View>
        ) : null}
      </View>
      <Text style={styles.value}>{value}</Text>
      {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stat: {
    flex: 1,
    minHeight: 80,
    borderRadius: spacing.radius,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtext: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
