import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:fl_chart/fl_chart.dart';

import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/widgets/glass_morphism_card.dart';
import '../../../../shared/widgets/quantum_shield_widget.dart';
import '../../../../shared/widgets/neural_network_background.dart';
import '../../../../shared/animations/pulse_animation.dart';
import '../providers/dashboard_provider.dart';
import '../widgets/security_status_card.dart';
import '../widgets/threat_timeline_graph.dart';
import '../widgets/metric_card.dart';
import '../widgets/threat_list_item.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen>
    with TickerProviderStateMixin {
  late AnimationController _shieldController;
  late AnimationController _pulseController;
  late AnimationController _particleController;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _startRealTimeUpdates();
  }

  void _initializeAnimations() {
    _shieldController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    )..repeat();

    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);

    _particleController = AnimationController(
      duration: const Duration(seconds: 10),
      vsync: this,
    )..repeat();
  }

  void _startRealTimeUpdates() {
    // Start real-time monitoring
    ref.read(dashboardProvider.notifier).startRealTimeMonitoring();
  }

  @override
  void dispose() {
    _shieldController.dispose();
    _pulseController.dispose();
    _particleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dashboardState = ref.watch(dashboardProvider);
    
    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: Stack(
        children: [
          // Animated Neural Network Background
          NeuralNetworkBackground(
            controller: _particleController,
          ),
          
          // Main Content
          CustomScrollView(
            slivers: [
              // Dynamic App Bar with Security Status
              _buildAnimatedAppBar(dashboardState),
              
              // Security Metrics Grid
              _buildSecurityMetrics(dashboardState),
              
              // Real-time Threat Graph
              _buildThreatTimeline(dashboardState),
              
              // Quick Actions
              _buildQuickActions(),
              
              // Recent Threats List
              _buildRecentThreats(dashboardState),
              
              // Bottom Padding
              const SliverToBoxAdapter(
                child: SizedBox(height: 100),
              ),
            ],
          ),
          
          // Floating Action Button for Quick Scan
          _buildFloatingActionButton(),
        ],
      ),
    );
  }

  Widget _buildAnimatedAppBar(DashboardState state) {
    return SliverAppBar(
      expandedHeight: 280,
      pinned: true,
      backgroundColor: Colors.transparent,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: _getStatusGradient(state.threatLevel),
          ),
          child: Stack(
            children: [
              // Quantum Shield Animation
              Center(
                child: AnimatedBuilder(
                  animation: _shieldController,
                  builder: (context, child) {
                    return Transform.rotate(
                      angle: _shieldController.value * 2 * 3.14159,
                      child: QuantumShieldWidget(
                        size: 120,
                        threatLevel: state.threatLevel,
                        isScanning: state.isScanning,
                      ),
                    );
                  },
                ),
              ),
              
              // Pulse Effect
              Center(
                child: AnimatedBuilder(
                  animation: _pulseController,
                  builder: (context, child) {
                    return Container(
                      width: 200 * (1 + _pulseController.value * 0.3),
                      height: 200 * (1 + _pulseController.value * 0.3),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.primaryLight.withOpacity(
                            0.5 * (1 - _pulseController.value),
                          ),
                          width: 2,
                        ),
                      ),
                    );
                  },
                ),
              ),
              
              // Status Text
              Positioned(
                bottom: 40,
                left: 0,
                right: 0,
                child: Column(
                  children: [
                    Text(
                      _getSecurityStatusText(state.threatLevel),
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        shadows: [
                          Shadow(
                            color: Colors.black.withOpacity(0.5),
                            offset: const Offset(0, 2),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Last scan: ${_formatLastScan(state.lastScanTime)}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        title: const Text(
          'PQ359 Protection',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.settings, color: Colors.white),
          onPressed: () => Navigator.pushNamed(context, '/settings'),
        ),
        IconButton(
          icon: const Icon(Icons.notifications, color: Colors.white),
          onPressed: () => Navigator.pushNamed(context, '/notifications'),
        ),
      ],
    );
  }

  Widget _buildSecurityMetrics(DashboardState state) {
    return SliverPadding(
      padding: const EdgeInsets.all(16),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 1.4,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
        ),
        delegate: SliverChildListDelegate([
          MetricCard(
            icon: Icons.shield_outlined,
            title: 'Threat Level',
            value: '${(state.threatLevel * 100).toInt()}%',
            color: AppColors.getThreatLevelColor(state.threatLevel),
            trend: state.threatTrend,
            onTap: () => Navigator.pushNamed(context, '/threats'),
          ).animate().fadeIn(delay: 100.ms).slideX(begin: -0.3, end: 0),
          
          MetricCard(
            icon: Icons.lock_outline,
            title: 'Quantum Safe',
            value: state.quantumResistance,
            color: AppColors.getQuantumResistanceColor(state.quantumResistance),
            trend: 0.0, // Stable
            onTap: () => Navigator.pushNamed(context, '/quantum'),
          ).animate().fadeIn(delay: 200.ms).slideX(begin: 0.3, end: 0),
          
          MetricCard(
            icon: Icons.speed,
            title: 'Latency',
            value: '${state.avgLatency}ms',
            color: AppColors.getPerformanceColor(state.avgLatency),
            trend: state.latencyTrend,
            onTap: () => _showPerformanceDetails(context),
          ).animate().fadeIn(delay: 300.ms).slideX(begin: -0.3, end: 0),
          
          MetricCard(
            icon: Icons.battery_charging_full,
            title: 'Efficiency',
            value: '${state.batteryImpact.toStringAsFixed(1)}%/hr',
            color: AppColors.getBatteryImpactColor(state.batteryImpact),
            trend: state.efficiencyTrend,
            onTap: () => _showBatteryDetails(context),
          ).animate().fadeIn(delay: 400.ms).slideX(begin: 0.3, end: 0),
        ]),
      ),
    );
  }

  Widget _buildThreatTimeline(DashboardState state) {
    return SliverToBoxAdapter(
      child: Container(
        height: 220,
        margin: const EdgeInsets.all(16),
        child: GlassMorphismCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Threat Timeline',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.fullscreen, color: Colors.white70),
                      onPressed: () => Navigator.pushNamed(context, '/analytics'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: ThreatTimelineGraph(
                    data: state.threatHistory,
                    isRealTime: true,
                  ),
                ),
              ],
            ),
          ),
        ),
      ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.3, end: 0),
    );
  }

  Widget _buildQuickActions() {
    return SliverToBoxAdapter(
      child: Container(
        height: 120,
        margin: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            Expanded(
              child: _buildQuickActionCard(
                icon: Icons.radar,
                title: 'Quick Scan',
                subtitle: 'Instant threat check',
                color: AppColors.primaryBlue,
                onTap: () => _startQuickScan(),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildQuickActionCard(
                icon: Icons.security,
                title: 'Deep Scan',
                subtitle: 'Comprehensive analysis',
                color: AppColors.secondaryBlue,
                onTap: () => _startDeepScan(),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildQuickActionCard(
                icon: Icons.psychology,
                title: 'Neural Scan',
                subtitle: 'AI-powered detection',
                color: AppColors.safeGreen,
                onTap: () => _startNeuralScan(),
              ),
            ),
          ],
        ),
      ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.3, end: 0),
    );
  }

  Widget _buildQuickActionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: GlassMorphismCard(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 32,
                color: color,
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecentThreats(DashboardState state) {
    if (state.recentThreats.isEmpty) {
      return const SliverToBoxAdapter(
        child: SizedBox.shrink(),
      );
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final threat = state.recentThreats[index];
          return Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              bottom: index == state.recentThreats.length - 1 ? 16 : 8,
            ),
            child: ThreatListItem(
              threat: threat,
              onTap: () => _showThreatDetails(threat),
            ).animate(delay: (700 + index * 100).ms)
                .fadeIn()
                .slideX(begin: 0.3, end: 0),
          );
        },
        childCount: state.recentThreats.length,
      ),
    );
  }

  Widget _buildFloatingActionButton() {
    return Positioned(
      bottom: 24,
      right: 24,
      child: FloatingActionButton.extended(
        onPressed: () => _startQuickScan(),
        backgroundColor: AppColors.primaryBlue,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.radar),
        label: const Text('Quick Scan'),
        elevation: 8,
      ).animate().scale(delay: 800.ms),
    );
  }

  // Helper Methods
  LinearGradient _getStatusGradient(double threatLevel) {
    if (threatLevel <= 0.3) {
      return const LinearGradient(
        colors: [AppColors.safeGreen, AppColors.primaryBlue],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else if (threatLevel <= 0.6) {
      return const LinearGradient(
        colors: [AppColors.warningOrange, AppColors.primaryBlue],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else {
      return const LinearGradient(
        colors: [AppColors.dangerRed, AppColors.primaryBlue],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    }
  }

  String _getSecurityStatusText(double threatLevel) {
    if (threatLevel <= 0.3) return 'SECURE';
    if (threatLevel <= 0.6) return 'CAUTION';
    return 'HIGH ALERT';
  }

  String _formatLastScan(DateTime? lastScan) {
    if (lastScan == null) return 'Never';
    final now = DateTime.now();
    final difference = now.difference(lastScan);
    
    if (difference.inMinutes < 1) return 'Just now';
    if (difference.inMinutes < 60) return '${difference.inMinutes}m ago';
    if (difference.inHours < 24) return '${difference.inHours}h ago';
    return '${difference.inDays}d ago';
  }

  // Action Methods
  void _startQuickScan() {
    Navigator.pushNamed(context, '/scanner', arguments: {'type': 'quick'});
  }

  void _startDeepScan() {
    Navigator.pushNamed(context, '/scanner', arguments: {'type': 'deep'});
  }

  void _startNeuralScan() {
    Navigator.pushNamed(context, '/scanner', arguments: {'type': 'neural'});
  }

  void _showThreatDetails(ThreatEvent threat) {
    Navigator.pushNamed(context, '/threat-details', arguments: threat);
  }

  void _showPerformanceDetails(BuildContext context) {
    Navigator.pushNamed(context, '/performance');
  }

  void _showBatteryDetails(BuildContext context) {
    Navigator.pushNamed(context, '/battery-optimization');
  }
}

// Dashboard State Model
class DashboardState {
  final double threatLevel;
  final String quantumResistance;
  final int avgLatency;
  final double batteryImpact;
  final bool isScanning;
  final DateTime? lastScanTime;
  final List<ThreatDataPoint> threatHistory;
  final List<ThreatEvent> recentThreats;
  final double threatTrend;
  final double latencyTrend;
  final double efficiencyTrend;

  const DashboardState({
    required this.threatLevel,
    required this.quantumResistance,
    required this.avgLatency,
    required this.batteryImpact,
    required this.isScanning,
    this.lastScanTime,
    required this.threatHistory,
    required this.recentThreats,
    required this.threatTrend,
    required this.latencyTrend,
    required this.efficiencyTrend,
  });

  DashboardState copyWith({
    double? threatLevel,
    String? quantumResistance,
    int? avgLatency,
    double? batteryImpact,
    bool? isScanning,
    DateTime? lastScanTime,
    List<ThreatDataPoint>? threatHistory,
    List<ThreatEvent>? recentThreats,
    double? threatTrend,
    double? latencyTrend,
    double? efficiencyTrend,
  }) {
    return DashboardState(
      threatLevel: threatLevel ?? this.threatLevel,
      quantumResistance: quantumResistance ?? this.quantumResistance,
      avgLatency: avgLatency ?? this.avgLatency,
      batteryImpact: batteryImpact ?? this.batteryImpact,
      isScanning: isScanning ?? this.isScanning,
      lastScanTime: lastScanTime ?? this.lastScanTime,
      threatHistory: threatHistory ?? this.threatHistory,
      recentThreats: recentThreats ?? this.recentThreats,
      threatTrend: threatTrend ?? this.threatTrend,
      latencyTrend: latencyTrend ?? this.latencyTrend,
      efficiencyTrend: efficiencyTrend ?? this.efficiencyTrend,
    );
  }
}

// Data Models
class ThreatDataPoint {
  final DateTime timestamp;
  final double threatLevel;
  final String source;

  const ThreatDataPoint({
    required this.timestamp,
    required this.threatLevel,
    required this.source,
  });
}

class ThreatEvent {
  final String id;
  final String type;
  final double severity;
  final String description;
  final DateTime timestamp;
  final Map<String, dynamic> metadata;

  const ThreatEvent({
    required this.id,
    required this.type,
    required this.severity,
    required this.description,
    required this.timestamp,
    required this.metadata,
  });
}
