import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rideconnect_app/core/router/route_names.dart';
import 'package:rideconnect_app/features/auth/presentation/screens/splash_screen.dart';
import 'package:rideconnect_app/features/auth/presentation/screens/onboarding_screen.dart';
import 'package:rideconnect_app/features/auth/presentation/screens/login_screen.dart';
import 'package:rideconnect_app/features/auth/presentation/screens/register_screen.dart';
import 'package:rideconnect_app/features/auth/domain/providers/auth_provider.dart';
import 'package:rideconnect_app/features/home/presentation/screens/home_shell.dart';
import 'package:rideconnect_app/features/home/presentation/screens/dashboard_screen.dart';
import 'package:rideconnect_app/features/rides/presentation/screens/search_rides_screen.dart';
import 'package:rideconnect_app/features/rides/presentation/screens/publish_ride_screen.dart';
import 'package:rideconnect_app/features/rides/presentation/screens/ride_detail_screen.dart';
import 'package:rideconnect_app/features/trips/presentation/screens/my_trips_screen.dart';
import 'package:rideconnect_app/features/trips/presentation/screens/driver_trips_screen.dart';
import 'package:rideconnect_app/features/wallet/presentation/screens/wallet_screen.dart';
import 'package:rideconnect_app/features/profile/presentation/screens/profile_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: RouteNames.splash,
    debugLogDiagnostics: false,
    redirect: (context, state) {
      final isAuthenticated = authState.value != null;
      final isSplash = state.matchedLocation == RouteNames.splash;
      final isOnboarding = state.matchedLocation == RouteNames.onboarding;
      final isAuth = state.matchedLocation == RouteNames.login ||
          state.matchedLocation == RouteNames.register;

      if (isSplash) return null;
      if (!isAuthenticated && !isAuth && !isOnboarding) return RouteNames.login;
      if (isAuthenticated && isAuth) return RouteNames.dashboard;
      return null;
    },
    routes: [
      GoRoute(
        path: RouteNames.splash,
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: RouteNames.onboarding,
        name: 'onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: RouteNames.login,
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: RouteNames.register,
        name: 'register',
        builder: (context, state) => const RegisterScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => HomeShell(child: child),
        routes: [
          GoRoute(
            path: RouteNames.dashboard,
            name: 'dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: RouteNames.searchRides,
            name: 'search-rides',
            builder: (context, state) => const SearchRidesScreen(),
          ),
          GoRoute(
            path: RouteNames.myTrips,
            name: 'my-trips',
            builder: (context, state) => const MyTripsScreen(),
          ),
          GoRoute(
            path: RouteNames.wallet,
            name: 'wallet',
            builder: (context, state) => const WalletScreen(),
          ),
          GoRoute(
            path: RouteNames.profile,
            name: 'profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
      GoRoute(
        path: RouteNames.publishRide,
        name: 'publish-ride',
        builder: (context, state) => const PublishRideScreen(),
      ),
      GoRoute(
        path: '${RouteNames.rideDetail}/:rideId',
        name: 'ride-detail',
        builder: (context, state) {
          final rideId = state.pathParameters['rideId']!;
          return RideDetailScreen(rideId: rideId);
        },
      ),
      GoRoute(
        path: RouteNames.driverTrips,
        name: 'driver-trips',
        builder: (context, state) => const DriverTripsScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      backgroundColor: const Color(0xFF0D0D1A),
      body: Center(
        child: Text(
          'Page Not Found\n${state.error}',
          textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.white),
        ),
      ),
    ),
  );
});
