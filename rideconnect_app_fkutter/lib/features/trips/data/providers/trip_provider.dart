import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rideconnect_app/core/network/api_endpoints.dart';
import 'package:rideconnect_app/core/network/dio_client.dart';

class TripRepository {
  final DioClient _client = DioClient.instance;

  Future<List<Map<String, dynamic>>> getMyTrips() async {
    try {
      final res = await _client.dio.get(ApiEndpoints.myTrips);
      return List<Map<String, dynamic>>.from(res.data as List);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message);
    }
  }

  Future<List<Map<String, dynamic>>> getDriverTrips() async {
    try {
      final res = await _client.dio.get(ApiEndpoints.driverTrips);
      return List<Map<String, dynamic>>.from(res.data as List);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message);
    }
  }

  Future<Map<String, dynamic>> bookTrip({
    required String rideId,
    required int bookedSeats,
    required String paymentMethod,
  }) async {
    try {
      final res = await _client.dio.post(ApiEndpoints.trips, data: {
        'rideId': rideId,
        'bookedSeats': bookedSeats,
        'paymentMethod': paymentMethod,
      });
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message);
    }
  }

  Future<Map<String, dynamic>> updateTripStatus(
      String tripId, String status) async {
    try {
      final res = await _client.dio.patch(
          '${ApiEndpoints.trips}/$tripId/status',
          queryParameters: {'status': status});
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message);
    }
  }

  Future<Map<String, dynamic>> acceptTrip(String tripId) async {
    try {
      final res =
          await _client.dio.post('${ApiEndpoints.trips}/$tripId/accept');
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message);
    }
  }

  Future<Map<String, dynamic>> rejectTrip(String tripId) async {
    try {
      final res =
          await _client.dio.post('${ApiEndpoints.trips}/$tripId/reject');
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message);
    }
  }

  Future<Map<String, dynamic>> cancelTrip(String tripId) async {
    try {
      final res =
          await _client.dio.patch('${ApiEndpoints.trips}/$tripId/cancel');
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message);
    }
  }

  Future<Map<String, dynamic>> verifyOtp(String tripId, String otp) async {
    try {
      final res = await _client.dio.post(
          '${ApiEndpoints.trips}/$tripId/verify-otp',
          queryParameters: {'otp': otp});
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message);
    }
  }
}

// ── Providers ──────────────────────────────────────────────────────────────

final tripRepositoryProvider =
    Provider<TripRepository>((ref) => TripRepository());

final myTripsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  return ref.read(tripRepositoryProvider).getMyTrips();
});

final driverTripsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  return ref.read(tripRepositoryProvider).getDriverTrips();
});
