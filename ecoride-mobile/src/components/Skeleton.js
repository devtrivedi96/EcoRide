import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../utils/theme';

export function SkeletonItem({ width = '100%', height = 16, borderRadius = 6, style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonRideCard() {
  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <SkeletonItem width="55%" height={20} />
        <SkeletonItem width={60} height={20} />
      </View>
      <View style={{ gap: 6, marginVertical: 10 }}>
        <SkeletonItem width="40%" height={14} />
        <SkeletonItem width="70%" height={14} />
        <SkeletonItem width="50%" height={14} />
      </View>
      <View style={styles.rowBetween}>
        <SkeletonItem width="35%" height={16} />
        <SkeletonItem width={90} height={36} borderRadius={8} />
      </View>
    </View>
  );
}

export function SkeletonDashboard() {
  return (
    <View style={{ gap: 16 }}>
      {/* Profile Card Skeleton */}
      <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
        <SkeletonItem width={56} height={56} borderRadius={28} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonItem width="40%" height={14} />
          <SkeletonItem width="65%" height={20} />
          <SkeletonItem width="50%" height={14} />
        </View>
      </View>

      {/* Stats Skeleton */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={[styles.statBox, { flex: 1 }]}>
          <SkeletonItem width={40} height={24} />
          <SkeletonItem width={70} height={12} style={{ marginTop: 8 }} />
        </View>
        <View style={[styles.statBox, { flex: 1 }]}>
          <SkeletonItem width={40} height={24} />
          <SkeletonItem width={70} height={12} style={{ marginTop: 8 }} />
        </View>
        <View style={[styles.statBox, { flex: 1 }]}>
          <SkeletonItem width={40} height={24} />
          <SkeletonItem width={70} height={12} style={{ marginTop: 8 }} />
        </View>
      </View>

      {/* Quick Action buttons skeleton */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <SkeletonItem width="48%" height={48} borderRadius={10} />
        <SkeletonItem width="48%" height={48} borderRadius={10} />
      </View>

      {/* Ride list skeletons */}
      <SkeletonRideCard />
      <SkeletonRideCard />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E2E8F0',
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: spacing.radius,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.page,
  },
  statBox: {
    backgroundColor: colors.panel,
    borderRadius: spacing.radius,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
