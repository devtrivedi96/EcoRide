import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../utils/theme';

export default function Badge({ label, variant = 'neutral', icon, size = 'md', style, textStyle }) {
  const variantStyles = {
    green: {
      bg: colors.greenLight,
      border: colors.greenBorder,
      text: colors.greenText,
      iconColor: colors.green,
    },
    amber: {
      bg: colors.amberLight,
      border: colors.amberBorder,
      text: colors.amberText,
      iconColor: colors.amber,
    },
    blue: {
      bg: colors.blueLight,
      border: colors.blueBorder,
      text: colors.blueText,
      iconColor: colors.blue,
    },
    red: {
      bg: colors.redLight,
      border: colors.redBorder,
      text: colors.redText,
      iconColor: colors.red,
    },
    purple: {
      bg: colors.purpleLight,
      border: '#DDD6FE',
      text: colors.purple,
      iconColor: colors.purple,
    },
    neutral: {
      bg: colors.panelSoft,
      border: colors.line,
      text: colors.textSecondary,
      iconColor: colors.muted,
    },
  }[variant] || {
    bg: colors.panelSoft,
    border: colors.line,
    text: colors.textSecondary,
    iconColor: colors.muted,
  };

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyles.bg,
          borderColor: variantStyles.border,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 6 : 8,
        },
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={isSmall ? 10 : 12}
          color={variantStyles.iconColor}
          style={styles.icon}
        />
      ) : null}
      <Text
        style={[
          styles.text,
          {
            color: variantStyles.text,
            fontSize: isSmall ? 10 : 11,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.radiusFull,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});
