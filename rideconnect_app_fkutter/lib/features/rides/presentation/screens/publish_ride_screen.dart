import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:rideconnect_app/core/theme/app_theme.dart';
import 'package:rideconnect_app/features/rides/data/providers/ride_provider.dart';

class PublishRideScreen extends ConsumerStatefulWidget {
  const PublishRideScreen({super.key});

  @override
  ConsumerState<PublishRideScreen> createState() => _PublishRideScreenState();
}

class _PublishRideScreenState extends ConsumerState<PublishRideScreen> {
  final _formKey = GlobalKey<FormState>();
  final _pickupCtrl = TextEditingController();
  final _destCtrl = TextEditingController();
  final _waypointsCtrl = TextEditingController();
  final _fareCtrl = TextEditingController();
  final _vehicleIdCtrl = TextEditingController();
  int _seats = 1;
  DateTime _departureTime =
      DateTime.now().add(const Duration(hours: 2));
  bool _loading = false;

  @override
  void dispose() {
    _pickupCtrl.dispose();
    _destCtrl.dispose();
    _waypointsCtrl.dispose();
    _fareCtrl.dispose();
    _vehicleIdCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _departureTime,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
      builder: (ctx, child) => Theme(
          data: Theme.of(ctx).copyWith(
            colorScheme: const ColorScheme.dark(primary: AppTheme.primary),
          ),
          child: child!),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_departureTime),
      builder: (ctx, child) => Theme(
          data: Theme.of(ctx).copyWith(
            colorScheme: const ColorScheme.dark(primary: AppTheme.primary),
          ),
          child: child!),
    );
    if (time == null) return;
    setState(() {
      _departureTime = DateTime(
          date.year, date.month, date.day, time.hour, time.minute);
    });
  }

  Future<void> _publish() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _loading = true);
    try {
      await ref.read(rideRepositoryProvider).publishRide({
        'pickupLocation': _pickupCtrl.text.trim(),
        'destination': _destCtrl.text.trim(),
        'departureTime': _departureTime.toIso8601String(),
        'availableSeats': _seats,
        'farePerSeat': double.parse(_fareCtrl.text.trim()),
        'vehicleId': _vehicleIdCtrl.text.trim(),
        if (_waypointsCtrl.text.trim().isNotEmpty)
          'routeWaypoints': _waypointsCtrl.text.trim(),
      });
      ref.invalidate(myRidesProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🚀 Ride published successfully!'),
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
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      appBar: AppBar(title: const Text('Publish a Ride')),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Info banner
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: AppTheme.primary.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline,
                        color: AppTheme.primary, size: 20),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        'You need a registered vehicle to publish a ride.',
                        style: TextStyle(
                            color: AppTheme.textSecondary, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              _Label('Vehicle ID'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _vehicleIdCtrl,
                style: const TextStyle(color: AppTheme.textPrimary),
                decoration: const InputDecoration(
                  hintText: 'Enter your vehicle ID',
                  prefixIcon: Icon(Icons.directions_car_rounded),
                ),
                validator: (v) =>
                    v == null || v.isEmpty ? 'Vehicle ID is required' : null,
              ),
              const SizedBox(height: 16),

              _Label('Pickup Location'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _pickupCtrl,
                style: const TextStyle(color: AppTheme.textPrimary),
                decoration: const InputDecoration(
                  hintText: 'e.g. Koramangala, Bangalore',
                  prefixIcon: Icon(Icons.trip_origin),
                ),
                validator: (v) =>
                    v == null || v.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),

              _Label('Destination'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _destCtrl,
                style: const TextStyle(color: AppTheme.textPrimary),
                decoration: const InputDecoration(
                  hintText: 'e.g. Electronic City, Bangalore',
                  prefixIcon: Icon(Icons.location_on_rounded),
                ),
                validator: (v) =>
                    v == null || v.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),

              _Label('Via (Waypoints, optional)'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _waypointsCtrl,
                style: const TextStyle(color: AppTheme.textPrimary),
                decoration: const InputDecoration(
                  hintText: 'e.g. BTM Layout, HSR Layout',
                  prefixIcon: Icon(Icons.route_rounded),
                ),
              ),
              const SizedBox(height: 16),

              _Label('Departure Time'),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _pickDateTime,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: AppTheme.bgInput,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.schedule,
                          color: AppTheme.primary, size: 20),
                      const SizedBox(width: 12),
                      Text(
                        DateFormat('EEE, d MMM yyyy · h:mm a')
                            .format(_departureTime),
                        style: const TextStyle(
                            color: AppTheme.textPrimary, fontSize: 14),
                      ),
                      const Spacer(),
                      const Icon(Icons.edit_calendar_rounded,
                          color: AppTheme.textMuted, size: 18),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _Label('Available Seats'),
                        const SizedBox(height: 8),
                        Container(
                          decoration: BoxDecoration(
                            color: AppTheme.bgInput,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Row(
                            children: [
                              IconButton(
                                onPressed: () {
                                  if (_seats > 1) setState(() => _seats--);
                                },
                                icon: const Icon(Icons.remove,
                                    color: AppTheme.textMuted),
                              ),
                              Expanded(
                                child: Center(
                                  child: Text(
                                    '$_seats',
                                    style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.textPrimary),
                                  ),
                                ),
                              ),
                              IconButton(
                                onPressed: () {
                                  if (_seats < 8) setState(() => _seats++);
                                },
                                icon: const Icon(Icons.add,
                                    color: AppTheme.primary),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _Label('Fare per Seat (₹)'),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _fareCtrl,
                          style: const TextStyle(color: AppTheme.textPrimary),
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            hintText: '0.00',
                            prefixIcon: Icon(Icons.currency_rupee),
                          ),
                          validator: (v) {
                            if (v == null || v.isEmpty) return 'Required';
                            if (double.tryParse(v) == null) return 'Invalid';
                            return null;
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _publish,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2.5, color: Colors.white))
                      : const Text('Publish Ride 🚀'),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) {
    return Text(text,
        style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppTheme.textSecondary));
  }
}
