import 'package:dio/dio.dart';
import 'package:rideconnect_app/core/network/api_endpoints.dart';
import 'package:rideconnect_app/core/network/dio_client.dart';
import 'package:rideconnect_app/features/auth/data/models/user_model.dart';

class AuthRepository {
  final DioClient _client = DioClient.instance;

  Future<UserModel> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? phoneNumber,
  }) async {
    try {
      final res = await _client.dio.post(ApiEndpoints.register, data: {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': password,
        if (phoneNumber != null) 'phoneNumber': phoneNumber,
      });
      final token = res.data['token'] as String;
      await _client.setToken(token);
      return UserModel.fromJson(
          res.data['user'] as Map<String, dynamic>,
          token: token);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    try {
      final res = await _client.dio.post(ApiEndpoints.login, data: {
        'email': email,
        'password': password,
      });
      final token = res.data['token'] as String;
      await _client.setToken(token);
      return UserModel.fromJson(
          res.data['user'] as Map<String, dynamic>,
          token: token);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> logout() async {
    await _client.clearToken();
  }

  Future<UserModel> getMe() async {
    try {
      final res = await _client.dio.get(ApiEndpoints.me);
      return UserModel.fromJson(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> forgotPassword(String email) async {
    try {
      await _client.dio.post(ApiEndpoints.forgotPassword,
          data: {'email': email});
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(DioException e) {
    final message = e.response?.data?['message'] as String? ??
        e.message ??
        'An unexpected error occurred';
    return Exception(message);
  }
}
