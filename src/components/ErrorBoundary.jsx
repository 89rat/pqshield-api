import React from 'react';
import { AlertTriangle, RefreshCw, Bug, Download } from 'lucide-react';
import performanceMonitor from '../utils/performance-monitor';

/**
 * Enhanced Error Boundary with debugging capabilities
 * 
 * Provides comprehensive error handling, logging, and debugging
 * information for the PQShield API platform.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
      performanceData: null,
    };
  }
  
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2),
    };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log error details
    this.logError(error, errorInfo);
    
    // Capture performance data at time of error
    const performanceData = performanceMonitor.getPerformanceSummary();
    
    this.setState({
      error,
      errorInfo,
      performanceData,
    });
    
    // Report error to monitoring service (if available)
    this.reportError(error, errorInfo, performanceData);
  }
  
  logError = (error, errorInfo) => {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.props.userId || 'anonymous',
    };
    
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error Details:', errorDetails);
    console.groupEnd();
    
    // Store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('pqshield_errors') || '[]');
      existingErrors.push(errorDetails);
      
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.shift();
      }
      
      localStorage.setItem('pqshield_errors', JSON.stringify(existingErrors));
    } catch (storageError) {
      console.warn('Failed to store error in localStorage:', storageError);
    }
  };
  
  reportError = async (error, errorInfo, performanceData) => {
    // In production, this would send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      try {
        // Example: Send to error reporting service
        // await fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     error: error.message,
        //     stack: error.stack,
        //     componentStack: errorInfo.componentStack,
        //     performanceData,
        //     timestamp: new Date().toISOString(),
        //   }),
        // });
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError);
      }
    }
  };
  
  handleRetry = () => {
    // Clear error state and retry
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
      performanceData: null,
    });
    
    // Optionally reload the page for critical errors
    if (this.props.reloadOnRetry) {
      window.location.reload();
    }
  };
  
  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };
  
  downloadErrorReport = () => {
    const errorReport = {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      error: {
        message: this.state.error?.message,
        stack: this.state.error?.stack,
      },
      errorInfo: this.state.errorInfo,
      performanceData: this.state.performanceData,
      userAgent: navigator.userAgent,
      url: window.location.href,
      localStorage: this.getRelevantLocalStorage(),
    };
    
    const blob = new Blob([JSON.stringify(errorReport, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pqshield-error-report-${this.state.errorId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  getRelevantLocalStorage = () => {
    const relevantKeys = [
      'pqshield_errors',
      'pqshield_settings',
      'pqshield_user_preferences',
    ];
    
    const data = {};
    relevantKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      } catch (error) {
        data[key] = `Error parsing: ${error.message}`;
      }
    });
    
    return data;
  };
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-red-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <AlertTriangle size={32} />
                <div>
                  <h1 className="text-2xl font-bold">Something went wrong</h1>
                  <p className="text-red-100">
                    PQShield encountered an unexpected error
                  </p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error Summary */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">Error Details</h3>
                <p className="text-red-700 text-sm">
                  <strong>Error ID:</strong> {this.state.errorId}
                </p>
                <p className="text-red-700 text-sm">
                  <strong>Message:</strong> {this.state.error?.message || 'Unknown error'}
                </p>
                <p className="text-red-700 text-sm">
                  <strong>Time:</strong> {new Date().toLocaleString()}
                </p>
              </div>
              
              {/* Performance Impact */}
              {this.state.performanceData && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Performance Impact</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {this.state.performanceData.memory && (
                      <div>
                        <span className="text-yellow-700">Memory Usage:</span>
                        <span className="ml-2 font-mono">
                          {this.state.performanceData.memory.used}MB ({this.state.performanceData.memory.percentage}%)
                        </span>
                      </div>
                    )}
                    {this.state.performanceData.neural && (
                      <div>
                        <span className="text-yellow-700">Neural Performance:</span>
                        <span className="ml-2 font-mono">
                          {this.state.performanceData.neural.accuracy}% accuracy
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw size={16} />
                  <span>Try Again</span>
                </button>
                
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Bug size={16} />
                  <span>{this.state.showDetails ? 'Hide' : 'Show'} Details</span>
                </button>
                
                <button
                  onClick={this.downloadErrorReport}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Download size={16} />
                  <span>Download Report</span>
                </button>
              </div>
              
              {/* Technical Details */}
              {this.state.showDetails && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Technical Details</h3>
                  
                  {/* Error Stack */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Error Stack:</h4>
                    <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
                      {this.state.error?.stack || 'No stack trace available'}
                    </pre>
                  </div>
                  
                  {/* Component Stack */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Component Stack:</h4>
                    <pre className="bg-gray-800 text-blue-400 p-3 rounded text-xs overflow-x-auto">
                      {this.state.errorInfo?.componentStack || 'No component stack available'}
                    </pre>
                  </div>
                  
                  {/* Performance Data */}
                  {this.state.performanceData && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Performance Data:</h4>
                      <pre className="bg-gray-800 text-yellow-400 p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify(this.state.performanceData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              
              {/* Help Text */}
              <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">What can you do?</h3>
                <ul className="space-y-1 text-blue-700">
                  <li>• Try refreshing the page or clicking "Try Again"</li>
                  <li>• Check your internet connection</li>
                  <li>• Clear your browser cache and cookies</li>
                  <li>• Download the error report and contact support if the issue persists</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for manual error reporting
export const useErrorReporting = () => {
  const reportError = (error, context = {}) => {
    console.error('Manual error report:', error, context);
    
    // Store error for debugging
    try {
      const errorDetails = {
        message: error.message || String(error),
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        manual: true,
      };
      
      const existingErrors = JSON.parse(localStorage.getItem('pqshield_errors') || '[]');
      existingErrors.push(errorDetails);
      
      if (existingErrors.length > 10) {
        existingErrors.shift();
      }
      
      localStorage.setItem('pqshield_errors', JSON.stringify(existingErrors));
    } catch (storageError) {
      console.warn('Failed to store manual error:', storageError);
    }
  };
  
  return { reportError };
};

export default ErrorBoundary;
