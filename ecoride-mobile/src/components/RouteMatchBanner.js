import React, { useEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../utils/theme';
import { currency } from '../utils/format';
import { navigate } from '../navigation/navigationRef';

export default function RouteMatchBanner({ match, onDismiss }) {
  const [slideAnim] = useState(new Animated.Value(-120));

  useEffect(() => {
    if (!match) return;

    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
    }).start();

    const timer = setTimeout(() => {
      handleDismiss();
    }, 9000);

    return () => clearTimeout(timer);
  }, [match]);

  if (!match) return null;

  function handleDismiss() {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  }

  function handleViewRide() {
    handleDismiss();
    navigate('Find', {
      pickupLocation: match.pickup,
      destination: match.destination,
    });
  }

  const driverName = match.driverName || 'Colleague Driver';
  const pickup = match.pickup || 'Pickup Point';
  const destination = match.destination || 'Destination';
  const fare = match.fare || 80;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.card}>
        <View style={styles.leftRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="car" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeText}>🚗 ROUTE MATCH FOUND</Text>
              <Text style={styles.fareText}>{currency(fare)}/seat</Text>
            </View>
            <Text style={styles.titleText}>
              {driverName} is driving along your route!
            </Text>
            <Text style={styles.routeText} numberOfLines={1}>
              {pickup} → {destination}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.viewBtn} onPress={handleViewRide}>
            <Text style={styles.viewBtnText}>View Matches</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss}>
            <Ionicons name="close" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 1.5,
    borderColor: colors.blueBorder || '#BFDBFE',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  fareText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.greenText,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  routeText: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 8,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: spacing.radiusFull,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 6,
  },
});
