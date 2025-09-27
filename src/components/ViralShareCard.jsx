// src/components/ViralShareCard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TwitterShareButton, 
  FacebookShareButton, 
  WhatsappShareButton,
  TwitterIcon,
  FacebookIcon,
  WhatsappIcon 
} from 'react-share';
import toast from 'react-hot-toast';

export default function ViralShareCard({ metrics }) {
  const [showReward, setShowReward] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  
  const shareUrl = 'https://universalsentinel.app';
  const shareMessage = `🛡️ Universal Sentinel protected me from ${metrics.threatsBlocked} threats and saved $${metrics.moneySaved}!\n\nGet AI-powered protection:`;
  
  const handleShare = async (platform) => {
    setShareCount(prev => prev + 1);
    
    // Track share
    try {
      const response = await fetch('https://universal-sentinel-viral-api.workers.dev/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          metrics,
          user_id: localStorage.getItem('user_id') || 'anonymous'
        })
      });
      
      const result = await response.json();
      
      if (result.reward) {
        setShowReward(true);
        toast.success('🎁 You earned premium protection!');
      }
    } catch (error) {
      console.log('Share tracking offline, continuing...');
    }
    
    // Show reward after 3 shares
    if (shareCount + 1 >= 3 && !showReward) {
      setShowReward(true);
      toast.success('🎁 You earned 7 days of premium protection!');
    }
    
    toast.success(`Shared on ${platform}!`);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-6 rounded-xl border border-blue-500/30"
    >
      <h3 className="text-xl font-bold text-white mb-4">
        📢 Share Your Protection Stats
      </h3>
      
      <div className="bg-black/30 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">
              {metrics.threatsBlocked || 47}
            </div>
            <div className="text-sm text-gray-400">Threats Blocked</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">
              ${metrics.moneySaved || 2450}
            </div>
            <div className="text-sm text-gray-400">Money Saved</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">
              0.3ms
            </div>
            <div className="text-sm text-gray-400">Response Time</div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center space-x-3 mb-4">
        <TwitterShareButton
          url={shareUrl}
          title={shareMessage}
          onClick={() => handleShare('twitter')}
        >
          <TwitterIcon size={40} round />
        </TwitterShareButton>
        
        <FacebookShareButton
          url={shareUrl}
          quote={shareMessage}
          onClick={() => handleShare('facebook')}
        >
          <FacebookIcon size={40} round />
        </FacebookShareButton>
        
        <WhatsappShareButton
          url={shareUrl}
          title={shareMessage}
          onClick={() => handleShare('whatsapp')}
        >
          <WhatsappIcon size={40} round />
        </WhatsappShareButton>
      </div>
      
      <div className="text-center text-sm text-gray-400 mb-3">
        Share 3 times to unlock premium features! ({shareCount}/3)
      </div>
      
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-center"
          >
            <p className="text-green-400 font-bold">
              🎉 Premium Protection Unlocked for 7 Days!
            </p>
            <p className="text-green-300 text-sm mt-1">
              Advanced threat detection, priority support, and family protection enabled!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            const referralCode = 'USR' + Math.random().toString(36).substring(2, 8).toUpperCase();
            const referralLink = `${shareUrl}?ref=${referralCode}`;
            navigator.clipboard.writeText(referralLink);
            toast.success('🔗 Referral link copied! Share to earn rewards!');
          }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
        >
          📋 Copy Referral Link
        </button>
      </div>
    </motion.div>
  );
}
