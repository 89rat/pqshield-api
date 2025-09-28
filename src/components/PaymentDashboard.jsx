/**
 * Payment Dashboard Component for PQShield API
 * Subscription management, billing, and payment processing
 */

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Shield, 
  Zap, 
  Crown, 
  Check, 
  X, 
  AlertTriangle,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Lock,
  Unlock,
  Star,
  Users,
  Globe,
  Smartphone
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import paymentService, { usePayment } from '../services/PaymentService.js';
import authService, { useAuth } from '../services/AuthenticationService.js';
import './PaymentDashboard.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const PaymentDashboard = () => {
  const { user, profile, subscriptionTier } = useAuth();
  const { loading, error, subscriptionTiers } = usePayment();
  const [activeTab, setActiveTab] = useState('subscription');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [usage, setUsage] = useState({
    scans: 0,
    apiCalls: 0,
    storage: 0
  });

  useEffect(() => {
    if (user) {
      loadBillingHistory();
      loadPaymentMethods();
      loadUsageStats();
    }
  }, [user]);

  const loadBillingHistory = async () => {
    try {
      const history = await paymentService.getBillingHistory(user.uid);
      setBillingHistory(history);
    } catch (error) {
      console.error('Failed to load billing history:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const methods = await paymentService.getPaymentMethods(user.uid);
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    }
  };

  const loadUsageStats = async () => {
    try {
      const currentUsage = await paymentService.getCurrentUsage(user.uid);
      setUsage(currentUsage);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const handleUpgrade = (tierId) => {
    setSelectedTier(tierId);
    setShowUpgradeModal(true);
  };

  const tabs = [
    { id: 'subscription', label: 'Subscription', icon: Crown },
    { id: 'billing', label: 'Billing History', icon: Calendar },
    { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
    { id: 'usage', label: 'Usage & Limits', icon: TrendingUp }
  ];

  return (
    <Elements stripe={stripePromise}>
      <div className="payment-dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Billing & Subscription</h1>
            <p>Manage your PQShield API subscription and billing</p>
          </div>
          
          <div className="current-plan-badge">
            <div className="plan-info">
              <span className="plan-name">{subscriptionTiers[subscriptionTier]?.name}</span>
              <span className="plan-price">
                ${subscriptionTiers[subscriptionTier]?.price}/month
              </span>
            </div>
            {subscriptionTier !== 'enterprise' && (
              <button 
                className="upgrade-btn"
                onClick={() => handleUpgrade('pro')}
              >
                <Crown size={16} />
                Upgrade
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="error-message">
            <AlertTriangle />
            {error}
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
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="dashboard-main">
            {activeTab === 'subscription' && (
              <SubscriptionTab 
                currentTier={subscriptionTier}
                subscriptionTiers={subscriptionTiers}
                onUpgrade={handleUpgrade}
                profile={profile}
              />
            )}

            {activeTab === 'billing' && (
              <BillingTab 
                billingHistory={billingHistory}
                loading={loading}
              />
            )}

            {activeTab === 'payment-methods' && (
              <PaymentMethodsTab 
                paymentMethods={paymentMethods}
                onMethodsUpdated={loadPaymentMethods}
                loading={loading}
              />
            )}

            {activeTab === 'usage' && (
              <UsageTab 
                usage={usage}
                limits={subscriptionTiers[subscriptionTier]?.limits}
                currentTier={subscriptionTier}
                onUpgrade={handleUpgrade}
              />
            )}
          </div>
        </div>

        {showUpgradeModal && (
          <UpgradeModal
            selectedTier={selectedTier}
            subscriptionTiers={subscriptionTiers}
            onClose={() => setShowUpgradeModal(false)}
            onSuccess={() => {
              setShowUpgradeModal(false);
              window.location.reload(); // Refresh to show updated subscription
            }}
          />
        )}
      </div>
    </Elements>
  );
};

// Subscription Tab Component
const SubscriptionTab = ({ currentTier, subscriptionTiers, onUpgrade, profile }) => {
  const currentPlan = subscriptionTiers[currentTier];
  const availableUpgrades = paymentService.getUpgradeOptions(currentTier);

  return (
    <div className="subscription-tab">
      <div className="current-subscription">
        <h2>Current Subscription</h2>
        <div className="subscription-card current">
          <div className="plan-header">
            <div className="plan-icon">
              {currentTier === 'basic' && <Shield />}
              {currentTier === 'pro' && <Zap />}
              {currentTier === 'enterprise' && <Crown />}
            </div>
            <div className="plan-details">
              <h3>{currentPlan.name}</h3>
              <div className="plan-price">
                <span className="price">${currentPlan.price}</span>
                <span className="period">/month</span>
              </div>
            </div>
          </div>
          
          <div className="plan-features">
            {currentPlan.features.map((feature, index) => (
              <div key={index} className="feature">
                <Check className="feature-icon" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {profile?.subscriptionStatus && (
            <div className="subscription-status">
              <div className="status-item">
                <span>Status:</span>
                <span className={`status ${profile.subscriptionStatus}`}>
                  {profile.subscriptionStatus.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              {profile.subscriptionEndDate && (
                <div className="status-item">
                  <span>Next billing:</span>
                  <span>{new Date(profile.subscriptionEndDate.toDate()).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {availableUpgrades.length > 0 && (
        <div className="available-upgrades">
          <h2>Upgrade Options</h2>
          <div className="plans-grid">
            {availableUpgrades.map(tier => (
              <div key={tier.id} className="subscription-card upgrade">
                <div className="plan-header">
                  <div className="plan-icon">
                    {tier.id === 'pro' && <Zap />}
                    {tier.id === 'enterprise' && <Crown />}
                  </div>
                  <div className="plan-details">
                    <h3>{tier.name}</h3>
                    <div className="plan-price">
                      <span className="price">${tier.price}</span>
                      <span className="period">/month</span>
                    </div>
                  </div>
                </div>
                
                <div className="plan-features">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="feature">
                      <Check className="feature-icon" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  className="upgrade-button"
                  onClick={() => onUpgrade(tier.id)}
                >
                  Upgrade to {tier.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="subscription-actions">
        <h2>Subscription Management</h2>
        <div className="actions-grid">
          <button className="action-button">
            <Download />
            Download Invoice
          </button>
          <button className="action-button">
            <Calendar />
            Change Billing Date
          </button>
          <button className="action-button danger">
            <X />
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  );
};

// Billing Tab Component
const BillingTab = ({ billingHistory, loading }) => {
  const handleDownloadInvoice = async (invoiceId) => {
    try {
      await paymentService.downloadInvoice(invoiceId);
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  };

  return (
    <div className="billing-tab">
      <h2>Billing History</h2>
      
      {loading ? (
        <div className="loading">Loading billing history...</div>
      ) : billingHistory.length === 0 ? (
        <div className="empty-state">
          <DollarSign size={48} />
          <h3>No billing history</h3>
          <p>Your billing history will appear here once you make your first payment.</p>
        </div>
      ) : (
        <div className="billing-table">
          <div className="table-header">
            <div>Date</div>
            <div>Description</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          
          {billingHistory.map(bill => (
            <div key={bill.id} className="table-row">
              <div>{new Date(bill.createdAt.toDate()).toLocaleDateString()}</div>
              <div>{bill.description}</div>
              <div>${bill.amount}</div>
              <div>
                <span className={`status ${bill.status}`}>
                  {bill.status.toUpperCase()}
                </span>
              </div>
              <div>
                <button 
                  className="download-btn"
                  onClick={() => handleDownloadInvoice(bill.invoiceId)}
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Payment Methods Tab Component
const PaymentMethodsTab = ({ paymentMethods, onMethodsUpdated, loading }) => {
  const [showAddCard, setShowAddCard] = useState(false);

  const handleRemoveMethod = async (methodId) => {
    if (confirm('Are you sure you want to remove this payment method?')) {
      try {
        const user = authService.getCurrentUser();
        await paymentService.removePaymentMethod(user.uid, methodId);
        onMethodsUpdated();
      } catch (error) {
        console.error('Failed to remove payment method:', error);
      }
    }
  };

  return (
    <div className="payment-methods-tab">
      <div className="tab-header">
        <h2>Payment Methods</h2>
        <button 
          className="add-method-btn"
          onClick={() => setShowAddCard(true)}
        >
          <CreditCard size={16} />
          Add Payment Method
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading payment methods...</div>
      ) : paymentMethods.length === 0 ? (
        <div className="empty-state">
          <CreditCard size={48} />
          <h3>No payment methods</h3>
          <p>Add a payment method to manage your subscription.</p>
          <button 
            className="add-first-method"
            onClick={() => setShowAddCard(true)}
          >
            Add Payment Method
          </button>
        </div>
      ) : (
        <div className="payment-methods-list">
          {paymentMethods.map(method => (
            <div key={method.id} className="payment-method-card">
              <div className="method-info">
                <div className="card-brand">
                  {method.card.brand.toUpperCase()}
                </div>
                <div className="card-details">
                  <span>•••• •••• •••• {method.card.last4}</span>
                  <span>Expires {method.card.exp_month}/{method.card.exp_year}</span>
                </div>
              </div>
              
              <div className="method-actions">
                <button 
                  className="remove-btn"
                  onClick={() => handleRemoveMethod(method.id)}
                >
                  <X size={16} />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddCard && (
        <AddPaymentMethodModal
          onClose={() => setShowAddCard(false)}
          onSuccess={() => {
            setShowAddCard(false);
            onMethodsUpdated();
          }}
        />
      )}
    </div>
  );
};

// Usage Tab Component
const UsageTab = ({ usage, limits, currentTier, onUpgrade }) => {
  const calculateUsagePercentage = (used, limit) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min(100, (used / limit) * 100);
  };

  const getUsageStatus = (used, limit) => {
    if (limit === -1) return 'unlimited';
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'critical';
    if (percentage >= 70) return 'warning';
    return 'normal';
  };

  return (
    <div className="usage-tab">
      <h2>Usage & Limits</h2>
      
      <div className="usage-cards">
        <div className="usage-card">
          <div className="usage-header">
            <div className="usage-icon">
              <Shield />
            </div>
            <div className="usage-info">
              <h3>Security Scans</h3>
              <div className="usage-numbers">
                <span className="used">{usage.scans}</span>
                <span className="separator">/</span>
                <span className="limit">
                  {limits?.scansPerMonth === -1 ? '∞' : limits?.scansPerMonth}
                </span>
              </div>
            </div>
          </div>
          
          {limits?.scansPerMonth !== -1 && (
            <div className="usage-bar">
              <div 
                className={`usage-fill ${getUsageStatus(usage.scans, limits.scansPerMonth)}`}
                style={{ width: `${calculateUsagePercentage(usage.scans, limits.scansPerMonth)}%` }}
              />
            </div>
          )}
        </div>

        <div className="usage-card">
          <div className="usage-header">
            <div className="usage-icon">
              <Globe />
            </div>
            <div className="usage-info">
              <h3>API Calls (Hourly)</h3>
              <div className="usage-numbers">
                <span className="used">{usage.apiCallsThisHour}</span>
                <span className="separator">/</span>
                <span className="limit">{limits?.apiCallsPerHour}</span>
              </div>
            </div>
          </div>
          
          <div className="usage-bar">
            <div 
              className={`usage-fill ${getUsageStatus(usage.apiCallsThisHour, limits.apiCallsPerHour)}`}
              style={{ width: `${calculateUsagePercentage(usage.apiCallsThisHour, limits.apiCallsPerHour)}%` }}
            />
          </div>
        </div>

        <div className="usage-card">
          <div className="usage-header">
            <div className="usage-icon">
              <Smartphone />
            </div>
            <div className="usage-info">
              <h3>Storage</h3>
              <div className="usage-numbers">
                <span className="used">{usage.storage} GB</span>
                <span className="separator">/</span>
                <span className="limit">
                  {limits?.storageGB === -1 ? '∞' : `${limits?.storageGB} GB`}
                </span>
              </div>
            </div>
          </div>
          
          {limits?.storageGB !== -1 && (
            <div className="usage-bar">
              <div 
                className={`usage-fill ${getUsageStatus(usage.storage, limits.storageGB)}`}
                style={{ width: `${calculateUsagePercentage(usage.storage, limits.storageGB)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {currentTier !== 'enterprise' && (
        <div className="upgrade-prompt">
          <div className="prompt-content">
            <h3>Need more resources?</h3>
            <p>Upgrade your plan to get higher limits and advanced features.</p>
            <button 
              className="upgrade-btn"
              onClick={() => onUpgrade('pro')}
            >
              <Crown size={16} />
              Upgrade Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Add Payment Method Modal
const AddPaymentMethodModal = ({ onClose, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      const user = authService.getCurrentUser();
      
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setError(error.message);
        return;
      }

      await paymentService.addPaymentMethod(user.uid, {
        card: cardElement,
        billingDetails: {
          name: user.displayName,
          email: user.email
        }
      });

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Add Payment Method</h3>
          <button className="close-btn" onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          <div className="card-element-container">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>

          {error && (
            <div className="error-message">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={!stripe || loading}
              className="submit-btn"
            >
              {loading ? 'Adding...' : 'Add Payment Method'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Upgrade Modal Component
const UpgradeModal = ({ selectedTier, subscriptionTiers, onClose, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const tier = subscriptionTiers[selectedTier];

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const user = authService.getCurrentUser();
      const methods = await paymentService.getPaymentMethods(user.uid);
      setPaymentMethods(methods);
      if (methods.length > 0) {
        setSelectedPaymentMethod(methods[0].id);
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = authService.getCurrentUser();
      await paymentService.createSubscription(user.uid, selectedTier, selectedPaymentMethod);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal upgrade-modal">
        <div className="modal-header">
          <h3>Upgrade to {tier.name}</h3>
          <button className="close-btn" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="upgrade-content">
          <div className="plan-summary">
            <div className="plan-price">
              <span className="price">${tier.price}</span>
              <span className="period">/month</span>
            </div>
            
            <div className="plan-features">
              {tier.features.map((feature, index) => (
                <div key={index} className="feature">
                  <Check className="feature-icon" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {paymentMethods.length > 0 ? (
            <div className="payment-method-selection">
              <h4>Select Payment Method</h4>
              {paymentMethods.map(method => (
                <label key={method.id} className="payment-method-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedPaymentMethod === method.id}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  />
                  <div className="method-info">
                    <span>{method.card.brand.toUpperCase()}</span>
                    <span>•••• {method.card.last4}</span>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="no-payment-methods">
              <p>You need to add a payment method first.</p>
              <AddPaymentMethodModal
                onClose={() => {}}
                onSuccess={loadPaymentMethods}
              />
            </div>
          )}

          {error && (
            <div className="error-message">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button 
              onClick={handleUpgrade}
              disabled={loading || !selectedPaymentMethod}
              className="upgrade-btn"
            >
              {loading ? 'Processing...' : `Upgrade for $${tier.price}/month`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDashboard;
