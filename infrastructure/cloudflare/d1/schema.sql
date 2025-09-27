-- SNN/ANN Edge Security Database Schema
-- Cloudflare D1 SQL Database for ultra-fast edge queries

-- Devices table (edge security endpoints)
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'endpoint', 'gateway', 'server', 'iot'
  location TEXT,
  ip_address TEXT,
  mac_address TEXT,
  os_type TEXT,
  agent_version TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'quarantined'
  threat_level TEXT DEFAULT 'normal', -- 'normal', 'elevated', 'high', 'critical'
  last_seen INTEGER DEFAULT (unixepoch()),
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Threat detections table (core security events)
CREATE TABLE threat_detections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  packet_hash TEXT NOT NULL,
  snn_score REAL NOT NULL,
  ann_score REAL DEFAULT 0,
  threat_level TEXT NOT NULL, -- 'safe', 'low', 'medium', 'high', 'critical'
  threat_type TEXT, -- 'malware', 'ddos', 'intrusion', 'phishing', 'botnet'
  action_taken TEXT NOT NULL, -- 'allow', 'monitor', 'block', 'quarantine'
  processing_time_ms REAL NOT NULL,
  confidence REAL NOT NULL,
  source_ip TEXT,
  destination_ip TEXT,
  port INTEGER,
  protocol TEXT,
  payload_size INTEGER,
  timestamp INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- Neural network models table (version control)
CREATE TABLE model_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snn_version TEXT NOT NULL,
  ann_version TEXT NOT NULL,
  snn_accuracy REAL,
  ann_accuracy REAL,
  hybrid_performance REAL,
  training_data_size INTEGER,
  deployment_status TEXT DEFAULT 'pending', -- 'pending', 'deployed', 'deprecated'
  deployed_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Detection events table (system events and cache hits)
CREATE TABLE detection_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'cache_hit', 'snn_process', 'ann_process', 'hybrid_decision'
  result TEXT, -- JSON result data
  processing_time_ms REAL,
  timestamp INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- System performance metrics table
CREATE TABLE performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_type TEXT NOT NULL, -- 'snn_latency', 'ann_latency', 'cache_hit_rate', 'throughput'
  value REAL NOT NULL,
  device_id TEXT,
  region TEXT, -- Cloudflare edge region
  timestamp INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- Threat patterns table (for pattern recognition)
CREATE TABLE threat_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_hash TEXT UNIQUE NOT NULL,
  pattern_type TEXT NOT NULL,
  threat_level TEXT NOT NULL,
  snn_signature TEXT, -- Spike pattern signature
  ann_features TEXT, -- JSON array of features
  detection_count INTEGER DEFAULT 1,
  last_detected INTEGER DEFAULT (unixepoch()),
  created_at INTEGER DEFAULT (unixepoch())
);

-- Security policies table (dynamic rule engine)
CREATE TABLE security_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  device_type TEXT, -- Apply to specific device types
  threat_threshold REAL DEFAULT 0.7, -- SNN threshold for action
  action TEXT NOT NULL, -- 'allow', 'monitor', 'block', 'quarantine'
  enabled BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 100,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Incident response table (security incidents)
CREATE TABLE security_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id TEXT UNIQUE NOT NULL,
  device_id TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  status TEXT DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'false_positive'
  threat_type TEXT,
  description TEXT,
  detection_count INTEGER DEFAULT 1,
  first_detected INTEGER DEFAULT (unixepoch()),
  last_detected INTEGER DEFAULT (unixepoch()),
  resolved_at INTEGER,
  assigned_to TEXT,
  notes TEXT,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- Analytics aggregations table (for dashboard performance)
CREATE TABLE analytics_hourly (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hour_timestamp INTEGER NOT NULL, -- Unix timestamp rounded to hour
  device_count INTEGER DEFAULT 0,
  total_detections INTEGER DEFAULT 0,
  threats_detected INTEGER DEFAULT 0,
  threats_blocked INTEGER DEFAULT 0,
  avg_snn_latency REAL DEFAULT 0,
  avg_ann_latency REAL DEFAULT 0,
  cache_hit_rate REAL DEFAULT 0,
  false_positive_rate REAL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

-- User sessions table (for dashboard access)
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_id TEXT,
  session_token TEXT NOT NULL,
  permissions TEXT, -- JSON array of permissions
  expires_at INTEGER NOT NULL,
  last_activity INTEGER DEFAULT (unixepoch()),
  created_at INTEGER DEFAULT (unixepoch())
);

-- Configuration table (system settings)
CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Create indexes for optimal query performance
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_threat_level ON devices(threat_level);
CREATE INDEX idx_devices_last_seen ON devices(last_seen);

CREATE INDEX idx_threat_detections_device_id ON threat_detections(device_id);
CREATE INDEX idx_threat_detections_timestamp ON threat_detections(timestamp);
CREATE INDEX idx_threat_detections_threat_level ON threat_detections(threat_level);
CREATE INDEX idx_threat_detections_action ON threat_detections(action_taken);
CREATE INDEX idx_threat_detections_composite ON threat_detections(device_id, timestamp, threat_level);

CREATE INDEX idx_detection_events_device_id ON detection_events(device_id);
CREATE INDEX idx_detection_events_timestamp ON detection_events(timestamp);
CREATE INDEX idx_detection_events_type ON detection_events(event_type);

CREATE INDEX idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX idx_performance_metrics_device ON performance_metrics(device_id);

CREATE INDEX idx_threat_patterns_hash ON threat_patterns(pattern_hash);
CREATE INDEX idx_threat_patterns_type ON threat_patterns(pattern_type);
CREATE INDEX idx_threat_patterns_level ON threat_patterns(threat_level);

CREATE INDEX idx_security_policies_enabled ON security_policies(enabled);
CREATE INDEX idx_security_policies_priority ON security_policies(priority);

CREATE INDEX idx_security_incidents_device_id ON security_incidents(device_id);
CREATE INDEX idx_security_incidents_status ON security_incidents(status);
CREATE INDEX idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX idx_security_incidents_first_detected ON security_incidents(first_detected);

CREATE INDEX idx_analytics_hourly_timestamp ON analytics_hourly(hour_timestamp);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Insert default configuration
INSERT INTO system_config (key, value, description) VALUES
('snn_threshold', '0.7', 'Default SNN anomaly threshold for threat detection'),
('ann_threshold', '0.8', 'Default ANN threat score threshold'),
('cache_ttl_safe', '3600', 'Cache TTL in seconds for safe packets'),
('cache_ttl_threat', '300', 'Cache TTL in seconds for threat packets'),
('max_processing_time', '5', 'Maximum processing time in milliseconds'),
('enable_hybrid_mode', 'true', 'Enable SNN+ANN hybrid processing'),
('auto_quarantine_threshold', '0.9', 'Auto-quarantine threshold for critical threats'),
('rate_limit_normal', '1000', 'Rate limit per minute for normal devices'),
('rate_limit_elevated', '100', 'Rate limit per minute for elevated threat devices'),
('rate_limit_critical', '10', 'Rate limit per minute for critical threat devices');

-- Insert default security policies
INSERT INTO security_policies (name, description, device_type, threat_threshold, action, priority) VALUES
('Default Allow Policy', 'Allow all traffic below threat threshold', 'all', 0.3, 'allow', 1000),
('Monitor Suspicious Activity', 'Monitor medium-level threats', 'all', 0.5, 'monitor', 500),
('Block High Threats', 'Block high-level threats automatically', 'all', 0.8, 'block', 100),
('Quarantine Critical Threats', 'Quarantine critical threats immediately', 'all', 0.9, 'quarantine', 50),
('IoT Device Protection', 'Enhanced protection for IoT devices', 'iot', 0.4, 'monitor', 200),
('Server Protection', 'Strict protection for servers', 'server', 0.6, 'block', 150);

-- Create views for common queries
CREATE VIEW device_threat_summary AS
SELECT 
  d.id,
  d.name,
  d.type,
  d.threat_level,
  d.status,
  COUNT(td.id) as total_detections,
  COUNT(CASE WHEN td.threat_level != 'safe' THEN 1 END) as threats_detected,
  COUNT(CASE WHEN td.action_taken = 'blocked' THEN 1 END) as threats_blocked,
  AVG(td.processing_time_ms) as avg_processing_time,
  MAX(td.timestamp) as last_detection
FROM devices d
LEFT JOIN threat_detections td ON d.id = td.device_id
WHERE td.timestamp > unixepoch() - 86400 -- Last 24 hours
GROUP BY d.id, d.name, d.type, d.threat_level, d.status;

CREATE VIEW hourly_threat_stats AS
SELECT 
  datetime(hour_timestamp, 'unixepoch') as hour,
  device_count,
  total_detections,
  threats_detected,
  threats_blocked,
  ROUND(avg_snn_latency, 2) as avg_snn_latency_ms,
  ROUND(avg_ann_latency, 2) as avg_ann_latency_ms,
  ROUND(cache_hit_rate * 100, 2) as cache_hit_rate_percent,
  ROUND(false_positive_rate * 100, 2) as false_positive_rate_percent
FROM analytics_hourly
ORDER BY hour_timestamp DESC
LIMIT 24;

CREATE VIEW active_incidents AS
SELECT 
  si.incident_id,
  si.device_id,
  d.name as device_name,
  si.severity,
  si.status,
  si.threat_type,
  si.detection_count,
  datetime(si.first_detected, 'unixepoch') as first_detected,
  datetime(si.last_detected, 'unixepoch') as last_detected,
  si.assigned_to
FROM security_incidents si
JOIN devices d ON si.device_id = d.id
WHERE si.status IN ('open', 'investigating')
ORDER BY si.severity DESC, si.last_detected DESC;
