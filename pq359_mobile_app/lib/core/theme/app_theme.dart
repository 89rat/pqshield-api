import 'package:flutter/material.dart';

/// PQ359 Production App Theme
/// Complete design system with quantum-inspired branding
class AppTheme {
  // ============ Brand Colors ============
  
  // Primary Palette - Quantum Security
  static const Color quantumBlue = Color(0xFF0D47A1);    // Primary brand
  static const Color quantumPurple = Color(0xFF4A148C);  // Quantum state
  static const Color quantumCyan = Color(0xFF00ACC1);    // Active scanning
  
  // Semantic Colors - Threat Levels
  static const Color safeMint = Color(0xFF00E676);       // No threats
  static const Color cautionAmber = Color(0xFFFFAB00);   // Low threat
  static const Color warningOrange = Color(0xFFFF6D00);  // Medium threat
  static const Color dangerRed = Color(0xFFD50000);      // High threat
  static const Color criticalMagenta = Color(0xFFE91E63); // Critical threat
  
  // Neutral Palette - Dark Theme Primary
  static const Color voidBlack = Color(0xFF000000);      // True black for OLED
  static const Color deepSpace = Color(0xFF0A0E1A);      // Background
  static const Color darkMatter = Color(0xFF141923);     // Surface
  static const Color cosmicGray = Color(0xFF1C2231);     // Card
  static const Color stellarGray = Color(0xFF2A3142);    // Elevated
  static const Color moonGray = Color(0xFF4A5568);       // Disabled
  static const Color silverNebula = Color(0xFF718096);   // Subtle text
  static const Color lightNebula = Color(0xFFA0AEC0);    // Body text
  static const Color starWhite = Color(0xFFE2E8F0);      // Primary text
  static const Color pureWhite = Color(0xFFFFFFFF);      // High emphasis
  
  // ============ Gradients ============
  
  static const quantumGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [quantumBlue, quantumPurple, quantumCyan],
    stops: [0.0, 0.5, 1.0],
  );
  
  static const threatGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [safeMint, cautionAmber, warningOrange, dangerRed],
    stops: [0.0, 0.33, 0.66, 1.0],
  );
  
  static const shieldGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [quantumCyan, quantumBlue, quantumPurple],
    stops: [0.0, 0.5, 1.0],
  );
  
  static const neuralGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF667eea),
      Color(0xFF764ba2),
      Color(0xFFf093fb),
      Color(0xFFf5576c),
    ],
  );
  
  // ============ Typography ============
  
  static const String primaryFont = 'Inter';
  static const String monoFont = 'JetBrainsMono';
  static const String displayFont = 'Orbitron';
  
  static final TextTheme textTheme = TextTheme(
    // Display styles - for big impact
    displayLarge: TextStyle(
      fontFamily: displayFont,
      fontSize: 96,
      fontWeight: FontWeight.w300,
      letterSpacing: -1.5,
      color: starWhite,
      height: 1.12,
    ),
    displayMedium: TextStyle(
      fontFamily: displayFont,
      fontSize: 60,
      fontWeight: FontWeight.w300,
      letterSpacing: -0.5,
      color: starWhite,
      height: 1.16,
    ),
    displaySmall: TextStyle(
      fontFamily: displayFont,
      fontSize: 48,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      color: starWhite,
      height: 1.22,
    ),
    
    // Headlines - for sections
    headlineLarge: TextStyle(
      fontFamily: primaryFont,
      fontSize: 40,
      fontWeight: FontWeight.w700,
      letterSpacing: 0.25,
      color: starWhite,
      height: 1.25,
    ),
    headlineMedium: TextStyle(
      fontFamily: primaryFont,
      fontSize: 32,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: starWhite,
      height: 1.25,
    ),
    headlineSmall: TextStyle(
      fontFamily: primaryFont,
      fontSize: 24,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: starWhite,
      height: 1.33,
    ),
    
    // Titles
    titleLarge: TextStyle(
      fontFamily: primaryFont,
      fontSize: 22,
      fontWeight: FontWeight.w500,
      letterSpacing: 0,
      color: starWhite,
      height: 1.27,
    ),
    titleMedium: TextStyle(
      fontFamily: primaryFont,
      fontSize: 16,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.15,
      color: starWhite,
      height: 1.5,
    ),
    titleSmall: TextStyle(
      fontFamily: primaryFont,
      fontSize: 14,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.1,
      color: starWhite,
      height: 1.43,
    ),
    
    // Body text
    bodyLarge: TextStyle(
      fontFamily: primaryFont,
      fontSize: 16,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.5,
      color: lightNebula,
      height: 1.5,
    ),
    bodyMedium: TextStyle(
      fontFamily: primaryFont,
      fontSize: 14,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.25,
      color: lightNebula,
      height: 1.43,
    ),
    bodySmall: TextStyle(
      fontFamily: primaryFont,
      fontSize: 12,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.4,
      color: silverNebula,
      height: 1.33,
    ),
    
    // Labels
    labelLarge: TextStyle(
      fontFamily: primaryFont,
      fontSize: 14,
      fontWeight: FontWeight.w500,
      letterSpacing: 1.25,
      color: starWhite,
      height: 1.43,
    ),
    labelMedium: TextStyle(
      fontFamily: monoFont,
      fontSize: 12,
      fontWeight: FontWeight.w500,
      letterSpacing: 1.5,
      color: lightNebula,
      height: 1.33,
    ),
    labelSmall: TextStyle(
      fontFamily: monoFont,
      fontSize: 11,
      fontWeight: FontWeight.w500,
      letterSpacing: 1.5,
      color: silverNebula,
      height: 1.45,
    ),
  );
  
  // ============ Spacing System (8px grid) ============
  
  static const double space1 = 4.0;   // Tight
  static const double space2 = 8.0;   // Default
  static const double space3 = 12.0;  // Comfortable
  static const double space4 = 16.0;  // Standard
  static const double space5 = 20.0;  // Relaxed
  static const double space6 = 24.0;  // Spacious
  static const double space8 = 32.0;  // Section
  static const double space10 = 40.0; // Large section
  static const double space12 = 48.0; // Hero
  static const double space16 = 64.0; // Page
  
  // ============ Border Radius ============
  
  static const double radiusXs = 4.0;
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  static const double radiusXl = 24.0;
  static const double radiusRound = 999.0;
  
  // ============ Elevation & Shadows ============
  
  static List<BoxShadow> elevation1 = [
    BoxShadow(
      color: voidBlack.withOpacity(0.2),
      blurRadius: 2,
      offset: const Offset(0, 1),
    ),
  ];
  
  static List<BoxShadow> elevation2 = [
    BoxShadow(
      color: voidBlack.withOpacity(0.3),
      blurRadius: 4,
      offset: const Offset(0, 2),
    ),
  ];
  
  static List<BoxShadow> elevation3 = [
    BoxShadow(
      color: voidBlack.withOpacity(0.4),
      blurRadius: 8,
      offset: const Offset(0, 4),
    ),
  ];
  
  static List<BoxShadow> elevation4 = [
    BoxShadow(
      color: voidBlack.withOpacity(0.5),
      blurRadius: 12,
      offset: const Offset(0, 6),
    ),
  ];
  
  static List<BoxShadow> quantumGlow = [
    BoxShadow(
      color: quantumCyan.withOpacity(0.3),
      blurRadius: 20,
      spreadRadius: 2,
    ),
  ];
  
  static List<BoxShadow> threatGlow(Color color) => [
    BoxShadow(
      color: color.withOpacity(0.4),
      blurRadius: 16,
      spreadRadius: 1,
    ),
  ];
  
  // ============ Animation Curves ============
  
  static const Curve entranceCurve = Curves.easeOutCubic;
  static const Curve exitCurve = Curves.easeInCubic;
  static const Curve emphasizedCurve = Curves.easeInOutCubic;
  static const Curve quantumCurve = Curves.elasticOut;
  
  // ============ Animation Durations ============
  
  static const Duration durationInstant = Duration(milliseconds: 100);
  static const Duration durationFast = Duration(milliseconds: 200);
  static const Duration durationNormal = Duration(milliseconds: 300);
  static const Duration durationSlow = Duration(milliseconds: 500);
  static const Duration durationEmphasis = Duration(milliseconds: 700);
  static const Duration durationQuantum = Duration(milliseconds: 1200);
  
  // ============ Theme Data ============
  
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      
      // Color Scheme
      colorScheme: const ColorScheme.dark(
        primary: quantumBlue,
        primaryContainer: quantumPurple,
        secondary: quantumCyan,
        secondaryContainer: quantumCyan,
        surface: darkMatter,
        background: deepSpace,
        error: dangerRed,
        onPrimary: pureWhite,
        onSecondary: voidBlack,
        onSurface: starWhite,
        onBackground: starWhite,
        onError: pureWhite,
      ),
      
      // Scaffold
      scaffoldBackgroundColor: deepSpace,
      
      // App Bar
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontFamily: primaryFont,
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: starWhite,
        ),
        iconTheme: IconThemeData(color: starWhite),
      ),
      
      // Cards
      cardTheme: CardTheme(
        color: cosmicGray,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusLg),
        ),
      ),
      
      // Buttons
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: quantumBlue,
          foregroundColor: pureWhite,
          elevation: 0,
          padding: const EdgeInsets.symmetric(
            horizontal: space6,
            vertical: space4,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
          textStyle: const TextStyle(
            fontFamily: primaryFont,
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
      ),
      
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: quantumCyan,
          side: const BorderSide(color: quantumCyan),
          padding: const EdgeInsets.symmetric(
            horizontal: space6,
            vertical: space4,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
          textStyle: const TextStyle(
            fontFamily: primaryFont,
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
      ),
      
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: quantumCyan,
          padding: const EdgeInsets.symmetric(
            horizontal: space4,
            vertical: space3,
          ),
          textStyle: const TextStyle(
            fontFamily: primaryFont,
            fontSize: 14,
            fontWeight: FontWeight.w500,
            letterSpacing: 0.5,
          ),
        ),
      ),
      
      // Input Decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: stellarGray,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide(color: stellarGray),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: quantumCyan, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: dangerRed),
        ),
        labelStyle: const TextStyle(
          fontFamily: primaryFont,
          color: silverNebula,
        ),
        hintStyle: const TextStyle(
          fontFamily: primaryFont,
          color: moonGray,
        ),
      ),
      
      // Switch
      switchTheme: SwitchThemeData(
        thumbColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return quantumCyan;
          }
          return moonGray;
        }),
        trackColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return quantumCyan.withOpacity(0.3);
          }
          return stellarGray;
        }),
      ),
      
      // Progress Indicator
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: quantumCyan,
        linearTrackColor: stellarGray,
        circularTrackColor: stellarGray,
      ),
      
      // Divider
      dividerTheme: const DividerThemeData(
        color: stellarGray,
        thickness: 1,
        space: 1,
      ),
      
      // Text Theme
      textTheme: textTheme,
      
      // Icon Theme
      iconTheme: const IconThemeData(
        color: starWhite,
        size: 24,
      ),
      
      // Bottom Navigation
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: darkMatter,
        selectedItemColor: quantumCyan,
        unselectedItemColor: silverNebula,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      
      // Floating Action Button
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: quantumBlue,
        foregroundColor: pureWhite,
        elevation: 8,
      ),
      
      // Snack Bar
      snackBarTheme: SnackBarThemeData(
        backgroundColor: cosmicGray,
        contentTextStyle: textTheme.bodyMedium,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
        ),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
  
  // ============ Utility Methods ============
  
  /// Get threat level color based on severity
  static Color getThreatLevelColor(double level) {
    if (level <= 0.3) return safeMint;
    if (level <= 0.6) return cautionAmber;
    if (level <= 0.8) return warningOrange;
    return dangerRed;
  }
  
  /// Get quantum resistance color
  static Color getQuantumResistanceColor(String level) {
    switch (level.toLowerCase()) {
      case 'quantum-safe':
      case 'high':
        return safeMint;
      case 'moderate':
      case 'medium':
        return cautionAmber;
      case 'vulnerable':
      case 'low':
        return dangerRed;
      default:
        return silverNebula;
    }
  }
  
  /// Get performance color based on latency
  static Color getPerformanceColor(int latencyMs) {
    if (latencyMs <= 50) return safeMint;
    if (latencyMs <= 100) return cautionAmber;
    if (latencyMs <= 200) return warningOrange;
    return dangerRed;
  }
  
  /// Get battery impact color
  static Color getBatteryImpactColor(double impactPercentage) {
    if (impactPercentage <= 1.0) return safeMint;
    if (impactPercentage <= 2.0) return cautionAmber;
    if (impactPercentage <= 3.0) return warningOrange;
    return dangerRed;
  }
  
  /// Create glass morphism decoration
  static BoxDecoration glassMorphism({
    double opacity = 0.1,
    double blur = 10.0,
    Color? color,
  }) {
    return BoxDecoration(
      color: (color ?? pureWhite).withOpacity(opacity),
      borderRadius: BorderRadius.circular(radiusLg),
      border: Border.all(
        color: pureWhite.withOpacity(0.2),
        width: 1,
      ),
      boxShadow: [
        BoxShadow(
          color: voidBlack.withOpacity(0.1),
          blurRadius: blur,
          offset: const Offset(0, 4),
        ),
      ],
    );
  }
  
  /// Create neural network gradient
  static LinearGradient createNeuralGradient(List<Color> colors) {
    return LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: colors,
      stops: List.generate(
        colors.length,
        (index) => index / (colors.length - 1),
      ),
    );
  }
}
