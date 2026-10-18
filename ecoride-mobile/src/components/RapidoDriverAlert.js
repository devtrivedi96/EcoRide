import React, { useEffect, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../utils/theme';
import { currency } from '../utils/format';

export default function EcoRideDriverAlert({ alert, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!alert) return;

    // Urgent high-priority driver vibration pattern
    Vibration.vibrate([0, 500, 200, 500, 200, 600]);

    setTimeLeft(30);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [alert]);

  if (!alert) return null;

  const fareAmount = alert.fare || 120;
  const seats = alert.seats || 1;
  const passengerName = alert.passengerName || 'Colleague Passenger';
  const pickup = alert.pickup || 'Silk Board Junction';
  const destination = alert.destination || 'Electronic City Phase 1';
  const progressPercent = Math.max(0, (timeLeft / 30) * 100);

  return (
    <Modal visible={Boolean(alert)} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* EcoRide Top Alert Banner */}
          <View style={styles.topBadgeRow}>
            <View style={styles.pulsingBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.pulsingBadgeText}>🚨 ECORIDE DRIVER ALERT</Text>
            </View>
            <View style={styles.timerBadge}>
              <Ionicons name="time-outline" size={14} color={colors.amberText} />
              <Text style={styles.timerText}>{timeLeft}s</Text>
            </View>
          </View>

          {/* Countdown Progress Bar */}
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          {/* Total Fare & Seats Callout */}
          <View style={styles.fareHeroBox}>
            <View>
              <Text style={styles.fareHeroLabel}>Guaranteed Earning</Text>
              <Text style={styles.fareHeroAmount}>{currency(fareAmount)}</Text>
            </View>
            <View style={styles.seatsBadge}>
              <Ionicons name="person" size={14} color={colors.greenText} />
              <Text style={styles.seatsBadgeText}>{seats} Seat{seats > 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* Passenger Information */}
          <View style={styles.passengerRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.passengerName}>{passengerName}</Text>
              <View style={styles.passengerMetaRow}>
                <Ionicons name="shield-checkmark" size={13} color={colors.green} />
                <Text style={styles.passengerMetaText}>Verified Corporate Employee · 4.9 ★</Text>
              </View>
            </View>
          </View>

          {/* Route Card */}
          <View style={styles.routeBox}>
            <View style={styles.routeStop}>
              <View style={[styles.stopDot, { backgroundColor: colors.green }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stopLabel}>PICKUP</Text>
                <Text style={styles.stopLocation} numberOfLines={1}>{pickup}</Text>
              </View>
            </View>

            <View style={styles.stopDivider} />

            <View style={styles.routeStop}>
              <View style={[styles.stopDot, { backgroundColor: colors.purple }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stopLabel}>DESTINATION</Text>
                <Text style={styles.stopLocation} numberOfLines={1}>{destination}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons (Accept vs Decline) */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
              <Ionicons name="close" size={20} color={colors.muted} />
              <Text style={styles.declineBtnText}>Pass</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => onAccept(alert)}
            >
              <Ionicons name="checkmark-done" size={22} color="#FFFFFF" />
              <Text style={styles.acceptBtnText}>ACCEPT RIDE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pulsingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: spacing.radiusFull,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  pulsingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.greenText,
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.amberLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: spacing.radiusFull,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.amberText,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: colors.line,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: colors.green,
    borderRadius: 2,
  },
  fareHeroBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.panelSoft,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  fareHeroLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fareHeroAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  seatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  seatsBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.greenText,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  passengerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  passengerMetaText: {
    fontSize: 12,
    color: colors.muted,
  },
  routeBox: {
    backgroundColor: colors.ink,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  routeStop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stopDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stopDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.line,
    marginLeft: 4.5,
  },
  stopLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 0.5,
  },
  stopLocation: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  declineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: colors.green,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
