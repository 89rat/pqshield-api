/**
 * Enhanced Security Dashboard for PQ359 API
 * Real-time vulnerability scanning with neural network analysis
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Brain, 
  Zap, 
  Code, 
  Upload,
  Download,
  Scan,
  TrendingUp,
  Clock,
  Database,
  Lock,
  Unlock,
  Eye,
  AlertCircle,
  Activity,
  BarChart3,
  FileText,
  Settings
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const EnhancedSecurityDashboard = () => {
  const [scanResults, setScanResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [realTimeThreats, setRealTimeThreats] = useState([]);
  const [threatStats, setThreatStats] = useState([]);
  const [complianceData, setComplianceData] = useState(null);
  const [quantumThreats, setQuantumThreats] = useState([]);
  const [activeTab, setActiveTab] = useState('scanner');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

  // Real-time threat monitoring
  useEffect(() => {
    const fetchRealTimeThreats = async () => {
      try {
        const response = await fetch('/api/monitor/threats');
        if (response.ok) {
          const data = await response.json();
          setRealTimeThreats(data.recentThreats || []);
          setThreatStats(data.statistics || []);
        }
      } catch (error) {
        console.error('Failed to fetch real-time threats:', error);
      }
    };

    fetchRealTimeThreats();
    const interval = setInterval(fetchRealTimeThreats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Enhanced code scanning with neural network analysis
  const handleScan = useCallback(async () => {
    if (!codeInput.trim()) return;

    setIsScanning(true);
    try {
      const response = await fetch('/api/scan/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: codeInput,
          filePath: 'user-input.js',
          options: {
            enableNeuralAnalysis: true,
            quantumThreatAssessment: true
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setScanResults(data);
        
        // Fetch compliance assessment
        const complianceResponse = await fetch('/api/assess/compliance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            framework: 'OWASP',
            scanResults: data.scan
          }),
        });

        if (complianceResponse.ok) {
          const complianceData = await complianceResponse.json();
          setComplianceData(complianceData);
        }

        // Extract quantum threats
        if (data.scan.quantumThreats) {
          setQuantumThreats(data.scan.quantumThreats);
        }
      }
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  }, [codeInput]);

  // File upload handling
  const handleFileUpload = useCallback(async (event) => {
    const files = Array.from(event.target.files);
    const fileContents = [];

    for (const file of files) {
      const content = await file.text();
      fileContents.push({
        path: file.name,
        content: content,
        size: file.size
      });
    }

    setUploadedFiles(fileContents);

    // Batch scan uploaded files
    if (fileContents.length > 0) {
      setIsScanning(true);
      try {
        const response = await fetch('/api/scan/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files: fileContents,
            options: {
              enableNeuralAnalysis: true,
              quantumThreatAssessment: true
            }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setScanResults(data);
        }
      } catch (error) {
        console.error('Batch scan failed:', error);
      } finally {
        setIsScanning(false);
      }
    }
  }, []);

  // Severity color mapping
  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#d97706',
      low: '#65a30d',
      info: '#0891b2'
    };
    return colors[severity] || '#6b7280';
  };

  // Security score color
  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    if (score >= 50) return '#ef4444';
    return '#dc2626';
  };

  // Render vulnerability card
  const VulnerabilityCard = ({ vulnerability }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle 
            className="w-5 h-5" 
            style={{ color: getSeverityColor(vulnerability.severity) }}
          />
          <div>
            <h4 className="font-semibold text-gray-900">{vulnerability.type}</h4>
            <p className="text-sm text-gray-600">{vulnerability.description}</p>
          </div>
        </div>
        <span 
          className="px-2 py-1 rounded text-xs font-medium text-white"
          style={{ backgroundColor: getSeverityColor(vulnerability.severity) }}
        >
          {vulnerability.severity.toUpperCase()}
        </span>
      </div>
      
      <div className="mt-3 space-y-2">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>Line: {vulnerability.line}</span>
          <span>CWE: {vulnerability.cwe}</span>
          {vulnerability.quantumThreat && (
            <span className="flex items-center space-x-1 text-purple-600">
              <Lock className="w-3 h-3" />
              <span>Quantum Threat</span>
            </span>
          )}
        </div>
        
        {vulnerability.evidence && (
          <div className="bg-gray-50 rounded p-2">
            <code className="text-xs text-gray-700">{vulnerability.evidence}</code>
          </div>
        )}
      </div>
    </div>
  );

  // Render neural analysis
  const NeuralAnalysisCard = ({ analysis }) => (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
      <div className="flex items-center space-x-3 mb-4">
        <Brain className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Neural Network Analysis</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {(analysis.anomalyScore * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Anomaly Score</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {analysis.threatClassification}
          </div>
          <div className="text-sm text-gray-600">Threat Type</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {(analysis.confidence * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Confidence</div>
        </div>
      </div>
    </div>
  );

  // Render quantum threats
  const QuantumThreatsCard = ({ threats }) => (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
      <div className="flex items-center space-x-3 mb-4">
        <Lock className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Quantum Threats</h3>
      </div>
      
      {threats.length === 0 ? (
        <div className="text-center py-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <p className="text-gray-600">No quantum vulnerabilities detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threats.map((threat, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{threat.algorithm}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  threat.risk === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {threat.risk.toUpperCase()} RISK
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{threat.recommendation}</p>
              
              {threat.quantumResistantAlternatives && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Alternatives: </span>
                  <span className="text-blue-600">
                    {threat.quantumResistantAlternatives.join(', ')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render compliance dashboard
  const ComplianceCard = ({ compliance }) => (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center space-x-3 mb-4">
        <Shield className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Compliance Status</h3>
      </div>
      
      {compliance && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">{compliance.compliance.framework}</span>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold" style={{ color: getScoreColor(compliance.compliance.score) }}>
                {compliance.compliance.score}%
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                compliance.compliance.status === 'compliant' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {compliance.compliance.status.toUpperCase()}
              </span>
            </div>
          </div>
          
          {compliance.compliance.details && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(compliance.compliance.details).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  {value ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-gray-700">{key.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render real-time threats
  const RealTimeThreatsCard = () => (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center space-x-3 mb-4">
        <Activity className="w-6 h-6 text-red-600" />
        <h3 className="text-lg font-semibold text-gray-900">Real-Time Threats</h3>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {realTimeThreats.length === 0 ? (
          <div className="text-center py-4">
            <Shield className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600">No active threats detected</p>
          </div>
        ) : (
          realTimeThreats.map((threat, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{threat.vulnerability_type}</div>
                <div className="text-sm text-gray-600">{threat.file_path}</div>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(threat.detected_at).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">PQ359 Security Scanner</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Activity className="w-4 h-4" />
                <span>Real-time Protection Active</span>
              </div>
              
              {scanResults && (
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getScoreColor(scanResults.scan?.securityScore || 0) }}
                  />
                  <span className="text-sm font-medium">
                    Score: {scanResults.scan?.securityScore || 0}/100
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'scanner', label: 'Code Scanner', icon: Scan },
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'threats', label: 'Live Threats', icon: Activity },
              { id: 'compliance', label: 'Compliance', icon: Shield },
              { id: 'quantum', label: 'Quantum Security', icon: Lock }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            {/* Code Input Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Security Code Scanner</h2>
                <div className="flex items-center space-x-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.php"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Files</span>
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <textarea
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Paste your code here for security analysis..."
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {uploadedFiles.length > 0 && (
                      <span>{uploadedFiles.length} files uploaded</span>
                    )}
                  </div>
                  
                  <button
                    onClick={handleScan}
                    disabled={isScanning || (!codeInput.trim() && uploadedFiles.length === 0)}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isScanning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Scanning...</span>
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4" />
                        <span>Scan Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Scan Results */}
            {scanResults && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-8 h-8 text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {scanResults.scan?.securityScore || 0}
                        </div>
                        <div className="text-sm text-gray-600">Security Score</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {scanResults.scan?.vulnerabilities?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Vulnerabilities</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Brain className="w-8 h-8 text-purple-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {scanResults.scan?.neuralAnalysis ? 
                            (scanResults.scan.neuralAnalysis.anomalyScore * 100).toFixed(0) + '%' : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">AI Anomaly</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-8 h-8 text-green-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {scanResults.processingTime?.toFixed(0) || 0}ms
                        </div>
                        <div className="text-sm text-gray-600">Scan Time</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Neural Analysis */}
                {scanResults.scan?.neuralAnalysis && (
                  <NeuralAnalysisCard analysis={scanResults.scan.neuralAnalysis} />
                )}

                {/* Vulnerabilities */}
                {scanResults.scan?.vulnerabilities && scanResults.scan.vulnerabilities.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Detected Vulnerabilities ({scanResults.scan.vulnerabilities.length})
                    </h3>
                    <div className="space-y-4">
                      {scanResults.scan.vulnerabilities.map((vuln, index) => (
                        <VulnerabilityCard key={index} vulnerability={vuln} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantum Threats */}
                {quantumThreats.length > 0 && (
                  <QuantumThreatsCard threats={quantumThreats} />
                )}

                {/* Recommendations */}
                {scanResults.recommendations && scanResults.recommendations.length > 0 && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Recommendations</h3>
                    <div className="space-y-4">
                      {scanResults.recommendations.map((rec, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{rec.description}</p>
                          {rec.actions && (
                            <div className="mt-2 space-y-1">
                              {rec.actions.map((action, actionIndex) => (
                                <div key={actionIndex} className="text-sm text-blue-600">
                                  • {action.fix || action.type}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'threats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RealTimeThreatsCard />
            
            {/* Threat Statistics */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Threat Statistics (24h)</h3>
              {threatStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={threatStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="severity" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No threat data available
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {complianceData ? (
              <ComplianceCard compliance={complianceData} />
            ) : (
              <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Run a security scan to see compliance status</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'quantum' && (
          <div className="space-y-6">
            {quantumThreats.length > 0 ? (
              <QuantumThreatsCard threats={quantumThreats} />
            ) : (
              <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                <Lock className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No quantum vulnerabilities detected</p>
                <p className="text-sm text-gray-500 mt-2">Your code appears to be quantum-resistant</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSecurityDashboard;
