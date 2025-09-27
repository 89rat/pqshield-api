// Universal Sentinel Viral Launch API
// Real-time metrics, social sharing, and viral growth engine

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Enable CORS for all origins
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handlers for viral features
      switch (url.pathname) {
        case '/api/metrics/live':
          return handleLiveMetrics(env, corsHeaders);
        case '/api/share':
          return handleShare(request, env, corsHeaders);
        case '/api/referral/create':
          return handleCreateReferral(request, env, corsHeaders);
        case '/api/referral/track':
          return handleTrackReferral(request, env, corsHeaders);
        case '/api/achievement/unlock':
          return handleAchievementUnlock(request, env, corsHeaders);
        case '/api/community/threat':
          return handleCommunityThreat(request, env, corsHeaders);
        case '/api/viral/leaderboard':
          return handleViralLeaderboard(env, corsHeaders);
        case '/api/social/generate':
          return handleSocialContentGeneration(request, env, corsHeaders);
        case '/api/protection/stats':
          return handleProtectionStats(request, env, corsHeaders);
        case '/websocket':
          return handleWebSocket(request, env);
        default:
          return new Response(JSON.stringify({ error: 'Endpoint not found' }), { 
            status: 404, 
            headers: corsHeaders 
          });
      }
    } catch (error) {
      console.error('API Error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};

// Real-time viral metrics with social proof
async function handleLiveMetrics(env, headers) {
  try {
    // Simulate real-time growth with base numbers
    const baseMetrics = {
      threats_blocked: 1247853,
      money_saved: 45230000,
      active_users: 152847,
      families_protected: 89432,
      children_safe: 234567,
      scams_prevented: 98765,
      daily_referrals: 342,
      viral_coefficient: 1.3
    };

    // Add realistic real-time variations
    const now = Date.now();
    const timeVariation = Math.sin(now / 60000) * 0.1; // 1-minute cycle
    const randomVariation = (Math.random() - 0.5) * 0.05; // ±2.5%
    const growthFactor = 1 + timeVariation + randomVariation;

    const liveMetrics = {
      threats_blocked: Math.floor(baseMetrics.threats_blocked * growthFactor),
      money_saved: Math.floor(baseMetrics.money_saved * growthFactor),
      active_users: Math.floor(baseMetrics.active_users * growthFactor),
      families_protected: Math.floor(baseMetrics.families_protected * growthFactor),
      children_safe: Math.floor(baseMetrics.children_safe * growthFactor),
      scams_prevented: Math.floor(baseMetrics.scams_prevented * growthFactor),
      daily_referrals: Math.floor(baseMetrics.daily_referrals * growthFactor),
      viral_coefficient: (baseMetrics.viral_coefficient * growthFactor).toFixed(2),
      
      // Real-time processing metrics
      snn_processing_time: (0.3 + Math.random() * 0.2).toFixed(1) + 'ms',
      ann_accuracy: (94.2 + Math.random() * 2).toFixed(1) + '%',
      hybrid_performance: (97.4 + Math.random() * 1).toFixed(1) + '%',
      
      // Social proof metrics
      shares_today: Math.floor(3421 * growthFactor),
      conversion_rate: (18.4 + Math.random() * 2).toFixed(1) + '%',
      nps_score: Math.floor(87 + Math.random() * 5),
      
      // Geographic spread
      countries_active: 47,
      cities_protected: 1247,
      
      // Timestamp for real-time updates
      timestamp: now,
      last_threat_blocked: now - Math.floor(Math.random() * 30000), // Within last 30 seconds
      
      // Viral growth indicators
      growth_rate_24h: (23.4 + Math.random() * 5).toFixed(1) + '%',
      referral_success_rate: (67.8 + Math.random() * 3).toFixed(1) + '%',
      
      // Community engagement
      community_alerts_sent: Math.floor(156 * growthFactor),
      family_networks_created: Math.floor(234 * growthFactor),
      
      // Achievement unlocks today
      achievements_unlocked: Math.floor(89 * growthFactor),
      
      // Real-time threat types
      threat_breakdown: {
        phishing: Math.floor(45 * growthFactor),
        scams: Math.floor(32 * growthFactor),
        malware: Math.floor(23 * growthFactor),
        grooming: Math.floor(12 * growthFactor),
        fraud: Math.floor(67 * growthFactor)
      }
    };

    return new Response(JSON.stringify(liveMetrics), { headers });
  } catch (error) {
    console.error('Live metrics error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch metrics' }), { 
      status: 500, 
      headers 
    });
  }
}

// Social sharing with viral tracking
async function handleShare(request, env, headers) {
  try {
    const { type, content, platform, user_id } = await request.json();
    
    // Generate shareable content with social proof
    const shareContent = generateViralContent(type, content);
    
    // Track share for viral metrics
    const shareId = crypto.randomUUID();
    const shareData = {
      id: shareId,
      user_id: user_id || 'anonymous',
      type,
      platform,
      content: shareContent,
      timestamp: Date.now(),
      tracking_url: `https://universalsentinel.app?ref=${shareId}`
    };

    // Check for milestone achievements
    const milestones = await checkShareMilestones(user_id);
    
    return new Response(JSON.stringify({
      success: true,
      share_id: shareId,
      content: shareContent,
      tracking_url: shareData.tracking_url,
      milestones,
      reward: milestones.length > 0 ? 'premium_days_added' : null,
      viral_boost: calculateViralBoost(type, platform)
    }), { headers });
  } catch (error) {
    console.error('Share handling error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process share' }), { 
      status: 500, 
      headers 
    });
  }
}

// Generate viral content templates
function generateViralContent(type, customContent) {
  const templates = {
    protection_stats: [
      "🛡️ Universal Sentinel just saved me from a $15,000 scam! The AI detected it in 0.3ms. Protecting my family is priceless. #AIProtection #ScamPrevention",
      "😱 Almost fell for a sophisticated phishing attack. Universal Sentinel's neural networks caught what I missed. This AI is incredible! #CyberSecurity #AIDetection",
      "💰 $45K saved by our community this month alone! Universal Sentinel's real-time protection is changing everything. #CommunityProtection #DigitalSafety"
    ],
    
    family_protection: [
      "👨‍👩‍👧‍👦 Our entire family is now protected by Universal Sentinel. The kids' devices, grandparents' phones - everyone's safe from online threats. #FamilyFirst #DigitalParenting",
      "🚨 Universal Sentinel detected a grooming attempt on my daughter's social media. As a parent, this AI gives me peace of mind. #ParentingInDigitalAge #ChildSafety",
      "🏠 Our family network blocked 47 threats this week. Universal Sentinel keeps us all connected and protected. #FamilyNetwork #SmartProtection"
    ],
    
    community_impact: [
      "🌍 347 families in our neighborhood use Universal Sentinel. Zero successful scams in 6 months. We're building a safer digital community! #CommunityWatch #TogetherStronger",
      "📊 Our city's threat map shows Universal Sentinel users are 94% less likely to fall for scams. This is how we protect each other! #DataDriven #CommunityProtection",
      "🤝 Shared a threat alert through Universal Sentinel and prevented 12 neighbors from losing money. This is what community protection looks like! #NeighborhoodWatch #DigitalSafety"
    ],
    
    achievement_unlock: [
      "🏆 Just unlocked 'Guardian Angel' achievement in Universal Sentinel! Helped protect 100+ people from online threats. Feels amazing to make a difference! #Achievement #DigitalHero",
      "⭐ 30-day protection streak! Universal Sentinel has been my digital bodyguard. The gamification makes staying safe actually fun! #ProtectionStreak #Gamification",
      "🎯 Reached 'Community Leader' status by sharing 50 threat alerts. Universal Sentinel makes protecting others rewarding! #CommunityLeader #ViralGood"
    ]
  };

  const categoryTemplates = templates[type] || templates.protection_stats;
  const randomTemplate = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
  
  return customContent || randomTemplate;
}

// Referral system with viral mechanics
async function handleCreateReferral(request, env, headers) {
  try {
    const { user_id, campaign } = await request.json();
    
    const referralCode = generateReferralCode(user_id);
    const referralLink = `https://universalsentinel.app?ref=${referralCode}&utm_source=referral&utm_campaign=${campaign}`;
    
    const referralData = {
      code: referralCode,
      user_id,
      campaign,
      link: referralLink,
      created_at: Date.now(),
      clicks: 0,
      conversions: 0,
      rewards_earned: 0
    };

    return new Response(JSON.stringify({
      success: true,
      referral_code: referralCode,
      referral_link: referralLink,
      potential_rewards: {
        per_signup: '7 days premium',
        per_subscription: '$10 credit',
        milestone_bonuses: ['50 referrals = 1 year free', '100 referrals = lifetime access']
      },
      sharing_templates: generateSharingTemplates(referralLink)
    }), { headers });
  } catch (error) {
    console.error('Referral creation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create referral' }), { 
      status: 500, 
      headers 
    });
  }
}

// Generate referral code
function generateReferralCode(userId) {
  const prefix = userId ? userId.substring(0, 3).toUpperCase() : 'USR';
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${random}`;
}

// Generate sharing templates for referrals
function generateSharingTemplates(referralLink) {
  return {
    whatsapp: `🛡️ I'm using Universal Sentinel to protect my family from online threats. The AI is incredible - it stopped a $15K scam attempt in 0.3ms! Get 7 days free: ${referralLink}`,
    
    facebook: `Friends, I had to share this! Universal Sentinel's AI just saved me from a sophisticated scam. The neural networks detected patterns I never would have seen. Protecting my family has never been easier. Try it free: ${referralLink}`,
    
    twitter: `🚨 Universal Sentinel's AI just blocked a major scam attempt. Sub-millisecond detection, 94% accuracy. This is the future of digital protection! Get started: ${referralLink} #AIProtection #CyberSecurity`,
    
    email: `Subject: This AI just saved me thousands\n\nHey!\n\nI had to tell you about Universal Sentinel. Their AI protection system just prevented me from falling for a $15,000 scam. The technology is incredible - it uses neural networks to detect threats in 0.3 milliseconds.\n\nI think you'd love it, especially with everything happening online these days. You can try it free for 7 days: ${referralLink}\n\nStay safe!\n[Your name]`,
    
    linkedin: `Professional network, I wanted to share something important. Universal Sentinel's AI-powered protection platform just prevented a sophisticated business email compromise attack on our company. The ROI on digital security has never been clearer. Check it out: ${referralLink}`
  };
}

// Achievement system for viral growth
async function handleAchievementUnlock(request, env, headers) {
  try {
    const { user_id, achievement_type, metadata } = await request.json();
    
    const achievements = {
      first_share: {
        title: 'Viral Starter',
        description: 'Shared your first protection story',
        reward: '3 days premium',
        badge: '🌟'
      },
      protection_streak_7: {
        title: 'Weekly Guardian',
        description: '7 days of continuous protection',
        reward: '7 days premium',
        badge: '🛡️'
      },
      referral_master: {
        title: 'Community Builder',
        description: 'Referred 10 new users',
        reward: '1 month premium',
        badge: '👥'
      },
      threat_reporter: {
        title: 'Digital Hero',
        description: 'Reported 50 community threats',
        reward: 'Lifetime premium',
        badge: '🦸'
      },
      family_protector: {
        title: 'Family Guardian',
        description: 'Protected entire family network',
        reward: 'Family plan upgrade',
        badge: '👨‍👩‍👧‍👦'
      }
    };

    const achievement = achievements[achievement_type];
    if (!achievement) {
      return new Response(JSON.stringify({ error: 'Achievement not found' }), { 
        status: 404, 
        headers 
      });
    }

    // Generate shareable achievement content
    const shareContent = `🏆 Just unlocked "${achievement.title}" in Universal Sentinel! ${achievement.description} ${achievement.badge}\n\nJoin me in building the world's safest digital community: https://universalsentinel.app?ref=achievement`;

    return new Response(JSON.stringify({
      success: true,
      achievement,
      share_content: shareContent,
      viral_boost: 1.5, // Achievement unlocks get 50% viral boost
      next_milestone: getNextMilestone(achievement_type),
      celebration_animation: `achievement_${achievement_type}.json`
    }), { headers });
  } catch (error) {
    console.error('Achievement unlock error:', error);
    return new Response(JSON.stringify({ error: 'Failed to unlock achievement' }), { 
      status: 500, 
      headers 
    });
  }
}

// Community threat alerts for viral spread
async function handleCommunityThreat(request, env, headers) {
  try {
    const { location, threat_type, severity, description, user_id } = await request.json();
    
    const threatAlert = {
      id: crypto.randomUUID(),
      location,
      threat_type,
      severity,
      description,
      reported_by: user_id,
      timestamp: Date.now(),
      verified_count: 1,
      community_impact: calculateCommunityImpact(location, threat_type)
    };

    // Generate viral alert content
    const alertContent = generateThreatAlert(threatAlert);
    
    return new Response(JSON.stringify({
      success: true,
      alert_id: threatAlert.id,
      alert_content: alertContent,
      community_reach: threatAlert.community_impact.potential_reach,
      viral_potential: threatAlert.community_impact.viral_score,
      sharing_encouraged: true,
      reward_for_sharing: 'Community points + premium days'
    }), { headers });
  } catch (error) {
    console.error('Community threat error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process threat alert' }), { 
      status: 500, 
      headers 
    });
  }
}

// Generate threat alert content
function generateThreatAlert(threat) {
  const alertTemplates = {
    phishing: `🚨 PHISHING ALERT - ${threat.location}\n\nNew phishing campaign detected targeting local residents. Universal Sentinel users are protected, but please warn others!\n\n${threat.description}\n\nStay safe: https://universalsentinel.app/community`,
    
    scam: `⚠️ SCAM WARNING - ${threat.location}\n\n${threat.description}\n\nUniversal Sentinel blocked this automatically, but your neighbors might be vulnerable. Share to protect your community!\n\nhttps://universalsentinel.app/alerts`,
    
    malware: `🦠 MALWARE ALERT - ${threat.location}\n\nMalicious software spreading in our area. Universal Sentinel's AI detected and blocked it instantly.\n\n${threat.description}\n\nProtect your devices: https://universalsentinel.app/protection`
  };

  return alertTemplates[threat.threat_type] || alertTemplates.scam;
}

// Viral leaderboard for competition
async function handleViralLeaderboard(env, headers) {
  try {
    const leaderboard = {
      top_protectors: [
        { name: 'Sarah M.', threats_blocked: 1247, referrals: 89, badge: '🏆' },
        { name: 'Mike R.', threats_blocked: 1156, referrals: 76, badge: '🥈' },
        { name: 'Lisa K.', threats_blocked: 1089, referrals: 67, badge: '🥉' },
        { name: 'David L.', threats_blocked: 987, referrals: 54, badge: '⭐' },
        { name: 'Emma W.', threats_blocked: 876, referrals: 43, badge: '⭐' }
      ],
      
      top_communities: [
        { location: 'San Francisco, CA', users: 15847, threats_blocked: 89234 },
        { location: 'New York, NY', users: 12456, threats_blocked: 76543 },
        { location: 'Austin, TX', users: 9876, threats_blocked: 54321 },
        { location: 'Seattle, WA', users: 8765, threats_blocked: 43210 },
        { location: 'Boston, MA', users: 7654, threats_blocked: 32109 }
      ],
      
      viral_champions: [
        { name: 'Alex P.', shares: 234, conversions: 89, viral_score: 4.2 },
        { name: 'Jordan T.', shares: 198, conversions: 76, viral_score: 3.8 },
        { name: 'Casey M.', shares: 167, conversions: 65, viral_score: 3.5 },
        { name: 'Riley S.', shares: 145, conversions: 54, viral_score: 3.2 },
        { name: 'Morgan L.', shares: 123, conversions: 43, viral_score: 2.9 }
      ],
      
      updated_at: Date.now(),
      next_update: Date.now() + 3600000 // 1 hour
    };

    return new Response(JSON.stringify(leaderboard), { headers });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch leaderboard' }), { 
      status: 500, 
      headers 
    });
  }
}

// WebSocket handler for real-time updates
async function handleWebSocket(request, env) {
  const upgradeHeader = request.headers.get('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  const [client, server] = Object.values(new WebSocketPair());
  
  server.accept();
  
  // Send initial metrics
  const metrics = await handleLiveMetrics(env, {});
  const metricsData = await metrics.json();
  server.send(JSON.stringify(metricsData));

  // Set up real-time updates every 5 seconds
  const interval = setInterval(async () => {
    try {
      const updatedMetrics = await handleLiveMetrics(env, {});
      const data = await updatedMetrics.json();
      server.send(JSON.stringify(data));
    } catch (error) {
      console.error('WebSocket update error:', error);
    }
  }, 5000);

  server.addEventListener('close', () => {
    clearInterval(interval);
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

// Helper functions
async function checkShareMilestones(userId) {
  // Simulate milestone checking
  const milestones = [];
  const shareCount = Math.floor(Math.random() * 100);
  
  if (shareCount === 1) milestones.push('First Share');
  if (shareCount === 10) milestones.push('Social Butterfly');
  if (shareCount === 50) milestones.push('Viral Champion');
  if (shareCount === 100) milestones.push('Community Leader');
  
  return milestones;
}

function calculateViralBoost(type, platform) {
  const boosts = {
    protection_stats: { facebook: 1.5, twitter: 1.3, whatsapp: 2.0 },
    family_protection: { facebook: 2.0, instagram: 1.8, whatsapp: 2.5 },
    community_impact: { twitter: 1.8, linkedin: 1.6, nextdoor: 3.0 },
    achievement_unlock: { instagram: 1.5, tiktok: 2.0, snapchat: 1.7 }
  };
  
  return boosts[type]?.[platform] || 1.0;
}

function calculateCommunityImpact(location, threatType) {
  return {
    potential_reach: Math.floor(Math.random() * 10000) + 1000,
    viral_score: (Math.random() * 3 + 2).toFixed(1), // 2.0 - 5.0
    urgency_level: threatType === 'scam' ? 'high' : 'medium'
  };
}

function getNextMilestone(achievementType) {
  const milestones = {
    first_share: 'Share 10 times for Social Butterfly',
    protection_streak_7: 'Reach 30 days for Monthly Guardian',
    referral_master: 'Refer 50 users for Viral Champion',
    threat_reporter: 'Report 100 threats for Community Hero',
    family_protector: 'Protect 10 families for Neighborhood Guardian'
  };
  
  return milestones[achievementType] || 'Keep protecting to unlock more achievements!';
}
