import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors, shadows, spacing } from '../utils/theme';

export default function Card({ children, style, onPress, activeOpacity = 0.82 }) {
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        style={[styles.card, shadows.card, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, shadows.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.radius,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: spacing.page,
    gap: 10,
  },
});
