-- Enhanced PQShield API Database Schema
-- Cloudflare D1 SQL Database for real-world security scanning with neural networks

-- Security scans table (main scan records)
CREATE TABLE security_scans (
  scan_id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  security_score INTEGER NOT NULL,
  vulnerability_count INTEGER DEFAULT 0,
  quantum_threat_count INTEGER DEFAULT 0,
  neural_anomaly_score REAL DEFAULT 0,
  processing_time_ms REAL NOT NULL,
  scan_timestamp INTEGER DEFAULT (unixepoch()),
  user_id TEXT,
  scan_type TEXT DEFAULT 'code', -- 'code', 'batch', 'realtime'
  created_at INTEGER DEFAULT (unixepoch())
);

-- Vulnerability detections table (individual vulnerabilities)
CREATE TABLE vulnerability_detections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_id TEXT NOT NULL,
  vulnerability_type TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low', 'info'
  cwe TEXT,
  line_number INTEGER,
  evidence TEXT,
  quantum_threat BOOLEAN DEFAULT FALSE,
  confidence_score REAL DEFAULT 0,
  detected_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (scan_id) REFERENCES security_scans(scan_id)
);

-- Batch scans table (batch processing records)
CREATE TABLE batch_scans (
  batch_id TEXT PRIMARY KEY,
  total_files INTEGER NOT NULL,
  scanned_files INTEGER NOT NULL,
  total_vulnerabilities INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  average_security_score REAL DEFAULT 0,
  processing_time_ms REAL NOT NULL,
  scan_timestamp INTEGER DEFAULT (unixepoch()),
  user_id TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Neural network analysis results
CREATE TABLE neural_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_id TEXT NOT NULL,
  snn_anomaly_score REAL NOT NULL,
  ann_threat_classification TEXT,
  confidence_score REAL NOT NULL,
  processing_time_ms REAL NOT NULL,
  model_version TEXT,
  analysis_timestamp INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (scan_id) REFERENCES security_scans(scan_id)
);

-- Quantum threat assessments
CREATE TABLE quantum_threats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_id TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  risk_level TEXT NOT NULL, -- 'high', 'medium', 'low'
  occurrences INTEGER DEFAULT 1,
  recommendation TEXT,
  quantum_resistant_alternatives TEXT, -- JSON array
  detected_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (scan_id) REFERENCES security_scans(scan_id)
);

-- Compliance assessments
CREATE TABLE compliance_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_id TEXT NOT NULL,
  framework TEXT NOT NULL, -- 'OWASP', 'NIST', 'ISO27001', 'PCI-DSS'
  compliance_score REAL NOT NULL,
  status TEXT NOT NULL, -- 'compliant', 'non-compliant', 'partial'
  details TEXT, -- JSON object with detailed results
  assessed_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (scan_id) REFERENCES security_scans(scan_id)
);

-- Real-time threat monitoring
CREATE TABLE threat_monitoring (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  threat_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  source_ip TEXT,
  target_system TEXT,
  description TEXT,
  mitigation_action TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'mitigated', 'false_positive'
  detected_at INTEGER DEFAULT (unixepoch()),
  resolved_at INTEGER
);

-- Threat intelligence feeds
CREATE TABLE threat_intelligence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cve_id TEXT,
  threat_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  affected_systems TEXT, -- JSON array
  mitigation TEXT,
  source TEXT, -- 'NVD', 'MITRE', 'internal'
  published_at INTEGER,
  updated_at INTEGER DEFAULT (unixepoch())
);

-- User sessions and authentication
CREATE TABLE user_sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT,
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'premium', 'enterprise'
  api_key_hash TEXT,
  permissions TEXT, -- JSON array
  rate_limit_remaining INTEGER DEFAULT 1000,
  rate_limit_reset INTEGER,
  last_activity INTEGER DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- API usage analytics
CREATE TABLE api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  response_code INTEGER,
  processing_time_ms REAL,
  request_size INTEGER,
  response_size INTEGER,
  timestamp INTEGER DEFAULT (unixepoch())
);

-- Neural network model versions
CREATE TABLE neural_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_type TEXT NOT NULL, -- 'snn', 'ann', 'hybrid'
  version TEXT NOT NULL,
  accuracy REAL,
  training_data_size INTEGER,
  model_size_bytes INTEGER,
  deployment_status TEXT DEFAULT 'pending', -- 'pending', 'deployed', 'deprecated'
  performance_metrics TEXT, -- JSON object
  deployed_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

-- System performance metrics
CREATE TABLE performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_type TEXT NOT NULL, -- 'scan_latency', 'neural_inference', 'api_response'
  value REAL NOT NULL,
  unit TEXT, -- 'ms', 'seconds', 'percentage'
  region TEXT, -- Cloudflare edge region
  timestamp INTEGER DEFAULT (unixepoch())
);

-- Security policies and rules
CREATE TABLE security_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_name TEXT NOT NULL,
  policy_type TEXT NOT NULL, -- 'vulnerability_threshold', 'quantum_migration', 'compliance'
  configuration TEXT, -- JSON object
  enabled BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 100,
  created_by TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Incident response and alerts
CREATE TABLE security_incidents (
  incident_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
  status TEXT DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'false_positive'
  description TEXT,
  affected_systems TEXT, -- JSON array
  detection_method TEXT, -- 'neural_network', 'pattern_matching', 'threat_intel'
  assigned_to TEXT,
  resolution_notes TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  resolved_at INTEGER
);

-- Create indexes for optimal performance
CREATE INDEX idx_security_scans_timestamp ON security_scans(scan_timestamp);
CREATE INDEX idx_security_scans_user ON security_scans(user_id);
CREATE INDEX idx_security_scans_score ON security_scans(security_score);
CREATE INDEX idx_security_scans_hash ON security_scans(code_hash);

CREATE INDEX idx_vulnerability_detections_scan ON vulnerability_detections(scan_id);
CREATE INDEX idx_vulnerability_detections_severity ON vulnerability_detections(severity);
CREATE INDEX idx_vulnerability_detections_type ON vulnerability_detections(vulnerability_type);
CREATE INDEX idx_vulnerability_detections_quantum ON vulnerability_detections(quantum_threat);

CREATE INDEX idx_batch_scans_timestamp ON batch_scans(scan_timestamp);
CREATE INDEX idx_batch_scans_user ON batch_scans(user_id);

CREATE INDEX idx_neural_analysis_scan ON neural_analysis(scan_id);
CREATE INDEX idx_neural_analysis_timestamp ON neural_analysis(analysis_timestamp);

CREATE INDEX idx_quantum_threats_scan ON quantum_threats(scan_id);
CREATE INDEX idx_quantum_threats_algorithm ON quantum_threats(algorithm);
CREATE INDEX idx_quantum_threats_risk ON quantum_threats(risk_level);

CREATE INDEX idx_compliance_assessments_scan ON compliance_assessments(scan_id);
CREATE INDEX idx_compliance_assessments_framework ON compliance_assessments(framework);

CREATE INDEX idx_threat_monitoring_severity ON threat_monitoring(severity);
CREATE INDEX idx_threat_monitoring_status ON threat_monitoring(status);
CREATE INDEX idx_threat_monitoring_timestamp ON threat_monitoring(detected_at);

CREATE INDEX idx_threat_intelligence_cve ON threat_intelligence(cve_id);
CREATE INDEX idx_threat_intelligence_type ON threat_intelligence(threat_type);
CREATE INDEX idx_threat_intelligence_updated ON threat_intelligence(updated_at);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_activity ON user_sessions(last_activity);

CREATE INDEX idx_api_usage_user ON api_usage(user_id);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX idx_api_usage_timestamp ON api_usage(timestamp);

CREATE INDEX idx_neural_models_type ON neural_models(model_type);
CREATE INDEX idx_neural_models_status ON neural_models(deployment_status);

CREATE INDEX idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);

CREATE INDEX idx_security_policies_enabled ON security_policies(enabled);
CREATE INDEX idx_security_policies_priority ON security_policies(priority);

CREATE INDEX idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX idx_security_incidents_status ON security_incidents(status);
CREATE INDEX idx_security_incidents_created ON security_incidents(created_at);

-- Create views for common queries
CREATE VIEW vulnerability_summary AS
SELECT 
  ss.scan_id,
  ss.file_path,
  ss.security_score,
  COUNT(vd.id) as total_vulnerabilities,
  COUNT(CASE WHEN vd.severity = 'critical' THEN 1 END) as critical_count,
  COUNT(CASE WHEN vd.severity = 'high' THEN 1 END) as high_count,
  COUNT(CASE WHEN vd.severity = 'medium' THEN 1 END) as medium_count,
  COUNT(CASE WHEN vd.quantum_threat = TRUE THEN 1 END) as quantum_threats,
  ss.scan_timestamp
FROM security_scans ss
LEFT JOIN vulnerability_detections vd ON ss.scan_id = vd.scan_id
GROUP BY ss.scan_id, ss.file_path, ss.security_score, ss.scan_timestamp;

CREATE VIEW daily_threat_stats AS
SELECT 
  DATE(tm.detected_at, 'unixepoch') as date,
  tm.threat_type,
  tm.severity,
  COUNT(*) as threat_count,
  COUNT(CASE WHEN tm.status = 'mitigated' THEN 1 END) as mitigated_count
FROM threat_monitoring tm
WHERE tm.detected_at > unixepoch() - 2592000 -- Last 30 days
GROUP BY DATE(tm.detected_at, 'unixepoch'), tm.threat_type, tm.severity
ORDER BY date DESC;

CREATE VIEW user_scan_analytics AS
SELECT 
  us.user_id,
  us.subscription_tier,
  COUNT(ss.scan_id) as total_scans,
  AVG(ss.security_score) as avg_security_score,
  COUNT(CASE WHEN vd.severity = 'critical' THEN 1 END) as critical_vulnerabilities_found,
  MAX(ss.scan_timestamp) as last_scan
FROM user_sessions us
LEFT JOIN security_scans ss ON us.user_id = ss.user_id
LEFT JOIN vulnerability_detections vd ON ss.scan_id = vd.scan_id
GROUP BY us.user_id, us.subscription_tier;

CREATE VIEW neural_performance_metrics AS
SELECT 
  na.model_version,
  COUNT(*) as analysis_count,
  AVG(na.snn_anomaly_score) as avg_anomaly_score,
  AVG(na.confidence_score) as avg_confidence,
  AVG(na.processing_time_ms) as avg_processing_time,
  DATE(na.analysis_timestamp, 'unixepoch') as analysis_date
FROM neural_analysis na
WHERE na.analysis_timestamp > unixepoch() - 604800 -- Last 7 days
GROUP BY na.model_version, DATE(na.analysis_timestamp, 'unixepoch')
ORDER BY analysis_date DESC;

-- Insert default configuration and policies
INSERT INTO security_policies (policy_name, policy_type, configuration, priority) VALUES
('Critical Vulnerability Threshold', 'vulnerability_threshold', '{"critical_threshold": 0, "auto_block": true}', 10),
('Quantum Migration Alert', 'quantum_migration', '{"algorithms": ["RSA", "ECDSA"], "alert_threshold": 1}', 20),
('OWASP Compliance Check', 'compliance', '{"framework": "OWASP", "required_score": 80}', 30),
('Neural Network Anomaly Threshold', 'vulnerability_threshold', '{"snn_threshold": 0.7, "ann_threshold": 0.8}', 40);

-- Insert sample threat intelligence data
INSERT INTO threat_intelligence (cve_id, threat_type, severity, description, source, published_at) VALUES
('CVE-2024-0001', 'injection', 'critical', 'SQL injection vulnerability in popular web framework', 'NVD', unixepoch()),
('CVE-2024-0002', 'crypto_weak', 'high', 'Weak cryptographic implementation vulnerable to quantum attacks', 'MITRE', unixepoch()),
('CVE-2024-0003', 'xss', 'medium', 'Cross-site scripting vulnerability in client-side library', 'NVD', unixepoch());

-- Insert neural model versions
INSERT INTO neural_models (model_type, version, accuracy, deployment_status, deployed_at) VALUES
('snn', 'v1.0.0', 0.94, 'deployed', unixepoch()),
('ann', 'v1.0.0', 0.96, 'deployed', unixepoch()),
('hybrid', 'v1.0.0', 0.98, 'deployed', unixepoch());
