import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Screen from '../../components/Screen';
import Stat from '../../components/Stat';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { colors, spacing } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';

export default function SustainabilityScreen({ navigation }) {
  const { user } = useAuth();

  return (
    <Screen contentStyle={styles.content}>
      {/* ── Impact Spotlight Card ── */}
      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.leafCircle}>
            <Ionicons name="leaf" size={28} color="#FFFFFF" />
          </View>
          <Badge label="Top 5% Eco Leader" variant="green" icon="ribbon-outline" />
        </View>

        <Text style={styles.heroTitle}>Your Corporate Eco Score</Text>
        <Text style={styles.heroSub}>
          Thank you, {user?.firstName || 'Alice'}! Every carpool reduces Bengaluru's traffic congestion and urban emissions.
        </Text>

        <View style={styles.heroMetricRow}>
          <View>
            <Text style={styles.heroMetricValue}>84.2 kg</Text>
            <Text style={styles.heroMetricLabel}>Total CO₂ Prevented</Text>
          </View>
          <View style={styles.heroMetricDivider} />
          <View>
            <Text style={styles.heroMetricValue}>~4.2</Text>
            <Text style={styles.heroMetricLabel}>Mature Trees Equivalent</Text>
          </View>
        </View>
      </Card>

      {/* ── Core Stats Grid ── */}
      <Text style={styles.sectionTitle}>Key Environmental Metrics</Text>
      <View style={styles.statsGrid}>
        <Stat
          label="Fuel Conserved"
          value="36.5 L"
          icon="water-outline"
          color={colors.blue}
          subtext="₹3,720 saved"
        />
        <Stat
          label="Shared Rides"
          value="18"
          icon="car-sport-outline"
          color={colors.green}
          subtext="Zero solo drives"
        />
      </View>
      <View style={styles.statsGrid}>
        <Stat
          label="Commute Cost Saved"
          value="₹4,850"
          icon="wallet-outline"
          color={colors.amber}
          subtext="vs Cabs / Autos"
        />
        <Stat
          label="Clean Distance"
          value="420 km"
          icon="navigate-outline"
          color="#8B5CF6"
          subtext="Carpool corridors"
        />
      </View>

      {/* ── Visual Progress Card ── */}
      <Card>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeaderTitle}>Monthly Green Goal</Text>
          <Text style={styles.goalPercent}>84% Achieved</Text>
        </View>
        <Text style={styles.goalSub}>Target: 100 kg CO₂ reduction this month</Text>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '84%' }]} />
        </View>

        <View style={styles.progressMilestones}>
          <Text style={styles.milestoneText}>0 kg</Text>
          <Text style={styles.milestoneText}>50 kg (Bronze)</Text>
          <Text style={styles.milestoneText}>100 kg (Silver)</Text>
        </View>
      </Card>

      {/* ── Eco Tips ── */}
      <Card style={styles.tipsCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="sparkles" size={20} color={colors.green} />
          <Text style={styles.tipsHeading}>EcoRide Sustainability Tip</Text>
        </View>
        <Text style={styles.tipsBody}>
          Sharing an electric vehicle (EV) commute between Koramangala and Electronic City cuts emissions by over 92% compared to single-occupancy petrol vehicles.
        </Text>
      </Card>

      <Button
        title="Find More Carpools"
        icon="search-outline"
        size="lg"
        onPress={() => navigation.navigate('Find')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#064E3B',
    borderColor: '#065F46',
    padding: 20,
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leafCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroSub: {
    fontSize: 13,
    color: '#A7F3D0',
    lineHeight: 19,
  },
  heroMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: spacing.radiusSm,
    padding: 14,
    marginTop: 6,
  },
  heroMetricDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroMetricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroMetricLabel: {
    fontSize: 11,
    color: '#D1FAE5',
    marginTop: 2,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  goalPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.green,
  },
  goalSub: {
    fontSize: 12,
    color: colors.muted,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: colors.panelSoft,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.green,
    borderRadius: 5,
  },
  progressMilestones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  milestoneText: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
  },
  tipsCard: {
    backgroundColor: colors.panelSoft,
    gap: 8,
  },
  tipsHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  tipsBody: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
  },
});
