class ApiEndpoints {
  ApiEndpoints._();

  // Change this to your backend IP/domain when running on a real device
  static const String baseUrl = 'http://10.0.2.2:8081/api';
  // For physical devices on the same WiFi: 'http://192.168.X.X:8081/api'

  // Auth
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';

  // Users
  static const String me = '/users/me';
  static const String resetPasswordAuth = '/users/reset-password';
  static const String savedPlaces = '/users/saved-places';

  // Rides
  static const String rides = '/rides';
  static const String searchRides = '/rides/search';
  static const String rideLocations = '/rides/locations';
  static const String myRides = '/rides/me';

  // Trips
  static const String trips = '/trips';
  static const String myTrips = '/trips/me';
  static const String myTripsPdf = '/trips/me/pdf';
  static const String driverTrips = '/trips/driver';

  // Payments
  static const String createOrder = '/payments/create-order';
  static const String verifyRazorpay = '/payments/verify-razorpay';
  static const String wallet = '/payments/wallet';
  static const String walletRecharge = '/payments/wallet/recharge';
  static const String tripPay = '/payments/trip/pay';
  static const String transactions = '/payments/transactions';

  // Admin
  static const String adminUsers = '/admin/users';
  static const String adminStats = '/admin/stats';

  // Analytics
  static const String analytics = '/analytics/me';

  // Chat
  static String chatHistory(String tripId) => '/chat/$tripId';

  // Health
  static const String health = '/health';
}
