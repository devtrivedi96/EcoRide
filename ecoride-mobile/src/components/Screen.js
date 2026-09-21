import React from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../utils/theme';

export default function Screen({
  children,
  scroll = true,
  style,
  contentStyle,
  refreshControl,
  keyboardAvoiding = true,
}) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
  );

  const inner = keyboardAvoiding && Platform.OS === 'ios' ? (
    <KeyboardAvoidingView behavior="padding" style={styles.flex}>
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return <SafeAreaView style={[styles.safe, style]}>{inner}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  content: {
    padding: spacing.page,
    gap: 14,
  },
  flex: {
    flex: 1,
  },
});
