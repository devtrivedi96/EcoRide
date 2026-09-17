import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rideconnect_app/core/router/route_names.dart';
import 'package:rideconnect_app/core/theme/app_theme.dart';
import 'package:rideconnect_app/features/auth/domain/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      appBar: AppBar(title: const Text('Profile')),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // ── Avatar Section ───────────────────────────────
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF1E1235), Color(0xFF0D0D1A)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Column(
                children: [
                  Stack(
                    children: [
                      Container(
                        width: 90,
                        height: 90,
                        decoration: BoxDecoration(
                          gradient: AppTheme.primaryGradient,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primary.withValues(alpha: 0.4),
                              blurRadius: 30,
                              spreadRadius: 5,
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            user != null
                                ? '${user.firstName[0]}${user.lastName[0]}'
                                : '?',
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 32),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    user?.fullName ?? '',
                    style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user?.email ?? '',
                    style: const TextStyle(
                        color: AppTheme.textSecondary, fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _Badge(label: user?.role ?? 'EMPLOYEE'),
                      if (user?.companyName != null) ...[
                        const SizedBox(width: 8),
                        _Badge(
                          label: user!.companyName!,
                          color: AppTheme.accent,
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),

            // ── Info Section ─────────────────────────────────
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  _InfoCard(
                    children: [
                      _InfoRow(
                        icon: Icons.phone_rounded,
                        label: 'Phone',
                        value: user?.phoneNumber ?? 'Not set',
                      ),
                      const Divider(color: AppTheme.border),
                      _InfoRow(
                        icon: Icons.badge_rounded,
                        label: 'Driver License',
                        value: user?.driverLicense ?? 'Not set',
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Action items
                  _InfoCard(
                    children: [
                      _ActionRow(
                        icon: Icons.directions_car_rounded,
                        label: 'My Published Rides',
                        color: AppTheme.accent,
                        onTap: () {},
                      ),
                      const Divider(color: AppTheme.border),
                      _ActionRow(
                        icon: Icons.supervisor_account_rounded,
                        label: 'Driver Trip Requests',
                        color: AppTheme.primary,
                        onTap: () => context.push(RouteNames.driverTrips),
                      ),
                      const Divider(color: AppTheme.border),
                      _ActionRow(
                        icon: Icons.lock_reset_rounded,
                        label: 'Change Password',
                        color: AppTheme.warning,
                        onTap: () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Logout
                  _InfoCard(
                    children: [
                      _ActionRow(
                        icon: Icons.logout_rounded,
                        label: 'Sign Out',
                        color: AppTheme.error,
                        onTap: () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Sign Out'),
                              content: const Text(
                                  'Are you sure you want to sign out?'),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(ctx, false),
                                  child: const Text('Cancel'),
                                ),
                                ElevatedButton(
                                  onPressed: () => Navigator.pop(ctx, true),
                                  style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.error),
                                  child: const Text('Sign Out'),
                                ),
                              ],
                            ),
                          );
                          if (confirm == true && context.mounted) {
                            await ref
                                .read(authStateProvider.notifier)
                                .logout();
                          }
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // App version
                  Text(
                    'RideConnect v1.0.0',
                    style: TextStyle(
                        color: AppTheme.textMuted, fontSize: 12),
                  ),
                  const SizedBox(height: 80),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color? color;
  const _Badge({required this.label, this.color});

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppTheme.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: c.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
            color: c, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final List<Widget> children;
  const _InfoCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(children: children),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow(
      {required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.textMuted, size: 20),
          const SizedBox(width: 12),
          Expanded(
              child: Text(label,
                  style: const TextStyle(color: AppTheme.textSecondary))),
          Text(value,
              style: const TextStyle(
                  color: AppTheme.textPrimary, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _ActionRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionRow(
      {required this.icon,
      required this.label,
      required this.color,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
                child: Text(label,
                    style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontWeight: FontWeight.w500))),
            const Icon(Icons.arrow_forward_ios_rounded,
                size: 14, color: AppTheme.textMuted),
          ],
        ),
      ),
    );
  }
}
