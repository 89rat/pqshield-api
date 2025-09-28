/**
 * Account Dashboard Component for PQ359 API
 * Comprehensive user account management interface
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Key, 
  Settings, 
  Bell, 
  CreditCard, 
  Activity,
  Lock,
  Smartphone,
  Link,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Edit3,
  Save,
  X
} from 'lucide-react';
import authService, { useAuth } from '../services/AuthenticationService.js';
import './AccountDashboard.css';

const AccountDashboard = () => {
  const { user, profile, isAuthenticated, subscriptionTier } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    email: '',
    company: '',
    jobTitle: '',
    phone: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [preferences, setPreferences] = useState({
    notifications: true,
    emailAlerts: true,
    darkMode: false,
    language: 'en'
  });
  
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [accountStats, setAccountStats] = useState({
    totalScans: 0,
    threatsBlocked: 0,
    securityScore: 0,
    lastScan: null
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        displayName: profile.displayName || '',
        email: profile.email || '',
        company: profile.company || '',
        jobTitle: profile.jobTitle || '',
        phone: profile.phone || ''
      });
      
      setPreferences(profile.preferences || preferences);
      loadAccountStats();
      loadSecurityAlerts();
    }
  }, [profile]);

  const loadAccountStats = async () => {
    try {
      // Load user statistics
      setAccountStats({
        totalScans: profile.scanCount || 0,
        threatsBlocked: profile.threatsBlocked || 0,
        securityScore: profile.securityScore || 0,
        lastScan: profile.lastScanAt || null
      });
    } catch (error) {
      console.error('Error loading account stats:', error);
    }
  };

  const loadSecurityAlerts = async () => {
    try {
      // Mock security alerts - replace with actual API call
      setSecurityAlerts([
        {
          id: 1,
          type: 'login',
          message: 'New login from Chrome on Windows',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          severity: 'info'
        },
        {
          id: 2,
          type: 'security',
          message: 'Password changed successfully',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          severity: 'success'
        }
      ]);
    } catch (error) {
      console.error('Error loading security alerts:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await authService.updateUserProfile(profileForm);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditMode(false);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    setLoading(true);
    
    try {
      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setLoading(true);
    
    try {
      await authService.updateUserProfile({ preferences });
      setMessage({ type: 'success', text: 'Preferences updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMFA = async () => {
    try {
      // This would typically open a modal for phone number input
      const phoneNumber = prompt('Enter your phone number for MFA:');
      if (phoneNumber) {
        await authService.enableMFA(phoneNumber);
        setMessage({ type: 'success', text: 'MFA enabled successfully!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDisableMFA = async () => {
    if (confirm('Are you sure you want to disable multi-factor authentication?')) {
      try {
        await authService.disableMFA();
        setMessage({ type: 'success', text: 'MFA disabled successfully!' });
      } catch (error) {
        setMessage({ type: 'error', text: error.message });
      }
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(profile.apiKey);
    setMessage({ type: 'success', text: 'API key copied to clipboard!' });
  };

  const regenerateApiKey = async () => {
    if (confirm('Are you sure you want to regenerate your API key? This will invalidate the current key.')) {
      try {
        const newApiKey = authService.generateApiKey();
        await authService.updateUserProfile({ apiKey: newApiKey });
        setMessage({ type: 'success', text: 'API key regenerated successfully!' });
      } catch (error) {
        setMessage({ type: 'error', text: error.message });
      }
    }
  };

  const exportData = async () => {
    try {
      // Export user data
      const userData = {
        profile,
        stats: accountStats,
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pq359-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data' });
    }
  };

  const deleteAccount = async () => {
    const password = prompt('Enter your password to confirm account deletion:');
    if (password) {
      try {
        await authService.deleteAccount(password);
        setMessage({ type: 'success', text: 'Account deleted successfully!' });
      } catch (error) {
        setMessage({ type: 'error', text: error.message });
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="account-dashboard">
        <div className="auth-required">
          <Shield className="auth-icon" />
          <h2>Authentication Required</h2>
          <p>Please sign in to access your account dashboard.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Access', icon: Key },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'activity', label: 'Activity', icon: Activity }
  ];

  return (
    <div className="account-dashboard">
      <div className="dashboard-header">
        <div className="user-info">
          <div className="avatar">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" />
            ) : (
              <User className="avatar-icon" />
            )}
          </div>
          <div className="user-details">
            <h1>{profile?.displayName || 'User'}</h1>
            <p>{profile?.email}</p>
            <span className={`subscription-badge ${subscriptionTier}`}>
              {subscriptionTier.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-value">{accountStats.totalScans}</div>
            <div className="stat-label">Total Scans</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{accountStats.threatsBlocked}</div>
            <div className="stat-label">Threats Blocked</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{accountStats.securityScore}</div>
            <div className="stat-label">Security Score</div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle /> : <XCircle />}
          {message.text}
          <button onClick={() => setMessage(null)}>
            <X />
          </button>
        </div>
      )}

      <div className="dashboard-content">
        <nav className="dashboard-nav">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="dashboard-main">
          {activeTab === 'profile' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>Profile Information</h2>
                <button
                  className="edit-button"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? <X /> : <Edit3 />}
                  {editMode ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <form onSubmit={handleProfileUpdate} className="profile-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Display Name</label>
                    <input
                      type="text"
                      value={profileForm.displayName}
                      onChange={(e) => setProfileForm({...profileForm, displayName: e.target.value})}
                      disabled={!editMode}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Company</label>
                    <input
                      type="text"
                      value={profileForm.company}
                      onChange={(e) => setProfileForm({...profileForm, company: e.target.value})}
                      disabled={!editMode}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Job Title</label>
                    <input
                      type="text"
                      value={profileForm.jobTitle}
                      onChange={(e) => setProfileForm({...profileForm, jobTitle: e.target.value})}
                      disabled={!editMode}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      disabled={!editMode}
                    />
                  </div>
                </div>

                {editMode && (
                  <div className="form-actions">
                    <button type="submit" disabled={loading} className="save-button">
                      <Save />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="tab-content">
              <h2>Security Settings</h2>

              <div className="security-section">
                <h3>Password</h3>
                <form onSubmit={handlePasswordChange} className="password-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      required
                    />
                  </div>
                  
                  <button type="submit" disabled={loading}>
                    <Lock />
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>

              <div className="security-section">
                <h3>Multi-Factor Authentication</h3>
                <div className="mfa-status">
                  <div className="status-info">
                    <Smartphone />
                    <span>
                      MFA is {profile?.mfaEnabled ? 'enabled' : 'disabled'}
                    </span>
                    {profile?.mfaEnabled ? (
                      <CheckCircle className="status-icon success" />
                    ) : (
                      <XCircle className="status-icon error" />
                    )}
                  </div>
                  
                  <button
                    onClick={profile?.mfaEnabled ? handleDisableMFA : handleEnableMFA}
                    className={profile?.mfaEnabled ? 'danger-button' : 'primary-button'}
                  >
                    {profile?.mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
                  </button>
                </div>
              </div>

              <div className="security-section">
                <h3>Recent Security Activity</h3>
                <div className="security-alerts">
                  {securityAlerts.map(alert => (
                    <div key={alert.id} className={`alert-item ${alert.severity}`}>
                      <div className="alert-icon">
                        {alert.severity === 'success' && <CheckCircle />}
                        {alert.severity === 'info' && <Bell />}
                        {alert.severity === 'warning' && <AlertTriangle />}
                      </div>
                      <div className="alert-content">
                        <div className="alert-message">{alert.message}</div>
                        <div className="alert-time">
                          {alert.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="tab-content">
              <h2>API Access</h2>

              <div className="api-section">
                <h3>API Key</h3>
                <div className="api-key-container">
                  <div className="api-key-display">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={profile?.apiKey || ''}
                      readOnly
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="toggle-visibility"
                    >
                      {showApiKey ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                  
                  <div className="api-actions">
                    <button onClick={copyApiKey} className="copy-button">
                      Copy Key
                    </button>
                    <button onClick={regenerateApiKey} className="regenerate-button">
                      Regenerate
                    </button>
                  </div>
                </div>
                
                <div className="api-info">
                  <p>Use this API key to authenticate requests to the PQ359 API.</p>
                  <p>Keep your API key secure and never share it publicly.</p>
                </div>
              </div>

              <div className="api-section">
                <h3>Usage Statistics</h3>
                <div className="usage-stats">
                  <div className="usage-item">
                    <span>API Calls This Month</span>
                    <span>{profile?.apiCallsThisMonth || 0}</span>
                  </div>
                  <div className="usage-item">
                    <span>Rate Limit</span>
                    <span>1000 calls/hour</span>
                  </div>
                  <div className="usage-item">
                    <span>Subscription Tier</span>
                    <span>{subscriptionTier.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="tab-content">
              <h2>Preferences</h2>

              <div className="preferences-section">
                <h3>Notifications</h3>
                <div className="preference-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.notifications}
                      onChange={(e) => setPreferences({...preferences, notifications: e.target.checked})}
                    />
                    Enable notifications
                  </label>
                </div>
                
                <div className="preference-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.emailAlerts}
                      onChange={(e) => setPreferences({...preferences, emailAlerts: e.target.checked})}
                    />
                    Email alerts for security threats
                  </label>
                </div>
              </div>

              <div className="preferences-section">
                <h3>Appearance</h3>
                <div className="preference-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.darkMode}
                      onChange={(e) => setPreferences({...preferences, darkMode: e.target.checked})}
                    />
                    Dark mode
                  </label>
                </div>
              </div>

              <div className="preferences-section">
                <h3>Language</h3>
                <div className="preference-item">
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
              </div>

              <button onClick={handlePreferencesUpdate} disabled={loading}>
                <Save />
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="tab-content">
              <h2>Billing & Subscription</h2>
              
              <div className="subscription-info">
                <div className="current-plan">
                  <h3>Current Plan: {subscriptionTier.toUpperCase()}</h3>
                  <p>Your current subscription tier and billing information.</p>
                </div>
                
                <div className="billing-actions">
                  <button className="upgrade-button">
                    <CreditCard />
                    Upgrade Plan
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="tab-content">
              <h2>Account Activity</h2>
              
              <div className="activity-section">
                <h3>Data Export</h3>
                <p>Download all your account data and scan history.</p>
                <button onClick={exportData} className="export-button">
                  <Download />
                  Export Data
                </button>
              </div>

              <div className="activity-section danger-zone">
                <h3>Danger Zone</h3>
                <p>Permanently delete your account and all associated data.</p>
                <button onClick={deleteAccount} className="delete-button">
                  <Trash2 />
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountDashboard;
