import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:rideconnect_app/core/theme/app_theme.dart';
import 'package:rideconnect_app/features/rides/data/providers/ride_provider.dart';
import 'package:rideconnect_app/features/trips/data/providers/trip_provider.dart';

class RideDetailScreen extends ConsumerStatefulWidget {
  final String rideId;
  const RideDetailScreen({super.key, required this.rideId});

  @override
  ConsumerState<RideDetailScreen> createState() => _RideDetailScreenState();
}

class _RideDetailScreenState extends ConsumerState<RideDetailScreen> {
  int _seats = 1;
  String _paymentMethod = 'WALLET';
  bool _booking = false;

  Future<void> _bookRide(Map<String, dynamic> ride) async {
    setState(() => _booking = true);
    try {
      await ref.read(tripRepositoryProvider).bookTrip(
        rideId: widget.rideId,
        bookedSeats: _seats,
        paymentMethod: _paymentMethod,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Trip booked successfully!'),
            backgroundColor: AppTheme.success,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _booking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final searchResults = ref.watch(searchRidesProvider);
    final ride = searchResults.value?.firstWhere(
      (r) => r['id'] == widget.rideId,
      orElse: () => {},
    );

    if (ride == null || ride.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Ride Details')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final driver = ride['driver'] as Map<String, dynamic>?;
    final vehicle = ride['vehicle'] as Map<String, dynamic>?;
    final farePerSeat = (ride['farePerSeat'] as num?)?.toDouble() ?? 0;
    final totalFare = farePerSeat * _seats;

    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      appBar: AppBar(title: const Text('Ride Details')),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
        decoration: const BoxDecoration(
          color: AppTheme.bgCard,
          border: Border(top: BorderSide(color: AppTheme.border)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Total Fare',
                      style: TextStyle(
                          color: AppTheme.textMuted, fontSize: 12)),
                  Text(
                    '₹${totalFare.toStringAsFixed(0)}',
                    style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primary),
                  ),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: _booking ? null : () => _bookRide(ride),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                    horizontal: 32, vertical: 16),
              ),
              child: _booking
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Text('Book Ride'),
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Route Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: AppTheme.cardGradient,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.border),
              ),
              child: Column(
                children: [
                  _RouteItem(
                    icon: Icons.trip_origin,
                    color: AppTheme.accent,
                    label: 'From',
                    value: ride['pickupLocation'] ?? '',
                  ),
                  const Padding(
                    padding: EdgeInsets.only(left: 8),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: SizedBox(
                          height: 20,
                          child:
                              VerticalDivider(color: AppTheme.border, width: 1)),
                    ),
                  ),
                  _RouteItem(
                    icon: Icons.location_on_rounded,
                    color: AppTheme.error,
                    label: 'To',
                    value: ride['destination'] ?? '',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Time & fare info
            Row(
              children: [
                Expanded(
                  child: _InfoChip(
                    icon: Icons.schedule,
                    label: ride['departureTime'] != null
                        ? _fmtTime(ride['departureTime'])
                        : 'N/A',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _InfoChip(
                    icon: Icons.currency_rupee,
                    label: '₹${farePerSeat.toStringAsFixed(0)}/seat',
                    color: AppTheme.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Driver info
            if (driver != null) ...[
              const Text('Driver',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary)),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.bgCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        gradient: AppTheme.primaryGradient,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          '${driver['firstName']?[0] ?? '?'}${driver['lastName']?[0] ?? ''}',
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
                            '${driver['firstName']} ${driver['lastName']}',
                            style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textPrimary,
                                fontSize: 16),
                          ),
                          if (driver['companyName'] != null)
                            Text(driver['companyName'],
                                style: const TextStyle(
                                    color: AppTheme.primary, fontSize: 12)),
                        ],
                      ),
                    ),
                    if (driver['phoneNumber'] != null)
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Icons.phone_rounded,
                            color: AppTheme.accent),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Vehicle
            if (vehicle != null) ...[
              const Text('Vehicle',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary)),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.bgCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.accent.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.directions_car_rounded,
                          color: AppTheme.accent),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(vehicle['model'] ?? '',
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.textPrimary)),
                          Text(
                            vehicle['registrationNumber'] ?? '',
                            style: const TextStyle(
                                color: AppTheme.textMuted, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '${vehicle['seatingCapacity']} seats',
                      style: const TextStyle(
                          color: AppTheme.textSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Seats selector
            const Text('Number of Seats',
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary)),
            const SizedBox(height: 12),
            Row(
              children: [
                IconButton(
                  onPressed: () {
                    if (_seats > 1) setState(() => _seats--);
                  },
                  icon: const Icon(Icons.remove_circle_outline),
                  style: IconButton.styleFrom(foregroundColor: AppTheme.primary),
                ),
                Expanded(
                  child: Center(
                    child: Text('$_seats',
                        style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary)),
                  ),
                ),
                IconButton(
                  onPressed: () {
                    final max = (ride['availableSeats'] as int?) ?? 4;
                    if (_seats < max) setState(() => _seats++);
                  },
                  icon: const Icon(Icons.add_circle_outline),
                  style: IconButton.styleFrom(foregroundColor: AppTheme.primary),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Payment method
            const Text('Payment Method',
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary)),
            const SizedBox(height: 12),
            Row(
              children: [
                _PaymentChip(
                  label: 'Wallet',
                  icon: Icons.account_balance_wallet_rounded,
                  selected: _paymentMethod == 'WALLET',
                  onTap: () => setState(() => _paymentMethod = 'WALLET'),
                ),
                const SizedBox(width: 12),
                _PaymentChip(
                  label: 'Cash',
                  icon: Icons.payments_rounded,
                  selected: _paymentMethod == 'CASH',
                  onTap: () => setState(() => _paymentMethod = 'CASH'),
                ),
              ],
            ),

            const SizedBox(height: 100),
          ],
        ),
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

class _RouteItem extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final String value;

  const _RouteItem(
      {required this.icon,
      required this.color,
      required this.label,
      required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: const TextStyle(
                      color: AppTheme.textMuted, fontSize: 11)),
              Text(value,
                  style: const TextStyle(
                      color: AppTheme.textPrimary, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;

  const _InfoChip({required this.icon, required this.label, this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color ?? AppTheme.textMuted),
          const SizedBox(width: 8),
          Expanded(
            child: Text(label,
                style: TextStyle(
                    color: color ?? AppTheme.textSecondary, fontSize: 12)),
          ),
        ],
      ),
    );
  }
}

class _PaymentChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _PaymentChip(
      {required this.label,
      required this.icon,
      required this.selected,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected
                ? AppTheme.primary.withValues(alpha: 0.15)
                : AppTheme.bgCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? AppTheme.primary : AppTheme.border,
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: selected ? AppTheme.primary : AppTheme.textMuted),
              const SizedBox(height: 6),
              Text(label,
                  style: TextStyle(
                      color: selected ? AppTheme.primary : AppTheme.textSecondary,
                      fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }
}
