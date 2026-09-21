import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { paymentApi } from '../../api/paymentApi';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import { colors, spacing } from '../../utils/theme';
import { currency, formatDateTime, getErrorMessage } from '../../utils/format';

const PRESET_AMOUNTS = ['200', '500', '1000', '2000'];

export default function WalletScreen() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('500');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isPull = false) => {
    if (isPull) setRefreshing(true);
    try {
      const [walletData, txData] = await Promise.all([
        paymentApi.wallet(),
        paymentApi.transactions(),
      ]);
      setWallet(walletData);
      setTransactions(txData || []);
    } catch (error) {
      Alert.alert('Could not load wallet', getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function recharge() {
    if (!amount || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid recharge amount.');
      return;
    }
    setLoading(true);
    try {
      await paymentApi.rechargeWallet({
        amount: Number(amount),
        paymentMethod: 'UPI',
      });
      Alert.alert('Recharge Successful', `₹${amount} added to your EcoRide wallet.`);
      await load();
    } catch (error) {
      Alert.alert('Recharge failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      contentStyle={{ paddingBottom: 90, gap: 16 }}
    >
      {/* ── Corporate Balance Card ── */}
      <Card style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>{currency(wallet?.balance || 0)}</Text>
          </View>
          <View style={styles.walletIconCircle}>
            <Ionicons name="wallet" size={26} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.balanceFooter}>
          <View style={styles.balanceMetaRow}>
            <Ionicons name="shield-checkmark" size={14} color="#A7F3D0" />
            <Text style={styles.balanceMetaText}>Corporate Commute Wallet</Text>
          </View>
          <Badge label="Auto-Pay Active" variant="green" size="sm" />
        </View>
      </Card>

      {/* ── Quick Recharge Section ── */}
      <Card style={styles.rechargeCard}>
        <Text style={styles.rechargeTitle}>Top Up Balance</Text>

        <View style={styles.presetRow}>
          {PRESET_AMOUNTS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.presetChip, amount === p && styles.presetChipActive]}
              onPress={() => setAmount(p)}
            >
              <Text style={[styles.presetText, amount === p && styles.presetTextActive]}>
                +₹{p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.rechargeInputRow}>
          <Field
            label="Amount (₹)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            icon="cash-outline"
            style={{ flex: 1 }}
          />
          <Button
            title="Add Money"
            icon="add-circle-outline"
            loading={loading}
            onPress={recharge}
            style={styles.addBtn}
          />
        </View>
      </Card>

      {/* ── Transaction History ── */}
      <View style={styles.txHeaderRow}>
        <Text style={styles.sectionHeading}>Transaction History</Text>
        <Text style={styles.txCount}>{transactions.length} records</Text>
      </View>

      {transactions.length ? (
        transactions.map((tx) => {
          const isRecharge = tx.transactionType === 'RECHARGE';
          return (
            <Card key={tx.id} style={styles.txCard}>
              <View style={styles.txRow}>
                <View style={styles.txLeft}>
                  <View
                    style={[
                      styles.txIconWrap,
                      isRecharge ? styles.txIconRecharge : styles.txIconPayment,
                    ]}
                  >
                    <Ionicons
                      name={isRecharge ? 'arrow-down' : 'arrow-up'}
                      size={16}
                      color={isRecharge ? colors.green : colors.blue}
                    />
                  </View>
                  <View>
                    <Text style={styles.txType}>
                      {isRecharge ? 'Wallet Top-up' : 'Trip Commute Fare'}
                    </Text>
                    <Text style={styles.txMeta}>
                      {tx.paymentMethod} · {formatDateTime(tx.createdAt)}
                    </Text>
                  </View>
                </View>

                <View style={styles.txRight}>
                  <Text
                    style={[
                      styles.txAmount,
                      isRecharge ? styles.txAmountPositive : styles.txAmountNegative,
                    ]}
                  >
                    {isRecharge ? '+' : '-'} {currency(tx.amount)}
                  </Text>
                  <Badge
                    label={tx.status}
                    variant={tx.status === 'SUCCESS' ? 'green' : 'amber'}
                    size="sm"
                  />
                </View>
              </View>
            </Card>
          );
        })
      ) : (
        <EmptyState
          icon="receipt-outline"
          title="No Transactions Yet"
          body="Your wallet recharges and trip ride payments will appear here."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: '#064E3B',
    borderColor: '#065F46',
    padding: 20,
    gap: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceLabel: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  walletIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  balanceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceMetaText: {
    color: '#D1FAE5',
    fontSize: 12,
    fontWeight: '600',
  },
  rechargeCard: {
    padding: 16,
    gap: 14,
  },
  rechargeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: spacing.radiusSm,
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {
    backgroundColor: colors.greenLight,
    borderColor: colors.green,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  presetTextActive: {
    color: colors.green,
    fontWeight: '800',
  },
  rechargeInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  addBtn: {
    height: 46,
    paddingHorizontal: 16,
  },
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  txCount: {
    fontSize: 12,
    color: colors.muted,
  },
  txCard: {
    padding: 14,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconRecharge: {
    backgroundColor: colors.greenLight,
  },
  txIconPayment: {
    backgroundColor: colors.blueLight,
  },
  txType: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  txMeta: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  txAmountPositive: {
    color: colors.green,
  },
  txAmountNegative: {
    color: colors.text,
  },
});
