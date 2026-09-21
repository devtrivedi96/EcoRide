import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../utils/theme';

export default function Field({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  onLocationPress,
  style,
  inputStyle,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.labelRow}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        {onLocationPress ? (
          <TouchableOpacity
            onPress={onLocationPress}
            style={styles.currentLocBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="locate" size={13} color={colors.green} />
            <Text style={styles.currentLocText}>Current Location</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {icon ? (
          <View style={styles.iconBox}>
            <Ionicons
              name={icon}
              size={18}
              color={isFocused ? colors.green : colors.muted}
            />
          </View>
        ) : null}

        <TextInput
          placeholderTextColor={colors.subtle}
          autoCapitalize="none"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, inputStyle]}
          {...props}
        />

        {rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.trailingIconBox}
            activeOpacity={0.7}
          >
            <Ionicons
              name={rightIcon}
              size={18}
              color={colors.muted}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={13} color={colors.red} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  currentLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: spacing.radiusFull,
  },
  currentLocText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.greenText,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: colors.green,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: colors.red,
    backgroundColor: colors.redLight,
  },
  iconBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  trailingIconBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  error: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '500',
  },
});
