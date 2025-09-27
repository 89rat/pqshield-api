// src/components/ReferralBanner.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ReferralBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    premiumDaysEarned: 0,
    nextReward: '7 days premium'
  });
  
  // Check if user came from referral
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
      // Track referral
      localStorage.setItem('referral_source', referralCode);
      toast.success('🎁 Welcome! You get 7 days free premium protection!');
      
      // Remove ref from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  
  const generateReferralLink = () => {
    const userId = localStorage.getItem('user_id') || 'user_' + Date.now();
    localStorage.setItem('user_id', userId);
    
    const referralCode = userId.substring(0, 3).toUpperCase() + 
                        Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const referralLink = `${window.location.origin}?ref=${referralCode}`;
    
    navigator.clipboard.writeText(referralLink);
    toast.success('🔗 Referral link copied! Share to earn premium days!');
    
    return referralLink;
  };
  
  const shareReferralLink = (platform) => {
    const referralLink = generateReferralLink();
    const message = `🛡️ Join me on Universal Sentinel! Get AI-powered protection from online threats. We both get premium features when you sign up: ${referralLink}`;
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(message)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      email: `mailto:?subject=Universal Sentinel - AI Protection&body=${encodeURIComponent(message)}`
    };
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 relative overflow-hidden"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between relative z-10">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="text-2xl"
            >
              🎁
            </motion.div>
            <div>
              <h3 className="font-bold text-lg">Refer Friends, Earn Premium!</h3>
              <p className="text-sm opacity-90">
                Share Universal Sentinel and get premium features for every friend who joins
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-center mr-4">
              <div className="text-2xl font-bold">{referralStats.totalReferrals}</div>
              <div className="text-xs opacity-75">Referrals</div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => shareReferralLink('twitter')}
                className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1"
              >
                <span>🐦</span>
                <span className="hidden md:inline">Twitter</span>
              </button>
              
              <button
                onClick={() => shareReferralLink('whatsapp')}
                className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1"
              >
                <span>💬</span>
                <span className="hidden md:inline">WhatsApp</span>
              </button>
              
              <button
                onClick={generateReferralLink}
                className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1"
              >
                <span>📋</span>
                <span className="hidden md:inline">Copy Link</span>
              </button>
            </div>
            
            <button
              onClick={() => setIsVisible(false)}
              className="ml-2 text-white/70 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Reward progress bar */}
        <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
          <motion.div
            className="bg-white h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(referralStats.totalReferrals % 5) * 20}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <div className="text-xs mt-1 text-center opacity-75">
          {5 - (referralStats.totalReferrals % 5)} more referrals to unlock {referralStats.nextReward}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
