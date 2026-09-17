import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rideconnect_app/core/network/api_endpoints.dart';
import 'package:rideconnect_app/core/network/dio_client.dart';

class PaymentRepository {
  final DioClient _client = DioClient.instance;

  Future<Map<String, dynamic>> getWallet() async {
    try {
      final res = await _client.dio.get(ApiEndpoints.wallet);
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message);
    }
  }

  Future<List<Map<String, dynamic>>> getTransactions() async {
    try {
      final res = await _client.dio.get(ApiEndpoints.transactions);
      return List<Map<String, dynamic>>.from(res.data as List);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message);
    }
  }

  Future<Map<String, dynamic>> rechargeWallet(
      double amount, String method) async {
    try {
      final res = await _client.dio.post(ApiEndpoints.walletRecharge, data: {
        'amount': amount,
        'paymentMethod': method,
      });
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message);
    }
  }
}

// ── Providers ──────────────────────────────────────────────────────────────

final paymentRepositoryProvider =
    Provider<PaymentRepository>((ref) => PaymentRepository());

final walletProvider =
    FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(paymentRepositoryProvider).getWallet();
});

final transactionsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  return ref.read(paymentRepositoryProvider).getTransactions();
});
