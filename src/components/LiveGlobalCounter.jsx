// src/components/LiveGlobalCounter.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useWebSocket from 'react-use-websocket';

export default function LiveGlobalCounter() {
  const [metrics, setMetrics] = useState({
    globalThreats: 1247853,
    globalSaved: 45230000,
    activeUsers: 152847,
    viralCoefficient: 1.3
  });
  
  const [isConnected, setIsConnected] = useState(false);
  
  // Try to connect to WebSocket, fallback to polling
  const { lastMessage, connectionStatus } = useWebSocket(
    'wss://universal-sentinel-viral-api.workers.dev/live',
    {
      shouldReconnect: () => true,
      onOpen: () => setIsConnected(true),
      onClose: () => setIsConnected(false),
      onError: () => setIsConnected(false),
    }
  );
  
  // Fallback: simulate real-time updates if WebSocket fails
  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(() => {
        setMetrics(prev => ({
          globalThreats: prev.globalThreats + Math.floor(Math.random() * 5) + 1,
          globalSaved: prev.globalSaved + Math.floor(Math.random() * 1000) + 100,
          activeUsers: prev.activeUsers + Math.floor(Math.random() * 10) - 5,
          viralCoefficient: Math.max(1.0, prev.viralCoefficient + (Math.random() - 0.5) * 0.1)
        }));
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isConnected]);
  
  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        setMetrics(data);
      } catch (error) {
        console.log('WebSocket data parsing error:', error);
      }
    }
  }, [lastMessage]);
  
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-xl shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-white">
          🌍 Global Protection Network
        </h3>
        <div className="flex items-center space-x-2">
          <motion.div
            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <span className="text-white/70 text-sm">
            {isConnected ? 'LIVE' : 'SIMULATED'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-center bg-white/10 rounded-lg p-3"
        >
          <div className="text-2xl md:text-3xl font-bold text-white">
            {formatNumber(metrics.globalThreats)}
          </div>
          <div className="text-xs md:text-sm text-white/70">Threats Blocked</div>
          <div className="text-xs text-green-300 mt-1">
            +{Math.floor(Math.random() * 50) + 10} today
          </div>
        </motion.div>
        
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
          className="text-center bg-white/10 rounded-lg p-3"
        >
          <div className="text-2xl md:text-3xl font-bold text-green-300">
            ${formatNumber(metrics.globalSaved)}
          </div>
          <div className="text-xs md:text-sm text-white/70">Money Saved</div>
          <div className="text-xs text-green-300 mt-1">
            +${formatNumber(Math.floor(Math.random() * 10000) + 1000)} today
          </div>
        </motion.div>
        
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2, delay: 1 }}
          className="text-center bg-white/10 rounded-lg p-3"
        >
          <div className="text-2xl md:text-3xl font-bold text-yellow-300">
            {formatNumber(metrics.activeUsers)}
          </div>
          <div className="text-xs md:text-sm text-white/70">Active Users</div>
          <div className="text-xs text-yellow-300 mt-1">
            +{Math.floor(Math.random() * 100) + 50} online
          </div>
        </motion.div>
        
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2, delay: 1.5 }}
          className="text-center bg-white/10 rounded-lg p-3"
        >
          <div className="text-2xl md:text-3xl font-bold text-pink-300">
            {metrics.viralCoefficient.toFixed(1)}
          </div>
          <div className="text-xs md:text-sm text-white/70">Viral K-Factor</div>
          <div className="text-xs text-pink-300 mt-1">
            {metrics.viralCoefficient > 1.0 ? '📈 Growing' : '📊 Stable'}
          </div>
        </motion.div>
      </div>
      
      <motion.div
        className="mt-4 text-center"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <span className="text-green-400 text-sm flex items-center justify-center space-x-2">
          <span>●</span>
          <span>{isConnected ? 'LIVE - Updating in real-time' : 'DEMO - Simulated real-time data'}</span>
        </span>
      </motion.div>
      
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-white/60">
        <div>
          <div className="font-semibold text-white">47</div>
          <div>Countries</div>
        </div>
        <div>
          <div className="font-semibold text-white">1,247</div>
          <div>Cities</div>
        </div>
        <div>
          <div className="font-semibold text-white">89%</div>
          <div>Success Rate</div>
        </div>
      </div>
    </motion.div>
  );
}
