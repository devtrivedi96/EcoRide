import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rideconnect_app/core/theme/app_theme.dart';
import 'package:rideconnect_app/features/auth/domain/providers/auth_provider.dart';
import 'package:rideconnect_app/features/auth/presentation/widgets/auth_text_field.dart';
import 'package:rideconnect_app/features/auth/presentation/widgets/gradient_button.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscure1 = true;
  bool _obscure2 = true;

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    await ref.read(authStateProvider.notifier).register(
          firstName: _firstNameCtrl.text.trim(),
          lastName: _lastNameCtrl.text.trim(),
          email: _emailCtrl.text.trim(),
          password: _passwordCtrl.text,
          phoneNumber:
              _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
        );
    final authState = ref.read(authStateProvider);
    if (authState.hasError && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authState.error.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppTheme.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Back button
                IconButton(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.arrow_back_ios_new_rounded,
                      color: AppTheme.textPrimary),
                  style: IconButton.styleFrom(
                    backgroundColor: AppTheme.bgCard,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 24),

                const Text('Create Account',
                    style: TextStyle(
                        fontSize: 30,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPrimary)),
                const SizedBox(height: 8),
                const Text(
                    'Your company workspace is auto-detected from your email domain',
                    style:
                        TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                const SizedBox(height: 32),

                // First & Last name row
                Row(
                  children: [
                    Expanded(
                      child: AuthTextField(
                        controller: _firstNameCtrl,
                        label: 'First Name',
                        hint: 'John',
                        prefixIcon: Icons.person_outline_rounded,
                        validator: (v) =>
                            v == null || v.isEmpty ? 'Required' : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: AuthTextField(
                        controller: _lastNameCtrl,
                        label: 'Last Name',
                        hint: 'Doe',
                        prefixIcon: Icons.person_outline_rounded,
                        validator: (v) =>
                            v == null || v.isEmpty ? 'Required' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                AuthTextField(
                  controller: _emailCtrl,
                  label: 'Work Email',
                  hint: 'you@company.com',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Email is required';
                    if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(v)) {
                      return 'Enter a valid email';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                AuthTextField(
                  controller: _phoneCtrl,
                  label: 'Phone Number (optional)',
                  hint: '+91 9876543210',
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),

                AuthTextField(
                  controller: _passwordCtrl,
                  label: 'Password',
                  hint: '8+ characters',
                  prefixIcon: Icons.lock_outline_rounded,
                  obscureText: _obscure1,
                  suffixIcon: IconButton(
                    icon: Icon(_obscure1
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined),
                    onPressed: () => setState(() => _obscure1 = !_obscure1),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Password is required';
                    if (v.length < 8) return 'Must be 8+ characters';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                AuthTextField(
                  controller: _confirmCtrl,
                  label: 'Confirm Password',
                  hint: '••••••••',
                  prefixIcon: Icons.lock_outline_rounded,
                  obscureText: _obscure2,
                  suffixIcon: IconButton(
                    icon: Icon(_obscure2
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined),
                    onPressed: () => setState(() => _obscure2 = !_obscure2),
                  ),
                  validator: (v) {
                    if (v != _passwordCtrl.text) return 'Passwords do not match';
                    return null;
                  },
                ),
                const SizedBox(height: 32),

                GradientButton(
                  label: 'Create Account',
                  isLoading: authState.isLoading,
                  onPressed: _register,
                ),
                const SizedBox(height: 24),

                Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Already have an account? ',
                          style: TextStyle(color: AppTheme.textSecondary)),
                      GestureDetector(
                        onTap: () => context.pop(),
                        child: ShaderMask(
                          shaderCallback: (b) =>
                              AppTheme.primaryGradient.createShader(b),
                          child: const Text('Sign In',
                              style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white)),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
