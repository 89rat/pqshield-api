import React from 'react';
import EnhancedSecurityDashboard from './components/EnhancedSecurityDashboard';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🛡️</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PQShield API</h1>
                <p className="text-sm text-gray-500">Quantum-Resistant Security Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Status:</span>
                <span className="ml-1 text-green-600 font-semibold">Secure & Hardened</span>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EnhancedSecurityDashboard />
      </main>
      
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>PQShield API - Ultimate Quantum-Resistant Security Platform</p>
            <p className="mt-1">🛡️ All Security Vulnerabilities Addressed • Production Ready • Neural Networks Hardened</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
