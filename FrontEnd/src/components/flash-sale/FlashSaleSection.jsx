import React, { useState, useEffect } from 'react';
import { Zap, Gift, Flame, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import FlashSaleTabs from './FlashSaleTabs';
import FlashSaleDateSelector from './FlashSaleDateSelector';
import FlashSaleTimeSelector from './FlashSaleTimeSelector';
import FlashSaleProductCard from './FlashSaleProductCard';
import ProductSlider from './ProductSlider';
import ProductCardSkeleton from '../ui/ProductCardSkeleton';

// ===== SKELETON =====
const FlashSaleSkeleton = () => (
  <section className="container mx-auto px-4 pt-6 pb-12">
    <div className="rounded-[24px] overflow-hidden shadow-2xl shadow-red-200/50">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 px-5 md:px-8 pt-6 pb-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-yellow-400/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-400/30 rounded-xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-7 w-36 bg-white/20 rounded-lg animate-pulse" />
              <div className="h-3 w-52 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            {[0,1,2,3].map(i => (
              <div key={i} className="w-12 h-14 bg-white/20 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Body skeleton */}
      <div className="bg-gradient-to-br from-red-700 via-red-800 to-red-900 px-4 md:px-5 pt-6 pb-8">
        <div className="flex gap-3 mb-5 overflow-hidden">
          {[0,1,2].map(i => (
            <div key={i} className={`h-10 bg-white/10 rounded-xl animate-pulse ${i === 0 ? 'w-28' : 'w-24'}`} />
          ))}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)]">
              <ProductCardSkeleton variant="flash-sale" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// ===== EMPTY STATE =====
const EmptyState = () => {
  const navigate = useNavigate();
  return (
    <section className="container mx-auto px-4 pt-6 pb-12">
      <div className="rounded-[24px] overflow-hidden shadow-2xl shadow-red-200/50">
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 px-5 md:px-8 pt-6 pb-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-yellow-400/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2.5 bg-yellow-400/80 rounded-xl shadow-lg shadow-yellow-400/30">
              <Zap size={24} className="text-red-700 fill-red-700" />
            </div>
            <div>
              <h2 className="text-white font-black text-xl md:text-2xl leading-none">FLASH SALE</h2>
              <p className="text-yellow-300 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-0.5">
                Khuyến mãi cực sốc
              </p>
            </div>
          </div>
          <svg className="absolute -bottom-px left-0 w-full h-10 text-white" viewBox="0 0 1440 40" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,40 C240,0 720,0 1440,40 L1440,40 L0,40 Z" />
          </svg>
        </div>

        <div className="bg-gradient-to-br from-red-700 via-red-800 to-red-900 px-4 md:px-6 pt-16 pb-16 flex flex-col items-center justify-center gap-5">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-full bg-yellow-400/20 flex items-center justify-center"
          >
            <Zap size={40} className="text-yellow-400 fill-yellow-400/50" />
          </motion.div>
          <div className="text-center space-y-2">
            <h3 className="text-white font-black text-lg">Chưa có sản phẩm khuyến mãi</h3>
            <p className="text-red-200/70 text-sm font-medium">
              Hãy quay lại sau để không bỏ lỡ các deal hời nhé!
            </p>
          </div>
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-red-800 font-black text-sm transition-all shadow-xl shadow-yellow-400/30 hover:shadow-yellow-400/50 hover:scale-105 active:scale-95"
          >
            <ShoppingBag size={16} />
            Xem sản phẩm khác
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};

// ===== MAIN COMPONENT =====
const FlashSaleSection = ({ flashSaleData, isLoading }) => {
  const navigate = useNavigate();
  const [activeCampaignIdx, setActiveCampaignIdx] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeProducts, setActiveProducts] = useState([]);
  const [featuredSession, setFeaturedSession] = useState(null);

  const campaigns = flashSaleData?.campaigns || [];

  // Find initial featured session
  useEffect(() => {
    if (campaigns.length > 0) {
      const firstCampaign = campaigns[activeCampaignIdx];
      if (firstCampaign?.sessions?.length > 0) {
        const runningSession = firstCampaign.sessions.find(s => s.isRunning);
        const upcomingSession = firstCampaign.sessions.find(s => s.isUpcoming);
        const selectedSession = runningSession || upcomingSession || firstCampaign.sessions[0];
        setActiveSessionId(selectedSession.id);
        setFeaturedSession(selectedSession);
        setActiveProducts(selectedSession.products || []);
      }
    }
  }, [campaigns, activeCampaignIdx]);

  // Update products when session changes
  useEffect(() => {
    if (!activeSessionId || campaigns.length === 0) return;
    const campaign = campaigns[activeCampaignIdx];
    if (!campaign?.sessions) return;
    const session = campaign.sessions.find(s => s.id === activeSessionId);
    if (session) {
      setFeaturedSession(session);
      setActiveProducts(session.products || []);
    }
  }, [activeSessionId, campaigns, activeCampaignIdx]);

  const handleCampaignChange = (idx) => {
    setActiveCampaignIdx(idx);
    const campaign = campaigns[idx];
    if (campaign?.sessions?.length > 0) {
      const runningSession = campaign.sessions.find(s => s.isRunning);
      const upcomingSession = campaign.sessions.find(s => s.isUpcoming);
      setActiveSessionId((runningSession || upcomingSession || campaign.sessions[0]).id);
    }
  };

  const handleSessionChange = (sessionId) => {
    setActiveSessionId(sessionId);
  };

  if (isLoading) return <FlashSaleSkeleton />;
  if (!campaigns || campaigns.length === 0) return <EmptyState />;

  const activeCampaign = campaigns[activeCampaignIdx];
  const hasMultipleCampaigns = campaigns.length > 1;
  const hasMultipleSessions = (activeCampaign?.sessions?.length || 0) > 1;
  const isSessionRunning = featuredSession?.isRunning;
  const isSessionEnded = featuredSession?.isEnded;

  return (
    <section className="container mx-auto px-4 pt-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="rounded-[24px] overflow-hidden shadow-2xl shadow-red-200/50"
      >
        {/* ===== HEADER ===== */}
        <div className={`relative px-5 md:px-8 pt-6 pb-0 overflow-hidden ${isSessionRunning ? 'bg-gradient-to-r from-red-600 via-red-700 to-red-800' : 'bg-gradient-to-r from-red-800 via-red-900 to-red-800'}`}>

          {/* Glow effects */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-yellow-400/25 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-400/20 rounded-full blur-3xl animate-pulse-slow" />

          {/* Header content row */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6">

            {/* Logo + Title + Status */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <div className={`absolute inset-0 rounded-xl blur-md ${isSessionRunning ? 'bg-yellow-400/50' : 'bg-yellow-400/30'}`} />
                <div className="relative p-2.5 bg-yellow-400 rounded-xl shadow-lg shadow-yellow-400/30">
                  <Zap size={24} className="text-red-700 fill-red-700" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-white font-black text-xl md:text-2xl leading-none">FLASH SALE</h2>

                  {isSessionRunning && (
                    <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-live-badge">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </span>
                  )}
                  {featuredSession?.isUpcoming && !isSessionRunning && !isSessionEnded && (
                    <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Sắp diễn ra
                    </span>
                  )}
                  {isSessionEnded && !isSessionRunning && (
                    <span className="inline-flex items-center gap-1 bg-slate-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Đã kết thúc
                    </span>
                  )}
                </div>

                <p className="text-yellow-300 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">
                  {activeCampaign.title}
                </p>
                {featuredSession && (
                  <p className="text-white/50 text-[9px] md:text-[10px] font-semibold mt-0.5">
                    {new Date(featuredSession.startAt).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}
                    {new Date(featuredSession.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {new Date(featuredSession.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>

            {/* Countdown */}
            <div className="shrink-0">
              <CountdownTimer
                remainingSeconds={featuredSession?.remainingSeconds}
                endAt={featuredSession?.endAt}
                compact={false}
                glow={isSessionRunning}
              />
            </div>
          </div>

          {/* Campaign Tabs */}
          {hasMultipleCampaigns && (
            <div className="relative z-10 flex items-center gap-2 pb-6 overflow-x-auto scrollbar-hide">
              <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest shrink-0">Chiến dịch:</span>
              <FlashSaleTabs
                campaigns={campaigns}
                activeIndex={activeCampaignIdx}
                onTabClick={handleCampaignChange}
              />
            </div>
          )}

          {/* Soft SVG wave */}
          <svg className="absolute -bottom-px left-0 w-full h-10 text-white" viewBox="0 0 1440 40" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,40 C240,0 720,0 1440,40 L1440,40 L0,40 Z" />
          </svg>
        </div>

        {/* ===== MAIN BODY ===== */}
        <div className="relative bg-gradient-to-br from-red-700 via-red-800 to-red-900 px-4 md:px-5 pt-6 pb-6 overflow-hidden">

          {/* Decorative elements */}
          <div className="absolute inset-0 border-y border-yellow-400/10 pointer-events-none" />
          <Gift size={48} className="absolute top-5 left-5 text-yellow-300/10 rotate-[-15deg]" />
          <Gift size={32} className="absolute top-14 right-7 text-yellow-300/8 rotate-[10deg]" />
          <Flame size={36} className="absolute bottom-5 right-14 text-orange-400/10 rotate-[20deg]" />

          {/* Running session glow line */}
          {isSessionRunning && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-80 animate-shimmer-move" />
          )}

          {/* Session date selector */}
          {hasMultipleSessions && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2.5">
                <Flame size={13} className="text-yellow-400 fill-yellow-400" />
                <span className="text-white/80 text-xs font-bold uppercase tracking-wider">Chọn khung giờ</span>
              </div>
              <FlashSaleDateSelector
                sessions={activeCampaign?.sessions || []}
                activeSessionId={activeSessionId}
                onSessionClick={handleSessionChange}
              />
            </div>
          )}

          {/* Session quick bar */}
          {hasMultipleSessions && (
            <div className="flex items-center gap-2 mb-5 overflow-x-auto scrollbar-hide">
              {activeCampaign?.sessions?.map((session) => {
                const isActive = session.id === activeSessionId;
                const isRunning = session.isRunning;
                const isEnded = session.isEnded;

                return (
                  <button
                    key={session.id}
                    onClick={() => handleSessionChange(session.id)}
                    className={`
                      flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 shrink-0
                      ${isActive && isRunning ? 'bg-yellow-400 text-red-800 shadow-lg shadow-yellow-400/40 ring-2 ring-yellow-300/50' : ''}
                      ${isActive && !isRunning && !isEnded ? 'bg-orange-400 text-white shadow-lg shadow-orange-400/40 ring-2 ring-orange-300/50' : ''}
                      ${isActive && isEnded ? 'bg-slate-400 text-white shadow-lg ring-2 ring-slate-300/50' : ''}
                      ${!isActive && isRunning ? 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20' : ''}
                      ${!isActive && !isRunning && !isEnded ? 'bg-white/5 text-white/50 hover:bg-white/15 border border-white/10' : ''}
                      ${!isActive && isEnded ? 'bg-white/5 text-white/40 border border-white/10' : ''}
                    `}
                  >
                    <span className="uppercase font-black tracking-wide">
                      {new Date(session.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isRunning && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />}
                    {isEnded && <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Products */}
          {activeProducts.length > 0 ? (
            <ProductSlider products={activeProducts} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <AlertCircle size={32} className="text-white/40" />
              </div>
              <p className="text-white/50 font-bold text-sm text-center">
                Không có sản phẩm nào trong khung giờ này
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default FlashSaleSection;
