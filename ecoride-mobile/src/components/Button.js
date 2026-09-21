import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing } from '../utils/theme';

export default function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  size = 'md',
  style,
  textStyle,
}) {
  const isGhost = variant === 'ghost' || variant === 'outline';
  const isSubtle = variant === 'subtle';
  const isDanger = variant === 'danger';
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const isDisabled = disabled || loading;

  const getContainerStyle = (pressed) => [
    styles.button,
    variant === 'primary' && styles.primary,
    isGhost && styles.ghost,
    isSubtle && styles.subtle,
    isDanger && styles.danger,
    variant === 'primary' && !isDisabled && shadows.sm,
    isSmall && styles.sizeSm,
    isLarge && styles.sizeLg,
    isDisabled && styles.disabled,
    pressed && !isDisabled && styles.pressed,
    style,
  ];

  const getTextColor = () => {
    if (isDisabled) return colors.subtle;
    if (isGhost) return colors.text;
    if (isSubtle) return colors.green;
    if (isDanger) return colors.red;
    return '#FFFFFF';
  };

  const textColor = getTextColor();

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      style={({ pressed }) => getContainerStyle(pressed)}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' ? (
            <Ionicons
              name={icon}
              size={isSmall ? 14 : isLarge ? 18 : 16}
              color={textColor}
              style={styles.iconLeft}
            />
          ) : null}
          <Text
            style={[
              styles.text,
              { color: textColor },
              isSmall && styles.textSm,
              isLarge && styles.textLg,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' ? (
            <Ionicons
              name={icon}
              size={isSmall ? 14 : isLarge ? 18 : 16}
              color={textColor}
              style={styles.iconRight}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    borderRadius: spacing.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.green,
    borderWidth: 1,
    borderColor: colors.greenHover,
  },
  ghost: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  subtle: {
    backgroundColor: colors.greenLight,
    borderWidth: 1,
    borderColor: colors.greenBorder,
  },
  danger: {
    backgroundColor: colors.redLight,
    borderWidth: 1,
    borderColor: colors.redBorder,
  },
  sizeSm: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  sizeLg: {
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: spacing.radius,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    backgroundColor: colors.panelSoft,
    borderColor: colors.line,
    opacity: 0.65,
  },
  text: {
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.1,
  },
  textSm: {
    fontSize: 12,
  },
  textLg: {
    fontSize: 16,
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
});
