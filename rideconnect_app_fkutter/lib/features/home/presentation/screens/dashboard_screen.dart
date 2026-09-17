import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:rideconnect_app/core/router/route_names.dart';
import 'package:rideconnect_app/core/theme/app_theme.dart';
import 'package:rideconnect_app/features/auth/domain/providers/auth_provider.dart';
import 'package:rideconnect_app/features/rides/data/providers/ride_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final ridesAsync = ref.watch(myRidesProvider);
    final greeting = _getGreeting();

    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      body: CustomScrollView(
        slivers: [
          // ── Header ────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AppTheme.bgDark,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF1E1235), Color(0xFF0D0D1A)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  greeting,
                                  style: const TextStyle(
                                      fontSize: 13,
                                      color: AppTheme.textSecondary),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  user?.fullName ?? '...',
                                  style: const TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.textPrimary),
                                ),
                                if (user?.companyName != null)
                                  Text(
                                    user!.companyName!,
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.primary),
                                  ),
                              ],
                            ),
                            // Avatar
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                gradient: AppTheme.primaryGradient,
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  user != null
                                      ? '${user.firstName[0]}${user.lastName[0]}'
                                      : '?',
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 16),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        // Date chip
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppTheme.bgCard,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.calendar_today_rounded,
                                  size: 14, color: AppTheme.primary),
                              const SizedBox(width: 6),
                              Text(
                                DateFormat('EEEE, d MMMM yyyy').format(DateTime.now()),
                                style: const TextStyle(
                                    fontSize: 12, color: AppTheme.textSecondary),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // ── Body ──────────────────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Quick Actions
                const Text('Quick Actions',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary)),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _QuickActionCard(
                        icon: Icons.search_rounded,
                        label: 'Find a Ride',
                        gradient: AppTheme.primaryGradient,
                        onTap: () => context.go(RouteNames.searchRides),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _QuickActionCard(
                        icon: Icons.add_circle_outline_rounded,
                        label: 'Publish Ride',
                        gradient: AppTheme.accentGradient,
                        onTap: () => context.push(RouteNames.publishRide),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _QuickActionCard(
                        icon: Icons.confirmation_number_rounded,
                        label: 'My Trips',
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFFB547), Color(0xFFFF6B6B)],
                        ),
                        onTap: () => context.go(RouteNames.myTrips),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _QuickActionCard(
                        icon: Icons.account_balance_wallet_rounded,
                        label: 'Wallet',
                        gradient: const LinearGradient(
                          colors: [Color(0xFF9B5DE5), Color(0xFF6C63FF)],
                        ),
                        onTap: () => context.go(RouteNames.wallet),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),

                // My Published Rides section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('My Published Rides',
                        style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary)),
                    TextButton(
                      onPressed: () => context.push(RouteNames.driverTrips),
                      child: const Text('Manage'),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ridesAsync.when(
                  loading: () => const Center(
                    child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation(AppTheme.primary)),
                  ),
                  error: (e, _) => _EmptyState(
                    icon: Icons.directions_car_outlined,
                    message: 'No rides published yet',
                    action: 'Publish a Ride',
                    onAction: () => context.push(RouteNames.publishRide),
                  ),
                  data: (rides) {
                    if (rides.isEmpty) {
                      return _EmptyState(
                        icon: Icons.directions_car_outlined,
                        message: 'You haven\'t published any rides yet',
                        action: 'Publish a Ride',
                        onAction: () => context.push(RouteNames.publishRide),
                      );
                    }
                    return ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: rides.take(3).length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (ctx, i) => _RideCard(ride: rides[i]),
                    );
                  },
                ),
                const SizedBox(height: 80),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning ☀️';
    if (hour < 17) return 'Good afternoon 🌤️';
    return 'Good evening 🌙';
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final LinearGradient gradient;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.gradient,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: gradient,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: gradient.colors.first.withValues(alpha: 0.3),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: Colors.white, size: 32),
              const SizedBox(height: 12),
              Text(
                label,
                style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.white),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RideCard extends StatelessWidget {
  final Map<String, dynamic> ride;
  const _RideCard({required this.ride});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.trip_origin, color: AppTheme.accent, size: 16),
              const SizedBox(width: 8),
              Expanded(
                  child: Text(ride['pickupLocation'] ?? '',
                      style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary))),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '₹${ride['farePerSeat']?.toStringAsFixed(0) ?? '?'}/seat',
                  style: const TextStyle(
                      color: AppTheme.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const Padding(
            padding: EdgeInsets.only(left: 7),
            child: SizedBox(
              height: 14,
              child: VerticalDivider(width: 1, color: AppTheme.border),
            ),
          ),
          Row(
            children: [
              const Icon(Icons.location_on_rounded, color: AppTheme.error, size: 16),
              const SizedBox(width: 8),
              Expanded(
                  child: Text(ride['destination'] ?? '',
                      style: const TextStyle(color: AppTheme.textSecondary))),
              Text(
                '${ride['availableSeats'] ?? 0} seats',
                style: const TextStyle(
                    color: AppTheme.textMuted, fontSize: 12),
              ),
            ],
          ),
          if (ride['departureTime'] != null) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.schedule, color: AppTheme.textMuted, size: 14),
                const SizedBox(width: 6),
                Text(
                  _formatTime(ride['departureTime']),
                  style: const TextStyle(
                      fontSize: 12, color: AppTheme.textMuted),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  String _formatTime(String? t) {
    if (t == null) return '';
    try {
      return DateFormat('EEE, d MMM · h:mm a')
          .format(DateTime.parse(t).toLocal());
    } catch (_) {
      return t;
    }
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  final String? action;
  final VoidCallback? onAction;

  const _EmptyState({
    required this.icon,
    required this.message,
    this.action,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          Icon(icon, size: 48, color: AppTheme.textMuted),
          const SizedBox(height: 12),
          Text(message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.textSecondary)),
          if (action != null) ...[
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onAction,
              child: Text(action!),
            ),
          ],
        ],
      ),
    );
  }
}
