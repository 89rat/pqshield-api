/**
 * Advanced Debugging and Monitoring Dashboard
 * Based on technical analysis recommendations for production readiness
 */

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Progress } from '../components/ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Activity, AlertTriangle, CheckCircle, Cpu, Database, Network, Zap, Bug, Monitor, Settings } from 'lucide-react'

// Advanced Monitoring Hook
const useSystemMonitoring = () => {
  const [metrics, setMetrics] = useState({
    performance: {
      cpuUsage: 45,
      memoryUsage: 67,
      networkLatency: 12,
      diskIO: 23,
      snnProcessingTime: 0.8,
      annInferenceTime: 1.2,
      hybridCoordination: 0.3
    },
    health: {
      snnDetector: 'healthy',
      annClassifier: 'healthy',
      edgeGateway: 'warning',
      packetCapture: 'healthy',
      threatMitigation: 'healthy',
      neuralTrainer: 'healthy'
    },
    errors: [],
    logs: [],
    traces: []
  })

  const [debugMode, setDebugMode] = useState(false)
  const [profiling, setProfiling] = useState(false)
  const wsRef = useRef(null)

  useEffect(() => {
    // Simulate WebSocket connection for real-time monitoring
    const connectWebSocket = () => {
      wsRef.current = {
        send: (data) => console.log('WS Send:', data),
        close: () => console.log('WS Closed'),
        readyState: 1
      }

      // Simulate real-time updates
      const interval = setInterval(() => {
        setMetrics(prev => ({
          ...prev,
          performance: {
            ...prev.performance,
            cpuUsage: Math.max(10, Math.min(90, prev.performance.cpuUsage + (Math.random() - 0.5) * 10)),
            memoryUsage: Math.max(20, Math.min(95, prev.performance.memoryUsage + (Math.random() - 0.5) * 5)),
            networkLatency: Math.max(1, Math.min(100, prev.performance.networkLatency + (Math.random() - 0.5) * 5)),
            snnProcessingTime: Math.max(0.3, Math.min(2.0, prev.performance.snnProcessingTime + (Math.random() - 0.5) * 0.2)),
            annInferenceTime: Math.max(0.5, Math.min(5.0, prev.performance.annInferenceTime + (Math.random() - 0.5) * 0.3))
          },
          logs: [
            ...prev.logs.slice(-49), // Keep last 49 logs
            {
              id: Date.now(),
              timestamp: new Date().toISOString(),
              level: Math.random() > 0.8 ? 'ERROR' : Math.random() > 0.6 ? 'WARN' : 'INFO',
              component: ['SNN', 'ANN', 'Gateway', 'Capture'][Math.floor(Math.random() * 4)],
              message: generateLogMessage()
            }
          ]
        }))
      }, 2000)

      return () => clearInterval(interval)
    }

    const cleanup = connectWebSocket()
    return cleanup
  }, [])

  const generateLogMessage = () => {
    const messages = [
      'Processed packet batch successfully',
      'SNN spike pattern detected',
      'ANN classification completed',
      'Threat mitigation activated',
      'Memory pool allocation optimized',
      'Circuit breaker triggered',
      'Load balancer adjusted',
      'Cache hit ratio improved'
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  return { metrics, debugMode, setDebugMode, profiling, setProfiling }
}

// Performance Profiler Component
const PerformanceProfiler = ({ metrics, profiling, setProfiling }) => {
  const [profileData, setProfileData] = useState([])

  useEffect(() => {
    if (profiling) {
      const interval = setInterval(() => {
        setProfileData(prev => [
          ...prev.slice(-29), // Keep last 29 points
          {
            timestamp: new Date().toLocaleTimeString(),
            snn: metrics.performance.snnProcessingTime,
            ann: metrics.performance.annInferenceTime,
            hybrid: metrics.performance.hybridCoordination,
            cpu: metrics.performance.cpuUsage,
            memory: metrics.performance.memoryUsage
          }
        ])
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [profiling, metrics])

  return (
    <Card className="bg-black/40 border-purple-800/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Performance Profiler</CardTitle>
          <Button
            onClick={() => setProfiling(!profiling)}
            variant={profiling ? "destructive" : "default"}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            {profiling ? 'Stop Profiling' : 'Start Profiling'}
          </Button>
        </div>
        <CardDescription className="text-gray-400">
          Real-time performance metrics and bottleneck detection
        </CardDescription>
      </CardHeader>
      <CardContent>
        {profiling && profileData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profileData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="timestamp" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #6B7280',
                  borderRadius: '8px'
                }} 
              />
              <Line type="monotone" dataKey="snn" stroke="#8B5CF6" strokeWidth={2} name="SNN (ms)" />
              <Line type="monotone" dataKey="ann" stroke="#06B6D4" strokeWidth={2} name="ANN (ms)" />
              <Line type="monotone" dataKey="hybrid" stroke="#10B981" strokeWidth={2} name="Hybrid (ms)" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Click "Start Profiling" to begin performance monitoring</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// System Health Monitor
const SystemHealthMonitor = ({ health }) => {
  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-600'
      case 'warning': return 'bg-yellow-600'
      case 'error': return 'bg-red-600'
      case 'degraded': return 'bg-orange-600'
      default: return 'bg-gray-600'
    }
  }

  const getHealthIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />
      default: return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <Card className="bg-black/40 border-purple-800/30">
      <CardHeader>
        <CardTitle className="text-white">System Health Monitor</CardTitle>
        <CardDescription className="text-gray-400">
          Real-time health status of all system components
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(health).map(([component, status]) => (
            <div key={component} className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white text-sm capitalize">
                  {component.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                {getHealthIcon(status)}
              </div>
              <Badge className={`${getHealthColor(status)} text-xs`}>
                {status.toUpperCase()}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Debug Console Component
const DebugConsole = ({ logs, debugMode }) => {
  const [filter, setFilter] = useState('ALL')
  const consoleRef = useRef(null)

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [logs])

  const filteredLogs = logs.filter(log => 
    filter === 'ALL' || log.level === filter
  )

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR': return 'text-red-400'
      case 'WARN': return 'text-yellow-400'
      case 'INFO': return 'text-blue-400'
      case 'DEBUG': return 'text-gray-400'
      default: return 'text-white'
    }
  }

  return (
    <Card className="bg-black/40 border-purple-800/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Debug Console</CardTitle>
          <div className="flex items-center space-x-2">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
            >
              <option value="ALL">All Logs</option>
              <option value="ERROR">Errors</option>
              <option value="WARN">Warnings</option>
              <option value="INFO">Info</option>
              <option value="DEBUG">Debug</option>
            </select>
            <Badge variant={debugMode ? "default" : "secondary"} className="bg-purple-600">
              {debugMode ? 'DEBUG ON' : 'DEBUG OFF'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={consoleRef}
          className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm"
        >
          {filteredLogs.map(log => (
            <div key={log.id} className="mb-1">
              <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className={`ml-2 font-bold ${getLevelColor(log.level)}`}>[{log.level}]</span>
              <span className="ml-2 text-purple-400">{log.component}:</span>
              <span className="ml-2 text-white">{log.message}</span>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="text-gray-500 text-center">No logs to display</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Resource Usage Monitor
const ResourceMonitor = ({ performance }) => {
  const resources = [
    { name: 'CPU Usage', value: performance.cpuUsage, unit: '%', icon: Cpu, color: 'text-blue-400' },
    { name: 'Memory Usage', value: performance.memoryUsage, unit: '%', icon: Database, color: 'text-green-400' },
    { name: 'Network Latency', value: performance.networkLatency, unit: 'ms', icon: Network, color: 'text-purple-400' },
    { name: 'Disk I/O', value: performance.diskIO, unit: '%', icon: Activity, color: 'text-yellow-400' }
  ]

  return (
    <Card className="bg-black/40 border-purple-800/30">
      <CardHeader>
        <CardTitle className="text-white">Resource Monitor</CardTitle>
        <CardDescription className="text-gray-400">
          System resource utilization and performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.map(resource => {
            const Icon = resource.icon
            return (
              <div key={resource.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${resource.color}`} />
                    <span className="text-white text-sm">{resource.name}</span>
                  </div>
                  <span className="text-white font-mono">
                    {resource.value.toFixed(1)}{resource.unit}
                  </span>
                </div>
                <Progress 
                  value={resource.value} 
                  className="h-2"
                  style={{
                    '--progress-background': resource.value > 80 ? '#ef4444' : 
                                           resource.value > 60 ? '#f59e0b' : '#10b981'
                  }}
                />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Neural Network Diagnostics
const NeuralDiagnostics = ({ performance }) => {
  const diagnostics = [
    {
      name: 'SNN Processing Time',
      value: performance.snnProcessingTime,
      unit: 'ms',
      threshold: 2.0,
      optimal: 1.0
    },
    {
      name: 'ANN Inference Time',
      value: performance.annInferenceTime,
      unit: 'ms',
      threshold: 5.0,
      optimal: 2.0
    },
    {
      name: 'Hybrid Coordination',
      value: performance.hybridCoordination,
      unit: 'ms',
      threshold: 1.0,
      optimal: 0.5
    }
  ]

  const getPerformanceStatus = (value, threshold, optimal) => {
    if (value <= optimal) return { status: 'excellent', color: 'text-green-400' }
    if (value <= threshold) return { status: 'good', color: 'text-yellow-400' }
    return { status: 'needs attention', color: 'text-red-400' }
  }

  return (
    <Card className="bg-black/40 border-purple-800/30">
      <CardHeader>
        <CardTitle className="text-white">Neural Network Diagnostics</CardTitle>
        <CardDescription className="text-gray-400">
          SNN/ANN performance analysis and optimization recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {diagnostics.map(metric => {
            const status = getPerformanceStatus(metric.value, metric.threshold, metric.optimal)
            return (
              <div key={metric.name} className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white text-sm">{metric.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-mono">
                      {metric.value.toFixed(2)}{metric.unit}
                    </span>
                    <Badge className={`text-xs ${status.color} bg-transparent border`}>
                      {status.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span>Optimal: ≤{metric.optimal}{metric.unit}</span>
                  <span>•</span>
                  <span>Threshold: ≤{metric.threshold}{metric.unit}</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Main Monitoring Dashboard Component
const MonitoringDashboard = () => {
  const { metrics, debugMode, setDebugMode, profiling, setProfiling } = useSystemMonitoring()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <header className="border-b border-purple-800/30 backdrop-blur-sm bg-black/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bug className="w-8 h-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Debug & Monitoring Console
                </h1>
                <p className="text-sm text-gray-400">Advanced system diagnostics and performance monitoring</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setDebugMode(!debugMode)}
                variant={debugMode ? "destructive" : "default"}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                {debugMode ? 'Disable Debug' : 'Enable Debug'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-black/30 border border-purple-800/30">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">
              <Monitor className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-purple-600">
              <Zap className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="data-[state=active]:bg-purple-600">
              <Activity className="w-4 h-4 mr-2" />
              Diagnostics
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-purple-600">
              <Bug className="w-4 h-4 mr-2" />
              Debug Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SystemHealthMonitor health={metrics.health} />
              <ResourceMonitor performance={metrics.performance} />
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceProfiler 
              metrics={metrics} 
              profiling={profiling} 
              setProfiling={setProfiling} 
            />
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-6">
            <NeuralDiagnostics performance={metrics.performance} />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <DebugConsole logs={metrics.logs} debugMode={debugMode} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default MonitoringDashboard
