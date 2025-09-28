import 'package:flutter/material.dart';

/// PQ359 App Color Palette
/// Quantum-inspired colors with security themes
class AppColors {
  // Primary Colors - Quantum Blue Spectrum
  static const Color primaryBlue = Color(0xFF0D47A1);
  static const Color primaryLight = Color(0xFF5472D3);
  static const Color primaryDark = Color(0xFF002171);
  static const Color primaryAccent = Color(0xFF1976D2);
  
  // Secondary Colors - Quantum Cyan
  static const Color secondaryBlue = Color(0xFF00BCD4);
  static const Color secondaryLight = Color(0xFF62EFFF);
  static const Color secondaryDark = Color(0xFF008BA3);
  
  // Security Status Colors
  static const Color safeGreen = Color(0xFF00C853);
  static const Color safeGreenLight = Color(0xFF5EFC82);
  static const Color safeGreenDark = Color(0xFF009624);
  
  static const Color warningOrange = Color(0xFFFF6D00);
  static const Color warningOrangeLight = Color(0xFFFF9E40);
  static const Color warningOrangeDark = Color(0xFFC43E00);
  
  static const Color dangerRed = Color(0xFFD50000);
  static const Color dangerRedLight = Color(0xFFFF5131);
  static const Color dangerRedDark = Color(0xFF9B0000);
  
  // Neutral Colors
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
  static const Color grey50 = Color(0xFFFAFAFA);
  static const Color grey100 = Color(0xFFF5F5F5);
  static const Color grey200 = Color(0xFFEEEEEE);
  static const Color grey300 = Color(0xFFE0E0E0);
  static const Color grey400 = Color(0xFFBDBDBD);
  static const Color grey500 = Color(0xFF9E9E9E);
  static const Color grey600 = Color(0xFF757575);
  static const Color grey700 = Color(0xFF616161);
  static const Color grey800 = Color(0xFF424242);
  static const Color grey900 = Color(0xFF212121);
  
  // Dark Theme Colors
  static const Color darkBg = Color(0xFF121212);
  static const Color darkSurface = Color(0xFF1E1E1E);
  static const Color darkCard = Color(0xFF2C2C2C);
  static const Color darkDivider = Color(0xFF3C3C3C);
  
  // Quantum Gradients
  static const LinearGradient quantumGradient = LinearGradient(
    colors: [primaryBlue, secondaryBlue, safeGreen],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    stops: [0.0, 0.5, 1.0],
  );
  
  static const LinearGradient shieldGradient = LinearGradient(
    colors: [primaryLight, primaryBlue, primaryDark],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
  
  static const LinearGradient threatGradient = LinearGradient(
    colors: [dangerRed, warningOrange, safeGreen],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );
  
  static const LinearGradient neuralGradient = LinearGradient(
    colors: [
      Color(0xFF667eea),
      Color(0xFF764ba2),
      Color(0xFFf093fb),
      Color(0xFFf5576c),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  // Glass Morphism Colors
  static Color glassMorphismBg = Colors.white.withOpacity(0.1);
  static Color glassMorphismBorder = Colors.white.withOpacity(0.2);
  
  // Shadow Colors
  static Color shadowLight = Colors.black.withOpacity(0.1);
  static Color shadowMedium = Colors.black.withOpacity(0.2);
  static Color shadowDark = Colors.black.withOpacity(0.3);
  
  // Quantum Particle Colors (for animations)
  static const List<Color> quantumParticles = [
    Color(0xFF00E5FF),
    Color(0xFF1DE9B6),
    Color(0xFF76FF03),
    Color(0xFFFFEA00),
    Color(0xFFFF6D00),
    Color(0xFFE91E63),
    Color(0xFF9C27B0),
    Color(0xFF673AB7),
  ];
  
  // Threat Level Colors
  static Color getThreatLevelColor(double level) {
    if (level <= 0.3) return safeGreen;
    if (level <= 0.6) return warningOrange;
    return dangerRed;
  }
  
  // Quantum Resistance Colors
  static Color getQuantumResistanceColor(String level) {
    switch (level.toLowerCase()) {
      case 'quantum-safe':
      case 'high':
        return safeGreen;
      case 'moderate':
      case 'medium':
        return warningOrange;
      case 'vulnerable':
      case 'low':
        return dangerRed;
      default:
        return grey500;
    }
  }
  
  // Neural Network Colors
  static const List<Color> neuralNetworkColors = [
    Color(0xFF00E676), // SNN - Green
    Color(0xFF00B0FF), // ANN - Blue
    Color(0xFFFF6D00), // Transformer - Orange
    Color(0xFFE91E63), // CNN - Pink
  ];
  
  // Performance Colors
  static Color getPerformanceColor(int latencyMs) {
    if (latencyMs <= 50) return safeGreen;
    if (latencyMs <= 100) return warningOrange;
    return dangerRed;
  }
  
  static Color getBatteryImpactColor(double impactPercentage) {
    if (impactPercentage <= 1.0) return safeGreen;
    if (impactPercentage <= 2.0) return warningOrange;
    return dangerRed;
  }
}
