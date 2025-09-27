import React, { useState, useEffect } from 'react'
import { UniversalDashboard } from './sentinel/UniversalDashboard'
import Confetti from 'react-confetti'
import { toast, Toaster } from 'react-hot-toast'
import ReferralBanner from './components/ReferralBanner'
import './App.css'

function App() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [userMetrics, setUserMetrics] = useState({
    threatsBlocked: 47,
    moneySaved: 2450,
    protectionStreak: 7
  });
  
  // Check for achievements and milestones
  useEffect(() => {
    // Check if user just signed up via referral
    const referralSource = localStorage.getItem('referral_source');
    if (referralSource && !localStorage.getItem('welcome_shown')) {
      setShowConfetti(true);
      toast.success('🎉 Welcome to Universal Sentinel! 7 days premium activated!');
      localStorage.setItem('welcome_shown', 'true');
      setTimeout(() => setShowConfetti(false), 5000);
    }
    
    // Check for protection streak achievements
    if (userMetrics.protectionStreak === 7) {
      toast.success('🏆 7-Day Protection Streak! Share to unlock more premium features!');
    }
    
    // Simulate user metrics updates
    const interval = setInterval(() => {
      setUserMetrics(prev => ({
        threatsBlocked: prev.threatsBlocked + Math.floor(Math.random() * 3),
        moneySaved: prev.moneySaved + Math.floor(Math.random() * 100),
        protectionStreak: prev.protectionStreak
      }));
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [userMetrics.protectionStreak]);
  
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #3b82f6'
          }
        }}
      />
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <ReferralBanner />
        <UniversalDashboard userMetrics={userMetrics} />
      </div>
    </>
  )
}

export default App
