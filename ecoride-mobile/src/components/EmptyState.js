import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/theme';
import Button from './Button';

export default function EmptyState({ title, body, action, onAction }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {action ? <Button title={action} onPress={onAction} variant="ghost" style={styles.button} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
  },
});
