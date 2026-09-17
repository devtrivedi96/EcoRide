import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:rideconnect_app/core/theme/app_theme.dart';
import 'package:rideconnect_app/features/trips/data/providers/trip_provider.dart';

class MyTripsScreen extends ConsumerWidget {
  const MyTripsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tripsAsync = ref.watch(myTripsProvider);

    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      appBar: AppBar(
        title: const Text('My Trips'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.invalidate(myTripsProvider),
          ),
        ],
      ),
      body: tripsAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation(AppTheme.primary)),
        ),
        error: (e, _) => _ErrorState(
            message: e.toString().replaceAll('Exception: ', ''),
            onRetry: () => ref.invalidate(myTripsProvider)),
        data: (trips) {
          if (trips.isEmpty) {
            return const _EmptyTrips();
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myTripsProvider),
            color: AppTheme.primary,
            backgroundColor: AppTheme.bgCard,
            child: ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: trips.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (ctx, i) => _TripCard(
                trip: trips[i],
                onCancel: () async {
                  await ref
                      .read(tripRepositoryProvider)
                      .cancelTrip(trips[i]['id']);
                  ref.invalidate(myTripsProvider);
                },
              ),
            ),
          );
        },
      ),
    );
  }
}

class _TripCard extends StatelessWidget {
  final Map<String, dynamic> trip;
  final VoidCallback? onCancel;

  const _TripCard({required this.trip, this.onCancel});

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return AppTheme.warning;
      case 'ACCEPTED':
        return AppTheme.success;
      case 'REJECTED':
      case 'CANCELLED':
        return AppTheme.error;
      case 'COMPLETED':
        return AppTheme.accent;
      default:
        return AppTheme.textMuted;
    }
  }

  IconData _statusIcon(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return Icons.hourglass_empty_rounded;
      case 'ACCEPTED':
        return Icons.check_circle_rounded;
      case 'REJECTED':
      case 'CANCELLED':
        return Icons.cancel_rounded;
      case 'COMPLETED':
        return Icons.verified_rounded;
      default:
        return Icons.help_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    final ride = trip['ride'] as Map<String, dynamic>?;
    final status = trip['status'] as String? ?? 'PENDING';
    final fare = (trip['totalFare'] as num?)?.toDouble() ?? 0;
    final canCancel = ['PENDING', 'ACCEPTED'].contains(status.toUpperCase());

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          // Status header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: _statusColor(status).withValues(alpha: 0.1),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(20)),
              border: Border(
                  bottom: BorderSide(
                      color: _statusColor(status).withValues(alpha: 0.2))),
            ),
            child: Row(
              children: [
                Icon(_statusIcon(status),
                    color: _statusColor(status), size: 18),
                const SizedBox(width: 8),
                Text(
                  status,
                  style: TextStyle(
                      color: _statusColor(status),
                      fontWeight: FontWeight.w600,
                      fontSize: 13),
                ),
                const Spacer(),
                if (trip['otp'] != null && status.toUpperCase() == 'ACCEPTED')
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.warning.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.lock_rounded,
                            color: AppTheme.warning, size: 13),
                        const SizedBox(width: 4),
                        Text(
                          'OTP: ${trip['otp']}',
                          style: const TextStyle(
                              color: AppTheme.warning,
                              fontWeight: FontWeight.w700,
                              fontSize: 14),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (ride != null) ...[
                  Row(
                    children: [
                      const Icon(Icons.trip_origin,
                          color: AppTheme.accent, size: 14),
                      const SizedBox(width: 8),
                      Expanded(
                          child: Text(ride['pickupLocation'] ?? '',
                              style: const TextStyle(
                                  color: AppTheme.textPrimary,
                                  fontWeight: FontWeight.w500))),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on_rounded,
                          color: AppTheme.error, size: 14),
                      const SizedBox(width: 8),
                      Expanded(
                          child: Text(ride['destination'] ?? '',
                              style: const TextStyle(
                                  color: AppTheme.textSecondary))),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(Icons.access_time,
                          color: AppTheme.textMuted, size: 14),
                      const SizedBox(width: 6),
                      Text(
                        _fmtTime(ride['departureTime']),
                        style: const TextStyle(
                            color: AppTheme.textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                ],
                const Divider(height: 20, color: AppTheme.border),
                Row(
                  children: [
                    _StatChip(
                        icon: Icons.event_seat_rounded,
                        label: '${trip['bookedSeats'] ?? 1} seat(s)'),
                    const SizedBox(width: 8),
                    _StatChip(
                        icon: Icons.currency_rupee,
                        label: '₹${fare.toStringAsFixed(0)}',
                        color: AppTheme.primary),
                    const Spacer(),
                    if (canCancel)
                      TextButton(
                        onPressed: onCancel,
                        style: TextButton.styleFrom(
                            foregroundColor: AppTheme.error),
                        child: const Text('Cancel'),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _fmtTime(String? t) {
    if (t == null) return '';
    try {
      return DateFormat('EEE, d MMM · h:mm a')
          .format(DateTime.parse(t).toLocal());
    } catch (_) {
      return t;
    }
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;

  const _StatChip({required this.icon, required this.label, this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: (color ?? AppTheme.textMuted).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color ?? AppTheme.textMuted),
          const SizedBox(width: 4),
          Text(label,
              style: TextStyle(
                  color: color ?? AppTheme.textMuted,
                  fontSize: 12,
                  fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _EmptyTrips extends StatelessWidget {
  const _EmptyTrips();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.confirmation_number_outlined,
              size: 72, color: AppTheme.textMuted),
          SizedBox(height: 16),
          Text('No trips yet',
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary)),
          SizedBox(height: 8),
          Text('Book a ride to see your trips here',
              style: TextStyle(color: AppTheme.textSecondary)),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: AppTheme.error, size: 48),
          const SizedBox(height: 12),
          Text(message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.textSecondary)),
          const SizedBox(height: 16),
          ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
