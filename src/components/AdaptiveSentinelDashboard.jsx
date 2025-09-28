import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Brain, Zap, Users, Heart, Lock, 
  AlertTriangle, CheckCircle, Activity, Settings,
  Baby, GraduationCap, Briefcase, Home, Glasses,
  Gamepad2, Star, Trophy, Gift, Phone
} from 'lucide-react';
import { VirtualSentinelEngine, AgeGroup, PrivacyConfigurations } from '../sentinel/VirtualSentinelEngine';

/**
 * Adaptive Sentinel Dashboard - Age-Appropriate Interface
 * 
 * Provides specialized interfaces for each age group with appropriate
 * visual design, functionality, and interaction patterns.
 */
const AdaptiveSentinelDashboard = ({ userProfile, onUserUpdate }) => {
  const [sentinelEngine, setSentinelEngine] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [threats, setThreats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Initialize Sentinel Engine
  useEffect(() => {
    const initializeEngine = async () => {
      try {
        const engine = new VirtualSentinelEngine({
          neural: {
            snn: { learningRate: 0.01 },
            ann: { threshold: 0.7 },
            qnn: { securityLevel: 256 }
          },
          federatedLearning: true,
          allowLearning: true
        });
        
        await engine.setUser(userProfile);
        setSentinelEngine(engine);
        
        // Start monitoring
        startRealTimeMonitoring(engine);
        
      } catch (error) {
        console.error('Failed to initialize Sentinel Engine:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userProfile) {
      initializeEngine();
    }
    
    return () => {
      if (sentinelEngine) {
        sentinelEngine.dispose();
      }
    };
  }, [userProfile]);
  
  const startRealTimeMonitoring = useCallback((engine) => {
    const updateMetrics = async () => {
      const currentMetrics = engine.getPerformanceMetrics();
      setMetrics(currentMetrics);
    };
    
    // Update metrics every 5 seconds
    const metricsInterval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update
    
    // Simulate threat detection for demo
    const simulateThreats = () => {
      const threatTypes = ['phishing', 'malware', 'scam', 'inappropriate_content'];
      const newThreat = {
        id: Date.now(),
        type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
        severity: Math.random(),
        timestamp: new Date(),
        blocked: Math.random() > 0.1, // 90% block rate
        source: 'network'
      };
      
      setThreats(prev => [newThreat, ...prev.slice(0, 9)]); // Keep last 10
    };
    
    // Simulate threats every 30 seconds
    const threatInterval = setInterval(simulateThreats, 30000);
    
    return () => {
      clearInterval(metricsInterval);
      clearInterval(threatInterval);
    };
  }, []);
  
  const determineAgeGroup = (age) => {
    for (const group of Object.values(AgeGroup)) {
      if (age >= group.min && age <= group.max) {
        return group;
      }
    }
    return AgeGroup.ADULT;
  };
  
  const ageGroup = determineAgeGroup(userProfile?.age || 25);
  const config = PrivacyConfigurations[ageGroup.name];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
        <span className="ml-4 text-xl font-semibold text-gray-700">
          Initializing Sentinel Engine...
        </span>
      </div>
    );
  }
  
  // Render age-appropriate dashboard
  switch (ageGroup.name) {
    case 'child':
      return <ChildDashboard 
        metrics={metrics} 
        threats={threats} 
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />;
    case 'teen':
      return <TeenDashboard 
        metrics={metrics} 
        threats={threats} 
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />;
    case 'youngAdult':
      return <YoungAdultDashboard 
        metrics={metrics} 
        threats={threats} 
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />;
    case 'senior':
      return <SeniorDashboard 
        metrics={metrics} 
        threats={threats} 
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />;
    default:
      return <AdultDashboard 
        metrics={metrics} 
        threats={threats} 
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />;
  }
};

/**
 * Child-Friendly Dashboard (Ages 0-12)
 */
const ChildDashboard = ({ metrics, threats, config, activeTab, setActiveTab }) => {
  const [points, setPoints] = useState(150);
  const [badges, setBadges] = useState(['Safe Surfer', 'Privacy Pro']);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      {/* Header with Mascot */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-sm border-b-4 border-purple-300 p-6"
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <motion.div
              animate={{ bounce: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-2xl"
            >
              🛡️
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-purple-800">Safety Buddy</h1>
              <p className="text-purple-600">Keeping you safe online!</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-200 px-4 py-2 rounded-full flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <span className="font-bold text-yellow-800">{points} Points</span>
            </div>
            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-lg font-semibold">
              Ask Parent
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Safety Status */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 mb-6 border-4 border-green-300"
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-4xl font-bold text-green-800 mb-2">You're Safe!</h2>
            <p className="text-xl text-green-600">
              Safety Buddy blocked {threats.filter(t => t.blocked).length} bad things today
            </p>
          </div>
        </motion.div>
        
        {/* Fun Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard
            icon={<Shield className="w-8 h-8" />}
            title="Threats Blocked"
            value={metrics?.threatsBlocked || 0}
            color="bg-blue-500"
            childFriendly={true}
          />
          <StatCard
            icon={<Trophy className="w-8 h-8" />}
            title="Safety Score"
            value="100%"
            color="bg-yellow-500"
            childFriendly={true}
          />
          <StatCard
            icon={<Heart className="w-8 h-8" />}
            title="Happy Days"
            value="7"
            color="bg-pink-500"
            childFriendly={true}
          />
        </div>
        
        {/* Badges & Achievements */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border-4 border-yellow-300"
        >
          <h3 className="text-2xl font-bold text-yellow-800 mb-4 flex items-center">
            <Trophy className="w-6 h-6 mr-2" />
            Your Badges
          </h3>
          <div className="flex flex-wrap gap-4">
            {badges.map((badge, index) => (
              <motion.div
                key={badge}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.2 }}
                className="bg-gradient-to-br from-purple-400 to-pink-400 text-white px-4 py-2 rounded-full font-semibold flex items-center space-x-2"
              >
                <Star className="w-4 h-4" />
                <span>{badge}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/**
 * Teen Dashboard (Ages 13-17)
 */
const TeenDashboard = ({ metrics, threats, config, activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'learn', label: 'Learn', icon: GraduationCap }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">PQShield</h1>
                <p className="text-sm text-gray-600">Your Privacy Guardian</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 px-3 py-1 rounded-full">
                <span className="text-sm font-semibold text-green-800">Protected</span>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TeenOverview metrics={metrics} threats={threats} />
            </motion.div>
          )}
          
          {activeTab === 'privacy' && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TeenPrivacy config={config} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const TeenOverview = ({ metrics, threats }) => (
  <div className="space-y-6">
    {/* Privacy Score */}
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Privacy Score</h2>
        <div className="text-3xl font-bold text-indigo-600">94%</div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full" style={{ width: '94%' }} />
      </div>
      <p className="text-sm text-gray-600 mt-2">Great job! Your privacy settings are well configured.</p>
    </div>
    
    {/* Recent Activity */}
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Protection</h2>
      <div className="space-y-3">
        {threats.slice(0, 3).map((threat, index) => (
          <div key={threat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${threat.blocked ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="font-medium capitalize">{threat.type.replace('_', ' ')}</span>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(threat.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TeenPrivacy = ({ config }) => (
  <div className="space-y-6">
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Privacy Controls</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(config.features).map(([feature, setting]) => (
          <div key={feature} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">{feature.replace(/([A-Z])/g, ' $1')}</span>
              <span className="text-sm text-indigo-600 font-semibold capitalize">{setting}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Senior Dashboard (Ages 60+)
 */
const SeniorDashboard = ({ metrics, threats, config, activeTab, setActiveTab }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Large, Clear Header */}
      <div className="bg-white border-b-2 border-blue-200 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-blue-800">Security Guardian</h1>
                <p className="text-xl text-blue-600">Protecting you from scams and fraud</p>
              </div>
            </div>
            
            <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl text-xl font-bold flex items-center space-x-3">
              <Phone className="w-6 h-6" />
              <span>Call Family</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Large Status Display */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-3xl p-12 mb-8 border-4 border-green-300 text-center">
          <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-5xl font-bold text-green-800 mb-4">You Are Protected</h2>
          <p className="text-2xl text-green-600">
            We blocked {threats.filter(t => t.blocked).length} suspicious activities today
          </p>
        </div>
        
        {/* Simple Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 border-2 border-blue-200">
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {metrics?.threatsBlocked || 0}
              </div>
              <div className="text-2xl font-semibold text-blue-800">Scams Blocked</div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 border-2 border-green-200">
            <div className="text-center">
              <div className="text-6xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-2xl font-semibold text-green-800">Protection Level</div>
            </div>
          </div>
        </div>
        
        {/* Recent Alerts */}
        {threats.length > 0 && (
          <div className="bg-white rounded-2xl p-8 mt-8 border-2 border-yellow-200">
            <h3 className="text-3xl font-bold text-yellow-800 mb-6">Recent Alerts</h3>
            <div className="space-y-4">
              {threats.slice(0, 2).map((threat) => (
                <div key={threat.id} className="p-6 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                  <div className="flex items-center space-x-4">
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    <div>
                      <div className="text-xl font-semibold text-yellow-800 capitalize">
                        {threat.type.replace('_', ' ')} Blocked
                      </div>
                      <div className="text-lg text-yellow-600">
                        {new Date(threat.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Adult Dashboard (Ages 25-59)
 */
const AdultDashboard = ({ metrics, threats, config, activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'threats', label: 'Threats', icon: AlertTriangle },
    { id: 'neural', label: 'Neural Networks', icon: Brain },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PQShield Enterprise</h1>
                <p className="text-sm text-gray-600">Quantum-Resistant Security Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-800">Active</span>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Professional Tab Navigation */}
          <div className="flex space-x-1 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Professional Content */}
      <div className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <AdultOverview metrics={metrics} threats={threats} />
          )}
          {activeTab === 'neural' && (
            <NeuralNetworkMonitor metrics={metrics} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const AdultOverview = ({ metrics, threats }) => (
  <div className="space-y-6">
    {/* Key Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <MetricCard
        title="Threats Detected"
        value={metrics?.threatsDetected || 0}
        icon={<AlertTriangle className="w-6 h-6" />}
        color="text-red-600"
        bgColor="bg-red-50"
      />
      <MetricCard
        title="Threats Blocked"
        value={metrics?.threatsBlocked || 0}
        icon={<Shield className="w-6 h-6" />}
        color="text-green-600"
        bgColor="bg-green-50"
      />
      <MetricCard
        title="Accuracy Rate"
        value={`${(metrics?.accuracyRate || 99.5).toFixed(1)}%`}
        icon={<Brain className="w-6 h-6" />}
        color="text-blue-600"
        bgColor="bg-blue-50"
      />
      <MetricCard
        title="Avg Response"
        value={`${(metrics?.averageInferenceTime || 45).toFixed(0)}ms`}
        icon={<Zap className="w-6 h-6" />}
        color="text-purple-600"
        bgColor="bg-purple-50"
      />
    </div>
    
    {/* Threat Timeline */}
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Threat Activity</h2>
      <div className="space-y-3">
        {threats.slice(0, 5).map((threat) => (
          <div key={threat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${
                threat.blocked ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <div>
                <div className="font-medium capitalize">
                  {threat.type.replace('_', ' ')}
                </div>
                <div className="text-sm text-gray-500">
                  Severity: {(threat.severity * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                {threat.blocked ? 'Blocked' : 'Warned'}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(threat.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const NeuralNetworkMonitor = ({ metrics }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Neural Network Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <Brain className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">SNN</div>
          <div className="text-sm text-gray-600">Temporal Detection</div>
          <div className="text-lg font-semibold mt-2">23ms avg</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">ANN</div>
          <div className="text-sm text-gray-600">Classification</div>
          <div className="text-lg font-semibold mt-2">41ms avg</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <Lock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-600">QNN</div>
          <div className="text-sm text-gray-600">Quantum Bridge</div>
          <div className="text-lg font-semibold mt-2">67ms avg</div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Utility Components
 */
const StatCard = ({ icon, title, value, color, childFriendly }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className={`${color} text-white rounded-2xl p-6 ${childFriendly ? 'border-4 border-white' : ''}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-lg opacity-90">{title}</div>
      </div>
      <div className="opacity-80">{icon}</div>
    </div>
  </motion.div>
);

const MetricCard = ({ title, value, icon, color, bgColor }) => (
  <div className={`${bgColor} rounded-xl p-6 border border-gray-200`}>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
      </div>
      <div className={color}>{icon}</div>
    </div>
  </div>
);

export default AdaptiveSentinelDashboard;
