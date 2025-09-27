/**
 * Enhanced SNN/ANN Edge Security Dashboard
 * Integrated with Cloudflare Workers, Firebase, and real-time monitoring
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Progress } from './components/ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import { 
  Activity, AlertTriangle, CheckCircle, Cpu, Database, Network, Zap, 
  Shield, Globe, Cloud, Server, Smartphone, Monitor, Bell, Settings,
  TrendingUp, TrendingDown, Eye, EyeOff, Pause, Play, RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Enhanced hook for real-time edge data
const useEdgeSecurityData = () => {
  const [data, setData] = useState({
    edgeMetrics: {
      totalDevices: 1247,
      activeThreats: 23,
      blockedThreats: 156,
      edgeLatency: 0.8,
      cacheHitRate: 94.2,
      globalUptime: 99.97
    },
    neuralNetworks: {
      snnProcessingTime: 0.8,
      annAccuracy: 94.2,
      hybridPerformance: 97.4,
      modelVersion: 'v2.1.3',
      lastUpdate: Date.now() - 3600000
    },
    edgeLocations: [
      { region: 'US-East', devices: 342, latency: 0.7, threats: 8, status: 'healthy' },
      { region: 'US-West', devices: 298, latency: 0.9, threats: 5, status: 'healthy' },
      { region: 'Europe', devices: 267, latency: 1.1, threats: 6, status: 'warning' },
      { region: 'Asia-Pacific', devices: 340, latency: 0.6, threats: 4, status: 'healthy' }
    ],
    realtimeThreats: [
      { id: 1, type: 'DDoS Attack', severity: 'critical', source: '192.168.1.100', target: 'web-server-01', blocked: true, timestamp: Date.now() - 30000 },
      { id: 2, type: 'Malware C2', severity: 'high', source: '10.0.0.45', target: 'endpoint-23', blocked: true, timestamp: Date.now() - 120000 },
      { id: 3, type: 'Port Scan', severity: 'medium', source: '172.16.0.88', target: 'firewall-01', blocked: false, timestamp: Date.now() - 180000 },
      { id: 4, type: 'Phishing Attempt', severity: 'high', source: 'external', target: 'email-gateway', blocked: true, timestamp: Date.now() - 240000 }
    ],
    performanceHistory: Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() - (23 - i) * 3600000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      snnLatency: 0.5 + Math.random() * 0.8,
      annLatency: 1.0 + Math.random() * 1.0,
      hybridLatency: 0.3 + Math.random() * 0.4,
      threatsDetected: Math.floor(Math.random() * 50) + 10,
      threatsBlocked: Math.floor(Math.random() * 45) + 8
    }))
  })

  const [isMonitoring, setIsMonitoring] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('connected')
  const wsRef = useRef(null)

  // Simulate real-time updates from Cloudflare Workers
  useEffect(() => {
    if (!isMonitoring) return

    const connectWebSocket = () => {
      // Simulate WebSocket connection to Cloudflare Workers
      wsRef.current = {
        send: (data) => console.log('WS Send:', data),
        close: () => console.log('WS Closed'),
        readyState: 1
      }
      setConnectionStatus('connected')

      const interval = setInterval(() => {
        setData(prev => ({
          ...prev,
          edgeMetrics: {
            ...prev.edgeMetrics,
            activeThreats: Math.max(0, prev.edgeMetrics.activeThreats + (Math.random() > 0.7 ? 1 : -1)),
            blockedThreats: prev.edgeMetrics.blockedThreats + (Math.random() > 0.8 ? 1 : 0),
            edgeLatency: Math.max(0.3, Math.min(2.0, prev.edgeMetrics.edgeLatency + (Math.random() - 0.5) * 0.2)),
            cacheHitRate: Math.max(85, Math.min(99, prev.edgeMetrics.cacheHitRate + (Math.random() - 0.5) * 2))
          },
          neuralNetworks: {
            ...prev.neuralNetworks,
            snnProcessingTime: Math.max(0.3, Math.min(2.0, prev.neuralNetworks.snnProcessingTime + (Math.random() - 0.5) * 0.1)),
            annAccuracy: Math.max(90, Math.min(99, prev.neuralNetworks.annAccuracy + (Math.random() - 0.5) * 1)),
            hybridPerformance: Math.max(95, Math.min(99.5, prev.neuralNetworks.hybridPerformance + (Math.random() - 0.5) * 0.5))
          }
        }))
      }, 3000)

      return () => clearInterval(interval)
    }

    const cleanup = connectWebSocket()
    return cleanup
  }, [isMonitoring])

  const toggleMonitoring = useCallback(() => {
    setIsMonitoring(prev => !prev)
    if (wsRef.current && !isMonitoring) {
      wsRef.current.close()
      setConnectionStatus('disconnected')
    }
  }, [isMonitoring])

  return { data, isMonitoring, toggleMonitoring, connectionStatus }
}

// Edge Location Status Component
const EdgeLocationCard = ({ location }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-600'
      case 'warning': return 'bg-yellow-600'
      case 'critical': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-400" />
      default: return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white">{location.region}</h3>
        </div>
        {getStatusIcon(location.status)}
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-400">Devices</p>
          <p className="text-white font-mono">{location.devices.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-400">Latency</p>
          <p className="text-white font-mono">{location.latency.toFixed(1)}ms</p>
        </div>
        <div>
          <p className="text-gray-400">Active Threats</p>
          <p className="text-white font-mono">{location.threats}</p>
        </div>
        <div>
          <p className="text-gray-400">Status</p>
          <Badge className={`${getStatusColor(location.status)} text-xs`}>
            {location.status.toUpperCase()}
          </Badge>
        </div>
      </div>
    </motion.div>
  )
}

// Real-time Threat Feed Component
const ThreatFeedCard = ({ threat }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/20 border-red-500/30'
      case 'high': return 'text-orange-400 bg-orange-900/20 border-orange-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30'
      case 'low': return 'text-blue-400 bg-blue-900/20 border-blue-500/30'
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30'
    }
  }

  const timeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-3 rounded-lg border ${getSeverityColor(threat.severity)} mb-2`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4" />
          <span className="font-medium text-sm">{threat.type}</span>
        </div>
        <div className="flex items-center space-x-2">
          {threat.blocked ? (
            <Badge className="bg-green-600 text-xs">BLOCKED</Badge>
          ) : (
            <Badge className="bg-yellow-600 text-xs">MONITORING</Badge>
          )}
          <span className="text-xs text-gray-400">{timeAgo(threat.timestamp)}</span>
        </div>
      </div>
      
      <div className="text-xs text-gray-300 space-y-1">
        <div>Source: <span className="font-mono text-purple-300">{threat.source}</span></div>
        <div>Target: <span className="font-mono text-blue-300">{threat.target}</span></div>
      </div>
    </motion.div>
  )
}

// Neural Network Performance Component
const NeuralNetworkMetrics = ({ networks }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 rounded-lg bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/30">
        <div className="flex items-center space-x-2 mb-3">
          <Zap className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white">SNN Processing</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Latency</span>
            <span className="text-white font-mono">{networks.snnProcessingTime.toFixed(1)}ms</span>
          </div>
          <Progress value={(2 - networks.snnProcessingTime) * 50} className="h-2" />
          <div className="text-xs text-gray-400">Target: &lt;1.0ms</div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 border border-cyan-500/30">
        <div className="flex items-center space-x-2 mb-3">
          <Database className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-white">ANN Accuracy</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Accuracy</span>
            <span className="text-white font-mono">{networks.annAccuracy.toFixed(1)}%</span>
          </div>
          <Progress value={networks.annAccuracy} className="h-2" />
          <div className="text-xs text-gray-400">Target: &gt;95%</div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-500/30">
        <div className="flex items-center space-x-2 mb-3">
          <Activity className="w-5 h-5 text-green-400" />
          <h3 className="font-semibold text-white">Hybrid Performance</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Combined</span>
            <span className="text-white font-mono">{networks.hybridPerformance.toFixed(1)}%</span>
          </div>
          <Progress value={networks.hybridPerformance} className="h-2" />
          <div className="text-xs text-gray-400">Target: &gt;97%</div>
        </div>
      </div>
    </div>
  )
}

// Main Edge Security Dashboard Component
const EdgeSecurityApp = () => {
  const { data, isMonitoring, toggleMonitoring, connectionStatus } = useEdgeSecurityData()
  const [activeTab, setActiveTab] = useState('overview')
  const [notifications, setNotifications] = useState([])

  // Simulate real-time notifications
  useEffect(() => {
    if (data.edgeMetrics.activeThreats > 20) {
      const newNotification = {
        id: Date.now(),
        type: 'warning',
        message: `High threat activity detected: ${data.edgeMetrics.activeThreats} active threats`,
        timestamp: Date.now()
      }
      setNotifications(prev => [newNotification, ...prev.slice(0, 4)])
    }
  }, [data.edgeMetrics.activeThreats])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-purple-800/30 backdrop-blur-sm bg-black/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: isMonitoring ? 360 : 0 }}
                transition={{ duration: 2, repeat: isMonitoring ? Infinity : 0, ease: "linear" }}
              >
                <Shield className="w-8 h-8 text-purple-400" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  SNN/ANN Edge Security
                </h1>
                <p className="text-sm text-gray-400">Global Neural Network Threat Detection</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm text-gray-400">
                  {connectionStatus === 'connected' ? 'Edge Connected' : 'Disconnected'}
                </span>
              </div>
              
              {/* Monitoring Status */}
              <Badge className={`${isMonitoring ? 'bg-green-600' : 'bg-yellow-600'}`}>
                <Activity className="w-3 h-3 mr-1" />
                {isMonitoring ? 'MONITORING' : 'PAUSED'}
              </Badge>
              
              {/* Control Button */}
              <Button
                onClick={toggleMonitoring}
                variant={isMonitoring ? "destructive" : "default"}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isMonitoring ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isMonitoring ? 'Pause' : 'Resume'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Bar */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-yellow-900/20 border-b border-yellow-500/30 px-6 py-2"
          >
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-300">{notifications[0]?.message}</span>
              <span className="text-xs text-gray-400">
                {new Date(notifications[0]?.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-black/30 border border-purple-800/30">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">
              <Monitor className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="edge-locations" className="data-[state=active]:bg-purple-600">
              <Globe className="w-4 h-4 mr-2" />
              Edge Locations
            </TabsTrigger>
            <TabsTrigger value="neural-networks" className="data-[state=active]:bg-purple-600">
              <Zap className="w-4 h-4 mr-2" />
              Neural Networks
            </TabsTrigger>
            <TabsTrigger value="threat-feed" className="data-[state=active]:bg-purple-600">
              <Shield className="w-4 h-4 mr-2" />
              Threat Feed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-black/40 border-purple-800/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Protected Devices</p>
                      <p className="text-2xl font-bold text-white">{data.edgeMetrics.totalDevices.toLocaleString()}</p>
                    </div>
                    <Server className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-green-400">+12% from last hour</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-800/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Active Threats</p>
                      <p className="text-2xl font-bold text-orange-400">{data.edgeMetrics.activeThreats}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-400" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <TrendingDown className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-green-400">-8% from last hour</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-800/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Edge Latency</p>
                      <p className="text-2xl font-bold text-purple-400">{data.edgeMetrics.edgeLatency.toFixed(1)}ms</p>
                    </div>
                    <Zap className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-gray-400">Target: &lt;1.0ms</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-800/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Cache Hit Rate</p>
                      <p className="text-2xl font-bold text-green-400">{data.edgeMetrics.cacheHitRate.toFixed(1)}%</p>
                    </div>
                    <Database className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-green-400">Optimal performance</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart */}
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white">Real-time Edge Performance</CardTitle>
                <CardDescription className="text-gray-400">
                  Neural network processing latency across global edge locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.performanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #6B7280',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line type="monotone" dataKey="snnLatency" stroke="#8B5CF6" strokeWidth={2} name="SNN (ms)" />
                    <Line type="monotone" dataKey="annLatency" stroke="#06B6D4" strokeWidth={2} name="ANN (ms)" />
                    <Line type="monotone" dataKey="hybridLatency" stroke="#10B981" strokeWidth={2} name="Hybrid (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Neural Network Metrics */}
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white">Neural Network Performance</CardTitle>
                <CardDescription className="text-gray-400">
                  Real-time SNN/ANN hybrid processing metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NeuralNetworkMetrics networks={data.neuralNetworks} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edge-locations" className="space-y-6">
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white">Global Edge Locations</CardTitle>
                <CardDescription className="text-gray-400">
                  Cloudflare edge computing nodes with SNN/ANN processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {data.edgeLocations.map((location, index) => (
                    <EdgeLocationCard key={index} location={location} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="neural-networks" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-black/40 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="text-white">Model Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Model Version</span>
                    <span className="text-white font-mono">{data.neuralNetworks.modelVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Update</span>
                    <span className="text-white">{new Date(data.neuralNetworks.lastUpdate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">SNN Architecture</span>
                    <span className="text-white">Leaky Integrate-and-Fire</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ANN Architecture</span>
                    <span className="text-white">Deep Convolutional</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="text-white">Processing Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-900/20">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">1</div>
                      <div>
                        <p className="text-white font-medium">Packet Capture</p>
                        <p className="text-gray-400 text-sm">Real-time network traffic ingestion</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-cyan-900/20">
                      <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-sm font-bold">2</div>
                      <div>
                        <p className="text-white font-medium">SNN Processing</p>
                        <p className="text-gray-400 text-sm">Spike-based anomaly detection</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-900/20">
                      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold">3</div>
                      <div>
                        <p className="text-white font-medium">ANN Classification</p>
                        <p className="text-gray-400 text-sm">Deep learning threat analysis</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-orange-900/20">
                      <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-sm font-bold">4</div>
                      <div>
                        <p className="text-white font-medium">Hybrid Decision</p>
                        <p className="text-gray-400 text-sm">Combined threat response</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="threat-feed" className="space-y-6">
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white">Real-time Threat Feed</CardTitle>
                <CardDescription className="text-gray-400">
                  Live security events detected by the SNN/ANN system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.realtimeThreats.map(threat => (
                    <ThreatFeedCard key={threat.id} threat={threat} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default EdgeSecurityApp
