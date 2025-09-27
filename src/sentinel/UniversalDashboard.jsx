/**
 * Universal Sentinel Dashboard - Complete Protection Platform
 * Integrates SNN/ANN hybrid architecture for comprehensive threat detection
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, AlertTriangle, Heart, Brain, DollarSign, Users, 
  Activity, Zap, Globe, Phone, Settings, Bell, Eye, 
  TrendingUp, Clock, CheckCircle, XCircle, AlertCircle,
  Play, Pause, RotateCcw, Download, Share2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

import { SNNAdaptiveDetector } from './neural/SNNAdaptiveDetector';
import { ANNThreatClassifier } from './neural/ANNThreatClassifier';
import { MobileFraudProtection } from './financial/MobileFraudProtection';

export function UniversalDashboard() {
  const [protectionMode, setProtectionMode] = useState('auto');
  const [threats, setThreats] = useState([]);
  const [userProfile, setUserProfile] = useState({ type: 'standard', age: 25 });
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    snnLatency: 0.3,
    annAccuracy: 94.2,
    hybridPerformance: 97.4,
    threatsBlocked: 1247,
    moneySaved: 45230,
    childrenProtected: 89,
    scamsPrevented: 342,
    emergencyResponses: 12,
    communityReports: 3421,
    protectedDevices: 1247,
    totalDetections: 15847
  });
  
  const snnRef = useRef(null);
  const annRef = useRef(null);
  const fraudProtectionRef = useRef(null);
  
  useEffect(() => {
    // Initialize neural networks
    snnRef.current = new SNNAdaptiveDetector();
    annRef.current = new ANNThreatClassifier();
    fraudProtectionRef.current = new MobileFraudProtection();
    
    // Start real-time monitoring
    const monitor = setInterval(monitorThreats, 2000); // 2-second updates
    const metricsUpdate = setInterval(updateMetrics, 5000); // 5-second metrics update
    
    return () => {
      clearInterval(monitor);
      clearInterval(metricsUpdate);
    };
  }, []);
  
  const protectionModes = [
    {
      id: 'child',
      name: 'Child Safety',
      icon: <Heart className="w-6 h-6" />,
      color: 'from-pink-500 to-rose-500',
      features: ['Content Filter', 'Grooming Detection', 'Parental Alerts', 'Screen Time Monitor'],
      stats: { protected: realTimeMetrics.childrenProtected, blocked: 234 }
    },
    {
      id: 'financial',
      name: 'Financial Guard Pro',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      features: ['Mobile-Optimized SNN Detection (0.3ms)', 'Advanced Phishing Protection', 'Real-time Transaction Monitor', 'Continuous Learning AI', 'Investment Scam Detection', 'Romance Scam Prevention'],
      stats: { 
        protected: `$${realTimeMetrics.moneySaved.toLocaleString()}`, 
        blocked: realTimeMetrics.scamsPrevented,
        accuracy: fraudProtectionRef.current?.getProtectionStats().accuracy || 0.942,
        responseTime: fraudProtectionRef.current?.getProtectionStats().responseTime || 0.3
      }
    },
    {
      id: 'social',
      name: 'Social Shield',
      icon: <Users className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      features: ['Manipulation Detection', 'Dating Safety', 'Harassment Block', 'Privacy Guard'],
      stats: { protected: 567, blocked: 123 }
    },
    {
      id: 'health',
      name: 'Health Sentinel',
      icon: <Brain className="w-6 h-6" />,
      color: 'from-purple-500 to-violet-500',
      features: ['Misinformation Filter', 'Crisis Detection', 'Wellness Monitor', 'Medical Verification'],
      stats: { protected: 892, blocked: 67 }
    },
  ];
  
  const emergencyContacts = [
    { name: 'Emergency Services', number: '911', type: 'emergency' },
    { name: 'Crisis Hotline', number: '988', type: 'crisis' },
    { name: 'Child Safety', number: '1-800-THE-LOST', type: 'child' },
    { name: 'Fraud Reporting', number: '1-877-FTC-HELP', type: 'financial' }
  ];
  
  async function monitorThreats() {
    if (!isMonitoring || !snnRef.current || !annRef.current) return;
    
    try {
      // Simulate real-time threat detection
      const contexts = [
        { type: 'conversation', content: generateSimulatedInput('conversation') },
        { type: 'transaction', content: generateSimulatedInput('transaction') },
        { type: 'browsing', content: generateSimulatedInput('browsing') },
        { type: 'social_media', content: generateSimulatedInput('social_media') }
      ];
      
      for (const context of contexts) {
        // SNN rapid detection (0.3ms target)
        const snnResult = await snnRef.current.detectThreat(context.content, userProfile, context);
        
        if (snnResult.threatDetected && snnResult.confidence > 0.7) {
          // ANN deep classification for confirmed threats
          const annResult = await annRef.current.classifyThreat(context.content, snnResult, context);
          
          if (annResult.confidence > 0.8) {
            handleThreatDetection({
              ...annResult,
              snnResult,
              context: context.type,
              timestamp: Date.now()
            });
          }
        }
      }
    } catch (error) {
      console.error('Monitoring error:', error);
    }
  }
  
  function generateSimulatedInput(type) {
    const simulations = {
      conversation: [
        'Hey, you seem really mature for your age. Want to chat privately?',
        'I can help you make money fast, just send me your bank details',
        'You look amazing in your photos. Where do you go to school?',
        'This is urgent! Your account will be closed unless you verify now!'
      ],
      transaction: [
        'URGENT: Your account has been compromised. Click here to verify.',
        'Congratulations! You have won $10,000. Pay processing fee to claim.',
        'IRS Notice: You owe back taxes. Pay immediately to avoid arrest.',
        'Your grandson is in jail and needs bail money right now!'
      ],
      browsing: [
        'Download this miracle cure that doctors do not want you to know about',
        'Free antivirus scan detected 47 viruses on your computer',
        'Single moms in your area want to meet you tonight',
        'This one weird trick will make you rich overnight'
      ],
      social_media: [
        'Share this post or something bad will happen to your family',
        'This vaccine contains microchips to control your mind',
        'The government is hiding the truth about this pandemic',
        'Like and share to save this dying child'
      ]
    };
    
    const options = simulations[type] || simulations.conversation;
    return options[Math.floor(Math.random() * options.length)];
  }
  
  function handleThreatDetection(threat) {
    const newThreat = {
      id: crypto.randomUUID(),
      ...threat,
      severity: calculateSeverity(threat),
      blocked: true,
      timestamp: Date.now()
    };
    
    // Handle emergency situations
    if (newThreat.emergency || newThreat.severity === 'emergency') {
      setEmergencyMode(true);
      // In real implementation, this would trigger emergency protocols
      console.log('EMERGENCY DETECTED:', newThreat);
    }
    
    setThreats(prev => [newThreat, ...prev.slice(0, 49)]); // Keep last 50 threats
    
    // Update protection statistics
    updateProtectionStats(newThreat);
  }
  
  function calculateSeverity(threat) {
    if (threat.emergency) return 'emergency';
    if (threat.confidence > 0.9) return 'critical';
    if (threat.confidence > 0.8) return 'high';
    if (threat.confidence > 0.6) return 'medium';
    return 'low';
  }
  
  function updateProtectionStats(threat) {
    setRealTimeMetrics(prev => ({
      ...prev,
      threatsBlocked: prev.threatsBlocked + 1,
      totalDetections: prev.totalDetections + 1,
      ...(threat.category === 'financial_protection' && {
        scamsPrevented: prev.scamsPrevented + 1,
        moneySaved: prev.moneySaved + Math.floor(Math.random() * 1000) + 100
      }),
      ...(threat.category === 'content_safety' && {
        childrenProtected: prev.childrenProtected + (Math.random() > 0.8 ? 1 : 0)
      }),
      ...(threat.emergency && {
        emergencyResponses: prev.emergencyResponses + 1
      })
    }));
  }
  
  function updateMetrics() {
    setRealTimeMetrics(prev => ({
      ...prev,
      snnLatency: Math.max(0.2, Math.min(1.2, prev.snnLatency + (Math.random() - 0.5) * 0.1)),
      annAccuracy: Math.max(90, Math.min(99, prev.annAccuracy + (Math.random() - 0.5) * 0.5)),
      hybridPerformance: Math.max(95, Math.min(99.5, prev.hybridPerformance + (Math.random() - 0.5) * 0.2))
    }));
  }
  
  const threatTrendData = [
    { time: '00:00', detected: 12, blocked: 11 },
    { time: '04:00', detected: 8, blocked: 8 },
    { time: '08:00', detected: 25, blocked: 23 },
    { time: '12:00', detected: 34, blocked: 32 },
    { time: '16:00', detected: 28, blocked: 26 },
    { time: '20:00', detected: 19, blocked: 18 },
  ];
  
  const protectionStats = [
    { name: 'Children Protected', value: realTimeMetrics.childrenProtected, color: '#ec4899' },
    { name: 'Scams Prevented', value: realTimeMetrics.scamsPrevented, color: '#10b981' },
    { name: 'Money Saved', value: `$${(realTimeMetrics.moneySaved / 1000).toFixed(0)}K`, color: '#3b82f6' },
    { name: 'Emergency Responses', value: realTimeMetrics.emergencyResponses, color: '#f59e0b' }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Emergency Mode Overlay */}
      <AnimatePresence>
        {emergencyMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-900/90 backdrop-blur z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-red-800 p-8 rounded-xl border border-red-600 max-w-md mx-4"
            >
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">Emergency Detected</h2>
                <p className="mb-6">Critical threat requiring immediate attention</p>
                
                <div className="space-y-3 mb-6">
                  {emergencyContacts.map(contact => (
                    <button
                      key={contact.number}
                      className="w-full p-3 bg-red-700 hover:bg-red-600 rounded-lg flex items-center justify-between"
                    >
                      <span>{contact.name}</span>
                      <span className="font-mono">{contact.number}</span>
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setEmergencyMode(false)}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  Acknowledge
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                animate={{ rotate: isMonitoring ? 360 : 0 }}
                transition={{ duration: 2, repeat: isMonitoring ? Infinity : 0, ease: "linear" }}
              >
                <Shield className="w-8 h-8 text-green-400" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold">Universal Sentinel</h1>
                <p className="text-sm text-gray-400">AI-Powered Protection Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Real-time Metrics */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                  <span>SNN: {realTimeMetrics.snnLatency.toFixed(1)}ms</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <span>ANN: {realTimeMetrics.annAccuracy.toFixed(1)}%</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  <span>Hybrid: {realTimeMetrics.hybridPerformance.toFixed(1)}%</span>
                </div>
              </div>
              
              {/* Control Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={isMonitoring ? "destructive" : "default"}
                  size="sm"
                  onClick={() => setIsMonitoring(!isMonitoring)}
                  className="flex items-center space-x-2"
                >
                  {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isMonitoring ? 'Pause' : 'Resume'}</span>
                </Button>
                
                <Badge variant={isMonitoring ? "default" : "secondary"}>
                  {isMonitoring ? 'MONITORING' : 'PAUSED'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800/50">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="protection">Protection Modes</TabsTrigger>
            <TabsTrigger value="threats">Threat Analysis</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
                  <Shield className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">{realTimeMetrics.threatsBlocked.toLocaleString()}</div>
                  <p className="text-xs text-gray-400">+12% from last hour</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Money Saved</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">${realTimeMetrics.moneySaved.toLocaleString()}</div>
                  <p className="text-xs text-gray-400">From prevented scams</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Protected Devices</CardTitle>
                  <Globe className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-400">{realTimeMetrics.protectedDevices.toLocaleString()}</div>
                  <p className="text-xs text-gray-400">Across all networks</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                  <Zap className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-400">{realTimeMetrics.snnLatency.toFixed(1)}ms</div>
                  <p className="text-xs text-gray-400">Average detection time</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Threat Detection Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <span>Real-time Threat Detection</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={threatTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="detected" 
                        stackId="1" 
                        stroke="#EF4444" 
                        fill="#EF4444" 
                        fillOpacity={0.3}
                        name="Detected"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="blocked" 
                        stackId="2" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.6}
                        name="Blocked"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {/* Protection Statistics */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span>Protection Impact</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {protectionStats.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">{stat.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold" style={{ color: stat.color }}>
                            {stat.value}
                          </span>
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: stat.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400 mb-2">Overall Protection Rate</div>
                    <Progress value={realTimeMetrics.hybridPerformance} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">
                      {realTimeMetrics.hybridPerformance.toFixed(1)}% effectiveness
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Threats */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <span>Recent Threat Activity</span>
                  </div>
                  <Badge variant="outline">{threats.length} Active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {threats.slice(0, 10).map(threat => (
                      <motion.div
                        key={threat.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`
                          p-4 rounded-lg border
                          ${threat.severity === 'emergency' 
                            ? 'bg-red-900/20 border-red-500' 
                            : threat.severity === 'critical'
                            ? 'bg-red-900/10 border-red-600'
                            : threat.severity === 'high'
                            ? 'bg-yellow-900/20 border-yellow-500'
                            : 'bg-blue-900/20 border-blue-500'}
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium">{threat.primaryThreat?.threatType || 'Unknown Threat'}</span>
                              <Badge 
                                variant={threat.blocked ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {threat.blocked ? 'Blocked' : 'Active'}
                              </Badge>
                              {threat.emergency && (
                                <Badge variant="destructive" className="text-xs animate-pulse">
                                  Emergency
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-400 mb-2">
                              Context: {threat.context} | Domain: {threat.category}
                            </div>
                            <div className="text-xs text-gray-500">
                              SNN: {(threat.snnResult?.confidence * 100 || 0).toFixed(1)}% | 
                              ANN: {(threat.confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 ml-4">
                            {new Date(threat.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {threats.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                      <p>No threats detected. System operating normally.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Protection Modes Tab */}
          <TabsContent value="protection" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {protectionModes.map(mode => (
                <motion.div
                  key={mode.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative overflow-hidden rounded-xl cursor-pointer
                    bg-gradient-to-br ${mode.color} p-6
                    ${protectionMode === mode.id ? 'ring-4 ring-white/50' : ''}
                  `}
                  onClick={() => setProtectionMode(mode.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-lg">
                      {mode.icon}
                    </div>
                    {protectionMode === mode.id && (
                      <Badge className="bg-white/30 text-white border-white/50">
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">{mode.name}</h3>
                  
                  <div className="space-y-2 mb-4">
                    {mode.features.map(feature => (
                      <div key={feature} className="text-sm opacity-90 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Protected: {mode.stats.protected}</span>
                      <span>Blocked: {mode.stats.blocked}</span>
                    </div>
                    {mode.id === 'financial' && (
                      <div className="flex items-center justify-between text-xs opacity-90">
                        <span>Accuracy: {((mode.stats.accuracy || 0.942) * 100).toFixed(1)}%</span>
                        <span>Response: {(mode.stats.responseTime || 0.3).toFixed(1)}ms</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
          
          {/* Other tabs */}
          <TabsContent value="threats">
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-xl font-semibold mb-2">Threat Analysis</h3>
              <p className="text-gray-400">Advanced threat analysis dashboard coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-blue-400" />
              <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-gray-400">Comprehensive analytics and reporting coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="emergency">
            <div className="space-y-6">
              <Card className="bg-red-900/20 border-red-600">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-red-400">
                    <Phone className="w-5 h-5" />
                    <span>Emergency Contacts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {emergencyContacts.map(contact => (
                      <button
                        key={contact.number}
                        className="p-4 bg-red-800/30 hover:bg-red-800/50 rounded-lg border border-red-600 flex items-center justify-between transition-colors"
                      >
                        <div className="text-left">
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-sm text-gray-400">{contact.type}</div>
                        </div>
                        <div className="font-mono text-lg">{contact.number}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle>Emergency Response Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-4xl font-bold text-red-400 mb-2">
                      {realTimeMetrics.emergencyResponses}
                    </div>
                    <p className="text-gray-400">Emergency responses this month</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
