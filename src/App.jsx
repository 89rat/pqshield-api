import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Progress } from './components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Shield, Activity, Cpu, Zap, Brain, Network, AlertTriangle, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import './App.css'

// Custom hooks for clean separation of concerns
const useRealTimeData = () => {
  const [metrics, setMetrics] = useState({
    totalThreats: 127,
    blockedThreats: 124,
    snnProcessingTime: 0.8,
    annAccuracy: 94.2,
    systemUptime: 99.9
  })

  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setMetrics(prev => ({
        totalThreats: prev.totalThreats + Math.floor(Math.random() * 3),
        blockedThreats: prev.blockedThreats + Math.floor(Math.random() * 2),
        snnProcessingTime: Math.max(0.3, prev.snnProcessingTime + (Math.random() - 0.5) * 0.2),
        annAccuracy: Math.min(99.9, Math.max(90, prev.annAccuracy + (Math.random() - 0.5) * 2)),
        systemUptime: Math.min(99.9, Math.max(95, prev.systemUptime + (Math.random() - 0.5) * 0.1))
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [isActive])

  return { metrics, isActive, setIsActive }
}

// Static data for charts
const THREAT_DETECTION_DATA = [
  { time: '00:00', detected: 12, blocked: 11 },
  { time: '04:00', detected: 8, blocked: 8 },
  { time: '08:00', detected: 15, blocked: 14 },
  { time: '12:00', detected: 23, blocked: 22 },
  { time: '16:00', detected: 18, blocked: 17 },
  { time: '20:00', detected: 14, blocked: 13 },
  { time: '24:00', detected: 11, blocked: 10 }
]

const NEURAL_PERFORMANCE_DATA = [
  { time: '00:00', snn: 98.2, ann: 94.1, hybrid: 97.1 },
  { time: '04:00', snn: 97.8, ann: 93.8, hybrid: 96.9 },
  { time: '08:00', snn: 98.5, ann: 94.9, hybrid: 97.4 },
  { time: '12:00', snn: 98.1, ann: 94.2, hybrid: 97.0 },
  { time: '16:00', snn: 98.7, ann: 95.1, hybrid: 97.6 },
  { time: '20:00', snn: 98.3, ann: 94.5, hybrid: 97.2 },
  { time: '24:00', snn: 98.9, ann: 95.3, hybrid: 97.8 }
]

const SYSTEM_COMPONENTS = [
  { name: 'SNN Anomaly Detector', load: 67, status: 'active', type: 'neural' },
  { name: 'ANN Threat Classifier', load: 82, status: 'active', type: 'neural' },
  { name: 'Edge Security Gateway', load: 45, status: 'active', type: 'gateway' },
  { name: 'Threat Mitigation Engine', load: 34, status: 'active', type: 'security' },
  { name: 'Packet Capture Service', load: 78, status: 'active', type: 'data' },
  { name: 'Neural Network Trainer', load: 23, status: 'active', type: 'ai' }
]

const RECENT_THREATS = [
  { id: 1, type: 'Malware C2 Communication', severity: 'critical', status: 'blocked', time: '2 min ago' },
  { id: 2, type: 'DDoS Attack Pattern', severity: 'high', status: 'monitoring', time: '5 min ago' },
  { id: 3, type: 'Suspicious Data Exfiltration', severity: 'medium', status: 'investigating', time: '8 min ago' },
  { id: 4, type: 'Botnet Traffic Signature', severity: 'low', status: 'blocked', time: '12 min ago' }
]

// Component for metric cards
const MetricCard = ({ title, value, change, icon: Icon, color = "blue" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="bg-black/40 border-purple-800/30 backdrop-blur-sm hover:bg-black/50 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-400`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {change && (
          <p className="text-xs text-green-400">{change}</p>
        )}
      </CardContent>
    </Card>
  </motion.div>
)

// Component for system components
const ComponentCard = ({ component }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-600'
      case 'warning': return 'bg-yellow-600'
      case 'error': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-white text-sm">{component.name}</h3>
        <Badge className={`${getStatusColor(component.status)} text-xs`}>
          {component.status}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Load</span>
          <span className="text-white">{component.load}%</span>
        </div>
        <Progress value={component.load} className="h-1" />
      </div>
    </div>
  )
}

// Component for threat items
const ThreatItem = ({ threat }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'blocked': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'monitoring': return <Activity className="w-4 h-4 text-blue-400" />
      case 'investigating': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/10">
      <div className={`w-2 h-2 rounded-full ${getSeverityColor(threat.severity)}`}></div>
      <div className="flex-1">
        <p className="text-white text-sm">{threat.type}</p>
        <p className="text-gray-400 text-xs">{threat.time}</p>
      </div>
      <div className="flex items-center space-x-2">
        {getStatusIcon(threat.status)}
        <Badge variant="outline" className="text-xs">
          {threat.status}
        </Badge>
      </div>
    </div>
  )
}

// Main App Component
function App() {
  const { metrics, isActive, setIsActive } = useRealTimeData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-purple-800/30 backdrop-blur-sm bg-black/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Shield className="w-8 h-8 text-purple-400" />
                <motion.div
                  className="absolute inset-0 w-8 h-8 border-2 border-purple-400 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  SNN/ANN Edge Security
                </h1>
                <p className="text-sm text-gray-400">Real-time Neural Network Threat Detection</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={isActive ? "default" : "secondary"} className="bg-purple-600">
                <Activity className="w-3 h-3 mr-1" />
                {isActive ? 'MONITORING' : 'PAUSED'}
              </Badge>
              <Button
                onClick={() => setIsActive(!isActive)}
                variant={isActive ? "destructive" : "default"}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isActive ? 'Pause' : 'Resume'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-black/30 border border-purple-800/30">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600">
              <Activity className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="architecture" className="data-[state=active]:bg-purple-600">
              <Network className="w-4 h-4 mr-2" />
              Architecture
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">
              <Brain className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Threats"
                value={metrics.totalThreats}
                change="+12% from yesterday"
                icon={Shield}
                color="red"
              />
              <MetricCard
                title="Blocked Threats"
                value={metrics.blockedThreats}
                change="+8% effectiveness"
                icon={CheckCircle}
                color="green"
              />
              <MetricCard
                title="SNN Processing"
                value={`${metrics.snnProcessingTime.toFixed(1)}ms`}
                change="Ultra-fast response"
                icon={Zap}
                color="purple"
              />
              <MetricCard
                title="ANN Accuracy"
                value={`${metrics.annAccuracy.toFixed(1)}%`}
                change="High precision"
                icon={Brain}
                color="cyan"
              />
            </div>

            {/* Threat Detection Chart */}
            <Card className="bg-black/40 border-purple-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Real-time Threat Detection</CardTitle>
                <CardDescription className="text-gray-400">
                  SNN/ANN hybrid processing performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={THREAT_DETECTION_DATA}>
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
                    <Area 
                      type="monotone" 
                      dataKey="detected" 
                      stackId="1" 
                      stroke="#8B5CF6" 
                      fill="#8B5CF6" 
                      fillOpacity={0.6}
                      name="Threats Detected"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="blocked" 
                      stackId="1" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.8}
                      name="Threats Blocked"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* System Status and Recent Threats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-black/40 border-purple-800/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">System Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">SNN Processing</span>
                      <span className="text-purple-400">{metrics.snnProcessingTime.toFixed(1)}ms</span>
                    </div>
                    <Progress value={100 - metrics.snnProcessingTime * 10} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">ANN Accuracy</span>
                      <span className="text-cyan-400">{metrics.annAccuracy.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.annAccuracy} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">System Uptime</span>
                      <span className="text-green-400">{metrics.systemUptime.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.systemUptime} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-800/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Recent Threats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {RECENT_THREATS.map((threat) => (
                      <ThreatItem key={threat.id} threat={threat} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Architecture Tab */}
          <TabsContent value="architecture" className="space-y-6">
            <Card className="bg-black/40 border-purple-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">System Architecture</CardTitle>
                <CardDescription className="text-gray-400">
                  SNN/ANN hybrid neural network components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SYSTEM_COMPONENTS.map((component, index) => (
                    <motion.div
                      key={component.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ComponentCard component={component} />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Flow */}
            <Card className="bg-black/40 border-purple-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Data Flow Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-white">Network Traffic → Packet Capture</span>
                  </div>
                  <div className="flex items-center space-x-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-white">Packet Capture → SNN Anomaly Detection</span>
                  </div>
                  <div className="flex items-center space-x-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-white">SNN Detection → ANN Classification</span>
                  </div>
                  <div className="flex items-center space-x-4 p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                    <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse"></div>
                    <span className="text-white">ANN Classification → Threat Mitigation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-black/40 border-purple-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Neural Network Performance</CardTitle>
                <CardDescription className="text-gray-400">
                  SNN vs ANN vs Hybrid processing accuracy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={NEURAL_PERFORMANCE_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" domain={[90, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #6B7280',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line type="monotone" dataKey="snn" stroke="#8B5CF6" strokeWidth={2} name="SNN Accuracy" />
                    <Line type="monotone" dataKey="ann" stroke="#06B6D4" strokeWidth={2} name="ANN Accuracy" />
                    <Line type="monotone" dataKey="hybrid" stroke="#10B981" strokeWidth={3} name="Hybrid Performance" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Technology Stack */}
            <Card className="bg-black/40 border-purple-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Technology Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <h3 className="font-medium text-white mb-2">Neural Networks</h3>
                    <p className="text-sm text-gray-300">snnTorch, PyTorch, TensorFlow Lite</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <h3 className="font-medium text-white mb-2">Edge Computing</h3>
                    <p className="text-sm text-gray-300">NVIDIA Jetson, Intel Movidius</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <h3 className="font-medium text-white mb-2">Security</h3>
                    <p className="text-sm text-gray-300">Deep Packet Inspection, Behavioral Analysis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App
