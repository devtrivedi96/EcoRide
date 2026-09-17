import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../utils/theme';

export default function Button({ title, onPress, loading, variant = 'primary', style }) {
  const isGhost = variant === 'ghost';
  return (
    <Pressable
      onPress={loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        isGhost ? styles.ghost : styles.primary,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? colors.blue : colors.text} />
      ) : (
        <Text style={[styles.text, isGhost && styles.ghostText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: colors.green,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.line,
  },
  pressed: {
    opacity: 0.76,
  },
  text: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  ghostText: {
    color: colors.blue,
  },
});
