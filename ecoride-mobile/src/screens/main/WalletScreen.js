import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { paymentApi } from '../../api/paymentApi';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import { colors } from '../../utils/theme';
import { currency, formatDateTime, getErrorMessage } from '../../utils/format';

export default function WalletScreen() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('500');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [walletData, txData] = await Promise.all([paymentApi.wallet(), paymentApi.transactions()]);
      setWallet(walletData);
      setTransactions(txData);
    } catch (error) {
      Alert.alert('Could not load wallet', getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function recharge() {
    try {
      await paymentApi.rechargeWallet({ amount: Number(amount), paymentMethod: 'WALLET' });
      await load();
    } catch (error) {
      Alert.alert('Recharge failed', getErrorMessage(error));
    }
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />} contentStyle={{ paddingBottom: 90 }}>
      <Card style={styles.balance}>
        <Text style={styles.label}>Wallet balance</Text>
        <Text style={styles.amount}>{currency(wallet?.balance || 0)}</Text>
      </Card>
      <View style={styles.row}>
        <Field label="Recharge amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.flex} />
        <Button title="Add" onPress={recharge} style={styles.add} />
      </View>
      <Text style={styles.section}>Transactions</Text>
      {transactions.length ? transactions.map((tx) => (
        <Card key={tx.id}>
          <View style={styles.txRow}>
            <Text style={styles.txType}>{tx.transactionType}</Text>
            <Text style={styles.txAmount}>{currency(tx.amount)}</Text>
          </View>
          <Text style={styles.meta}>{tx.paymentMethod} · {tx.status}</Text>
          <Text style={styles.meta}>{formatDateTime(tx.createdAt)}</Text>
        </Card>
      )) : (
        <EmptyState title="No transactions" body="Wallet recharges and trip payments appear here." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balance: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  label: {
    color: '#D1FAE5',
    fontWeight: '800',
  },
  amount: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '900',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  add: {
    width: 96,
  },
  section: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  txType: {
    color: colors.text,
    fontWeight: '900',
  },
  txAmount: {
    color: colors.green,
    fontWeight: '900',
  },
  meta: {
    color: colors.muted,
  },
});
