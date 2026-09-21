import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rideApi } from '../../api/rideApi';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import { colors, spacing } from '../../utils/theme';
import { currency, formatDateTime, getErrorMessage } from '../../utils/format';
import { MOCK_VEHICLES } from '../../mock/mockData';
import { getCurrentUserAddress } from '../../utils/location';

const STEPS = [
  { id: 1, label: 'Route', icon: 'map-outline' },
  { id: 2, label: 'Schedule', icon: 'calendar-outline' },
  { id: 3, label: 'Vehicle', icon: 'car-outline' },
  { id: 4, label: 'Pricing', icon: 'pricetag-outline' },
  { id: 5, label: 'Review', icon: 'checkmark-circle-outline' },
];

export default function PublishRideScreen({ route, navigation }) {
  const defaultVehicleId = route.params?.vehicleId || 'veh-001';

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [publishedRide, setPublishedRide] = useState(null);

  // Form State preserved across all steps
  const [form, setForm] = useState({
    vehicleId: defaultVehicleId,
    pickupLocation: '',
    destination: 'Electronic City',
    departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    availableSeats: '3',
    farePerSeat: '80',
    routeWaypoints: 'Silk Board, HSR Layout',
    preferences: ['AC', 'Quiet Ride', 'No Smoking'],
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getCurrentUserAddress();
        if (res?.address) {
          setValue('pickupLocation', res.address);
        }
      } catch (err) {
        console.warn('PublishRide auto-detect location error:', err);
      }
    })();
  }, []);

  function setValue(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleUseCurrentLocation() {
    try {
      const res = await getCurrentUserAddress();
      if (res?.address) {
        setValue('pickupLocation', res.address);
      } else {
        Alert.alert('Location Notice', 'Could not detect your current GPS location.');
      }
    } catch {
      Alert.alert('Location Error', 'Unable to retrieve your current location.');
    }
  }

  // Navigation between steps with validation
  function handleNext() {
    if (currentStep === 1) {
      if (!form.pickupLocation.trim() || !form.destination.trim()) {
        Alert.alert('Missing Details', 'Please provide both pickup and destination locations.');
        return;
      }
    } else if (currentStep === 2) {
      if (!form.departureTime) {
        Alert.alert('Missing Details', 'Please select a departure date & time.');
        return;
      }
    } else if (currentStep === 3) {
      if (!form.vehicleId.trim()) {
        Alert.alert('Missing Details', 'Please select or enter a vehicle ID.');
        return;
      }
    } else if (currentStep === 4) {
      if (!form.availableSeats || !form.farePerSeat) {
        Alert.alert('Missing Details', 'Please enter available seats and fare per seat.');
        return;
      }
    }
    setCurrentStep((s) => Math.min(5, s + 1));
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(1, s - 1));
  }

  async function handlePublish() {
    setLoading(true);
    try {
      const payload = {
        vehicleId: form.vehicleId.trim(),
        pickupLocation: form.pickupLocation.trim(),
        destination: form.destination.trim(),
        departureTime: new Date(form.departureTime).toISOString(),
        availableSeats: Number(form.availableSeats),
        farePerSeat: Number(form.farePerSeat),
        routeWaypoints: form.routeWaypoints.trim() || undefined,
      };

      const result = await rideApi.publish(payload);
      setPublishedRide(result || payload);
    } catch (error) {
      Alert.alert('Could not publish ride', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  // ── SCREEN 12: RIDE PUBLISHED SCREEN ─────────────────────────────────────────
  if (publishedRide) {
    return (
      <Screen contentStyle={styles.publishedContent}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark-done" size={44} color="#FFFFFF" />
        </View>

        <Text style={styles.publishedTitle}>Ride Published!</Text>
        <Text style={styles.publishedSub}>
          Your corporate ride is now searchable and matching colleagues can send booking requests.
        </Text>

        <Card style={styles.summaryCard}>
          <View style={styles.publishedBadgeRow}>
            <Badge label="Active Listing" variant="green" icon="radio-outline" />
            <Text style={styles.fareHighlight}>{currency(form.farePerSeat)} / seat</Text>
          </View>

          <View style={styles.routeBox}>
            <Text style={styles.routeLocation}>{form.pickupLocation}</Text>
            <Ionicons name="arrow-down" size={16} color={colors.green} style={{ marginVertical: 4 }} />
            <Text style={styles.routeLocation}>{form.destination}</Text>
          </View>

          <View style={styles.summaryMetaRow}>
            <View>
              <Text style={styles.metaLabel}>Departure</Text>
              <Text style={styles.metaVal}>{formatDateTime(form.departureTime)}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Seats Available</Text>
              <Text style={styles.metaVal}>{form.availableSeats} seats</Text>
            </View>
          </View>
        </Card>

        <View style={styles.publishedActions}>
          <Button
            title="Manage Driver Requests"
            icon="people-outline"
            size="lg"
            onPress={() => navigation.navigate('DriverTrips')}
          />
          <Button
            title="Back to Dashboard"
            variant="ghost"
            icon="home-outline"
            size="lg"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          />
        </View>
      </Screen>
    );
  }

  // ── STEPPER FORM ─────────────────────────────────────────────────────────────
  return (
    <Screen contentStyle={styles.content}>
      {/* ── Stepper Header ── */}
      <View style={styles.stepperContainer}>
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;
          return (
            <React.Fragment key={step.id}>
              <TouchableOpacity
                onPress={() => isDone && setCurrentStep(step.id)}
                style={styles.stepItem}
              >
                <View
                  style={[
                    styles.stepCircle,
                    isActive && styles.stepCircleActive,
                    isDone && styles.stepCircleDone,
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.stepNum,
                        isActive && styles.stepNumActive,
                      ]}
                    >
                      {step.id}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
              </TouchableOpacity>
              {idx < STEPS.length - 1 ? (
                <View
                  style={[
                    styles.stepLine,
                    isDone && styles.stepLineDone,
                  ]}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>

      {/* ── STEP 1: ROUTE ── */}
      {currentStep === 1 && (
        <Card style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Badge label="Step 1 of 5" variant="green" size="sm" />
            <Text style={styles.stepTitle}>Enter Carpool Route</Text>
            <Text style={styles.stepDesc}>
              Define your start location, final destination, and key pickup stops along the way.
            </Text>
          </View>

          <Field
            label="Pickup Location"
            icon="navigate-outline"
            placeholder="e.g. Koramangala, Indiranagar"
            value={form.pickupLocation}
            onChangeText={(v) => setValue('pickupLocation', v)}
            onLocationPress={handleUseCurrentLocation}
          />

          <Field
            label="Destination"
            icon="flag-outline"
            placeholder="e.g. Electronic City, Whitefield"
            value={form.destination}
            onChangeText={(v) => setValue('destination', v)}
          />

          <Field
            label="Route Waypoints (Stops)"
            icon="git-commit-outline"
            placeholder="e.g. Silk Board, HSR Layout (comma-separated)"
            value={form.routeWaypoints}
            onChangeText={(v) => setValue('routeWaypoints', v)}
          />

          {/* Quick presets */}
          <View style={styles.presetsBox}>
            <Text style={styles.presetTitle}>Popular Corridors:</Text>
            <View style={styles.presetChips}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => {
                  setValue('pickupLocation', 'Koramangala');
                  setValue('destination', 'Electronic City');
                  setValue('routeWaypoints', 'Silk Board, HSR Layout');
                }}
              >
                <Text style={styles.presetChipText}>Koramangala → E-City</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => {
                  setValue('pickupLocation', 'Indiranagar');
                  setValue('destination', 'Whitefield');
                  setValue('routeWaypoints', 'Marathahalli');
                }}
              >
                <Text style={styles.presetChipText}>Indiranagar → Whitefield</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      )}

      {/* ── STEP 2: SCHEDULE ── */}
      {currentStep === 2 && (
        <Card style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Badge label="Step 2 of 5" variant="green" size="sm" />
            <Text style={styles.stepTitle}>Select Date & Departure Time</Text>
            <Text style={styles.stepDesc}>
              Set when you will begin driving from your pickup point.
            </Text>
          </View>

          <Field
            label="Departure Time (ISO Format)"
            icon="time-outline"
            value={form.departureTime}
            onChangeText={(v) => setValue('departureTime', v)}
          />

          <View style={styles.schedulePreviewBox}>
            <Ionicons name="calendar" size={18} color={colors.green} />
            <View>
              <Text style={styles.schedulePreviewLabel}>Selected Departure</Text>
              <Text style={styles.schedulePreviewVal}>
                {formatDateTime(form.departureTime)}
              </Text>
            </View>
          </View>

          {/* Quick timing shortcuts */}
          <View style={styles.presetsBox}>
            <Text style={styles.presetTitle}>Quick Shortcuts:</Text>
            <View style={styles.presetChips}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() =>
                  setValue('departureTime', new Date(Date.now() + 2 * 3600 * 1000).toISOString())
                }
              >
                <Text style={styles.presetChipText}>In 2 Hours</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(8, 30, 0, 0);
                  setValue('departureTime', d.toISOString());
                }}
              >
                <Text style={styles.presetChipText}>Tomorrow 8:30 AM</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(17, 30, 0, 0);
                  setValue('departureTime', d.toISOString());
                }}
              >
                <Text style={styles.presetChipText}>Tomorrow 5:30 PM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      )}

      {/* ── STEP 3: VEHICLE ── */}
      {currentStep === 3 && (
        <Card style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Badge label="Step 3 of 5" variant="green" size="sm" />
            <Text style={styles.stepTitle}>Select Vehicle</Text>
            <Text style={styles.stepDesc}>
              Choose the verified corporate vehicle you are driving for this trip.
            </Text>
          </View>

          <View style={styles.vehicleList}>
            {MOCK_VEHICLES.map((v) => {
              const isSelected = form.vehicleId === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.vehicleSelectCard, isSelected && styles.vehicleSelectCardActive]}
                  onPress={() => setValue('vehicleId', v.id)}
                >
                  <View style={styles.vehicleSelectLeft}>
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleActive,
                      ]}
                    >
                      {isSelected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <View>
                      <Text style={styles.vehicleSelectName}>{v.model}</Text>
                      <Text style={styles.vehicleSelectReg}>{v.registrationNumber} · {v.seatingCapacity} seats</Text>
                    </View>
                  </View>
                  <Badge
                    label={v.vehicleType === 'ELECTRIC' ? 'EV' : 'Standard'}
                    variant={v.vehicleType === 'ELECTRIC' ? 'green' : 'neutral'}
                    size="sm"
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <Field
            label="Or Enter Vehicle ID"
            icon="key-outline"
            placeholder="e.g. veh-001"
            value={form.vehicleId}
            onChangeText={(v) => setValue('vehicleId', v)}
          />
        </Card>
      )}

      {/* ── STEP 4: PREFERENCES & PRICING ── */}
      {currentStep === 4 && (
        <Card style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Badge label="Step 4 of 5" variant="green" size="sm" />
            <Text style={styles.stepTitle}>Seats & Seat Contribution</Text>
            <Text style={styles.stepDesc}>
              Set the seats available to share and the standard corporate fare per passenger.
            </Text>
          </View>

          <View style={styles.row}>
            <Field
              label="Seats Offered"
              icon="people-outline"
              placeholder="3"
              keyboardType="number-pad"
              value={form.availableSeats}
              onChangeText={(v) => setValue('availableSeats', v)}
              style={styles.flex}
            />
            <Field
              label="Fare Per Seat (₹)"
              icon="cash-outline"
              placeholder="80"
              keyboardType="numeric"
              value={form.farePerSeat}
              onChangeText={(v) => setValue('farePerSeat', v)}
              style={styles.flex}
            />
          </View>

          <View style={styles.fareGuidanceBox}>
            <Ionicons name="information-circle-outline" size={18} color={colors.green} />
            <Text style={styles.fareGuidanceText}>
              EcoRide recommends ₹60–₹120 for Bangalore IT corridors to maintain affordable corporate carpooling.
            </Text>
          </View>
        </Card>
      )}

      {/* ── STEP 5: REVIEW & PUBLISH ── */}
      {currentStep === 5 && (
        <Card style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Badge label="Step 5 of 5 · Final Review" variant="green" size="sm" />
            <Text style={styles.stepTitle}>Review Ride Listing</Text>
            <Text style={styles.stepDesc}>
              Check the details before publishing your ride to employees.
            </Text>
          </View>

          {/* Route Summary */}
          <View style={styles.reviewSection}>
            <View style={styles.reviewSecHeader}>
              <Text style={styles.reviewSecTitle}>Route & Waypoints</Text>
              <TouchableOpacity onPress={() => setCurrentStep(1)}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.reviewVal}>{form.pickupLocation} → {form.destination}</Text>
            {form.routeWaypoints ? (
              <Text style={styles.reviewSub}>Via: {form.routeWaypoints}</Text>
            ) : null}
          </View>

          {/* Schedule Summary */}
          <View style={styles.reviewSection}>
            <View style={styles.reviewSecHeader}>
              <Text style={styles.reviewSecTitle}>Schedule</Text>
              <TouchableOpacity onPress={() => setCurrentStep(2)}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.reviewVal}>{formatDateTime(form.departureTime)}</Text>
          </View>

          {/* Vehicle & Seats */}
          <View style={styles.reviewSection}>
            <View style={styles.reviewSecHeader}>
              <Text style={styles.reviewSecTitle}>Vehicle & Capacity</Text>
              <TouchableOpacity onPress={() => setCurrentStep(3)}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.reviewVal}>Vehicle ID: {form.vehicleId}</Text>
            <Text style={styles.reviewSub}>{form.availableSeats} seats · {currency(form.farePerSeat)} per seat</Text>
          </View>
        </Card>
      )}

      {/* ── Stepper Navigation Actions ── */}
      <View style={styles.navRow}>
        {currentStep > 1 ? (
          <Button
            title="Go Back"
            variant="ghost"
            icon="arrow-back"
            style={{ flex: 1 }}
            onPress={handleBack}
          />
        ) : (
          <Button
            title="Cancel"
            variant="ghost"
            style={{ flex: 1 }}
            onPress={() => navigation.goBack()}
          />
        )}

        {currentStep < 5 ? (
          <Button
            title="Continue"
            icon="arrow-forward"
            iconPosition="right"
            style={{ flex: 1.5 }}
            onPress={handleNext}
          />
        ) : (
          <Button
            title="Publish Ride"
            icon="rocket-outline"
            loading={loading}
            style={{ flex: 1.5 }}
            onPress={handlePublish}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
    gap: 16,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.panel,
    padding: 12,
    borderRadius: spacing.radius,
    borderWidth: 1,
    borderColor: colors.line,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.green,
    borderColor: colors.greenHover,
  },
  stepCircleDone: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  stepNumActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: colors.green,
    fontWeight: '800',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.line,
    marginHorizontal: 4,
    marginBottom: 14,
  },
  stepLineDone: {
    backgroundColor: colors.green,
  },
  stepCard: {
    padding: 18,
    gap: 14,
  },
  stepHeader: {
    gap: 6,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  stepDesc: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  presetsBox: {
    gap: 8,
    marginTop: 6,
  },
  presetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  presetChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    backgroundColor: colors.panelSoft,
    borderColor: colors.line,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: spacing.radiusFull,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  schedulePreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.greenLight,
    borderColor: colors.greenBorder,
    borderWidth: 1,
    padding: 12,
    borderRadius: spacing.radiusSm,
  },
  schedulePreviewLabel: {
    fontSize: 11,
    color: colors.greenText,
    fontWeight: '600',
  },
  schedulePreviewVal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.greenText,
    marginTop: 2,
  },
  vehicleList: {
    gap: 8,
  },
  vehicleSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panelSoft,
  },
  vehicleSelectCardActive: {
    backgroundColor: colors.greenLight,
    borderColor: colors.green,
  },
  vehicleSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: colors.green,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.green,
  },
  vehicleSelectName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  vehicleSelectReg: {
    fontSize: 11,
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  fareGuidanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.panelSoft,
    padding: 12,
    borderRadius: spacing.radiusSm,
  },
  fareGuidanceText: {
    fontSize: 12,
    color: colors.muted,
    flex: 1,
    lineHeight: 17,
  },
  reviewSection: {
    backgroundColor: colors.panelSoft,
    padding: 12,
    borderRadius: spacing.radiusSm,
    gap: 4,
  },
  reviewSecHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewSecTitle: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  editBtn: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.green,
  },
  reviewVal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  reviewSub: {
    fontSize: 12,
    color: colors.muted,
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  // Published Screen Styles
  publishedContent: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 16,
  },
  successCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  publishedTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  publishedSub: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 18,
  },
  summaryCard: {
    width: '100%',
    padding: 18,
    gap: 12,
  },
  publishedBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareHighlight: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.green,
  },
  routeBox: {
    backgroundColor: colors.panelSoft,
    padding: 12,
    borderRadius: spacing.radiusSm,
    marginVertical: 4,
  },
  routeLocation: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  metaLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  publishedActions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
});
