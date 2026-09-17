import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rideconnect_app/core/theme/app_theme.dart';
import 'package:rideconnect_app/features/trips/data/providers/trip_provider.dart';

class DriverTripsScreen extends ConsumerWidget {
  const DriverTripsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tripsAsync = ref.watch(driverTripsProvider);

    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      appBar: AppBar(
        title: const Text('Trip Requests'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.invalidate(driverTripsProvider),
          ),
        ],
      ),
      body: tripsAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation(AppTheme.primary)),
        ),
        error: (e, _) => Center(
          child: Text(e.toString(), style: const TextStyle(color: AppTheme.error)),
        ),
        data: (trips) {
          if (trips.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.inbox_rounded, size: 64, color: AppTheme.textMuted),
                  SizedBox(height: 16),
                  Text('No trip requests',
                      style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary)),
                  SizedBox(height: 8),
                  Text('Passengers will appear here after booking your ride',
                      style: TextStyle(color: AppTheme.textSecondary),
                      textAlign: TextAlign.center),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(driverTripsProvider),
            color: AppTheme.primary,
            backgroundColor: AppTheme.bgCard,
            child: ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: trips.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (ctx, i) => _DriverTripCard(
                trip: trips[i],
                onAccept: () async {
                  try {
                    await ref.read(tripRepositoryProvider).acceptTrip(trips[i]['id']);
                    ref.invalidate(driverTripsProvider);
                    if (ctx.mounted) {
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        const SnackBar(
                          content: Text('Trip accepted!'),
                          backgroundColor: AppTheme.success,
                        ),
                      );
                    }
                  } catch (e) {
                    if (ctx.mounted) {
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        SnackBar(content: Text(e.toString())),
                      );
                    }
                  }
                },
                onReject: () async {
                  try {
                    await ref.read(tripRepositoryProvider).rejectTrip(trips[i]['id']);
                    ref.invalidate(driverTripsProvider);
                  } catch (e) {
                    if (ctx.mounted) {
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        SnackBar(content: Text(e.toString())),
                      );
                    }
                  }
                },
                onVerifyOtp: (otp) async {
                  try {
                    await ref.read(tripRepositoryProvider).verifyOtp(trips[i]['id'], otp);
                    ref.invalidate(driverTripsProvider);
                    if (ctx.mounted) {
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        const SnackBar(
                          content: Text('✅ Trip started!'),
                          backgroundColor: AppTheme.success,
                        ),
                      );
                    }
                  } catch (e) {
                    if (ctx.mounted) {
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        SnackBar(content: Text(e.toString())),
                      );
                    }
                  }
                },
              ),
            ),
          );
        },
      ),
    );
  }
}

class _DriverTripCard extends StatelessWidget {
  final Map<String, dynamic> trip;
  final VoidCallback onAccept;
  final VoidCallback onReject;
  final Function(String otp) onVerifyOtp;

  const _DriverTripCard({
    required this.trip,
    required this.onAccept,
    required this.onReject,
    required this.onVerifyOtp,
  });

  @override
  Widget build(BuildContext context) {
    final passenger = trip['passenger'] as Map<String, dynamic>?;
    final status = trip['status'] as String? ?? 'PENDING';
    final isPending = status.toUpperCase() == 'PENDING';
    final isAccepted = status.toUpperCase() == 'ACCEPTED';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Passenger info
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: AppTheme.accentGradient,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    passenger != null
                        ? '${passenger['firstName']?[0] ?? '?'}'
                        : '?',
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 18),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      passenger != null
                          ? '${passenger['firstName']} ${passenger['lastName']}'
                          : 'Unknown Passenger',
                      style: const TextStyle(
                          color: AppTheme.textPrimary,
                          fontWeight: FontWeight.w600),
                    ),
                    if (passenger?['phoneNumber'] != null)
                      Text(passenger!['phoneNumber'],
                          style: const TextStyle(
                              color: AppTheme.textMuted, fontSize: 12)),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${trip['bookedSeats'] ?? 1} seat(s)',
                  style: const TextStyle(
                      color: AppTheme.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Trip details
          Row(
            children: [
              const Icon(Icons.currency_rupee, color: AppTheme.success, size: 14),
              Text('₹${(trip['totalFare'] as num?)?.toStringAsFixed(0) ?? '?'}',
                  style: const TextStyle(color: AppTheme.success, fontWeight: FontWeight.w600)),
              const SizedBox(width: 16),
              Text('· $status',
                  style: const TextStyle(
                      color: AppTheme.textMuted, fontSize: 13)),
            ],
          ),

          // Action buttons
          if (isPending) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: onReject,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.error,
                      side: const BorderSide(color: AppTheme.error),
                    ),
                    child: const Text('Reject'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: onAccept,
                    style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.success),
                    child: const Text('Accept'),
                  ),
                ),
              ],
            ),
          ],

          // OTP Verify
          if (isAccepted) ...[
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () => _showOtpDialog(context),
              icon: const Icon(Icons.verified_user_rounded, size: 18),
              label: const Text('Verify OTP & Start Trip'),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 44),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showOtpDialog(BuildContext context) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Enter Passenger OTP'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          maxLength: 6,
          decoration: const InputDecoration(
            hintText: '6-digit OTP',
            counterText: '',
          ),
          style: const TextStyle(
              color: AppTheme.textPrimary, fontSize: 20, letterSpacing: 8),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              onVerifyOtp(controller.text.trim());
            },
            child: const Text('Verify'),
          ),
        ],
      ),
    );
  }
}
