# 🚗 RideConnect — Flutter Mobile App

Enterprise Carpooling Platform for Android (& iOS) built with Flutter 3.

## 📱 Features

| Screen | Description |
|--------|-------------|
| **Onboarding** | 4-page illustrated onboarding for new users |
| **Login / Register** | JWT auth, auto company detection by email domain |
| **Dashboard** | Greeting, quick actions, my published rides |
| **Search Rides** | Location + date/time + seat search with results list |
| **Ride Detail** | Driver info, vehicle, seat selector, book + payment |
| **Publish Ride** | Form to publish a ride as a driver |
| **My Trips** | Passenger booked trips with OTP display & cancel |
| **Driver Trips** | Accept / Reject requests, verify OTP to start trip |
| **Wallet** | Balance card, add money, transaction history |
| **Profile** | User info, navigation shortcuts, sign-out |

## 🏗️ Architecture

```
lib/
├── core/
│   ├── network/       # Dio HTTP client + API endpoints
│   ├── router/        # GoRouter with auth guards
│   ├── theme/         # AppTheme (dark, Material 3)
│   └── utils/         # Logger
└── features/
    ├── auth/          # Login, Register, Splash, Onboarding
    ├── home/          # HomeShell (bottom nav) + Dashboard
    ├── rides/         # Search, Publish, Ride Detail
    ├── trips/         # My Trips, Driver Trips
    ├── wallet/        # Wallet, Transactions
    └── profile/       # Profile Screen
```

**State Management:** Riverpod (`AsyncNotifier`, `FutureProvider`, `StateNotifierProvider`)  
**Navigation:** GoRouter with `ShellRoute` for bottom nav  
**Networking:** Dio with auth token interceptor  
**Storage:** `flutter_secure_storage` (JWT), `shared_preferences` (onboarding flag)

## ⚙️ Setup

### 1. Prerequisites

```bash
# Install Flutter (already done via snap)
flutter --version

# Install Android SDK via Android Studio or command line tools
```

### 2. Configure Backend URL

Edit `lib/core/network/api_endpoints.dart`:

```dart
// For Android Emulator (points to host machine)
static const String baseUrl = 'http://10.0.2.2:8081/api';

// For physical device on same WiFi
static const String baseUrl = 'http://192.168.X.X:8081/api';
```

### 3. Start the Backend

```bash
cd ../backend-node
npm run dev
```

### 4. Run the App

```bash
cd rideconnect_app

# Get dependencies
flutter pub get

# List connected devices
flutter devices

# Run on connected Android device / emulator
flutter run

# Run on a specific device
flutter run -d <device-id>
```

### 5. Build APK

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

## 🔧 Environment Notes

- **Base URL** `10.0.2.2` is the Android emulator loopback to your host machine's `localhost`.
- For real devices, replace with your machine's local IP address.
- The backend runs on port **8081** by default (see `backend-node/.env`).

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `flutter_riverpod` | State management |
| `go_router` | Declarative navigation |
| `dio` | HTTP client with interceptors |
| `flutter_secure_storage` | Secure JWT storage |
| `google_fonts` | Inter font family |
| `shared_preferences` | Onboarding persistence |
| `intl` | Date/time formatting |
| `equatable` | Value equality for models |

## 🚀 Scalability Notes

- **Feature-first folder structure** — each feature is self-contained with `data/`, `domain/`, `presentation/` layers
- **Repository pattern** — easy to swap backends (REST → GraphQL → Firebase)
- **Riverpod providers** — `autoDispose` prevents memory leaks; `invalidate()` for manual refresh
- **GoRouter** — deep links and auth-guarded routes built-in
- Add `riverpod_generator` + `freezed` for codegen when team scales
