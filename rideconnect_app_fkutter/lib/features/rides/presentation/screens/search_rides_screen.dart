import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:rideconnect_app/core/router/route_names.dart';
import 'package:rideconnect_app/core/theme/app_theme.dart';
import 'package:rideconnect_app/features/rides/data/providers/ride_provider.dart';

class SearchRidesScreen extends ConsumerStatefulWidget {
  const SearchRidesScreen({super.key});

  @override
  ConsumerState<SearchRidesScreen> createState() => _SearchRidesScreenState();
}

class _SearchRidesScreenState extends ConsumerState<SearchRidesScreen> {
  final _pickupCtrl = TextEditingController();
  final _destCtrl = TextEditingController();
  DateTime _selectedDate = DateTime.now().add(const Duration(hours: 1));
  int _seats = 1;

  @override
  void dispose() {
    _pickupCtrl.dispose();
    _destCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.dark(primary: AppTheme.primary),
        ),
        child: child!,
      ),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_selectedDate),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.dark(primary: AppTheme.primary),
        ),
        child: child!,
      ),
    );
    if (time == null) return;
    setState(() {
      _selectedDate = DateTime(
          date.year, date.month, date.day, time.hour, time.minute);
    });
  }

  void _search() {
    if (_pickupCtrl.text.isEmpty || _destCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter pickup and destination')),
      );
      return;
    }
    ref.read(searchRidesProvider.notifier).search(
          pickup: _pickupCtrl.text.trim(),
          destination: _destCtrl.text.trim(),
          departureTime: _selectedDate.toIso8601String(),
          seats: _seats,
        );
  }

  @override
  Widget build(BuildContext context) {
    final searchState = ref.watch(searchRidesProvider);

    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      appBar: AppBar(
        title: const Text('Find a Ride'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded),
            onPressed: () => context.push(RouteNames.publishRide),
            tooltip: 'Publish Ride',
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Search Panel ────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: AppTheme.bgCard,
              border: Border(bottom: BorderSide(color: AppTheme.border)),
            ),
            child: Column(
              children: [
                // Pickup
                _SearchField(
                  controller: _pickupCtrl,
                  hint: 'Pickup location',
                  icon: Icons.trip_origin,
                  iconColor: AppTheme.accent,
                ),
                const Padding(
                  padding: EdgeInsets.only(left: 20),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: SizedBox(
                        height: 16,
                        child: VerticalDivider(
                            color: AppTheme.border, width: 1)),
                  ),
                ),
                // Destination
                _SearchField(
                  controller: _destCtrl,
                  hint: 'Destination',
                  icon: Icons.location_on_rounded,
                  iconColor: AppTheme.error,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    // Date
                    Expanded(
                      child: GestureDetector(
                        onTap: _pickDate,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: AppTheme.bgInput,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.schedule,
                                  color: AppTheme.primary, size: 18),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  DateFormat('d MMM, h:mm a')
                                      .format(_selectedDate),
                                  style: const TextStyle(
                                      fontSize: 13,
                                      color: AppTheme.textPrimary),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Seats counter
                    Container(
                      decoration: BoxDecoration(
                        color: AppTheme.bgInput,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            onPressed: () {
                              if (_seats > 1) setState(() => _seats--);
                            },
                            icon: const Icon(Icons.remove,
                                color: AppTheme.textMuted, size: 18),
                          ),
                          Text(
                            '$_seats',
                            style: const TextStyle(
                                color: AppTheme.textPrimary,
                                fontWeight: FontWeight.w600),
                          ),
                          IconButton(
                            onPressed: () => setState(() => _seats++),
                            icon: const Icon(Icons.add,
                                color: AppTheme.primary, size: 18),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _search,
                    icon: const Icon(Icons.search_rounded),
                    label: const Text('Search Rides'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── Results ─────────────────────────────────────────
          Expanded(
            child: searchState.when(
              loading: () => const Center(
                child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation(AppTheme.primary)),
              ),
              error: (e, _) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline,
                        color: AppTheme.error, size: 48),
                    const SizedBox(height: 12),
                    Text(e.toString().replaceAll('Exception: ', ''),
                        textAlign: TextAlign.center,
                        style:
                            const TextStyle(color: AppTheme.textSecondary)),
                  ],
                ),
              ),
              data: (rides) {
                if (rides.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.directions_car_outlined,
                            size: 64, color: AppTheme.textMuted),
                        SizedBox(height: 16),
                        Text('No rides found',
                            style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textPrimary)),
                        SizedBox(height: 8),
                        Text('Try different locations or date',
                            style:
                                TextStyle(color: AppTheme.textSecondary)),
                      ],
                    ),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(20),
                  itemCount: rides.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (ctx, i) {
                    final ride = rides[i];
                    return _RideResultCard(
                      ride: ride,
                      onBook: () => context.push(
                          '${RouteNames.rideDetail}/${ride['id']}'),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _SearchField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final Color iconColor;

  const _SearchField({
    required this.controller,
    required this.hint,
    required this.icon,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      style: const TextStyle(color: AppTheme.textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon, color: iconColor, size: 18),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        filled: true,
        fillColor: AppTheme.bgInput,
      ),
    );
  }
}

class _RideResultCard extends StatelessWidget {
  final Map<String, dynamic> ride;
  final VoidCallback onBook;

  const _RideResultCard({required this.ride, required this.onBook});

  @override
  Widget build(BuildContext context) {
    final driver = ride['driver'] as Map<String, dynamic>?;
    final vehicle = ride['vehicle'] as Map<String, dynamic>?;
    final farePerSeat = ride['farePerSeat'];

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onBook,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Route
                Row(
                  children: [
                    Column(
                      children: [
                        const Icon(Icons.trip_origin,
                            color: AppTheme.accent, size: 16),
                        Container(
                          width: 1,
                          height: 20,
                          color: AppTheme.border,
                        ),
                        const Icon(Icons.location_on_rounded,
                            color: AppTheme.error, size: 16),
                      ],
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            ride['pickupLocation'] ?? '',
                            style: const TextStyle(
                                color: AppTheme.textPrimary,
                                fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            ride['destination'] ?? '',
                            style: const TextStyle(
                                color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '₹${farePerSeat?.toStringAsFixed(0) ?? '?'}',
                          style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.primary),
                        ),
                        Text(
                          'per seat',
                          style: TextStyle(
                              fontSize: 11, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ],
                ),

                const Divider(height: 24, color: AppTheme.border),

                // Driver & time row
                Row(
                  children: [
                    if (driver != null) ...[
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          gradient: AppTheme.primaryGradient,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '${driver['firstName']?[0] ?? '?'}',
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 13),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${driver['firstName']} ${driver['lastName']}',
                              style: const TextStyle(
                                  color: AppTheme.textPrimary,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500),
                            ),
                            if (vehicle != null)
                              Text(
                                vehicle['model'] ?? '',
                                style: const TextStyle(
                                    color: AppTheme.textMuted, fontSize: 11),
                              ),
                          ],
                        ),
                      ),
                    ],
                    Row(
                      children: [
                        const Icon(Icons.event_seat_rounded,
                            color: AppTheme.textMuted, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          '${ride['availableSeats']} seats',
                          style: const TextStyle(
                              color: AppTheme.textMuted, fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ),

                if (ride['departureTime'] != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.access_time,
                            size: 13, color: AppTheme.primary),
                        const SizedBox(width: 5),
                        Text(
                          _fmtTime(ride['departureTime']),
                          style: const TextStyle(
                              color: AppTheme.primary,
                              fontSize: 12,
                              fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
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
