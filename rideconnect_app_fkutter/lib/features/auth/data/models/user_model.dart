import 'package:equatable/equatable.dart';

class UserModel extends Equatable {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String? phoneNumber;
  final String role;
  final String? companyName;
  final String? driverLicense;
  final String token;

  const UserModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phoneNumber,
    required this.role,
    this.companyName,
    this.driverLicense,
    required this.token,
  });

  String get fullName => '$firstName $lastName';
  bool get isDriver => role == 'DRIVER' || role == 'ADMIN';
  bool get isAdmin => role == 'ADMIN';

  factory UserModel.fromJson(Map<String, dynamic> json, {String token = ''}) {
    return UserModel(
      id: json['id'] as String? ?? '',
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phoneNumber: json['phoneNumber'] as String?,
      role: json['role'] as String? ?? 'EMPLOYEE',
      companyName: json['companyName'] as String?,
      driverLicense: json['driverLicense'] as String?,
      token: token,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'phoneNumber': phoneNumber,
        'role': role,
        'companyName': companyName,
        'driverLicense': driverLicense,
      };

  UserModel copyWith({
    String? id,
    String? firstName,
    String? lastName,
    String? email,
    String? phoneNumber,
    String? role,
    String? companyName,
    String? driverLicense,
    String? token,
  }) {
    return UserModel(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      role: role ?? this.role,
      companyName: companyName ?? this.companyName,
      driverLicense: driverLicense ?? this.driverLicense,
      token: token ?? this.token,
    );
  }

  @override
  List<Object?> get props => [id, email, role];
}
