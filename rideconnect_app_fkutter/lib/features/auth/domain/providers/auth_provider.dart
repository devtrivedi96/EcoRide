import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:rideconnect_app/features/auth/data/models/user_model.dart';
import 'package:rideconnect_app/features/auth/data/repositories/auth_repository.dart';

// ── Repository provider ────────────────────────────────────────────────────
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

// ── Auth State — persists the logged-in user ──────────────────────────────
final authStateProvider =
    AsyncNotifierProvider<AuthNotifier, UserModel?>(() => AuthNotifier());

class AuthNotifier extends AsyncNotifier<UserModel?> {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  late final AuthRepository _repo;

  @override
  Future<UserModel?> build() async {
    _repo = ref.read(authRepositoryProvider);
    return await _restoreSession();
  }

  Future<UserModel?> _restoreSession() async {
    try {
      final token = await _storage.read(key: 'auth_token');
      if (token == null) return null;
      final userJson = await _storage.read(key: 'user_data');
      if (userJson == null) return null;
      return UserModel.fromJson(
          json.decode(userJson) as Map<String, dynamic>,
          token: token);
    } catch (_) {
      return null;
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final user = await _repo.login(email: email, password: password);
      await _storage.write(key: 'user_data', value: json.encode(user.toJson()));
      return user;
    });
  }

  Future<void> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? phoneNumber,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final user = await _repo.register(
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        phoneNumber: phoneNumber,
      );
      await _storage.write(key: 'user_data', value: json.encode(user.toJson()));
      return user;
    });
  }

  Future<void> logout() async {
    await _repo.logout();
    await _storage.delete(key: 'user_data');
    await _storage.delete(key: 'auth_token');
    state = const AsyncData(null);
  }
}

// ── Convenience selector ──────────────────────────────────────────────────
final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authStateProvider).value;
});
