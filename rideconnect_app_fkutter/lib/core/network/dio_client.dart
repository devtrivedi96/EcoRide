import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:rideconnect_app/core/network/api_endpoints.dart';
import 'package:rideconnect_app/core/utils/logger.dart';

class DioClient {
  static DioClient? _instance;
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  DioClient._() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiEndpoints.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
    _setupInterceptors();
  }

  static DioClient get instance {
    _instance ??= DioClient._();
    return _instance!;
  }

  Dio get dio => _dio;

  void _setupInterceptors() {
    // Auth token injection
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          AppLogger.d('REQUEST [${options.method}] => ${options.uri}');
          handler.next(options);
        },
        onResponse: (response, handler) {
          AppLogger.d(
              'RESPONSE [${response.statusCode}] => ${response.requestOptions.uri}');
          handler.next(response);
        },
        onError: (DioException e, handler) async {
          AppLogger.e('ERROR [${e.response?.statusCode}] => ${e.requestOptions.uri}',
              error: e.message);

          // Handle 401 — clear token and redirect to login
          if (e.response?.statusCode == 401) {
            await _storage.delete(key: 'auth_token');
            // Router redirect will handle navigation
          }
          handler.next(e);
        },
      ),
    );
  }

  Future<void> setToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
  }

  Future<void> clearToken() async {
    await _storage.delete(key: 'auth_token');
  }
}
