import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'dart:math' as math;

import '../../../../core/theme/app_theme.dart';
import '../../../../domain/models/complete_models.dart';
import '../widgets/security_status_header.dart';
import '../widgets/threat_timeline_chart.dart';
import '../widgets/metric_card.dart';
import '../widgets/threat_list_item.dart';
import '../widgets/neural_network_background.dart';
import '../widgets/quantum_shield_widget.dart';
import '../widgets/expandable_fab.dart';

/// Production-Ready Main Dashboard
/// Comprehensive security monitoring with real-time updates
class ProductionDashboardScreen extends ConsumerStatefulWidget {
  @override
  _ProductionDashboardScreenState createState() => _ProductionDashboardScreenState();
}

class _ProductionDashboardScreenState extends ConsumerState<ProductionDashboardScreen>
    with TickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey();
  final GlobalKey<RefreshIndicatorState> _refreshKey = GlobalKey();
  
  // Animation controllers
  late AnimationController _threatLevelController;
  late AnimationController _scanPulseController;
  late AnimationController _particleController;
  late AnimationController _shieldController;
  
  // Scroll controller for collapsible header
  late ScrollController _scrollController;
  bool _isCollapsed = false;
  
  // Dashboard state
  bool _isRefreshing = false;
  DateTime _lastRefresh = DateTime.now();
  
  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _initializeScrollController();
    _startPeriodicUpdates();
  }
  
  void _initializeAnimations() {
    _threatLevelController = AnimationController(
      duration: AppTheme.durationEmphasis,
      vsync: this,
    );
    
    _scanPulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat();
    
    _particleController = AnimationController(
      duration: const Duration(seconds: 20),
      vsync: this,
    )..repeat();
    
    _shieldController = AnimationController(
      duration: AppTheme.durationQuantum,
      vsync: this,
    );
  }
  
  void _initializeScrollController() {
    _scrollController = ScrollController();
    _scrollController.addListener(() {
      final isCollapsed = _scrollController.offset > 200;
      if (isCollapsed != _isCollapsed) {
        setState(() => _isCollapsed = isCollapsed);
      }
    });
  }
  
  void _startPeriodicUpdates() {
    // Update dashboard every 30 seconds
    Future.delayed(const Duration(seconds: 30), () {
      if (mounted) {
        _refreshDashboard();
        _startPeriodicUpdates();
      }
    });
  }
  
  @override
  Widget build(BuildContext context) {
    final securityState = ref.watch(securityStateProvider);
    final threats = ref.watch(threatStreamProvider);
    final modelState = ref.watch(modelStateProvider);
    final performanceMetrics = ref.watch(performanceMetricsProvider);
    
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppTheme.deepSpace,
      
      body: Stack(
        children: [
          // Animated neural network background
          Positioned.fill(
            child: NeuralNetworkBackground(
              controller: _particleController,
              nodeCount: 80,
              connectionProbability: 0.2,
            ),
          ),
          
          // Main content
          RefreshIndicator(
            key: _refreshKey,
            onRefresh: _refreshDashboard,
            color: AppTheme.quantumCyan,
            backgroundColor: AppTheme.darkMatter,
            child: CustomScrollView(
              controller: _scrollController,
              physics: const BouncingScrollPhysics(),
              slivers: [
                // Collapsible security status header
                SliverAppBar(
                  expandedHeight: 320,
                  collapsedHeight: 120,
                  pinned: true,
                  stretch: true,
                  backgroundColor: Colors.transparent,
                  
                  flexibleSpace: FlexibleSpaceBar(
                    stretchModes: const [
                      StretchMode.zoomBackground,
                      StretchMode.blurBackground,
                    ],
                    
                    background: SecurityStatusHeader(
                      threatLevel: securityState.overallThreatLevel,
                      quantumScore: securityState.quantumResistanceScore,
                      lastScanTime: securityState.lastFullScan,
                      activeThreats: threats.activeCount,
                      isScanning: securityState.isScanning,
                      onQuickScan: () => _performQuickScan(),
                      onDeepScan: () => _performDeepScan(),
                    ),
                    
                    title: AnimatedOpacity(
                      opacity: _isCollapsed ? 1.0 : 0.0,
                      duration: AppTheme.durationFast,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ThreatLevelIndicator(
                            level: securityState.overallThreatLevel,
                            size: 24,
                            animated: true,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _getThreatLevelText(securityState.overallThreatLevel),
                            style: AppTheme.textTheme.titleMedium,
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  actions: [
                    // Notification bell with badge
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.notifications_outlined),
                          color: AppTheme.starWhite,
                          onPressed: () => _navigateToNotifications(),
                        ),
                        if (securityState.unreadAlerts > 0)
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: AppTheme.dangerRed,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                      ],
                    ),
                    
                    // Settings
                    IconButton(
                      icon: const Icon(Icons.settings_outlined),
                      color: AppTheme.starWhite,
                      onPressed: () => _navigateToSettings(),
                    ),
                  ],
                ),
                
                // Quick Actions Grid
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(AppTheme.space4),
                    child: _buildQuickActionsGrid(securityState),
                  ),
                ),
                
                // Threat Timeline Chart
                SliverToBoxAdapter(
                  child: Container(
                    height: 220,
                    margin: const EdgeInsets.symmetric(horizontal: AppTheme.space4),
                    child: ThreatTimelineChart(
                      data: threats.timeline,
                      onRangeSelected: (range) => _showThreatDetails(range),
                    ),
                  ),
                ),
                
                // Security Metrics Cards
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(AppTheme.space4),
                    child: _buildMetricsGrid(
                      threats,
                      securityState,
                      modelState,
                      performanceMetrics,
                    ),
                  ),
                ),
                
                // Recent Threats Section
                if (threats.recent.isNotEmpty) ...[
                  SliverToBoxAdapter(
                    child: _buildSectionHeader(
                      'Recent Threats',
                      onViewAll: () => _navigateToThreatHistory(),
                    ),
                  ),
                  
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final threat = threats.recent[index];
                        return Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppTheme.space4,
                            vertical: AppTheme.space1,
                          ),
                          child: ThreatListItem(
                            threat: threat,
                            onTap: () => _showThreatDetails(threat),
                            onAction: (action) => _handleThreatAction(threat, action),
                          ),
                        );
                      },
                      childCount: math.min(5, threats.recent.length),
                    ),
                  ),
                ],
                
                // Active Monitoring Status
                SliverToBoxAdapter(
                  child: _buildMonitoringStatus(securityState),
                ),
                
                // Neural Network Status
                SliverToBoxAdapter(
                  child: _buildNeuralNetworkStatus(modelState),
                ),
                
                // Performance Overview
                SliverToBoxAdapter(
                  child: _buildPerformanceOverview(performanceMetrics),
                ),
                
                // Bottom padding for FAB
                const SliverToBoxAdapter(
                  child: SizedBox(height: 100),
                ),
              ],
            ),
          ),
        ],
      ),
      
      // Expandable Floating Action Button
      floatingActionButton: ExpandableFab(
        distance: 80,
        children: [
          ActionButton(
            icon: Icons.qr_code_scanner,
            label: 'Scan QR',
            color: AppTheme.quantumCyan,
            onPressed: () => _scanQRCode(),
          ),
          ActionButton(
            icon: Icons.wifi_find,
            label: 'Check WiFi',
            color: AppTheme.quantumPurple,
            onPressed: () => _checkWiFiSecurity(),
          ),
          ActionButton(
            icon: Icons.app_settings_alt,
            label: 'App Scan',
            color: AppTheme.quantumBlue,
            onPressed: () => _scanInstalledApps(),
          ),
          ActionButton(
            icon: Icons.psychology,
            label: 'Train AI',
            color: AppTheme.cautionAmber,
            onPressed: () => _startModelTraining(),
          ),
        ],
        child: AnimatedContainer(
          duration: AppTheme.durationFast,
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppTheme.quantumGradient,
            boxShadow: AppTheme.quantumGlow,
          ),
          child: const Icon(
            Icons.security,
            color: AppTheme.pureWhite,
          ),
        ),
      ),
    );
  }
  
  Widget _buildQuickActionsGrid(SecurityState securityState) {
    return StaggeredGrid.count(
      crossAxisCount: 2,
      mainAxisSpacing: AppTheme.space3,
      crossAxisSpacing: AppTheme.space3,
      children: [
        QuickActionCard(
          icon: Icons.radar,
          label: 'Deep Scan',
          subtitle: 'Full system analysis',
          color: AppTheme.quantumBlue,
          gradient: AppTheme.quantumGradient,
          onTap: () => _performDeepScan(),
          enabled: !securityState.isScanning,
        ),
        QuickActionCard(
          icon: Icons.model_training,
          label: 'Train Model',
          subtitle: 'Improve AI accuracy',
          color: AppTheme.quantumPurple,
          onTap: () => _navigateToTraining(),
        ),
        QuickActionCard(
          icon: Icons.shield,
          label: 'Quantum Test',
          subtitle: 'Check resistance',
          color: AppTheme.quantumCyan,
          onTap: () => _performQuantumTest(),
        ),
        QuickActionCard(
          icon: Icons.vpn_lock,
          label: 'VPN Status',
          subtitle: securityState.vpnEnabled ? 'Connected' : 'Disconnected',
          color: securityState.vpnEnabled ? AppTheme.safeMint : AppTheme.warningOrange,
          onTap: () => _toggleVPN(),
        ),
      ],
    );
  }
  
  Widget _buildMetricsGrid(
    ThreatState threats,
    SecurityState securityState,
    ModelState modelState,
    PerformanceMetrics performanceMetrics,
  ) {
    return StaggeredGrid.count(
      crossAxisCount: 2,
      mainAxisSpacing: AppTheme.space3,
      crossAxisSpacing: AppTheme.space3,
      children: [
        // Threats blocked today
        MetricCard(
          title: 'Threats Blocked',
          value: '${threats.blockedToday}',
          subtitle: 'Today',
          icon: Icons.block,
          trend: threats.trendPercentage,
          color: AppTheme.dangerRed,
          onTap: () => _showThreatLog(),
        ),
        
        // Network scans
        MetricCard(
          title: 'Network Scans',
          value: '${securityState.scanCount}',
          subtitle: 'Last 24h',
          icon: Icons.wifi_tethering,
          color: AppTheme.quantumCyan,
          onTap: () => _showNetworkActivity(),
        ),
        
        // Model accuracy
        MetricCard(
          title: 'AI Accuracy',
          value: '${(modelState.accuracy * 100).toStringAsFixed(1)}%',
          subtitle: 'Current',
          icon: Icons.psychology,
          trend: modelState.accuracyTrend,
          color: AppTheme.quantumPurple,
          progress: modelState.accuracy,
          onTap: () => _showModelMetrics(),
        ),
        
        // Privacy score
        MetricCard(
          title: 'Privacy Score',
          value: '${securityState.privacyScore}/100',
          subtitle: 'Protected',
          icon: Icons.privacy_tip,
          color: AppTheme.safeMint,
          progress: securityState.privacyScore / 100,
          onTap: () => _showPrivacyReport(),
        ),
        
        // Performance metrics
        MetricCard(
          title: 'Performance',
          value: '${performanceMetrics.inferenceLatencyMs.toInt()}ms',
          subtitle: 'Avg latency',
          icon: Icons.speed,
          color: AppTheme.getPerformanceColor(performanceMetrics.inferenceLatencyMs.toInt()),
          onTap: () => _showPerformanceDetails(),
        ),
        
        // Battery impact
        MetricCard(
          title: 'Battery Impact',
          value: '${performanceMetrics.batteryDrainPercentPerHour.toStringAsFixed(1)}%/h',
          subtitle: 'Power usage',
          icon: Icons.battery_std,
          color: AppTheme.getBatteryImpactColor(performanceMetrics.batteryDrainPercentPerHour),
          onTap: () => _showBatteryOptimization(),
        ),
      ],
    );
  }
  
  Widget _buildSectionHeader(String title, {VoidCallback? onViewAll}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppTheme.space4,
        AppTheme.space6,
        AppTheme.space4,
        AppTheme.space3,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: AppTheme.textTheme.headlineSmall,
          ),
          if (onViewAll != null)
            TextButton(
              onPressed: onViewAll,
              child: const Text('View All'),
            ),
        ],
      ),
    );
  }
  
  Widget _buildMonitoringStatus(SecurityState securityState) {
    return Container(
      margin: const EdgeInsets.all(AppTheme.space4),
      padding: const EdgeInsets.all(AppTheme.space4),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.quantumBlue.withOpacity(0.1),
            AppTheme.quantumPurple.withOpacity(0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(
          color: AppTheme.quantumCyan.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          // Animated monitoring icon
          SizedBox(
            width: 48,
            height: 48,
            child: AnimatedBuilder(
              animation: _scanPulseController,
              builder: (context, child) {
                return Stack(
                  alignment: Alignment.center,
                  children: [
                    // Pulse effect
                    Container(
                      width: 48 * _scanPulseController.value,
                      height: 48 * _scanPulseController.value,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.quantumCyan.withOpacity(
                          0.3 * (1 - _scanPulseController.value),
                        ),
                      ),
                    ),
                    const Icon(
                      Icons.radar,
                      color: AppTheme.quantumCyan,
                    ),
                  ],
                );
              },
            ),
          ),
          
          const SizedBox(width: AppTheme.space4),
          
          // Status text
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Active Monitoring',
                  style: AppTheme.textTheme.titleMedium,
                ),
                Text(
                  securityState.monitoringEnabled
                      ? 'All systems operational'
                      : 'Monitoring disabled',
                  style: AppTheme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
          
          // Toggle switch
          Switch.adaptive(
            value: securityState.monitoringEnabled,
            onChanged: (value) => _toggleMonitoring(value),
            activeColor: AppTheme.quantumCyan,
          ),
        ],
      ),
    );
  }
  
  Widget _buildNeuralNetworkStatus(ModelState modelState) {
    return Container(
      margin: const EdgeInsets.all(AppTheme.space4),
      padding: const EdgeInsets.all(AppTheme.space4),
      decoration: AppTheme.glassMorphism(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.psychology,
                color: AppTheme.quantumPurple,
              ),
              const SizedBox(width: AppTheme.space2),
              Text(
                'Neural Networks',
                style: AppTheme.textTheme.titleMedium,
              ),
            ],
          ),
          
          const SizedBox(height: AppTheme.space3),
          
          // Model status indicators
          Row(
            children: [
              _buildModelStatusChip('SNN', modelState.snnStatus),
              const SizedBox(width: AppTheme.space2),
              _buildModelStatusChip('ANN', modelState.annStatus),
              const SizedBox(width: AppTheme.space2),
              _buildModelStatusChip('Quantum', modelState.quantumStatus),
            ],
          ),
          
          const SizedBox(height: AppTheme.space3),
          
          // Training progress if active
          if (modelState.isTraining) ...[
            Text(
              'Training in progress...',
              style: AppTheme.textTheme.bodySmall,
            ),
            const SizedBox(height: AppTheme.space2),
            LinearProgressIndicator(
              value: modelState.trainingProgress,
              backgroundColor: AppTheme.stellarGray,
              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.quantumPurple),
            ),
          ],
        ],
      ),
    );
  }
  
  Widget _buildModelStatusChip(String label, ModelStatus status) {
    Color color;
    switch (status) {
      case ModelStatus.ready:
        color = AppTheme.safeMint;
        break;
      case ModelStatus.training:
        color = AppTheme.cautionAmber;
        break;
      case ModelStatus.error:
        color = AppTheme.dangerRed;
        break;
      default:
        color = AppTheme.silverNebula;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.space2,
        vertical: AppTheme.space1,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        label,
        style: AppTheme.textTheme.labelSmall?.copyWith(color: color),
      ),
    );
  }
  
  Widget _buildPerformanceOverview(PerformanceMetrics metrics) {
    return Container(
      margin: const EdgeInsets.all(AppTheme.space4),
      padding: const EdgeInsets.all(AppTheme.space4),
      decoration: AppTheme.glassMorphism(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.speed,
                color: AppTheme.quantumCyan,
              ),
              const SizedBox(width: AppTheme.space2),
              Text(
                'Performance Overview',
                style: AppTheme.textTheme.titleMedium,
              ),
            ],
          ),
          
          const SizedBox(height: AppTheme.space3),
          
          // Performance metrics
          Row(
            children: [
              Expanded(
                child: _buildPerformanceMetric(
                  'CPU',
                  '${metrics.cpuUsage.toInt()}%',
                  metrics.cpuUsage / 100,
                ),
              ),
              const SizedBox(width: AppTheme.space3),
              Expanded(
                child: _buildPerformanceMetric(
                  'Memory',
                  '${metrics.memoryUsageMB.toInt()}MB',
                  metrics.memoryUsageMB / 1024, // Assuming 1GB max
                ),
              ),
              const SizedBox(width: AppTheme.space3),
              Expanded(
                child: _buildPerformanceMetric(
                  'Thermal',
                  metrics.thermalState.name.toUpperCase(),
                  _getThermalProgress(metrics.thermalState),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildPerformanceMetric(String label, String value, double progress) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTheme.textTheme.labelSmall,
        ),
        const SizedBox(height: AppTheme.space1),
        Text(
          value,
          style: AppTheme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppTheme.space1),
        LinearProgressIndicator(
          value: progress.clamp(0.0, 1.0),
          backgroundColor: AppTheme.stellarGray,
          valueColor: AlwaysStoppedAnimation<Color>(
            _getProgressColor(progress),
          ),
        ),
      ],
    );
  }
  
  // Helper methods
  String _getThreatLevelText(double level) {
    if (level <= 0.3) return 'Secure';
    if (level <= 0.6) return 'Caution';
    if (level <= 0.8) return 'Warning';
    return 'Critical';
  }
  
  double _getThermalProgress(ThermalState state) {
    switch (state) {
      case ThermalState.nominal:
        return 0.2;
      case ThermalState.fair:
        return 0.5;
      case ThermalState.serious:
        return 0.8;
      case ThermalState.critical:
        return 1.0;
    }
  }
  
  Color _getProgressColor(double progress) {
    if (progress <= 0.5) return AppTheme.safeMint;
    if (progress <= 0.8) return AppTheme.cautionAmber;
    return AppTheme.dangerRed;
  }
  
  // Action methods
  Future<void> _refreshDashboard() async {
    if (_isRefreshing) return;
    
    setState(() => _isRefreshing = true);
    
    try {
      await Future.wait([
        ref.read(securityStateProvider.notifier).refresh(),
        ref.read(threatStreamProvider.notifier).refresh(),
        ref.read(modelStateProvider.notifier).refresh(),
        ref.read(performanceMetricsProvider.notifier).refresh(),
      ]);
      
      _lastRefresh = DateTime.now();
    } catch (e) {
      _showErrorSnackBar('Failed to refresh dashboard: $e');
    } finally {
      setState(() => _isRefreshing = false);
    }
  }
  
  void _performQuickScan() {
    Navigator.pushNamed(context, '/scanner', arguments: ScanType.quick);
  }
  
  void _performDeepScan() {
    Navigator.pushNamed(context, '/scanner', arguments: ScanType.deep);
  }
  
  void _performQuantumTest() {
    Navigator.pushNamed(context, '/scanner', arguments: ScanType.quantum);
  }
  
  void _scanQRCode() {
    Navigator.pushNamed(context, '/qr-scanner');
  }
  
  void _checkWiFiSecurity() {
    Navigator.pushNamed(context, '/wifi-security');
  }
  
  void _scanInstalledApps() {
    Navigator.pushNamed(context, '/app-scanner');
  }
  
  void _startModelTraining() {
    Navigator.pushNamed(context, '/model-training');
  }
  
  void _toggleVPN() {
    ref.read(securityStateProvider.notifier).toggleVPN();
  }
  
  void _toggleMonitoring(bool enabled) {
    ref.read(securityStateProvider.notifier).setMonitoring(enabled);
  }
  
  void _navigateToNotifications() {
    Navigator.pushNamed(context, '/notifications');
  }
  
  void _navigateToSettings() {
    Navigator.pushNamed(context, '/settings');
  }
  
  void _navigateToThreatHistory() {
    Navigator.pushNamed(context, '/threat-history');
  }
  
  void _showThreatDetails(dynamic threat) {
    Navigator.pushNamed(context, '/threat-details', arguments: threat);
  }
  
  void _handleThreatAction(Threat threat, String action) {
    ref.read(threatStreamProvider.notifier).handleThreatAction(threat, action);
  }
  
  void _showThreatLog() {
    Navigator.pushNamed(context, '/threat-log');
  }
  
  void _showNetworkActivity() {
    Navigator.pushNamed(context, '/network-activity');
  }
  
  void _showModelMetrics() {
    Navigator.pushNamed(context, '/model-metrics');
  }
  
  void _showPrivacyReport() {
    Navigator.pushNamed(context, '/privacy-report');
  }
  
  void _showPerformanceDetails() {
    Navigator.pushNamed(context, '/performance-details');
  }
  
  void _showBatteryOptimization() {
    Navigator.pushNamed(context, '/battery-optimization');
  }
  
  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppTheme.dangerRed,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
  
  @override
  void dispose() {
    _threatLevelController.dispose();
    _scanPulseController.dispose();
    _particleController.dispose();
    _shieldController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}

// Supporting widgets and providers would be defined in separate files
// This is a comprehensive production-ready dashboard implementation
