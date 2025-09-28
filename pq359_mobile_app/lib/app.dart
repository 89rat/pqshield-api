import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/constants/app_colors.dart';
import 'core/constants/app_themes.dart';
import 'core/router/app_router.dart';
import 'core/providers/theme_provider.dart';
import 'core/providers/auth_provider.dart';
import 'features/splash/presentation/screens/splash_screen.dart';
import 'features/dashboard/presentation/screens/dashboard_screen.dart';
import 'features/auth/presentation/screens/login_screen.dart';

class PQ359App extends ConsumerWidget {
  const PQ359App({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final authState = ref.watch(authStateProvider);
    
    return MaterialApp(
      title: 'PQ359 - Quantum Security',
      debugShowCheckedModeBanner: false,
      
      // Theme Configuration
      theme: AppThemes.lightTheme,
      darkTheme: AppThemes.darkTheme,
      themeMode: themeMode,
      
      // Localization
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en', 'US'),
        Locale('es', 'ES'),
        Locale('fr', 'FR'),
        Locale('de', 'DE'),
        Locale('ja', 'JP'),
        Locale('zh', 'CN'),
      ],
      
      // Navigation
      onGenerateRoute: AppRouter.generateRoute,
      initialRoute: _getInitialRoute(authState),
      
      // Global App Configuration
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaleFactor: 1.0, // Prevent system font scaling
          ),
          child: child ?? const SizedBox.shrink(),
        );
      },
      
      // Error Handling
      home: _buildHome(authState),
    );
  }
  
  String _getInitialRoute(AsyncValue<AuthState> authState) {
    return authState.when(
      data: (state) {
        switch (state.status) {
          case AuthStatus.authenticated:
            return '/dashboard';
          case AuthStatus.unauthenticated:
            return '/login';
          case AuthStatus.initial:
          default:
            return '/splash';
        }
      },
      loading: () => '/splash',
      error: (_, __) => '/login',
    );
  }
  
  Widget _buildHome(AsyncValue<AuthState> authState) {
    return authState.when(
      data: (state) {
        switch (state.status) {
          case AuthStatus.authenticated:
            return const DashboardScreen();
          case AuthStatus.unauthenticated:
            return const LoginScreen();
          case AuthStatus.initial:
          default:
            return const SplashScreen();
        }
      },
      loading: () => const SplashScreen(),
      error: (error, stackTrace) => ErrorScreen(
        error: error,
        onRetry: () {
          // Retry authentication
        },
      ),
    );
  }
}

class ErrorScreen extends StatelessWidget {
  final Object error;
  final VoidCallback onRetry;
  
  const ErrorScreen({
    Key? key,
    required this.error,
    required this.onRetry,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: AppColors.dangerRed,
              ),
              const SizedBox(height: 24),
              Text(
                'Something went wrong',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                error.toString(),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white70,
                ),
                textAlign: TextAlign.center,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryBlue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 16,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Auth State Models
enum AuthStatus {
  initial,
  authenticated,
  unauthenticated,
}

class AuthState {
  final AuthStatus status;
  final String? userId;
  final String? email;
  final Map<String, dynamic>? userProfile;
  final String? error;
  
  const AuthState({
    required this.status,
    this.userId,
    this.email,
    this.userProfile,
    this.error,
  });
  
  AuthState copyWith({
    AuthStatus? status,
    String? userId,
    String? email,
    Map<String, dynamic>? userProfile,
    String? error,
  }) {
    return AuthState(
      status: status ?? this.status,
      userId: userId ?? this.userId,
      email: email ?? this.email,
      userProfile: userProfile ?? this.userProfile,
      error: error ?? this.error,
    );
  }
}
