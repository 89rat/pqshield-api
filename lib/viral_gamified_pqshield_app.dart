// lib/viral_gamified_pqshield_app.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:confetti/confetti.dart';
import 'package:animated_text_kit/animated_text_kit.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:async';
import 'dart:math';
import 'dart:convert';
import 'package:crypto/crypto.dart';

// ULTIMATE VIRAL GAMIFIED PQSHIELD APP
// Combines quantum security with addictive gaming mechanics
// Designed for k>1 viral growth in 30 days

class ViralGamefiedPQShieldApp extends StatelessWidget {
  const ViralGamefiedPQShieldApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PQShield - Quantum Security Game',
      theme: ThemeData(
        primarySwatch: Colors.purple,
        visualDensity: VisualDensity.adaptivePlatformDensity,
        fontFamily: 'Orbitron', // Futuristic font
      ),
      home: const GameDashboard(),
      routes: {
        '/battle': (context) => const TeamBattleScreen(),
        '/shop': (context) => const PremiumShopScreen(),
        '/achievements': (context) => const AchievementsScreen(),
        '/leaderboard': (context) => const GlobalLeaderboardScreen(),
        '/team': (context) => const TeamManagementScreen(),
      },
    );
  }
}

// MAIN GAME DASHBOARD - THE VIRAL ENGINE
class GameDashboard extends StatefulWidget {
  const GameDashboard({Key? key}) : super(key: key);
  
  @override
  State<GameDashboard> createState() => _GameDashboardState();
}

class _GameDashboardState extends State<GameDashboard> 
    with TickerProviderStateMixin {
  
  // Game engines
  final ViralGamificationEngine _gameEngine = ViralGamificationEngine();
  final ViralGrowthEngine _viralEngine = ViralGrowthEngine();
  final QuantumSecurityEngine _securityEngine = QuantumSecurityEngine();
  
  // Animation controllers
  late ConfettiController _confettiController;
  late AnimationController _xpAnimationController;
  late AnimationController _levelProgressController;
  late AnimationController _threatPulseController;
  
  // Game state
  PlayerProfile? _playerProfile;
  List<XPEvent> _recentXPEvents = [];
  List<ThreatDetection> _recentThreats = [];
  bool _isScanning = false;
  
  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _initializeGame();
    _startQuantumScanning();
  }
  
  void _initializeAnimations() {
    _confettiController = ConfettiController(duration: const Duration(seconds: 3));
    _xpAnimationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _levelProgressController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _threatPulseController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat(reverse: true);
  }
  
  void _initializeGame() async {
    await _gameEngine.initialize('user_${DateTime.now().millisecondsSinceEpoch}');
    
    // Listen to game events for viral mechanics
    _gameEngine.profileStream.listen((profile) {
      setState(() {
        _playerProfile = profile;
      });
      _levelProgressController.forward();
      
      // Trigger viral sharing for major milestones
      if (profile.level % 10 == 0) {
        _triggerMilestoneSharing(profile);
      }
    });
    
    _gameEngine.xpEventStream.listen((event) {
      setState(() {
        _recentXPEvents.insert(0, event);
        if (_recentXPEvents.length > 5) {
          _recentXPEvents.removeLast();
        }
      });
      _xpAnimationController.forward(from: 0);
      
      // Haptic feedback for engagement
      HapticFeedback.lightImpact();
    });
    
    _gameEngine.achievementStream.listen((achievement) {
      _showViralAchievementUnlocked(achievement);
      _confettiController.play();
      HapticFeedback.heavyImpact();
    });
  }
  
  void _startQuantumScanning() {
    // Simulate real-time quantum threat detection
    Timer.periodic(const Duration(seconds: 3), (timer) {
      if (_isScanning) {
        _simulateQuantumThreatDetection();
      }
    });
  }
  
  void _simulateQuantumThreatDetection() async {
    final threat = await _securityEngine.scanForQuantumThreats();
    if (threat != null) {
      setState(() {
        _recentThreats.insert(0, threat);
        if (_recentThreats.length > 10) {
          _recentThreats.removeLast();
        }
      });
      
      // Award XP based on threat level
      final xpReward = threat.level == ThreatLevel.critical ? 'threat_detected_critical'
                     : threat.level == ThreatLevel.medium ? 'threat_detected_medium'
                     : 'threat_detected_low';
      
      _gameEngine.awardXP(xpReward);
      
      // Trigger viral sharing for critical threats
      if (threat.level == ThreatLevel.critical) {
        _showCriticalThreatAlert(threat);
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    if (_playerProfile == null) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Initializing Quantum Security...'),
            ],
          ),
        ),
      );
    }
    
    return Scaffold(
      body: Stack(
        children: [
          // Animated quantum background
          _buildQuantumBackground(),
          
          // Main content
          SafeArea(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  _buildPlayerHeader(),
                  _buildLevelProgress(),
                  _buildQuantumScanner(),
                  _buildStatsGrid(),
                  _buildDailyChallenges(),
                  _buildTeamBattlePreview(),
                  _buildViralActionButtons(),
                  _buildRecentActivity(),
                ],
              ),
            ),
          ),
          
          // XP Animation Overlay
          ..._buildXPAnimations(),
          
          // Confetti overlay for achievements
          Align(
            alignment: Alignment.topCenter,
            child: ConfettiWidget(
              confettiController: _confettiController,
              blastDirection: 3.14 / 2,
              colors: const [Colors.yellow, Colors.purple, Colors.cyan, Colors.green],
              gravity: 0.3,
              emissionFrequency: 0.05,
            ),
          ),
        ],
      ),
      
      bottomNavigationBar: _buildGameNavBar(),
      floatingActionButton: _buildViralShareFAB(),
    );
  }
  
  Widget _buildQuantumBackground() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            _playerProfile!.rankColor.withOpacity(0.3),
            Colors.black,
            Colors.purple.withOpacity(0.2),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: AnimatedBuilder(
        animation: _threatPulseController,
        builder: (context, child) {
          return CustomPaint(
            painter: QuantumParticlesPainter(_threatPulseController.value),
            size: Size.infinite,
          );
        },
      ),
    );
  }
  
  Widget _buildPlayerHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          // Animated avatar with level badge
          Stack(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 500),
                child: CircleAvatar(
                  radius: 40,
                  backgroundColor: _playerProfile!.rankColor,
                  child: Text(
                    _playerProfile!.level.toString(),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _playerProfile!.rankColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  child: Text(
                    _playerProfile!.rank,
                    style: const TextStyle(
                      fontSize: 10,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 16),
          
          // Player info with animated title
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _playerProfile!.username,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                AnimatedTextKit(
                  animatedTexts: [
                    TypewriterAnimatedText(
                      _playerProfile!.title,
                      textStyle: TextStyle(
                        fontSize: 16,
                        color: _playerProfile!.rankColor,
                        fontWeight: FontWeight.w600,
                      ),
                      speed: const Duration(milliseconds: 100),
                    ),
                  ],
                  isRepeatingAnimation: false,
                ),
                Row(
                  children: [
                    Icon(Icons.bolt, size: 18, color: Colors.yellow),
                    Text(
                      ' ${_playerProfile!.dailyStreak} day streak',
                      style: const TextStyle(color: Colors.white70),
                    ),
                    const SizedBox(width: 12),
                    Icon(Icons.trending_up, size: 16, color: Colors.green),
                    Text(
                      ' K-Factor: ${_playerProfile!.socialStats.kFactor.toStringAsFixed(2)}',
                      style: const TextStyle(color: Colors.green),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Coins display with animation
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.yellow.withOpacity(0.2),
              borderRadius: BorderRadius.circular(25),
              border: Border.all(color: Colors.yellow, width: 2),
              boxShadow: [
                BoxShadow(
                  color: Colors.yellow.withOpacity(0.3),
                  blurRadius: 8,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Row(
              children: [
                const Icon(Icons.monetization_on, color: Colors.yellow, size: 24),
                const SizedBox(width: 6),
                Text(
                  _playerProfile!.coins.toString(),
                  style: const TextStyle(
                    color: Colors.yellow,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildLevelProgress() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.4),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _playerProfile!.rankColor.withOpacity(0.5)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Level ${_playerProfile!.level}',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              Text(
                '${_playerProfile!.xp} / ${_playerProfile!.xpForNextLevel} XP',
                style: const TextStyle(color: Colors.white70),
              ),
              Text(
                'Level ${_playerProfile!.level + 1}',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          AnimatedBuilder(
            animation: _levelProgressController,
            builder: (context, child) {
              return Container(
                height: 12,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(6),
                  gradient: LinearGradient(
                    colors: [Colors.grey[800]!, Colors.grey[700]!],
                  ),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: _playerProfile!.levelProgress * _levelProgressController.value,
                    backgroundColor: Colors.transparent,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      _playerProfile!.rankColor,
                    ),
                    minHeight: 12,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
  
  Widget _buildQuantumScanner() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.blue.withOpacity(0.3),
            Colors.purple.withOpacity(0.3),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.cyan.withOpacity(0.5), width: 2),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '🛡️ Quantum Scanner',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Switch(
                value: _isScanning,
                onChanged: (value) {
                  setState(() {
                    _isScanning = value;
                  });
                  if (value) {
                    _gameEngine.awardXP('scanner_activated');
                  }
                },
                activeColor: Colors.green,
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Scanning animation
          AnimatedBuilder(
            animation: _threatPulseController,
            builder: (context, child) {
              return Container(
                height: 100,
                width: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: _isScanning 
                      ? Colors.green.withOpacity(_threatPulseController.value)
                      : Colors.grey,
                    width: 3,
                  ),
                ),
                child: Center(
                  child: Icon(
                    _isScanning ? Icons.radar : Icons.security,
                    size: 40,
                    color: _isScanning ? Colors.green : Colors.grey,
                  ),
                ),
              );
            },
          ),
          
          const SizedBox(height: 16),
          Text(
            _isScanning 
              ? 'Scanning for quantum threats...'
              : 'Tap to activate quantum protection',
            style: const TextStyle(color: Colors.white70),
          ),
          
          if (_recentThreats.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              'Last threat: ${_recentThreats.first.type} (Level ${_recentThreats.first.level.name})',
              style: TextStyle(
                color: _recentThreats.first.level == ThreatLevel.critical 
                  ? Colors.red 
                  : Colors.orange,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ],
      ),
    );
  }
  
  Widget _buildStatsGrid() {
    return Container(
      height: 120,
      margin: const EdgeInsets.all(16),
      child: Row(
        children: [
          _buildStatCard('Threats\nBlocked', 
            _playerProfile!.socialStats.threatsDetected.toString(), 
            Icons.shield, Colors.red),
          _buildStatCard('Keys\nGenerated', 
            _playerProfile!.socialStats.keysGenerated.toString(), 
            Icons.vpn_key, Colors.green),
          _buildStatCard('Referrals', 
            _playerProfile!.socialStats.successfulReferrals.toString(), 
            Icons.people, Colors.blue),
          _buildStatCard('Viral\nScore', 
            (_playerProfile!.socialStats.viralCoefficient * 100).toInt().toString(), 
            Icons.trending_up, Colors.purple),
        ],
      ),
    );
  }
  
  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.2),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.5)),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.2),
              blurRadius: 8,
              spreadRadius: 1,
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(
                color: color,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 11,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildDailyChallenges() {
    final challenges = _gameEngine.getDailyChallenges();
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '⚡ Daily Challenges',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                'Resets in ${_getTimeUntilReset()}',
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...challenges.map((challenge) => _buildChallengeCard(challenge)).toList(),
        ],
      ),
    );
  }
  
  Widget _buildChallengeCard(DailyChallenge challenge) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: challenge.isComplete 
          ? Colors.green.withOpacity(0.2)
          : Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: challenge.isComplete ? Colors.green : Colors.white30,
        ),
      ),
      child: Row(
        children: [
          Icon(
            challenge.isComplete ? Icons.check_circle : Icons.circle_outlined,
            color: challenge.isComplete ? Colors.green : Colors.white70,
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  challenge.description,
                  style: const TextStyle(color: Colors.white, fontSize: 16),
                ),
                const SizedBox(height: 6),
                LinearProgressIndicator(
                  value: challenge.progressPercent,
                  backgroundColor: Colors.grey[800],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    challenge.isComplete ? Colors.green : Colors.blue,
                  ),
                  minHeight: 6,
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            children: [
              Text(
                '+${challenge.xpReward} XP',
                style: const TextStyle(color: Colors.blue, fontSize: 12),
              ),
              Text(
                '+${challenge.coinReward} 🪙',
                style: const TextStyle(color: Colors.yellow, fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildTeamBattlePreview() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.orange.withOpacity(0.3), Colors.red.withOpacity(0.3)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.orange.withOpacity(0.5)),
      ),
      child: Column(
        children: [
          const Row(
            children: [
              Icon(Icons.groups, color: Colors.orange, size: 24),
              SizedBox(width: 8),
              Text(
                '⚔️ Team Battle Arena',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Join a team and compete in quantum security battles!',
            style: TextStyle(color: Colors.white70),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/battle'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: const Text('JOIN BATTLE'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildViralActionButtons() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: _inviteFriends,
              icon: const Icon(Icons.people_alt),
              label: const Text('INVITE FRIENDS'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                padding: const EdgeInsets.all(16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () => Navigator.pushNamed(context, '/shop'),
              icon: const Icon(Icons.shopping_cart),
              label: const Text('PREMIUM SHOP'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.purple,
                padding: const EdgeInsets.all(16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildRecentActivity() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '📊 Recent Activity',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          if (_recentThreats.isEmpty)
            const Text(
              'No threats detected yet. Keep scanning!',
              style: TextStyle(color: Colors.white70),
            )
          else
            ..._recentThreats.take(5).map((threat) => _buildThreatItem(threat)).toList(),
        ],
      ),
    );
  }
  
  Widget _buildThreatItem(ThreatDetection threat) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: threat.level == ThreatLevel.critical 
          ? Colors.red.withOpacity(0.2)
          : Colors.orange.withOpacity(0.2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(
            Icons.warning,
            color: threat.level == ThreatLevel.critical ? Colors.red : Colors.orange,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  threat.type,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Level ${threat.level.name} • ${_formatTime(threat.detectedAt)}',
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () => _shareThreateDetection(threat),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              minimumSize: const Size(60, 30),
            ),
            child: const Text('SHARE', style: TextStyle(fontSize: 10)),
          ),
        ],
      ),
    );
  }
  
  Widget _buildGameNavBar() {
    return BottomNavigationBar(
      backgroundColor: Colors.black,
      selectedItemColor: Colors.yellow,
      unselectedItemColor: Colors.white54,
      type: BottomNavigationBarType.fixed,
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.dashboard),
          label: 'Dashboard',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.shield),
          label: 'Protect',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.groups),
          label: 'Team',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.emoji_events),
          label: 'Achievements',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.leaderboard),
          label: 'Leaderboard',
        ),
      ],
      onTap: (index) {
        switch (index) {
          case 1: /* Current screen */ break;
          case 2: Navigator.pushNamed(context, '/team'); break;
          case 3: Navigator.pushNamed(context, '/achievements'); break;
          case 4: Navigator.pushNamed(context, '/leaderboard'); break;
        }
      },
    );
  }
  
  Widget _buildViralShareFAB() {
    return FloatingActionButton.extended(
      onPressed: _shareViralContent,
      backgroundColor: Colors.pink,
      icon: const Icon(Icons.share),
      label: const Text('GO VIRAL!'),
    );
  }
  
  List<Widget> _buildXPAnimations() {
    return _recentXPEvents.map((event) {
      return AnimatedBuilder(
        animation: _xpAnimationController,
        builder: (context, child) {
          return Positioned(
            top: 250 - (_xpAnimationController.value * 150),
            right: 20,
            child: Opacity(
              opacity: 1 - _xpAnimationController.value,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.blue,
                  borderRadius: BorderRadius.circular(25),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.blue.withOpacity(0.5),
                      blurRadius: 8,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Text(
                  '+${event.amount} XP',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
          );
        },
      );
    }).toList();
  }
  
  // VIRAL MECHANICS IMPLEMENTATION
  
  void _triggerMilestoneSharing(PlayerProfile profile) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.purple.shade900,
        title: const Text(
          '🎉 MILESTONE ACHIEVED!',
          style: TextStyle(color: Colors.yellow),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'You reached Level ${profile.level}!',
              style: const TextStyle(color: Colors.white, fontSize: 18),
            ),
            const SizedBox(height: 16),
            const Text(
              'Share your achievement and get bonus rewards!',
              style: TextStyle(color: Colors.white70),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Later'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _shareViralMilestone(profile);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            child: const Text('SHARE & GET +100 XP'),
          ),
        ],
      ),
    );
  }
  
  void _showViralAchievementUnlocked(Achievement achievement) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.purple, Colors.blue, Colors.cyan],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.yellow, width: 3),
            boxShadow: [
              BoxShadow(
                color: Colors.purple.withOpacity(0.5),
                blurRadius: 20,
                spreadRadius: 5,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                '🏆 ACHIEVEMENT UNLOCKED! 🏆',
                style: TextStyle(
                  color: Colors.yellow,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              Icon(
                Icons.emoji_events,
                size: 100,
                color: Colors.yellow,
              ),
              const SizedBox(height: 20),
              Text(
                achievement.name,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                achievement.description,
                style: const TextStyle(color: Colors.white70, fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.blue.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      '+${achievement.xpReward} XP',
                      style: const TextStyle(color: Colors.blue, fontSize: 16),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.yellow.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      '+${achievement.coinReward} Coins',
                      style: const TextStyle(color: Colors.yellow, fontSize: 16),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  _viralEngine.shareAchievement(achievement, 'twitter');
                  _gameEngine.awardXP('achievement_shared');
                },
                icon: const Icon(Icons.share),
                label: const Text('SHARE & GET +50 XP'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _showCriticalThreatAlert(ThreatDetection threat) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.red.shade900,
        title: const Row(
          children: [
            Icon(Icons.warning, color: Colors.red, size: 32),
            SizedBox(width: 8),
            Text('⚠️ CRITICAL THREAT!', style: TextStyle(color: Colors.white)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Blocked: ${threat.type}',
              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            const Text(
              'Your quantum security just saved you from a critical attack!',
              style: TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 16),
            const Text(
              'Share this heroic moment and warn your friends!',
              style: TextStyle(color: Colors.yellow),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Dismiss'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _shareThreateDetection(threat);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
            child: const Text('SHARE ALERT'),
          ),
        ],
      ),
    );
  }
  
  void _inviteFriends() async {
    final referralLink = await _viralEngine.generateReferralLink(_playerProfile!.userId);
    final shareText = '''
🛡️ Join me on PQShield - the world's first gamified quantum security app! 🎮

I'm Level ${_playerProfile!.level} ${_playerProfile!.title} protecting against quantum threats while earning rewards!

Use my referral code and we both get:
✅ 100 XP bonus
✅ 50 Coins
✅ Exclusive "Referred by Legend" badge

Join the quantum security revolution: $referralLink

#PQShield #QuantumSecurity #JoinMyTeam #CyberSecurity
''';
    
    await Share.share(shareText);
    _gameEngine.awardXP('referral_sent');
  }
  
  void _shareViralContent() async {
    final shareText = '''
🚀 I'm dominating the quantum security game on PQShield! 🛡️

Current Stats:
🏆 Level ${_playerProfile!.level} ${_playerProfile!.title}
⚡ ${_playerProfile!.socialStats.threatsDetected} threats blocked
🔑 ${_playerProfile!.socialStats.keysGenerated} quantum keys generated
📈 ${(_playerProfile!.socialStats.viralCoefficient * 100).toInt()}% viral score

The future of cybersecurity is here and it's gamified! 🎮

Join me: ${await _viralEngine.generateReferralLink(_playerProfile!.userId)}

#PQShield #QuantumSecurity #CyberGaming #FutureOfSecurity
''';
    
    await Share.share(shareText);
    _gameEngine.awardXP('viral_share');
  }
  
  void _shareViralMilestone(PlayerProfile profile) async {
    final shareText = '''
🎉 MILESTONE ACHIEVED! 🎉

Just reached Level ${profile.level} in PQShield! 🛡️

I'm now a ${profile.title} protecting against quantum threats while earning epic rewards! The gamification makes cybersecurity actually fun! 🎮

Want to join the quantum security revolution?
Use my code: ${await _viralEngine.generateReferralLink(profile.userId)}

#PQShield #LevelUp #QuantumSecurity #Achievement
''';
    
    await Share.share(shareText);
    _gameEngine.awardXP('milestone_shared', multiplier: 2);
  }
  
  void _shareThreateDetection(ThreatDetection threat) async {
    final shareText = '''
⚠️ QUANTUM THREAT BLOCKED! ⚠️

My PQShield just protected me from a ${threat.level.name.toUpperCase()} level ${threat.type} attack! 🛡️

This is why everyone needs quantum-resistant security. The threats are real and they're happening NOW!

Protect yourself: ${await _viralEngine.generateReferralLink(_playerProfile!.userId)}

#QuantumThreat #StaySecure #PQShield #CyberSecurity
''';
    
    await Share.share(shareText);
    _gameEngine.awardXP('threat_shared', multiplier: 2);
  }
  
  // UTILITY METHODS
  
  String _getTimeUntilReset() {
    final now = DateTime.now();
    final tomorrow = DateTime(now.year, now.month, now.day + 1);
    final difference = tomorrow.difference(now);
    return '${difference.inHours}h ${difference.inMinutes % 60}m';
  }
  
  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);
    
    if (difference.inMinutes < 1) return 'Just now';
    if (difference.inMinutes < 60) return '${difference.inMinutes}m ago';
    if (difference.inHours < 24) return '${difference.inHours}h ago';
    return '${difference.inDays}d ago';
  }
  
  @override
  void dispose() {
    _confettiController.dispose();
    _xpAnimationController.dispose();
    _levelProgressController.dispose();
    _threatPulseController.dispose();
    super.dispose();
  }
}

// SUPPORTING CLASSES AND SCREENS

// Custom painter for quantum background effects
class QuantumParticlesPainter extends CustomPainter {
  final double animationValue;
  
  QuantumParticlesPainter(this.animationValue);
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.cyan.withOpacity(0.3)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    
    // Draw animated quantum particles
    for (int i = 0; i < 20; i++) {
      final x = (size.width / 20) * i;
      final y = size.height / 2 + sin(animationValue * 2 * pi + i) * 50;
      
      canvas.drawCircle(
        Offset(x, y),
        5 + sin(animationValue * 2 * pi + i) * 3,
        paint,
      );
    }
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

// Placeholder screens for navigation
class TeamBattleScreen extends StatelessWidget {
  const TeamBattleScreen({Key? key}) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('⚔️ Team Battle Arena'),
        backgroundColor: Colors.red,
      ),
      body: const Center(
        child: Text(
          'Team Battle System\n\nCompete with your quantum security team!\nEarn exclusive rewards and climb the rankings!',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 18, color: Colors.white),
        ),
      ),
      backgroundColor: Colors.black,
    );
  }
}

class PremiumShopScreen extends StatelessWidget {
  const PremiumShopScreen({Key? key}) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('🛒 Premium Shop'),
        backgroundColor: Colors.purple,
      ),
      body: const Center(
        child: Text(
          'Premium Shop\n\nUpgrade your quantum protection!\nXP boosters, exclusive badges, and more!',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 18, color: Colors.white),
        ),
      ),
      backgroundColor: Colors.black,
    );
  }
}

class AchievementsScreen extends StatelessWidget {
  const AchievementsScreen({Key? key}) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('🏆 Achievements'),
        backgroundColor: Colors.green,
      ),
      body: const Center(
        child: Text(
          'Achievement Gallery\n\nUnlock 50+ achievements!\nShare your progress and go viral!',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 18, color: Colors.white),
        ),
      ),
      backgroundColor: Colors.black,
    );
  }
}

class GlobalLeaderboardScreen extends StatelessWidget {
  const GlobalLeaderboardScreen({Key? key}) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('🏅 Global Leaderboard'),
        backgroundColor: Colors.orange,
      ),
      body: const Center(
        child: Text(
          'Global Rankings\n\nCompete with quantum guardians worldwide!\nClimb the leaderboard and earn prestige!',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 18, color: Colors.white),
        ),
      ),
      backgroundColor: Colors.black,
    );
  }
}

class TeamManagementScreen extends StatelessWidget {
  const TeamManagementScreen({Key? key}) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('👥 Team Management'),
        backgroundColor: Colors.blue,
      ),
      body: const Center(
        child: Text(
          'Team Hub\n\nCreate or join a quantum security team!\nCollaborate, compete, and conquer!',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 18, color: Colors.white),
        ),
      ),
      backgroundColor: Colors.black,
    );
  }
}

// GAME ENGINE CLASSES (Simplified for demo)

class ViralGamificationEngine {
  PlayerProfile? _currentPlayer;
  final StreamController<PlayerProfile> _profileController = StreamController<PlayerProfile>.broadcast();
  final StreamController<Achievement> _achievementController = StreamController<Achievement>.broadcast();
  final StreamController<XPEvent> _xpEventController = StreamController<XPEvent>.broadcast();
  
  Stream<PlayerProfile> get profileStream => _profileController.stream;
  Stream<Achievement> get achievementStream => _achievementController.stream;
  Stream<XPEvent> get xpEventStream => _xpEventController.stream;
  
  Future<void> initialize(String userId) async {
    _currentPlayer = PlayerProfile(
      userId: userId,
      username: 'QuantumGuardian${Random().nextInt(9999)}',
      level: 1,
      xp: 0,
      coins: 100,
      rank: 'Bronze',
      achievements: [],
      unlockedBadges: [],
      team: null,
      socialStats: SocialStats(
        referrals: 0,
        successfulReferrals: 0,
        achievementsShared: 0,
        threatsDetected: 0,
        keysGenerated: 0,
        viralCoefficient: 0.0,
      ),
      joinDate: DateTime.now(),
      dailyStreak: 1,
      battlePass: {},
    );
    _profileController.add(_currentPlayer!);
  }
  
  void awardXP(String action, {int multiplier = 1}) {
    if (_currentPlayer == null) return;
    
    final xpRewards = {
      'threat_detected_low': 5,
      'threat_detected_medium': 15,
      'threat_detected_critical': 50,
      'scanner_activated': 10,
      'referral_sent': 30,
      'viral_share': 25,
      'milestone_shared': 50,
      'threat_shared': 40,
      'achievement_shared': 30,
    };
    
    final baseXP = xpRewards[action] ?? 0;
    final totalXP = baseXP * multiplier;
    
    _currentPlayer = _currentPlayer!.copyWith(xp: _currentPlayer!.xp + totalXP);
    
    // Check for level up
    while (_currentPlayer!.xp >= _currentPlayer!.xpForNextLevel) {
      final overflow = _currentPlayer!.xp - _currentPlayer!.xpForNextLevel;
      _currentPlayer = _currentPlayer!.copyWith(
        level: _currentPlayer!.level + 1,
        xp: overflow,
        coins: _currentPlayer!.coins + 50,
      );
    }
    
    _xpEventController.add(XPEvent(
      amount: totalXP,
      action: action,
      timestamp: DateTime.now(),
    ));
    
    _profileController.add(_currentPlayer!);
  }
  
  List<DailyChallenge> getDailyChallenges() {
    return [
      DailyChallenge(
        id: 'detect_5_threats',
        description: 'Detect 5 quantum threats',
        progress: Random().nextInt(6),
        target: 5,
        xpReward: 50,
        coinReward: 25,
      ),
      DailyChallenge(
        id: 'generate_3_keys',
        description: 'Generate 3 quantum keys',
        progress: Random().nextInt(4),
        target: 3,
        xpReward: 40,
        coinReward: 20,
      ),
      DailyChallenge(
        id: 'share_achievement',
        description: 'Share an achievement',
        progress: Random().nextInt(2),
        target: 1,
        xpReward: 30,
        coinReward: 15,
      ),
    ];
  }
}

class ViralGrowthEngine {
  Future<String> generateReferralLink(String userId) async {
    final code = _generateReferralCode(userId);
    return 'https://pqshield.app/join?ref=$code&reward=100xp';
  }
  
  String _generateReferralCode(String userId) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final input = '$userId:$timestamp';
    return sha256.convert(utf8.encode(input)).toString().substring(0, 8);
  }
  
  Future<void> shareAchievement(Achievement achievement, String platform) async {
    // Implementation for sharing to different platforms
  }
}

class QuantumSecurityEngine {
  Future<ThreatDetection?> scanForQuantumThreats() async {
    // Simulate threat detection
    if (Random().nextDouble() < 0.3) { // 30% chance of threat
      final threats = [
        'Quantum Key Distribution Attack',
        'Post-Quantum Cryptography Breach',
        'Shor\'s Algorithm Exploitation',
        'Quantum Entanglement Hijack',
        'Lattice-Based Crypto Weakness',
      ];
      
      final levels = [ThreatLevel.low, ThreatLevel.medium, ThreatLevel.critical];
      
      return ThreatDetection(
        type: threats[Random().nextInt(threats.length)],
        level: levels[Random().nextInt(levels.length)],
        detectedAt: DateTime.now(),
      );
    }
    return null;
  }
}

// DATA MODELS

class PlayerProfile {
  final String userId;
  final String username;
  final int level;
  final int xp;
  final int coins;
  final String rank;
  final List<Achievement> achievements;
  final List<String> unlockedBadges;
  final TeamInfo? team;
  final SocialStats socialStats;
  final DateTime joinDate;
  final int dailyStreak;
  final Map<String, dynamic> battlePass;
  
  PlayerProfile({
    required this.userId,
    required this.username,
    required this.level,
    required this.xp,
    required this.coins,
    required this.rank,
    required this.achievements,
    required this.unlockedBadges,
    this.team,
    required this.socialStats,
    required this.joinDate,
    required this.dailyStreak,
    required this.battlePass,
  });
  
  String get title {
    if (level <= 4) return '🛡️ Quantum Rookie';
    if (level <= 10) return '⚔️ Crypto Knight';
    if (level <= 20) return '🎯 Security Sentinel';
    if (level <= 35) return '⚡ Quantum Warrior';
    if (level <= 50) return '🔥 Cipher Master';
    if (level <= 75) return '👑 Quantum Guardian';
    if (level <= 99) return '🌟 Security Legend';
    return '🚀 Quantum God';
  }
  
  int get xpForNextLevel => level * 100 + 50;
  double get levelProgress => xp / xpForNextLevel;
  
  Color get rankColor {
    switch (rank) {
      case 'Bronze': return Colors.brown;
      case 'Silver': return Colors.grey;
      case 'Gold': return Colors.amber;
      case 'Platinum': return Colors.blueGrey;
      case 'Diamond': return Colors.cyan;
      case 'Master': return Colors.purple;
      case 'Grandmaster': return Colors.deepPurple;
      default: return Colors.red; // Challenger
    }
  }
  
  PlayerProfile copyWith({
    String? userId,
    String? username,
    int? level,
    int? xp,
    int? coins,
    String? rank,
    List<Achievement>? achievements,
    List<String>? unlockedBadges,
    TeamInfo? team,
    SocialStats? socialStats,
    DateTime? joinDate,
    int? dailyStreak,
    Map<String, dynamic>? battlePass,
  }) {
    return PlayerProfile(
      userId: userId ?? this.userId,
      username: username ?? this.username,
      level: level ?? this.level,
      xp: xp ?? this.xp,
      coins: coins ?? this.coins,
      rank: rank ?? this.rank,
      achievements: achievements ?? this.achievements,
      unlockedBadges: unlockedBadges ?? this.unlockedBadges,
      team: team ?? this.team,
      socialStats: socialStats ?? this.socialStats,
      joinDate: joinDate ?? this.joinDate,
      dailyStreak: dailyStreak ?? this.dailyStreak,
      battlePass: battlePass ?? this.battlePass,
    );
  }
}

class Achievement {
  final String id;
  final String name;
  final String description;
  final String iconUrl;
  final int xpReward;
  final int coinReward;
  final DateTime unlockedAt;
  final bool isRare;
  final String shareText;
  
  Achievement({
    required this.id,
    required this.name,
    required this.description,
    required this.iconUrl,
    required this.xpReward,
    required this.coinReward,
    required this.unlockedAt,
    required this.isRare,
    required this.shareText,
  });
}

class TeamInfo {
  final String teamId;
  final String teamName;
  final int teamLevel;
  final int memberCount;
  final int teamRank;
  final String motto;
  final Map<String, dynamic> battleStats;
  
  TeamInfo({
    required this.teamId,
    required this.teamName,
    required this.teamLevel,
    required this.memberCount,
    required this.teamRank,
    required this.motto,
    required this.battleStats,
  });
}

class SocialStats {
  final int referrals;
  final int successfulReferrals;
  final int achievementsShared;
  final int threatsDetected;
  final int keysGenerated;
  final double viralCoefficient;
  
  SocialStats({
    required this.referrals,
    required this.successfulReferrals,
    required this.achievementsShared,
    required this.threatsDetected,
    required this.keysGenerated,
    required this.viralCoefficient,
  });
  
  double get kFactor => successfulReferrals / (referrals > 0 ? referrals : 1);
}

class XPEvent {
  final int amount;
  final String action;
  final DateTime timestamp;
  
  XPEvent({
    required this.amount,
    required this.action,
    required this.timestamp,
  });
}

class DailyChallenge {
  final String id;
  final String description;
  int progress;
  final int target;
  final int xpReward;
  final int coinReward;
  
  DailyChallenge({
    required this.id,
    required this.description,
    required this.progress,
    required this.target,
    required this.xpReward,
    required this.coinReward,
  });
  
  bool get isComplete => progress >= target;
  double get progressPercent => progress / target;
}

class ThreatDetection {
  final String type;
  final ThreatLevel level;
  final DateTime detectedAt;
  
  ThreatDetection({
    required this.type,
    required this.level,
    required this.detectedAt,
  });
}

enum ThreatLevel { low, medium, critical }
