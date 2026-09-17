import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:rideconnect_app/core/theme/app_theme.dart';
import 'package:rideconnect_app/features/wallet/data/providers/payment_provider.dart';

class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final walletAsync = ref.watch(walletProvider);
    final txAsync = ref.watch(transactionsProvider);

    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      appBar: AppBar(
        title: const Text('My Wallet'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              ref.invalidate(walletProvider);
              ref.invalidate(transactionsProvider);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Balance Card ─────────────────────────────────────
          walletAsync.when(
            loading: () => Container(
              margin: const EdgeInsets.all(20),
              height: 160,
              decoration: BoxDecoration(
                gradient: AppTheme.primaryGradient,
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            ),
            error: (e, _) => const SizedBox.shrink(),
            data: (wallet) {
              final balance = (wallet['balance'] as num?)?.toDouble() ?? 0;
              return Container(
                margin: const EdgeInsets.all(20),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: AppTheme.primaryGradient,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primary.withValues(alpha: 0.4),
                      blurRadius: 30,
                      offset: const Offset(0, 12),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.account_balance_wallet_rounded,
                            color: Colors.white70, size: 20),
                        const SizedBox(width: 8),
                        const Text('Available Balance',
                            style: TextStyle(
                                color: Colors.white70, fontSize: 13)),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text('Active',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      '₹${balance.toStringAsFixed(2)}',
                      style: const TextStyle(
                          fontSize: 40,
                          fontWeight: FontWeight.w800,
                          color: Colors.white),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton.icon(
                      onPressed: () => _showRechargeDialog(context, ref),
                      icon: const Icon(Icons.add_rounded, size: 18),
                      label: const Text('Add Money'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppTheme.primary,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 10),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),

          // ── Transactions ─────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Transactions',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary)),
                Text(
                  txAsync.value != null
                      ? '${txAsync.value!.length} total'
                      : '',
                  style:
                      const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          Expanded(
            child: txAsync.when(
              loading: () => const Center(
                child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation(AppTheme.primary)),
              ),
              error: (e, _) => Center(
                child: Text(e.toString(),
                    style: const TextStyle(color: AppTheme.error)),
              ),
              data: (txs) {
                if (txs.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.receipt_long_outlined,
                            size: 56, color: AppTheme.textMuted),
                        SizedBox(height: 12),
                        Text('No transactions yet',
                            style: TextStyle(color: AppTheme.textSecondary)),
                      ],
                    ),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                  itemCount: txs.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (ctx, i) => _TxCard(tx: txs[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showRechargeDialog(BuildContext context, WidgetRef ref) {
    final amountCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.bgCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
            24, 24, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 24),
              decoration: BoxDecoration(
                color: AppTheme.border,
                borderRadius: BorderRadius.circular(2),
              ),
              alignment: Alignment.center,
            ),
            const Text('Add Money to Wallet',
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary)),
            const SizedBox(height: 20),

            // Quick amounts
            Wrap(
              spacing: 8,
              children: [100, 500, 1000, 2000].map((amt) {
                return ActionChip(
                  label: Text('₹$amt'),
                  onPressed: () => amountCtrl.text = amt.toString(),
                  backgroundColor: AppTheme.bgSurface,
                  side: const BorderSide(color: AppTheme.border),
                  labelStyle:
                      const TextStyle(color: AppTheme.textSecondary),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: AppTheme.textPrimary),
              decoration: const InputDecoration(
                hintText: 'Enter amount',
                prefixIcon: Icon(Icons.currency_rupee),
              ),
            ),
            const SizedBox(height: 16),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  final amount = double.tryParse(amountCtrl.text);
                  if (amount == null || amount <= 0) return;
                  Navigator.pop(ctx);
                  try {
                    await ref
                        .read(paymentRepositoryProvider)
                        .rechargeWallet(amount, 'CASH');
                    ref.invalidate(walletProvider);
                    ref.invalidate(transactionsProvider);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('₹ Added to wallet!'),
                          backgroundColor: AppTheme.success,
                        ),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(e.toString())),
                      );
                    }
                  }
                },
                child: const Text('Add Money'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TxCard extends StatelessWidget {
  final Map<String, dynamic> tx;
  const _TxCard({required this.tx});

  @override
  Widget build(BuildContext context) {
    final type = tx['transactionType'] as String? ?? '';
    final amount = (tx['amount'] as num?)?.toDouble() ?? 0;
    final isCredit = type.toUpperCase().contains('RECHARGE') ||
        type.toUpperCase().contains('CREDIT');
    final createdAt = tx['createdAt'] as String?;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: (isCredit ? AppTheme.success : AppTheme.error)
                  .withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isCredit ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
              color: isCredit ? AppTheme.success : AppTheme.error,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _formatType(type),
                  style: const TextStyle(
                      color: AppTheme.textPrimary, fontWeight: FontWeight.w500),
                ),
                if (createdAt != null)
                  Text(
                    _fmtTime(createdAt),
                    style: const TextStyle(
                        color: AppTheme.textMuted, fontSize: 11),
                  ),
              ],
            ),
          ),
          Text(
            '${isCredit ? '+' : '-'}₹${amount.toStringAsFixed(0)}',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: isCredit ? AppTheme.success : AppTheme.error,
            ),
          ),
        ],
      ),
    );
  }

  String _formatType(String type) {
    return type.replaceAll('_', ' ').toLowerCase().split(' ').map((w) {
      if (w.isEmpty) return w;
      return w[0].toUpperCase() + w.substring(1);
    }).join(' ');
  }

  String _fmtTime(String t) {
    try {
      return DateFormat('d MMM yyyy · h:mm a').format(DateTime.parse(t).toLocal());
    } catch (_) {
      return t;
    }
  }
}
