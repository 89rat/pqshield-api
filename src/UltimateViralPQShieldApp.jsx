import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Zap, Users, Gift, TrendingUp, AlertTriangle, Star, Trophy, Share2, Bell, Settings, Eye, EyeOff, Download, Upload, Wifi, Lock, Unlock, Play, Pause, RotateCcw, Search, FileText, Mail, Globe, CreditCard, Camera, Mic, Phone, MessageSquare, Calendar, Target, Brain, Database, CloudLightning, Cpu, Network, ShoppingCart, Heart, Flag, UserPlus, Award, Gamepad2, Bot, Sparkles, Rocket, Crown, Swords, Gem, Timer, MapPin, ChevronRight, ChevronLeft, RefreshCw, CheckCircle, XCircle, Info, Smartphone, Laptop, Monitor, Tv, Watch, Car } from 'lucide-react';

const UltimateViralPQShieldApp = () => {
  // Enhanced user state with complete progression system
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pqshield_user');
    return saved ? JSON.parse(saved) : {
      id: 'user_' + Date.now(),
      username: 'QuantumDefender' + Math.floor(Math.random() * 1000),
      email: '',
      level: 1,
      xp: 0,
      xpToNext: 100,
      tier: 'Quantum Rookie',
      totalThreats: 0,
      coins: 100,
      gems: 10,
      streak: 0,
      referrals: 0,
      subscription: 'Free',
      joinDate: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      achievements: [],
      referralCode: generateReferralCode(),
      dailyChallenges: [],
      guildId: null,
      guildRole: null,
      premiumFeatures: [],
      deviceProtections: {},
      scansToday: 0,
      totalScans: 0,
      viralShares: 0,
      teamBattleWins: 0,
      quantumKeys: 0,
      neuralNetworkLevel: 1,
      encryptionStrength: 256,
      antiVirusEngine: 'Basic',
      firewallLevel: 1,
      vpnActive: false,
      realTimeProtection: false,
      behaviorAnalysis: false,
      cloudSyncEnabled: false,
      biometricLock: false,
      twoFactorAuth: false
    };
  });

  const [threats, setThreats] = useState([]);
  const [achievements, setAchievements] = useState(() => {
    const saved = localStorage.getItem('pqshield_achievements');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isScanning, setIsScanning] = useState(false);
  const [networkScan, setNetworkScan] = useState({ devices: [], scanning: false });
  const [securityScore, setSecurityScore] = useState(85);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dailyChallenges, setDailyChallenges] = useState([]);
  const [teamBattles, setTeamBattles] = useState([]);
  const [shop, setShop] = useState([]);
  const [guild, setGuild] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [quantumEngine, setQuantumEngine] = useState({ active: false, strength: 0 });
  const [neuralNetwork, setNeuralNetwork] = useState({ nodes: [], connections: [], processing: false });
  const [viralMetrics, setViralMetrics] = useState({ kFactor: 1.0, shares: 0, conversions: 0 });
  const [analytics, setAnalytics] = useState({ 
    sessionsToday: 1, 
    avgSessionTime: 0, 
    retentionRate: 100,
    engagementScore: 0
  });

  // Advanced threat types with quantum-level security
  const threatTypes = [
    { type: 'Quantum Malware', severity: 'Critical', xp: 100, description: 'Post-quantum malware using quantum algorithms', probability: 0.05 },
    { type: 'AI-Powered Phishing', severity: 'High', xp: 50, description: 'Machine learning generated phishing attack', probability: 0.15 },
    { type: 'Neural Network Intrusion', severity: 'Critical', xp: 120, description: 'AI attempting to breach neural defenses', probability: 0.03 },
    { type: 'Quantum Key Attack', severity: 'Critical', xp: 150, description: 'Attempt to crack quantum encryption keys', probability: 0.02 },
    { type: 'Deepfake Social Engineering', severity: 'High', xp: 45, description: 'AI-generated social manipulation', probability: 0.12 },
    { type: 'Blockchain Ransomware', severity: 'High', xp: 60, description: 'Cryptocurrency-based file encryption', probability: 0.08 },
    { type: 'IoT Botnet', severity: 'Medium', xp: 25, description: 'Smart device network compromise', probability: 0.20 },
    { type: 'Zero-Day Exploit', severity: 'Critical', xp: 200, description: 'Unknown vulnerability exploitation', probability: 0.01 },
    { type: 'Quantum Tunneling Attack', severity: 'Critical', xp: 180, description: 'Advanced quantum computing breach', probability: 0.01 },
    { type: 'Biometric Spoofing', severity: 'High', xp: 40, description: 'Fake biometric authentication', probability: 0.10 },
    { type: 'Memory Injection', severity: 'Medium', xp: 30, description: 'Direct memory manipulation attack', probability: 0.18 },
    { type: 'DNS Poisoning', severity: 'Medium', xp: 20, description: 'Domain name system corruption', probability: 0.25 },
    { type: 'Spyware', severity: 'Medium', xp: 18, description: 'Data theft monitoring software', probability: 0.30 },
    { type: 'Adware', severity: 'Low', xp: 8, description: 'Unwanted advertisement injection', probability: 0.35 },
    { type: 'Browser Hijacker', severity: 'Medium', xp: 22, description: 'Web browser control takeover', probability: 0.28 }
  ];

  // Complete 8-tier progression system
  const tiers = [
    { name: 'Quantum Rookie', levels: [1, 4], icon: '🛡️', color: 'bg-gray-500', minLevel: 1, benefits: ['Basic protection', 'Community access'] },
    { name: 'Crypto Knight', levels: [5, 10], icon: '⚔️', color: 'bg-blue-500', minLevel: 5, benefits: ['Enhanced scanning', 'Team features'] },
    { name: 'Security Sentinel', levels: [11, 20], icon: '🎯', color: 'bg-green-500', minLevel: 11, benefits: ['Advanced monitoring', 'Daily challenges'] },
    { name: 'Quantum Warrior', levels: [21, 35], icon: '⚡', color: 'bg-yellow-500', minLevel: 21, benefits: ['Real-time protection', 'Neural networks'] },
    { name: 'Cipher Master', levels: [36, 50], icon: '🔥', color: 'bg-orange-500', minLevel: 36, benefits: ['Expert analysis', 'Custom rules'] },
    { name: 'Quantum Guardian', levels: [51, 75], icon: '👑', color: 'bg-purple-500', minLevel: 51, benefits: ['Elite features', 'Guild leadership'] },
    { name: 'Security Legend', levels: [76, 99], icon: '🌟', color: 'bg-pink-500', minLevel: 76, benefits: ['Legendary status', 'Beta access'] },
    { name: 'Quantum God', levels: [100, 999], icon: '🚀', color: 'bg-red-500', minLevel: 100, benefits: ['Ultimate power', 'Exclusive content'] }
  ];

  // Complete subscription system with k-factors
  const subscriptionTiers = [
    { 
      name: 'Free', 
      price: '$0', 
      monthly: 0,
      features: ['Basic protection', 'Community support', '10 scans/day', '1x XP'], 
      kFactor: 1.0,
      limits: { scans: 10, referrals: 3, features: ['basic'], xpMultiplier: 1.0 }
    },
    { 
      name: 'Premium', 
      price: '$4.99', 
      monthly: 4.99,
      features: ['Advanced features', '2x XP boost', 'Unlimited scans', 'Daily challenges'], 
      kFactor: 1.5,
      limits: { scans: -1, referrals: 10, features: ['basic', 'advanced'], xpMultiplier: 2.0 }
    },
    { 
      name: 'Elite', 
      price: '$9.99', 
      monthly: 9.99,
      features: ['Real-time monitoring', 'Team features', 'Priority support', '3x XP'], 
      kFactor: 2.0,
      limits: { scans: -1, referrals: 25, features: ['basic', 'advanced', 'team'], xpMultiplier: 3.0 }
    },
    { 
      name: 'Quantum', 
      price: '$19.99', 
      monthly: 19.99,
      features: ['Ultimate protection', 'Custom networks', 'AI analysis', '5x XP'], 
      kFactor: 3.0,
      limits: { scans: -1, referrals: 50, features: ['basic', 'advanced', 'team', 'quantum'], xpMultiplier: 5.0 }
    }
  ];

  // Neural network visualization
  const neuralNetworkRef = useRef(null);

  // Generate referral code with cryptographic security
  function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'QS';
    const array = new Uint8Array(6);
    if (window.crypto) {
      window.crypto.getRandomValues(array);
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(array[i] % chars.length);
      }
    } else {
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    return result;
  }

  // Advanced threat detection with quantum algorithms
  const quantumThreatDetection = useCallback(() => {
    const baseChance = 0.25;
    const quantumBonus = quantumEngine.active ? quantumEngine.strength * 0.1 : 0;
    const neuralBonus = user.neuralNetworkLevel * 0.02;
    const totalChance = Math.min(baseChance + quantumBonus + neuralBonus, 0.8);
    
    if (Math.random() < totalChance) {
      // Weighted threat selection based on probabilities
      let randomValue = Math.random();
      let cumulativeProbability = 0;
      
      for (const threat of threatTypes) {
        cumulativeProbability += threat.probability;
        if (randomValue <= cumulativeProbability) {
          return threat;
        }
      }
    }
    return null;
  }, [quantumEngine, user.neuralNetworkLevel]);

  // Save user data to localStorage
  useEffect(() => {
    localStorage.setItem('pqshield_user', JSON.stringify(user));
  }, [user]);

  // Save achievements to localStorage
  useEffect(() => {
    localStorage.setItem('pqshield_achievements', JSON.stringify(achievements));
  }, [achievements]);

  // Core functions
  const addXP = (amount) => {
    setUser(prev => {
      const multiplier = getCurrentSubscription().limits.xpMultiplier;
      let newXP = prev.xp + (amount * multiplier);
      let newLevel = prev.level;
      let newXPToNext = prev.xpToNext;
      let newTier = prev.tier;

      while (newXP >= newXPToNext) {
        newXP -= newXPToNext;
        newLevel++;
        newXPToNext = Math.floor(newXPToNext * 1.15);
        
        const currentTier = tiers.find(tier => newLevel >= tier.minLevel && newLevel <= tier.levels[1]);
        if (currentTier) {
          newTier = currentTier.name;
        }
        
        addNotification(`🎉 Level up! You are now level ${newLevel}!`);
        
        if (newLevel % 10 === 0) {
          shareContent('level', { level: newLevel, tier: newTier });
        }
      }

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        xpToNext: newXPToNext,
        tier: newTier
      };
    });
  };

  const addCoins = (amount) => {
    setUser(prev => ({
      ...prev,
      coins: prev.coins + amount
    }));
  };

  const addNotification = (message) => {
    const notification = {
      id: Date.now(),
      message,
      timestamp: new Date().toLocaleTimeString(),
      read: false
    };
    setNotifications(prev => [notification, ...prev.slice(0, 19)]);
  };

  const getCurrentTier = () => {
    return tiers.find(tier => user.level >= tier.minLevel && user.level <= tier.levels[1]) || tiers[0];
  };

  const getCurrentSubscription = () => {
    return subscriptionTiers.find(tier => tier.name === user.subscription) || subscriptionTiers[0];
  };

  const shareContent = (type, data) => {
    // Viral sharing implementation
    trackViralMetrics('share');
    addNotification(`📱 Shared ${type} content! +25 XP`);
    addXP(25);
  };

  const trackViralMetrics = useCallback((action, value = 1) => {
    setViralMetrics(prev => {
      const updated = { ...prev };
      
      switch(action) {
        case 'share':
          updated.shares += value;
          updated.kFactor = Math.min(updated.kFactor + 0.1, 5.0);
          break;
        case 'conversion':
          updated.conversions += value;
          updated.kFactor = Math.min(updated.kFactor + 0.2, 5.0);
          break;
        case 'referral':
          updated.kFactor = Math.min(updated.kFactor + 0.15, 5.0);
          break;
      }
      
      return updated;
    });
  }, []);

  // Quantum engine activation
  const activateQuantumEngine = () => {
    if (user.quantumKeys >= 5) {
      setQuantumEngine({ active: true, strength: Math.min(quantumEngine.strength + 1, 10) });
      setUser(prev => ({ ...prev, quantumKeys: prev.quantumKeys - 5 }));
      addNotification('⚛️ Quantum Engine activated! Enhanced protection enabled.');
      addXP(100);
    } else {
      addNotification('❌ Need 5 Quantum Keys to activate engine');
    }
  };

  // Neural network upgrade
  const upgradeNeuralNetwork = () => {
    if (user.coins >= 100 * user.neuralNetworkLevel) {
      const cost = 100 * user.neuralNetworkLevel;
      setUser(prev => ({
        ...prev,
        coins: prev.coins - cost,
        neuralNetworkLevel: prev.neuralNetworkLevel + 1
      }));
      
      addNotification(`🧠 Neural Network upgraded to level ${user.neuralNetworkLevel + 1}!`);
      addXP(50);
    } else {
      addNotification('❌ Insufficient coins for neural upgrade');
    }
  };

  // Threat scanning simulation
  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      const threat = quantumThreatDetection();
      if (threat) {
        const newThreat = {
          ...threat,
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          ip: generateFakeIP(),
          location: generateFakeLocation(),
          quantumSignature: generateQuantumSignature()
        };
        
        setThreats(prev => [newThreat, ...prev.slice(0, 9)]);
        setUser(prev => ({ ...prev, totalThreats: prev.totalThreats + 1 }));
        addXP(threat.xp);
        addCoins(Math.floor(threat.xp / 2));
        addNotification(`🛡️ Blocked ${threat.type}! +${threat.xp} XP`);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isScanning, quantumThreatDetection]);

  // Generate fake data helpers
  function generateFakeIP() {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  function generateFakeLocation() {
    const locations = ['Unknown', 'Russia', 'China', 'North Korea', 'Iran', 'Brazil', 'Romania', 'Nigeria', 'Ukraine', 'Belarus'];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  function generateQuantumSignature() {
    return Array.from({length: 8}, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
  }

  // Dashboard Tab with complete features
  const DashboardTab = () => (
    <div className="space-y-6 pb-20">
      {/* Hero Stats with Quantum Effects */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-lg p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{getCurrentTier().name}</h2>
              <p className="opacity-90">Level {user.level} • {user.subscription}</p>
              <p className="text-sm opacity-75">Neural Network Lv.{user.neuralNetworkLevel}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl mb-2">{getCurrentTier().icon}</div>
              <div className={`px-2 py-1 rounded text-xs ${quantumEngine.active ? 'bg-green-500' : 'bg-red-500'}`}>
                Quantum {quantumEngine.active ? 'ACTIVE' : 'OFFLINE'}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>XP Progress</span>
              <span>{user.xp.toLocaleString()} / {user.xpToNext.toLocaleString()}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full h-3 transition-all duration-500 relative overflow-hidden"
                style={{ width: `${(user.xp / user.xpToNext) * 100}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid with Enhanced Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center space-x-3">
            <Shield className="text-green-500" size={24} />
            <div>
              <p className="text-2xl font-bold text-green-600">{user.totalThreats.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Threats Blocked</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center space-x-3">
            <Zap className="text-yellow-500" size={24} />
            <div>
              <p className="text-2xl font-bold text-yellow-600">{user.coins.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Quantum Coins</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center space-x-3">
            <Gem className="text-purple-500" size={24} />
            <div>
              <p className="text-2xl font-bold text-purple-600">{user.gems}</p>
              <p className="text-sm text-gray-600">Quantum Gems</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center space-x-3">
            <Users className="text-blue-500" size={24} />
            <div>
              <p className="text-2xl font-bold text-blue-600">{user.referrals}</p>
              <p className="text-sm text-gray-600">Referrals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quantum Engine Control */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center">
            <CloudLightning className="mr-2" size={20} />
            Quantum Engine
          </h3>
          <button
            onClick={activateQuantumEngine}
            disabled={user.quantumKeys < 5}
            className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {quantumEngine.active ? `Upgrade (${user.quantumKeys}/5)` : `Activate (${user.quantumKeys}/5)`}
          </button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Power Level</span>
            <span>{quantumEngine.strength}/10</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${quantumEngine.strength * 10}%` }}
            />
          </div>
          <p className="text-xs opacity-90">
            Quantum enhancement boosts threat detection by {quantumEngine.strength * 10}%
          </p>
        </div>
      </div>

      {/* Neural Network Upgrade */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center">
            <Brain className="mr-2 text-pink-500" size={20} />
            Neural Network
          </h3>
          <button
            onClick={upgradeNeuralNetwork}
            disabled={user.coins < 100 * user.neuralNetworkLevel}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 text-sm"
          >
            Upgrade ({(100 * user.neuralNetworkLevel).toLocaleString()} coins)
          </button>
        </div>
        
        <p className="text-xs text-gray-600">
          Level {user.neuralNetworkLevel} • Enhanced pattern recognition • +{user.neuralNetworkLevel * 2}% detection
        </p>
      </div>

      {/* Real-time Protection */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center">
            <Shield className="mr-2 text-green-500" size={20} />
            Real-time Protection
          </h3>
          <button
            onClick={() => setIsScanning(!isScanning)}
            className={`px-4 py-2 rounded-lg text-white font-medium ${
              isScanning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isScanning ? <><Pause size={16} className="mr-1" />Stop</> : <><Play size={16} className="mr-1" />Start</>}
          </button>
        </div>
        
        <div className={`w-full h-3 rounded-full mb-3 ${isScanning ? 'bg-green-200' : 'bg-gray-200'}`}>
          {isScanning && (
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse" />
          )}
        </div>
        
        <p className="text-xs text-gray-600">
          {isScanning ? 'Actively monitoring for quantum threats...' : 'Click Start to begin real-time protection'}
        </p>
      </div>

      {/* Recent Threats */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="font-bold mb-3 flex items-center">
          <AlertTriangle className="mr-2 text-red-500" size={20} />
          Recent Threats Blocked
        </h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {threats.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No threats detected yet. Start scanning to see results!</p>
          ) : (
            threats.map(threat => (
              <div key={threat.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{threat.type}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    threat.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                    threat.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                    threat.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {threat.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{threat.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>
                    <span className="font-medium">Source IP:</span> {threat.ip}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {threat.location}
                  </div>
                  <div>
                    <span className="font-medium">Quantum ID:</span> {threat.quantumSignature}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {threat.timestamp}
                  </div>
                </div>
                <div className="mt-2 text-xs">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    ✅ BLOCKED • +{threat.xp} XP
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Viral Metrics Dashboard */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-4 text-white">
        <h3 className="font-bold mb-3 flex items-center">
          <TrendingUp className="mr-2" size={20} />
          Viral Growth Metrics
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{viralMetrics.kFactor.toFixed(1)}x</p>
            <p className="text-xs opacity-90">K-Factor</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{viralMetrics.shares}</p>
            <p className="text-xs opacity-90">Viral Shares</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{viralMetrics.conversions}</p>
            <p className="text-xs opacity-90">Conversions</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="text-white" size={24} />
            <div>
              <span className="font-bold text-lg">PQShield</span>
              <div className="text-xs opacity-90">Quantum Security Gaming</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right text-sm">
              <div className="font-bold">{user.coins.toLocaleString()}</div>
              <div className="text-xs opacity-75">coins</div>
            </div>
            <div className="text-right text-sm">
              <div className="font-bold">{user.gems}</div>
              <div className="text-xs opacity-75">gems</div>
            </div>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 bg-white/20 rounded-lg"
            >
              <Bell size={20} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="absolute right-4 top-16 w-80 bg-white border rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
            <div className="p-3 border-b bg-gray-50">
              <h3 className="font-bold text-gray-800">Notifications</h3>
            </div>
            {notifications.length === 0 ? (
              <p className="p-4 text-gray-500 text-center">No notifications</p>
            ) : (
              notifications.map(notification => (
                <div key={notification.id} className="p-3 border-b last:border-b-0 text-gray-800">
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{notification.timestamp}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'dashboard' && <DashboardTab />}
        {/* Other tabs would be implemented similarly with full features */}
      </div>

      {/* Enhanced Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t shadow-lg">
        <div className="flex">
          {[
            { id: 'dashboard', icon: Shield, label: 'Shield', color: 'text-purple-600' },
            { id: 'achievements', icon: Trophy, label: 'Rewards', color: 'text-yellow-600' },
            { id: 'social', icon: Users, label: 'Social', color: 'text-blue-600' },
            { id: 'upgrade', icon: TrendingUp, label: 'Upgrade', color: 'text-green-600' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-2 text-center transition-all duration-200 ${
                activeTab === tab.id 
                  ? `${tab.color} bg-gradient-to-t from-gray-100 to-transparent scale-110` 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={20} className="mx-auto mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="w-8 h-0.5 bg-current mx-auto mt-1 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UltimateViralPQShieldApp;
