import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'dart:math' as math;

import '../core/theme/app_theme.dart';
import 'virtual_sentinel_engine.dart';

/// Age-Adaptive Sentinel Dashboard
/// 
/// Provides specialized interfaces for different age groups with appropriate
/// security controls, visual design, and interaction patterns.
class AdaptiveSentinelDashboard extends ConsumerStatefulWidget {
  final AgeGroup ageGroup;
  
  const AdaptiveSentinelDashboard({
    Key? key,
    required this.ageGroup,
  }) : super(key: key);
  
  @override
  _AdaptiveSentinelDashboardState createState() => _AdaptiveSentinelDashboardState();
}

class _AdaptiveSentinelDashboardState extends ConsumerState<AdaptiveSentinelDashboard>
    with TickerProviderStateMixin {
  
  late final VirtualSentinelEngine _sentinelEngine;
  late AnimationController _protectionAnimationController;
  late AnimationController _threatPulseController;
  
  // Dashboard state
  bool _isProtectionActive = true;
  double _currentThreatLevel = 0.0;
  int _threatsBlockedToday = 0;
  List<DetectedThreat> _recentThreats = [];
  
  @override
  void initState() {
    super.initState();
    _sentinelEngine = VirtualSentinelEngine();
    _initializeAnimations();
    _initializeSentinel();
  }
  
  void _initializeAnimations() {
    _protectionAnimationController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    )..repeat();
    
    _threatPulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
  }
  
  Future<void> _initializeSentinel() async {
    await _sentinelEngine.initialize(ageGroup: widget.ageGroup);
    
    // Listen to threat stream
    _sentinelEngine.threatStream.listen((threatEvent) {
      setState(() {
        _recentThreats.insert(0, threatEvent.threat);
        if (_recentThreats.length > 10) {
          _recentThreats.removeLast();
        }
        _threatsBlockedToday++;
        _currentThreatLevel = threatEvent.assessment.threatLevel;
      });
      
      // Animate threat pulse
      _threatPulseController.forward().then((_) {
        _threatPulseController.reset();
      });
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _getBackgroundColor(widget.ageGroup),
      body: _buildAgeAppropriateUI(widget.ageGroup),
    );
  }
  
  Widget _buildAgeAppropriateUI(AgeGroup ageGroup) {
    switch (ageGroup) {
      case AgeGroup.child:
        return _buildChildDashboard();
      case AgeGroup.teen:
        return _buildTeenDashboard();
      case AgeGroup.youngAdult:
        return _buildYoungAdultDashboard();
      case AgeGroup.adult:
        return _buildAdultDashboard();
      case AgeGroup.senior:
        return _buildSeniorDashboard();
    }
  }
  
  /// Child Dashboard (Ages 0-12) - Friendly, Educational, Parental Controls
  Widget _buildChildDashboard() {
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Friendly Header
            _buildChildHeader(),
            
            const SizedBox(height: 20),
            
            // Protection Shield (Animated)
            _buildChildProtectionShield(),
            
            const SizedBox(height: 20),
            
            // Simple Status Cards
            _buildChildStatusCards(),
            
            const SizedBox(height: 20),
            
            // Educational Games
            _buildEducationalGames(),
            
            const SizedBox(height: 20),
            
            // Parent Portal Access
            _buildParentPortalAccess(),
          ],
        ),
      ),
    );
  }
  
  Widget _buildChildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.blue.shade300,
            Colors.purple.shade300,
          ],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          // Friendly mascot
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                ),
              ],
            ),
            child: const Icon(
              Icons.shield,
              color: Colors.blue,
              size: 30,
            ),
          ),
          
          const SizedBox(width: 16),
          
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hi there! 👋',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'Your digital guardian is keeping you safe!',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildChildProtectionShield() {
    return AnimatedBuilder(
      animation: _protectionAnimationController,
      builder: (context, child) {
        return Container(
          width: 200,
          height: 200,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Outer glow
              Container(
                width: 200 * (0.8 + 0.2 * _protectionAnimationController.value),
                height: 200 * (0.8 + 0.2 * _protectionAnimationController.value),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      Colors.green.withOpacity(0.3),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
              
              // Main shield
              Container(
                width: 150,
                height: 150,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [
                      Colors.green.shade400,
                      Colors.green.shade600,
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.green.withOpacity(0.3),
                      blurRadius: 20,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: Icon(
                  Icons.verified_user,
                  color: Colors.white,
                  size: 60,
                ),
              ),
              
              // Status text
              Positioned(
                bottom: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.green,
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Text(
                    _isProtectionActive ? 'Protected! 🛡️' : 'Offline',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
  
  Widget _buildChildStatusCards() {
    return Row(
      children: [
        Expanded(
          child: _buildChildStatusCard(
            icon: Icons.block,
            title: 'Blocked Today',
            value: '$_threatsBlockedToday',
            color: Colors.red,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildChildStatusCard(
            icon: Icons.star,
            title: 'Safety Score',
            value: '100%',
            color: Colors.amber,
          ),
        ),
      ],
    );
  }
  
  Widget _buildChildStatusCard({
    required IconData icon,
    required String title,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 30),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
  
  Widget _buildEducationalGames() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Learn & Play! 🎮',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.purple,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildGameButton(
                  'Password Game',
                  Icons.lock,
                  Colors.blue,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildGameButton(
                  'Stranger Danger',
                  Icons.person,
                  Colors.orange,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildGameButton(String title, IconData icon, Color color) {
    return ElevatedButton(
      onPressed: () {
        // Launch educational game
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.all(12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      child: Column(
        children: [
          Icon(icon, size: 24),
          const SizedBox(height: 4),
          Text(
            title,
            style: const TextStyle(fontSize: 12),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
  
  /// Senior Dashboard (Ages 65+) - Simple, Clear, Scam-Focused
  Widget _buildSeniorDashboard() {
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Large, Clear Header
            _buildSeniorHeader(),
            
            const SizedBox(height: 30),
            
            // Main Protection Status
            _buildSeniorProtectionStatus(),
            
            const SizedBox(height: 30),
            
            // Scam Alerts
            _buildScamAlerts(),
            
            const SizedBox(height: 30),
            
            // Simple Controls
            _buildSeniorControls(),
            
            const SizedBox(height: 30),
            
            // Emergency Contacts
            _buildEmergencyContacts(),
          ],
        ),
      ),
    );
  }
  
  Widget _buildSeniorHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade300, width: 2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(
            Icons.security,
            size: 48,
            color: Colors.green.shade600,
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Security Status',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                Text(
                  'You are protected from scams and fraud',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey.shade700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildSeniorProtectionStatus() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.green.shade400,
            Colors.green.shade600,
          ],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Icon(
            Icons.verified_user,
            size: 80,
            color: Colors.white,
          ),
          const SizedBox(height: 16),
          Text(
            'PROTECTED',
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: 2,
            ),
          ),
          Text(
            'All systems are monitoring for threats',
            style: TextStyle(
              fontSize: 18,
              color: Colors.white.withOpacity(0.9),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
  
  Widget _buildScamAlerts() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.orange.shade300, width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.warning,
                color: Colors.orange.shade600,
                size: 32,
              ),
              const SizedBox(width: 12),
              Text(
                'Scam Protection Active',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.orange.shade800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'We are watching for:\n• Fake phone calls\n• Suspicious emails\n• Fraudulent websites\n• Fake tech support',
            style: TextStyle(
              fontSize: 18,
              color: Colors.orange.shade700,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildSeniorControls() {
    return Column(
      children: [
        _buildLargeButton(
          'Report Suspicious Activity',
          Icons.report,
          Colors.red,
          () {
            // Report suspicious activity
          },
        ),
        const SizedBox(height: 16),
        _buildLargeButton(
          'Call Family for Help',
          Icons.phone,
          Colors.blue,
          () {
            // Call family
          },
        ),
        const SizedBox(height: 16),
        _buildLargeButton(
          'View Security Tips',
          Icons.lightbulb,
          Colors.green,
          () {
            // Show security tips
          },
        ),
      ],
    );
  }
  
  Widget _buildLargeButton(
    String text,
    IconData icon,
    Color color,
    VoidCallback onPressed,
  ) {
    return SizedBox(
      width: double.infinity,
      height: 80,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 4,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32),
            const SizedBox(width: 16),
            Text(
              text,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  /// Teen Dashboard (Ages 13-17) - Privacy-Focused, Educational
  Widget _buildTeenDashboard() {
    return SafeArea(
      child: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: Colors.purple.shade700,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text('Your Privacy Shield'),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.purple.shade700,
                      Colors.blue.shade600,
                    ],
                  ),
                ),
                child: Center(
                  child: Icon(
                    Icons.privacy_tip,
                    size: 80,
                    color: Colors.white.withOpacity(0.8),
                  ),
                ),
              ),
            ),
          ),
          
          // Content
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Privacy Score
                _buildPrivacyScoreCard(),
                
                const SizedBox(height: 20),
                
                // Social Media Monitoring
                _buildSocialMediaCard(),
                
                const SizedBox(height: 20),
                
                // Cyberbullying Protection
                _buildCyberbullyingCard(),
                
                const SizedBox(height: 20),
                
                // Digital Wellness
                _buildDigitalWellnessCard(),
              ]),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildPrivacyScoreCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.purple.shade100,
            Colors.blue.shade100,
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.privacy_tip,
                color: Colors.purple.shade700,
                size: 28,
              ),
              const SizedBox(width: 12),
              Text(
                'Privacy Score',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.purple.shade700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '92/100',
                      style: TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        color: Colors.green.shade600,
                      ),
                    ),
                    Text(
                      'Excellent privacy protection',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ],
                ),
              ),
              CircularProgressIndicator(
                value: 0.92,
                strokeWidth: 8,
                backgroundColor: Colors.grey.shade300,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.green.shade600),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildSocialMediaCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.people,
                color: Colors.blue.shade600,
                size: 28,
              ),
              const SizedBox(width: 12),
              Text(
                'Social Media Safety',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue.shade600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Monitoring for cyberbullying, inappropriate content, and privacy risks across your social platforms.',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildSocialPlatformStatus('Instagram', true),
              const SizedBox(width: 12),
              _buildSocialPlatformStatus('TikTok', true),
              const SizedBox(width: 12),
              _buildSocialPlatformStatus('Snapchat', false),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildSocialPlatformStatus(String platform, bool protected) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: protected ? Colors.green.shade100 : Colors.red.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            protected ? Icons.check_circle : Icons.warning,
            size: 16,
            color: protected ? Colors.green.shade600 : Colors.red.shade600,
          ),
          const SizedBox(width: 4),
          Text(
            platform,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: protected ? Colors.green.shade600 : Colors.red.shade600,
            ),
          ),
        ],
      ),
    );
  }
  
  /// Adult Dashboard (Ages 25-59) - Full Control, Professional
  Widget _buildAdultDashboard() {
    return SafeArea(
      child: CustomScrollView(
        slivers: [
          // Professional Header
          SliverAppBar(
            expandedHeight: 160,
            pinned: true,
            backgroundColor: AppTheme.quantumBlue,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text('Security Command Center'),
              background: Container(
                decoration: BoxDecoration(
                  gradient: AppTheme.quantumGradient,
                ),
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.settings),
                onPressed: () {
                  // Open settings
                },
              ),
            ],
          ),
          
          // Metrics Grid
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 1.2,
              ),
              delegate: SliverChildListDelegate([
                _buildMetricCard(
                  'Threats Blocked',
                  '$_threatsBlockedToday',
                  Icons.block,
                  Colors.red,
                ),
                _buildMetricCard(
                  'Network Scans',
                  '1,247',
                  Icons.wifi_tethering,
                  Colors.blue,
                ),
                _buildMetricCard(
                  'AI Accuracy',
                  '99.7%',
                  Icons.psychology,
                  Colors.purple,
                ),
                _buildMetricCard(
                  'Quantum Safe',
                  '256-bit',
                  Icons.lock,
                  Colors.green,
                ),
              ]),
            ),
          ),
          
          // Recent Threats
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverToBoxAdapter(
              child: _buildRecentThreatsSection(),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildMetricCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 32),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }
  
  /// Young Adult Dashboard (Ages 18-24) - Privacy-Focused, Modern
  Widget _buildYoungAdultDashboard() {
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Modern Header
            _buildModernHeader(),
            
            const SizedBox(height: 20),
            
            // Privacy Focus Cards
            _buildPrivacyFocusCards(),
            
            const SizedBox(height: 20),
            
            // Digital Footprint
            _buildDigitalFootprintCard(),
            
            const SizedBox(height: 20),
            
            // Financial Protection
            _buildFinancialProtectionCard(),
          ],
        ),
      ),
    );
  }
  
  Widget _buildModernHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.indigo.shade600,
            Colors.purple.shade600,
          ],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Your Digital Privacy',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Advanced protection for the digital generation',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              _buildQuickStat('Data Protected', '2.4GB'),
              const SizedBox(width: 20),
              _buildQuickStat('Trackers Blocked', '847'),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildQuickStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.white.withOpacity(0.8),
          ),
        ),
      ],
    );
  }
  
  // Common helper methods
  Color _getBackgroundColor(AgeGroup ageGroup) {
    switch (ageGroup) {
      case AgeGroup.child:
        return Colors.blue.shade50;
      case AgeGroup.teen:
        return Colors.purple.shade50;
      case AgeGroup.youngAdult:
        return Colors.indigo.shade50;
      case AgeGroup.adult:
        return AppTheme.deepSpace;
      case AgeGroup.senior:
        return Colors.grey.shade100;
    }
  }
  
  Widget _buildParentPortalAccess() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.orange.shade100,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.orange.shade300),
      ),
      child: Row(
        children: [
          Icon(
            Icons.family_restroom,
            color: Colors.orange.shade700,
            size: 32,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Parent Portal',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.orange.shade800,
                  ),
                ),
                Text(
                  'Parents can view detailed reports',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.orange.shade700,
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {
              // Open parent portal
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange.shade600,
              foregroundColor: Colors.white,
            ),
            child: const Text('Access'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildCyberbullyingCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.shield_outlined,
                color: Colors.red.shade600,
                size: 28,
              ),
              const SizedBox(width: 12),
              Text(
                'Cyberbullying Protection',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.red.shade600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'AI monitors your messages and social interactions for signs of bullying or harassment.',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              // Report bullying
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              foregroundColor: Colors.white,
            ),
            child: const Text('Report Incident'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildDigitalWellnessCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.favorite,
                color: Colors.pink.shade600,
                size: 28,
              ),
              const SizedBox(width: 12),
              Text(
                'Digital Wellness',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.pink.shade600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Screen time today: 4h 23m\nRecommended break in 37 minutes',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey.shade700,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildPrivacyFocusCards() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildPrivacyCard(
                'Data Brokers',
                '23 blocked',
                Icons.business,
                Colors.red,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildPrivacyCard(
                'Trackers',
                '847 blocked',
                Icons.track_changes,
                Colors.orange,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildPrivacyCard(
                'Location Requests',
                '12 denied',
                Icons.location_on,
                Colors.blue,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildPrivacyCard(
                'Data Shared',
                '0 bytes',
                Icons.share,
                Colors.green,
              ),
            ),
          ],
        ),
      ],
    );
  }
  
  Widget _buildPrivacyCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildDigitalFootprintCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.footprint,
                color: Colors.indigo.shade600,
                size: 28,
              ),
              const SizedBox(width: 12),
              Text(
                'Digital Footprint',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.indigo.shade600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Your online presence is being monitored and protected. We\'ve found 3 data broker profiles that we\'re working to remove.',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              // View full report
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.indigo.shade600,
              foregroundColor: Colors.white,
            ),
            child: const Text('View Full Report'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildFinancialProtectionCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.account_balance_wallet,
                color: Colors.green.shade600,
                size: 28,
              ),
              const SizedBox(width: 12),
              Text(
                'Financial Protection',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.green.shade600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Monitoring for fraudulent transactions, phishing attempts, and suspicious financial activity.',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Icon(
                Icons.check_circle,
                color: Colors.green.shade600,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'All accounts secure',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.green.shade600,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildEmergencyContacts() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.red.shade300, width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.emergency,
                color: Colors.red.shade600,
                size: 32,
              ),
              const SizedBox(width: 12),
              Text(
                'Emergency Contacts',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.red.shade600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildEmergencyContact('Family', '(555) 123-4567'),
          const SizedBox(height: 8),
          _buildEmergencyContact('Doctor', '(555) 987-6543'),
          const SizedBox(height: 8),
          _buildEmergencyContact('Police', '911'),
        ],
      ),
    );
  }
  
  Widget _buildEmergencyContact(String name, String number) {
    return Row(
      children: [
        Expanded(
          child: Text(
            '$name: $number',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        ElevatedButton(
          onPressed: () {
            // Call contact
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red.shade600,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
          child: const Text('Call'),
        ),
      ],
    );
  }
  
  Widget _buildRecentThreatsSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Recent Threats',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade800,
            ),
          ),
          const SizedBox(height: 16),
          if (_recentThreats.isEmpty)
            Text(
              'No threats detected today',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey.shade600,
              ),
            )
          else
            ..._recentThreats.take(5).map((threat) => _buildThreatItem(threat)),
        ],
      ),
    );
  }
  
  Widget _buildThreatItem(DetectedThreat threat) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Row(
        children: [
          Icon(
            Icons.warning,
            color: Colors.red.shade600,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  threat.type.toString().split('.').last,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.red.shade700,
                  ),
                ),
                Text(
                  '${threat.timestamp.hour}:${threat.timestamp.minute.toString().padLeft(2, '0')}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
          Text(
            'Blocked',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Colors.green.shade600,
            ),
          ),
        ],
      ),
    );
  }
  
  @override
  void dispose() {
    _protectionAnimationController.dispose();
    _threatPulseController.dispose();
    super.dispose();
  }
}
