import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../utils/theme';
import Button from './Button';

export default function EmptyState({
  icon = 'file-tray-outline',
  title,
  body,
  action,
  onAction,
  actionIcon,
  style,
}) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={32} color={colors.green} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {action ? (
        <Button
          title={action}
          icon={actionIcon}
          onPress={onAction}
          variant="primary"
          size="sm"
          style={styles.button}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: colors.panel,
    borderRadius: spacing.radius,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    gap: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.greenLight,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 280,
  },
  button: {
    marginTop: 8,
  },
});
