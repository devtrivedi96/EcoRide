import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rideconnect_app/core/network/api_endpoints.dart';
import 'package:rideconnect_app/core/network/dio_client.dart';

class RideRepository {
  final DioClient _client = DioClient.instance;

  Future<List<Map<String, dynamic>>> searchRides({
    required String pickup,
    required String destination,
    required String departureTime,
    int seats = 1,
  }) async {
    try {
      final res = await _client.dio.get(ApiEndpoints.searchRides, queryParameters: {
        'pickupLocation': pickup,
        'destination': destination,
        'departureTime': departureTime,
        'seats': seats,
      });
      return List<Map<String, dynamic>>.from(res.data as List);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message);
    }
  }

  Future<List<Map<String, dynamic>>> getMyRides() async {
    try {
      final res = await _client.dio.get(ApiEndpoints.myRides);
      return List<Map<String, dynamic>>.from(res.data as List);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message);
    }
  }

  Future<Map<String, dynamic>> publishRide(Map<String, dynamic> body) async {
    try {
      final res = await _client.dio.post(ApiEndpoints.rides, data: body);
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message);
    }
  }

  Future<void> deleteRide(String rideId) async {
    try {
      await _client.dio.delete('${ApiEndpoints.rides}/$rideId');
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message);
    }
  }

  Future<Map<String, List<String>>> getAvailableLocations() async {
    try {
      final res = await _client.dio.get(ApiEndpoints.rideLocations);
      final data = res.data as Map<String, dynamic>;
      return {
        'pickupLocations': List<String>.from(data['pickupLocations'] as List),
        'destinations': List<String>.from(data['destinations'] as List),
      };
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message);
    }
  }
}

// ── Providers ──────────────────────────────────────────────────────────────

final rideRepositoryProvider = Provider<RideRepository>((ref) => RideRepository());

final myRidesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return ref.read(rideRepositoryProvider).getMyRides();
});

final availableLocationsProvider =
    FutureProvider<Map<String, List<String>>>((ref) async {
  return ref.read(rideRepositoryProvider).getAvailableLocations();
});

// Search rides state
class SearchRidesNotifier
    extends StateNotifier<AsyncValue<List<Map<String, dynamic>>>> {
  final RideRepository _repo;
  SearchRidesNotifier(this._repo) : super(const AsyncData([]));

  Future<void> search({
    required String pickup,
    required String destination,
    required String departureTime,
    int seats = 1,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _repo.searchRides(
          pickup: pickup,
          destination: destination,
          departureTime: departureTime,
          seats: seats,
        ));
  }

  void clear() => state = const AsyncData([]);
}

final searchRidesProvider = StateNotifierProvider<SearchRidesNotifier,
    AsyncValue<List<Map<String, dynamic>>>>((ref) {
  return SearchRidesNotifier(ref.read(rideRepositoryProvider));
});
