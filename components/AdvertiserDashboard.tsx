import React, { useState, useEffect } from 'react';
import { User, AdZone, AdContent, AdRentalRequest } from '../types';
import { generateAdCopy } from '../services/geminiService';
import { 
  MapPin, Wand2, Loader2, Save, ShoppingBag, TrendingUp, ShieldCheck, 
  ArrowRight, Clock, Users, BarChart3, LogOut, Map as MapIcon, 
  ChevronRight, X, PlayCircle, Info, Target, DollarSign, Filter,
  CheckCircle2, AlertCircle, Timer, FileText, Layout, Wallet, CreditCard, Plus, History, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';

interface AdvertiserDashboardProps {
  user: User;
  screen: string;
  ads: AdZone[];
  onAddAd: (req: Partial<AdRentalRequest>) => void;
  isHighContrast: boolean;
  onNavigateToMap: () => void;
  onLogout: () => void;
  rentalRequests: AdRentalRequest[];
  initialSelectedZone?: AdZone | null;
  onAddFunds?: (amount: number) => void;
}

export const AdvertiserDashboard: React.FC<AdvertiserDashboardProps> = ({ 
    user,
    ads, 
    onAddAd, 
    isHighContrast, 
    onLogout,
    onNavigateToMap,
    rentalRequests = [],
    initialSelectedZone,
    onAddFunds
}) => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'marketplace' | 'wallet'>('campaigns');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedZone, setSelectedZone] = useState<AdZone | null>(null);
  const [productName, setProductName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetViews, setTargetViews] = useState(1000);
  const [newAd, setNewAd] = useState<AdContent>({ title: '', description: '', rewardPoints: 50, companyName: '', videoUrl: '' });
  const [viewingCampaign, setViewingCampaign] = useState<AdRentalRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'REJECTED'>('ALL');
  
  // Wallet State
  const [amountToAdd, setAmountToAdd] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (initialSelectedZone) {
      setSelectedZone(initialSelectedZone);
      setIsCreating(true);
      setActiveTab('marketplace');
    }
  }, [initialSelectedZone]);

  const cardClass = isHighContrast ? 'bg-gray-900 border-2 border-yellow-400 text-yellow-400' : 'bg-white border border-gray-200 shadow-sm text-gray-800';

  const handleGenerate = async () => {
    if (!productName) return;
    setIsGenerating(true);
    const content = await generateAdCopy(productName, newAd.rewardPoints || 50);
    setNewAd(prev => ({ ...prev, ...content }));
    setIsGenerating(false);
  };
  
  const handleAddFunds = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountToAdd);
    if (!val || val <= 0) return;
    
    setIsProcessingPayment(true);
    setTimeout(() => {
       onAddFunds?.(val);
       setAmountToAdd('');
       setIsProcessingPayment(false);
    }, 1500);
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'ACTIVE': return { label: 'Approved & Live', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', dot: 'bg-green-500' };
      case 'PENDING': return { label: 'Waiting Approval', icon: Timer, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', dot: 'bg-orange-500' };
      case 'REJECTED': return { label: 'Declined', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-500' };
      case 'COMPLETED': return { label: 'Finished', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-500' };
      default: return { label: status, icon: Info, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', dot: 'bg-gray-400' };
    }
  };

  const filteredRequests = rentalRequests.filter(req => 
    statusFilter === 'ALL' || req.status === statusFilter
  ).sort((a,b) => b.createdAt - a.createdAt);

  if (isCreating && selectedZone) {
    const totalPrice = (selectedZone.pricePer1k * targetViews) / 1000;
    return (
      <div className={`h-full flex flex-col p-4 pb-20 overflow-y-auto ${isHighContrast ? 'bg-black' : 'bg-gray-50'}`}>
         <div className="flex items-center gap-2 mb-6">
            <button onClick={() => { setIsCreating(false); setSelectedZone(null); }} className="p-2"><ArrowRight className="rotate-180"/></button>
            <h2 className="text-xl font-bold">New Campaign</h2>
         </div>
         <div className={`${cardClass} p-5 rounded-3xl space-y-5 shadow-xl`}>
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50">
               <div className="flex justify-between items-center mb-3">
                  <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Reach & Budget</p>
                  <span className="text-xs font-black text-indigo-600">${selectedZone.pricePer1k.toFixed(2)} CPM</span>
               </div>
               <input type="range" min="1000" max="25000" step="1000" value={targetViews} onChange={e => setTargetViews(parseInt(e.target.value))} className="w-full accent-indigo-600" />
               <div className="flex justify-between mt-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold opacity-40 uppercase">Impressions</span>
                    <span className="text-lg font-black">{targetViews.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold opacity-40 uppercase">Proposal Total</span>
                    <span className="text-lg font-black text-indigo-700">${totalPrice.toFixed(2)}</span>
                  </div>
               </div>
            </div>
            
            <div className="space-y-4">
               <div className="space-y-1">
                  <p className="text-[10px] font-black opacity-40 uppercase ml-1">Brand Name</p>
                  <input placeholder="Who is advertising?" value={newAd.companyName} onChange={e => setNewAd({...newAd, companyName: e.target.value})} className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50/50 outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black opacity-40 uppercase ml-1">Video Asset URL (Optional)</p>
                  <input placeholder="https://..." value={newAd.videoUrl || ''} onChange={e => setNewAd({...newAd, videoUrl: e.target.value})} className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50/50 outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black opacity-40 uppercase ml-1">AI Content Assistant</p>
                  <div className="flex gap-2">
                     <input placeholder="Describe your product..." value={productName} onChange={e => setProductName(e.target.value)} className="flex-1 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium" />
                     <button onClick={handleGenerate} className="bg-indigo-600 text-white px-5 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                        {isGenerating ? <Loader2 className="animate-spin" size={20}/> : <Wand2 size={20}/>}
                     </button>
                  </div>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black opacity-40 uppercase ml-1">Campaign Title</p>
                  <input placeholder="Main Headline" value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50/50 outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black opacity-40 uppercase ml-1">Promo Details</p>
                  <textarea placeholder="Tell users why to click..." value={newAd.description} onChange={e => setNewAd({...newAd, description: e.target.value})} className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50/50 outline-none focus:border-indigo-600 focus:bg-white transition-all text-sm h-24 resize-none" />
               </div>
            </div>
            
            <button 
               onClick={() => { 
                 onAddAd({ 
                   zoneId: selectedZone.id, 
                   adContent: newAd, 
                   targetViews, 
                   pricePer1k: selectedZone.pricePer1k, 
                   totalPrice, 
                   advertiserName: newAd.companyName || user.name 
                 }); 
                 setIsCreating(false); 
                 setSelectedZone(null); 
                 setActiveTab('campaigns'); 
               }} 
               className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-base shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
               <FileText size={22}/> Submit Campaign for Approval
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${isHighContrast ? 'bg-black' : 'bg-[#f8f9fc]'}`}>
      {/* Detailed Modal */}
      {viewingCampaign && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in">
          <div className={`w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-12 ${isHighContrast ? 'bg-black border-2 border-yellow-400 text-yellow-400' : 'bg-white'}`}>
            <div className="relative aspect-video bg-gray-900 flex items-center justify-center overflow-hidden">
              {viewingCampaign.adContent.videoUrl ? (
                <video src={viewingCampaign.adContent.videoUrl} autoPlay loop controls className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-3 opacity-20">
                  <Layout size={64} className="text-white" />
                  <span className="text-white text-xs font-bold uppercase tracking-widest">Image Content</span>
                </div>
              )}
              <button onClick={() => setViewingCampaign(null)} className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-colors"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <h3 className="text-2xl font-black leading-tight mb-1">{viewingCampaign.adContent.title}</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">{viewingCampaign.adContent.companyName}</span>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-1.5 ${getStatusDisplay(viewingCampaign.status).bg} ${getStatusDisplay(viewingCampaign.status).color}`}>
                  {React.createElement(getStatusDisplay(viewingCampaign.status).icon, { size: 12 })}
                  {getStatusDisplay(viewingCampaign.status).label}
                </div>
              </div>
              
              <div className="space-y-4">
                 <p className="text-sm opacity-70 leading-relaxed font-medium bg-gray-50 p-4 rounded-2xl">"{viewingCampaign.adContent.description}"</p>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-3xl bg-indigo-50/50 border border-indigo-100/50">
                     <p className="text-[9px] font-black uppercase opacity-40 mb-1 tracking-widest">Proposal</p>
                     <p className="text-xl font-black text-indigo-700">${viewingCampaign.totalPrice.toFixed(2)}</p>
                   </div>
                   <div className="p-4 rounded-3xl bg-green-50/50 border border-green-100/50">
                     <p className="text-[9px] font-black uppercase opacity-40 mb-1 tracking-widest">Reward</p>
                     <p className="text-xl font-black text-green-700">{viewingCampaign.adContent.rewardPoints} Pts</p>
                   </div>
                 </div>

                 <div className="space-y-3">
                   <div className="flex justify-between items-end px-1">
                     <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Fulfillment Progress</p>
                     <p className="text-xs font-black tabular-nums">{viewingCampaign.currentViews.toLocaleString()} / {viewingCampaign.targetViews.toLocaleString()}</p>
                   </div>
                   <div className={`w-full h-2.5 rounded-full overflow-hidden ${isHighContrast ? 'bg-gray-800' : 'bg-gray-100'}`}>
                     <div 
                       className={`h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.1)] ${
                         viewingCampaign.status === 'ACTIVE' ? 'bg-green-500' : 
                         viewingCampaign.status === 'COMPLETED' ? 'bg-blue-500' : 
                         viewingCampaign.status === 'REJECTED' ? 'bg-red-500' : 'bg-orange-400'
                       }`} 
                       style={{ width: `${(viewingCampaign.currentViews / viewingCampaign.targetViews) * 100}%` }}
                     />
                   </div>
                 </div>
              </div>

              <button onClick={() => setViewingCampaign(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl">Back to List</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`p-4 flex justify-between items-center sticky top-0 z-10 ${isHighContrast ? 'bg-gray-900 border-b border-yellow-400' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg">
                {user.name?.charAt(0) || 'A'}
             </div>
             <div>
                <h1 className="text-lg font-bold leading-none">Campaigns</h1>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Advertiser Control Center</p>
             </div>
          </div>
          <button onClick={onLogout} className="px-4 py-2 text-red-500 font-black text-[11px] uppercase tracking-widest rounded-lg hover:bg-red-50">Log Out</button>
      </div>
      
      {/* Navigation Sub-Tabs */}
      <div className="flex p-2 gap-2 bg-white border-b border-gray-100">
        <button onClick={() => setActiveTab('campaigns')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${activeTab === 'campaigns' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 text-gray-400'}`}>My Ads</button>
        <button onClick={() => setActiveTab('marketplace')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${activeTab === 'marketplace' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 text-gray-400'}`}>Discovery</button>
        <button onClick={() => setActiveTab('wallet')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${activeTab === 'wallet' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 text-gray-400'}`}>Wallet</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-6">
         {activeTab === 'campaigns' ? (
            <>
               {/* Categories for Real feel */}
               <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                  <button onClick={() => setStatusFilter('ALL')} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all border ${statusFilter === 'ALL' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-400'}`}>All Ads</button>
                  <button onClick={() => setStatusFilter('ACTIVE')} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all border ${statusFilter === 'ACTIVE' ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-200 text-gray-400'}`}>Approved</button>
                  <button onClick={() => setStatusFilter('PENDING')} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all border ${statusFilter === 'PENDING' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-gray-200 text-gray-400'}`}>Pending</button>
                  <button onClick={() => setStatusFilter('REJECTED')} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all border ${statusFilter === 'REJECTED' ? 'bg-red-500 text-white border-red-500' : 'bg-white border-gray-200 text-gray-400'}`}>Declined</button>
               </div>

               {filteredRequests.length === 0 ? (
                  <div className="py-24 text-center space-y-5 animate-in fade-in">
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto shadow-inner border-4 border-white">
                        <Target size={36} className="text-gray-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-gray-900 uppercase tracking-widest">No Campaigns Found</p>
                        <p className="text-[11px] opacity-50 max-w-[220px] mx-auto font-bold leading-relaxed">You haven't submitted any ad proposals in this category yet.</p>
                      </div>
                      <button onClick={() => setActiveTab('marketplace')} className="bg-indigo-600 text-white px-8 py-3 rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95">Browse Discovery</button>
                  </div>
               ) : (
                  <div className="space-y-4">
                      {filteredRequests.map(req => {
                          const progress = (req.currentViews / req.targetViews) * 100;
                          const status = getStatusDisplay(req.status);
                          return (
                              <div 
                                key={req.id} 
                                onClick={() => setViewingCampaign(req)}
                                className={`${cardClass} p-5 rounded-[32px] transition-all active:scale-[0.98] cursor-pointer group hover:shadow-xl hover:translate-y-[-2px] animate-in fade-in slide-in-from-bottom-2`}
                              >
                                  <div className="flex justify-between items-start mb-5">
                                      <div className="max-w-[70%]">
                                          <div className="flex items-center gap-2 mb-1.5">
                                             <div className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`}></div>
                                             <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${status.bg} ${status.color}`}>
                                                {status.label}
                                             </span>
                                          </div>
                                          <h4 className="font-black text-lg truncate group-hover:text-indigo-600 transition-colors">{req.adContent.title}</h4>
                                          <p className="text-[10px] opacity-40 uppercase font-black flex items-center gap-1 mt-0.5 tracking-tighter">
                                             <Clock size={10}/> Submitted on {new Date(req.createdAt).toLocaleDateString()}
                                          </p>
                                      </div>
                                      <div className="text-right">
                                         <p className="text-lg font-black text-indigo-700 tabular-nums">${req.totalPrice.toFixed(2)}</p>
                                         <p className="text-[8px] opacity-40 font-black uppercase tracking-widest">Budget</p>
                                      </div>
                                  </div>
                                  
                                  <div className="space-y-2.5 mb-6">
                                      <div className="flex justify-between items-center text-[9px] font-black">
                                          <span className="opacity-30 uppercase tracking-widest">Performance Track</span>
                                          <span className="tabular-nums opacity-60 font-bold">{req.currentViews.toLocaleString()} / {req.targetViews.toLocaleString()} views</span>
                                      </div>
                                      <div className={`w-full h-2 rounded-full overflow-hidden ${isHighContrast ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                          <div 
                                            className={`h-full transition-all duration-700 shadow-[0_0_8px_rgba(0,0,0,0.05)] ${
                                              req.status === 'ACTIVE' ? 'bg-green-500' : 
                                              req.status === 'COMPLETED' ? 'bg-blue-500' : 
                                              req.status === 'REJECTED' ? 'bg-red-500' : 'bg-orange-400'
                                            }`} 
                                            style={{ width: `${progress}%` }} 
                                          />
                                      </div>
                                  </div>
                                  
                                  <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                      <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[10px]">
                                            {req.adContent.rewardPoints}
                                         </div>
                                         <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Points per view</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 opacity-60 group-hover:opacity-100 transition-opacity">
                                         VIEW DETAILS <ChevronRight size={14}/>
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
               )}
            </>
         ) : activeTab === 'wallet' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
               {/* Updated Balance Card Design */}
               <div className="relative w-full h-56 rounded-[32px] overflow-hidden p-6 flex flex-col justify-between shadow-2xl transition-transform transform hover:scale-[1.01] bg-black">
                  {/* Background Gradient & Effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] z-0"></div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500 opacity-20 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4 pointer-events-none"></div>
                  
                  {/* Content Layer */}
                  <div className="relative z-10 flex flex-col h-full justify-between">
                      {/* Top Row */}
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                                 <Wallet size={12} className="text-indigo-300" /> Current Balance
                              </p>
                              <h2 className="text-5xl font-black text-white tracking-tight drop-shadow-sm">
                                 <span className="text-2xl opacity-50 align-top mr-1">$</span>{user.balance.toFixed(2)}
                              </h2>
                          </div>
                          {/* Card Chip Visual */}
                          <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-80 shadow-inner border border-yellow-600/30 flex items-center justify-center">
                             <div className="w-full h-[1px] bg-black/10"></div>
                          </div>
                      </div>

                      {/* Bottom Row */}
                      <div className="space-y-3">
                          <p className="text-[9px] text-indigo-200/60 font-mono uppercase tracking-widest">Quick Top-up</p>
                          <div className="flex gap-3">
                            {[100, 500, 1000].map(amt => (
                                <button 
                                  key={amt}
                                  onClick={() => setAmountToAdd(amt.toString())}
                                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1 group"
                                >
                                  <Plus size={10} className="opacity-50 group-hover:opacity-100 transition-opacity"/> ${amt}
                                </button>
                            ))}
                          </div>
                      </div>
                  </div>
                  
                  {/* Decorative Circles */}
                  <div className="absolute -bottom-6 -right-6 flex opacity-10 pointer-events-none">
                     <div className="w-24 h-24 rounded-full bg-white mix-blend-overlay"></div>
                     <div className="w-24 h-24 rounded-full bg-white mix-blend-overlay -ml-12"></div>
                  </div>
               </div>

               {/* Add Funds Form */}
               <div className={`${cardClass} p-5 rounded-3xl space-y-4`}>
                  <h3 className="text-xs font-black uppercase opacity-40 tracking-widest flex items-center gap-2">
                     <Plus size={14} /> Add Funds
                  </h3>
                  <div className="flex gap-3">
                     <div className="relative flex-1">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</div>
                        <input 
                           type="number" 
                           placeholder="0.00" 
                           value={amountToAdd}
                           onChange={(e) => setAmountToAdd(e.target.value)}
                           className={`w-full pl-8 pr-4 py-3 rounded-2xl outline-none font-bold ${isHighContrast ? 'bg-gray-800' : 'bg-gray-50'}`}
                        />
                     </div>
                     <button 
                        onClick={handleAddFunds}
                        disabled={!amountToAdd || isProcessingPayment}
                        className="px-6 rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-lg shadow-indigo-100 disabled:opacity-50 active:scale-95 transition-all"
                     >
                        {isProcessingPayment ? <Loader2 className="animate-spin" /> : 'Pay'}
                     </button>
                  </div>
                  <p className="text-[10px] opacity-40 leading-tight">
                     Secure payment processing powered by Stripe integration (Mock). Funds are available immediately.
                  </p>
               </div>

               {/* History */}
               <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase opacity-40 tracking-widest flex items-center gap-2 px-1">
                     <History size={14} /> Campaign Transactions
                  </h3>
                  
                  {rentalRequests.filter(r => r.status === 'ACTIVE' || r.status === 'COMPLETED').length === 0 ? (
                     <div className="text-center py-10 opacity-30 italic text-xs">No transaction history found.</div>
                  ) : (
                     rentalRequests
                        .filter(r => r.status === 'ACTIVE' || r.status === 'COMPLETED')
                        .sort((a,b) => b.createdAt - a.createdAt)
                        .map(req => (
                           <div key={req.id} className={`${cardClass} p-4 rounded-2xl flex items-center justify-between`}>
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                                    <ArrowUpRight size={18} />
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-xs truncate max-w-[150px]">{req.adContent.title}</h4>
                                    <p className="text-[9px] opacity-40 uppercase font-black">Campaign Deduction</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="font-black text-red-500">-${req.totalPrice.toFixed(2)}</p>
                                 <p className="text-[8px] opacity-30 uppercase">{new Date(req.createdAt).toLocaleDateString()}</p>
                              </div>
                           </div>
                        ))
                  )}
               </div>
            </div>
         ) : (
            <>
               <div className="flex justify-between items-center px-1 mb-2">
                  <h3 className="text-xs font-black uppercase opacity-40 tracking-widest">Explore Ad Spaces</h3>
                  <button 
                    onClick={onNavigateToMap}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100 active:scale-95"
                  >
                    <MapIcon size={14}/> Live Map
                  </button>
               </div>
               
               {ads.filter(z => z.isActive).length === 0 ? (
                   <div className="py-24 text-center opacity-30 italic">No zones currently available for rent.</div>
               ) : (
                   ads.filter(z => z.isActive).map(z => (
                       <div key={z.id} className={`${cardClass} p-6 rounded-[32px] group transition-all hover:shadow-2xl border-b-4 border-b-gray-100 hover:border-b-indigo-600`}>
                           <div className="flex justify-between items-start mb-6">
                               <div>
                                 <h3 className="font-black text-xl group-hover:text-indigo-600 transition-colors">{z.name}</h3>
                                 <div className="flex items-center gap-2 mt-1.5">
                                    <p className="text-[10px] opacity-50 flex items-center gap-1 font-black uppercase bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100"><MapPin size={10}/> {z.shape}</p>
                                    <p className="text-[10px] opacity-40 font-black uppercase tracking-tighter">Verified Space</p>
                                 </div>
                               </div>
                               <div className="text-right">
                                 <p className="text-2xl font-black text-indigo-600 tabular-nums">${z.pricePer1k.toFixed(2)}</p>
                                 <p className="text-[9px] opacity-40 font-black uppercase tracking-widest">CPM Rate</p>
                               </div>
                           </div>
                           <button onClick={() => { setSelectedZone(z); setIsCreating(true); }} className="w-full py-4.5 bg-indigo-600 text-white rounded-[20px] font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 active:scale-95 transition-all">
                              Start Campaign Here <ArrowRight size={20}/>
                           </button>
                       </div>
                   ))
               )}
            </>
         )}
      </div>
    </div>
  );
};