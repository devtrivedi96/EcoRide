import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { colors, spacing } from '../../utils/theme';
import { MOCK_VEHICLES } from '../../mock/mockData';

export default function VehiclesScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([...MOCK_VEHICLES]);
  const [modalVisible, setModalVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form state
  const [model, setModel] = useState('');
  const [regNo, setRegNo] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [isEV, setIsEV] = useState(true);

  function handleSaveVehicle() {
    if (!model.trim() || !regNo.trim()) {
      Alert.alert('Missing fields', 'Vehicle model and registration number are required.');
      return;
    }

    const newVehicle = {
      id: `veh-${Date.now().toString().slice(-4)}`,
      userId: 'mock-user-001',
      model: model.trim(),
      registrationNumber: regNo.trim().toUpperCase(),
      seatingCapacity: Number(capacity) || 4,
      vehicleType: isEV ? 'ELECTRIC' : 'PETROL',
    };

    setVehicles((current) => [newVehicle, ...current]);
    setModalVisible(false);
    setModel('');
    setRegNo('');
    setSuccessMsg(`✓ Vehicle ${newVehicle.model} added successfully!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  return (
    <Screen contentStyle={styles.content}>
      {/* ── Success Toast Banner ── */}
      {successMsg ? (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={18} color={colors.green} />
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      ) : null}

      {/* ── Header Intro ── */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Registered Vehicles</Text>
          <Text style={styles.subtitle}>
            Vehicles registered to offer corporate carpool rides.
          </Text>
        </View>
        <Button
          title="Add Vehicle"
          icon="add"
          size="sm"
          onPress={() => setModalVisible(true)}
        />
      </View>

      {/* ── Vehicle Cards ── */}
      {vehicles.length ? (
        vehicles.map((v) => (
          <Card key={v.id} style={styles.vehicleCard}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modelName}>{v.model}</Text>
                <Text style={styles.regNumber}>{v.registrationNumber}</Text>
              </View>
              <Badge
                label={v.vehicleType === 'ELECTRIC' ? '100% EV' : 'Standard'}
                variant={v.vehicleType === 'ELECTRIC' ? 'green' : 'neutral'}
                icon={v.vehicleType === 'ELECTRIC' ? 'flash-outline' : 'car-outline'}
                size="sm"
              />
            </View>

            <View style={styles.cardMetaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={14} color={colors.muted} />
                <Text style={styles.metaText}>{v.seatingCapacity} seats capacity</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.green} />
                <Text style={styles.metaText}>Corporate Verified</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.vehicleId}>ID: {v.id}</Text>
              <Button
                title="Use to Publish"
                variant="ghost"
                size="sm"
                onPress={() => {
                  navigation.navigate('PublishRide', { vehicleId: v.id });
                }}
              />
            </View>
          </Card>
        ))
      ) : (
        <EmptyState
          icon="car-sport-outline"
          title="No Vehicles Registered"
          body="Add your vehicle to start offering carpool rides to colleagues."
          action="Add Vehicle"
          onAction={() => setModalVisible(true)}
        />
      )}

      {/* ── Add Vehicle Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register New Vehicle</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <Field
              label="Vehicle Model"
              placeholder="e.g. Tata Nexon EV, MG ZS EV"
              value={model}
              onChangeText={setModel}
            />

            <Field
              label="Registration Number"
              placeholder="e.g. KA 01 AB 1234"
              value={regNo}
              onChangeText={setRegNo}
              autoCapitalize="characters"
            />

            <Field
              label="Seating Capacity"
              placeholder="4"
              keyboardType="number-pad"
              value={capacity}
              onChangeText={setCapacity}
            />

            <View style={styles.evToggleRow}>
              <Text style={styles.evLabel}>Electric Vehicle (EV)</Text>
              <TouchableOpacity
                style={[styles.evToggle, isEV && styles.evToggleActive]}
                onPress={() => setIsEV(!isEV)}
              >
                <Ionicons
                  name={isEV ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={isEV ? colors.green : colors.muted}
                />
                <Text style={[styles.evToggleText, isEV && { color: colors.green }]}>
                  {isEV ? 'Yes, 100% Electric' : 'No, Petrol/Diesel'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => setModalVisible(false)}
              />
              <Button
                title="Save Vehicle"
                style={{ flex: 1 }}
                onPress={handleSaveVehicle}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
    gap: 14,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.greenLight,
    borderColor: colors.greenBorder,
    borderWidth: 1,
    padding: 12,
    borderRadius: spacing.radiusSm,
  },
  successText: {
    color: colors.greenText,
    fontSize: 13,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  vehicleCard: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modelName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  regNumber: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.panelSoft,
    padding: 8,
    borderRadius: spacing.radiusSm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  vehicleId: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  evToggleRow: {
    gap: 6,
  },
  evLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  evToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.panelSoft,
    padding: 12,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  evToggleActive: {
    backgroundColor: colors.greenLight,
    borderColor: colors.greenBorder,
  },
  evToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
