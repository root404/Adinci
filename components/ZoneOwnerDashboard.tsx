import React, { useState, useEffect } from 'react';
import { User, AdZone, AdRentalRequest } from '../types';
import { PLATFORM_COMMISSION } from '../constants';
import { 
  LogOut, Wallet, MapPin, CheckCircle, XCircle, TrendingUp, Package, 
  Bell, Edit2, History, Trash2, Calendar, LayoutDashboard, Map as MapIcon,
  CreditCard, ArrowUpRight, BarChart3, ChevronRight, Clock, Info, ShieldCheck, PlayCircle,
  DollarSign, Maximize, ExternalLink, ChevronDown, ChevronUp, Plus, Power, AlertCircle,
  Check, Target, TrendingDown, Filter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ZoneOwnerDashboardProps {
  user: User;
  zones: AdZone[];
  rentalRequests: AdRentalRequest[];
  onApprove: (requestId: string, approve: boolean) => void;
  isHighContrast: boolean;
  onLogout: () => void;
  onEditZone?: (zone: AdZone) => void;
  onRenewZone?: (zone: AdZone) => void;
  onDeleteZone?: (zoneId: string) => void;
  onToggleStatus?: (zoneId: string) => void;
  onNavigateToMap?: () => void;
  onWithdraw?: () => void;
}

export const ZoneOwnerDashboard: React.FC<ZoneOwnerDashboardProps> = ({
  user,
  zones,
  rentalRequests,
  onApprove,
  isHighContrast,
  onLogout,
  onEditZone,
  onRenewZone,
  onDeleteZone,
  onToggleStatus,
  onNavigateToMap,
  onWithdraw
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'zones' | 'requests' | 'analytics' | 'earnings'>('home');
  const [requestFilter, setRequestFilter] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [previewAd, setPreviewAd] = useState<AdRentalRequest | null>(null);

  const pendingRequests = rentalRequests.filter(r => r.status === 'PENDING' && zones.some(z => z.id === r.zoneId));
  const historyRequests = rentalRequests.filter(r => (r.status === 'ACTIVE' || r.status === 'REJECTED' || r.status === 'COMPLETED') && zones.some(z => z.id === r.zoneId)).sort((a,b) => b.createdAt - a.createdAt);
  
  const activeRentals = rentalRequests.filter(r => r.status === 'ACTIVE' && zones.some(z => z.id === r.zoneId));
  const ownerRentals = rentalRequests.filter(r => zones.some(z => z.id === r.zoneId));

  const cardClass = isHighContrast 
    ? 'bg-gray-900 border-2 border-yellow-400 text-yellow-400' 
    : 'bg-white border border-gray-200 shadow-sm text-gray-800';

  const calculateArea = (zone: AdZone) => {
    return zone.shape === 'CIRCLE' 
      ? Math.round(Math.PI * zone.radius * zone.radius) 
      : Math.round(zone.width * zone.height);
  };

  const getStatusLabel = (zone: AdZone) => {
    if (!zone.isActive) return 'Deactivated';
    if (zone.expiryDate && zone.expiryDate < Date.now()) return 'Expired';
    return 'Active';
  };

  const getStatusColor = (zone: AdZone) => {
    const status = getStatusLabel(zone);
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Deactivated': return 'bg-gray-100 text-gray-700';
      case 'Expired': return 'bg-red-100 text-red-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };
  
  const getRequestStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'COMPLETED': return 'bg-blue-100 text-blue-700';
      case 'PENDING': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTimeRemaining = (expiry?: number) => {
    if (!expiry) return 'Draft';
    const diff = expiry - Date.now();
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h left`;
  };

  // Analytics Calculations
  const totalViews = ownerRentals.reduce((sum, r) => sum + r.currentViews, 0);
  const estTotalRevenue = ownerRentals.reduce((sum, r) => {
    return sum + (r.currentViews * r.pricePer1k / 1000 * (1 - PLATFORM_COMMISSION));
  }, 0);

  const chartData = ownerRentals.slice(0, 5).map(r => ({
    name: r.adContent.title.length > 10 ? r.adContent.title.substring(0, 10) + '...' : r.adContent.title,
    views: r.currentViews,
    revenue: parseFloat((r.currentViews * r.pricePer1k / 1000 * (1 - PLATFORM_COMMISSION)).toFixed(2))
  }));

  // Dynamic Notifications based on Real Data
  const notifications = [
    ...pendingRequests.map(r => ({ 
       id: `notif-${r.id}`, 
       type: 'request', 
       text: `New Proposal: ${r.adContent.title} by ${r.advertiserName}`, 
       time: 'Just now' 
    })),
    // Fallback static notifications if no real data
    ...(pendingRequests.length === 0 ? [
        { id: 'static-1', type: 'info', text: 'System is running smoothly.', time: 'Now' }
    ] : [])
  ];

  return (
    <div className={`h-full flex flex-col ${isHighContrast ? 'bg-black' : 'bg-[#f7f8fa]'}`}>
      {/* Header */}
      <div className={`p-4 flex justify-between items-center sticky top-0 z-10 ${isHighContrast ? 'bg-gray-900 border-b border-yellow-400' : 'bg-white shadow-sm border-b border-gray-100'}`}>
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg">
             {user.name.charAt(0)}
           </div>
           <div>
             <h1 className="text-lg font-bold leading-none">{user.name}</h1>
             <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Zone Owner Account</p>
           </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setActiveTab('requests')} className={`p-2 rounded-full relative ${isHighContrast ? 'text-yellow-400' : 'text-gray-400 hover:bg-gray-100'}`}>
              <Bell size={20} />
              {pendingRequests.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
           </button>
           <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><LogOut size={20} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        
        {/* Navigation Tabs */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {[
            { id: 'home', icon: LayoutDashboard, label: 'Home' },
            { id: 'zones', icon: MapIcon, label: 'Zones' },
            { id: 'requests', icon: Bell, label: 'Inbox', badge: pendingRequests.length },
            { id: 'analytics', icon: BarChart3, label: 'Stats' },
            { id: 'earnings', icon: Wallet, label: 'Wallet' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-all relative ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={18} />
              <span className="text-[9px] mt-1 font-bold uppercase">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center border-2 border-white">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
             <div className="grid grid-cols-2 gap-3">
                <div className={`${cardClass} p-4 rounded-2xl`}>
                   <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-black opacity-60 uppercase">Settled Revenue</p>
                      <ArrowUpRight size={14} className="text-green-500" />
                   </div>
                   <p className="text-2xl font-black">${user.totalEarnings?.toFixed(2)}</p>
                   <p className="text-[8px] opacity-40 font-bold mt-1">TOTAL EARNED</p>
                </div>
                <div className={`${cardClass} p-4 rounded-2xl`}>
                   <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-black opacity-60 uppercase">Active Ads</p>
                      <ShieldCheck size={14} className="text-indigo-500" />
                   </div>
                   <p className="text-2xl font-black text-indigo-600">{activeRentals.length}</p>
                   <p className="text-[8px] opacity-40 font-bold mt-1">CURRENTLY RUNNING</p>
                </div>
             </div>

             <div className={`${cardClass} p-5 rounded-2xl`}>
                <h3 className="text-sm font-black uppercase opacity-60 mb-4 flex items-center gap-2">
                   <Bell size={16} /> Alerts & Notifications
                </h3>
                <div className="space-y-3">
                   {notifications.map(n => (
                     <div key={n.id} className="flex gap-3 items-start pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className={`mt-0.5 w-2 h-2 rounded-full ${n.type === 'request' ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1">
                           <p className="text-xs font-medium">{n.text}</p>
                           <p className="text-[9px] opacity-40 font-bold">{n.time}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* TAB: ZONES */}
        {activeTab === 'zones' && (
           <div className="space-y-4 animate-in fade-in">
              <div className="flex justify-between items-center mb-2">
                 <h3 className="text-xs font-black uppercase opacity-40 tracking-widest">My Locations</h3>
                 <button onClick={onNavigateToMap} className="p-2 bg-indigo-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-lg">
                    <Plus size={12}/> New
                 </button>
              </div>
              
              {zones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                   <MapPin size={48} className="mb-4" />
                   <p className="text-sm font-bold">No zones created.</p>
                   <p className="text-[10px] mt-2">Go to Map to create one.</p>
                </div>
              ) : zones.map(z => (
                  <div key={z.id} className={`${cardClass} p-0 rounded-2xl overflow-hidden mb-4`}>
                    <div className="p-4 flex justify-between items-center border-b border-gray-50">
                       <div>
                          <h4 className="font-bold text-sm">{z.name}</h4>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${getStatusColor(z)}`}>
                            {getStatusLabel(z).toUpperCase()}
                          </span>
                       </div>
                       <button onClick={() => onEditZone?.(z)} className="p-2 text-gray-400"><Edit2 size={16}/></button>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                           <span className="text-[9px] opacity-40 font-black uppercase">Area</span>
                           <span className="text-xs font-bold">{calculateArea(z)} m²</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[9px] opacity-40 font-black uppercase">Expiry</span>
                           <span className="text-xs font-bold">{getTimeRemaining(z.expiryDate)}</span>
                        </div>
                    </div>
                  </div>
              ))}
           </div>
        )}

        {/* TAB: ANALYTICS */}
        {activeTab === 'analytics' && (
           <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-end px-1">
                 <h3 className="text-xs font-black uppercase opacity-40 tracking-widest">Performance Dashboard</h3>
                 <span className="text-[10px] font-bold opacity-30">Real-time stats</span>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                 <div className={`${cardClass} p-3 rounded-2xl text-center`}>
                    <div className="flex justify-center mb-1 text-indigo-600"><TrendingUp size={16}/></div>
                    <p className="text-lg font-black">{totalViews.toLocaleString()}</p>
                    <p className="text-[8px] opacity-40 font-black uppercase">Total Views</p>
                 </div>
                 <div className={`${cardClass} p-3 rounded-2xl text-center`}>
                    <div className="flex justify-center mb-1 text-green-600"><DollarSign size={16}/></div>
                    <p className="text-lg font-black text-green-700">${estTotalRevenue.toFixed(2)}</p>
                    <p className="text-[8px] opacity-40 font-black uppercase">Ad Revenue</p>
                 </div>
                 <div className={`${cardClass} p-3 rounded-2xl text-center`}>
                    <div className="flex justify-center mb-1 text-purple-600"><Target size={16}/></div>
                    <p className="text-lg font-black">{ownerRentals.length}</p>
                    <p className="text-[8px] opacity-40 font-black uppercase">Campaigns</p>
                 </div>
              </div>

              {/* Views Chart */}
              <div className={`${cardClass} p-5 rounded-3xl h-64 flex flex-col`}>
                 <h4 className="text-[10px] font-black uppercase opacity-40 mb-4 flex items-center gap-2">
                    <BarChart3 size={14}/> Campaign Impact (Top 5)
                 </h4>
                 <div className="flex-1 w-full">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" fontSize={8} tick={{fontWeight: 'bold'}} stroke="#ccc" />
                            <YAxis fontSize={8} stroke="#ccc" />
                            <Tooltip 
                               cursor={{fill: '#f8fafc'}}
                               contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }}
                            />
                            <Bar dataKey="views" radius={[4, 4, 0, 0]} name="Views">
                               {chartData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#818cf8'} />
                               ))}
                            </Bar>
                         </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center opacity-20 italic text-xs">No active data to chart</div>
                    )}
                 </div>
              </div>

              {/* Detailed Ad Performance List */}
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase opacity-40 px-1 tracking-widest">Campaign Breakdown</h4>
                 {ownerRentals.length === 0 ? (
                    <div className="py-12 text-center opacity-20">No campaigns found</div>
                 ) : (
                    ownerRentals.map(r => {
                       const revenue = r.currentViews * r.pricePer1k / 1000 * (1 - PLATFORM_COMMISSION);
                       const progress = (r.currentViews / r.targetViews) * 100;
                       const zone = zones.find(z => z.id === r.zoneId);
                       
                       return (
                          <div key={r.id} className={`${cardClass} p-5 rounded-[28px] space-y-4 shadow-sm border-b-2 border-b-indigo-50`}>
                             <div className="flex justify-between items-start">
                                <div className="max-w-[70%]">
                                   <h5 className="font-black text-sm text-gray-900 truncate">{r.adContent.title}</h5>
                                   <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-tighter mt-0.5">
                                      {zone?.name || 'Unknown Zone'}
                                   </p>
                                </div>
                                <div className="text-right">
                                   <p className="text-sm font-black text-green-700">${revenue.toFixed(2)}</p>
                                   <p className="text-[8px] font-black opacity-30 uppercase">Revenue (Net)</p>
                                </div>
                             </div>

                             <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                   <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Views Fulfilled</span>
                                   <span className="text-[10px] font-black tabular-nums">{r.currentViews.toLocaleString()} / {r.targetViews.toLocaleString()}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                   <div 
                                     className={`h-full transition-all duration-1000 ${r.status === 'COMPLETED' ? 'bg-indigo-600' : 'bg-green-500'}`}
                                     style={{ width: `${progress}%` }}
                                   />
                                </div>
                             </div>

                             <div className="pt-2 flex justify-between items-center text-[9px] font-black opacity-40 border-t border-gray-50 pt-3">
                                <span className="uppercase">{r.advertiserName}</span>
                                <span className="uppercase">CPM ${r.pricePer1k.toFixed(2)}</span>
                             </div>
                          </div>
                       );
                    })
                 )}
              </div>
           </div>
        )}

        {/* TAB: REQUESTS (INBOX) */}
        {activeTab === 'requests' && (
           <div className="space-y-4 animate-in fade-in">
              <div className="flex justify-between items-center px-1">
                 <h3 className="text-xs font-black uppercase opacity-40 tracking-widest">Campaign Proposals</h3>
                 <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                    <button 
                       onClick={() => setRequestFilter('PENDING')}
                       className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${requestFilter === 'PENDING' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                    >
                       Pending
                    </button>
                    <button 
                       onClick={() => setRequestFilter('HISTORY')}
                       className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${requestFilter === 'HISTORY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                    >
                       History
                    </button>
                 </div>
              </div>
              
              {requestFilter === 'PENDING' ? (
                 pendingRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 opacity-20">
                       <CheckCircle size={48} className="mb-2" />
                       <p className="text-sm font-bold uppercase tracking-widest">Inbox Zero</p>
                       <p className="text-xs mt-2">No pending campaigns.</p>
                    </div>
                 ) : (
                    pendingRequests.map(req => (
                       <div key={req.id} className={`${cardClass} p-5 rounded-2xl border-l-4 border-l-indigo-600 shadow-lg`}>
                          <div className="flex justify-between items-start mb-4">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                                   {req.advertiserName.charAt(0)}
                                </div>
                                <div>
                                   <h4 className="font-bold text-sm">{req.adContent.title}</h4>
                                   <p className="text-[9px] opacity-60 uppercase font-black tracking-tighter">From {req.advertiserName}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-base font-black text-green-600">${req.totalPrice.toFixed(2)}</p>
                                <p className="text-[8px] opacity-40 font-bold uppercase">Proposal</p>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => setPreviewAd(req)} className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100"><PlayCircle size={20}/></button>
                             <button onClick={() => onApprove(req.id, true)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all">Approve</button>
                             <button onClick={() => onApprove(req.id, false)} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 active:scale-95 transition-all">Decline</button>
                          </div>
                       </div>
                    ))
                 )
              ) : (
                 // HISTORY VIEW
                 historyRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 opacity-20">
                       <History size={48} className="mb-2" />
                       <p className="text-sm font-bold uppercase tracking-widest">No History</p>
                       <p className="text-xs mt-2">Decisions will appear here.</p>
                    </div>
                 ) : (
                    historyRequests.map(req => (
                       <div key={req.id} className={`${cardClass} p-4 rounded-2xl opacity-80 hover:opacity-100 transition-opacity`}>
                          <div className="flex justify-between items-center mb-2">
                             <h4 className="font-bold text-xs">{req.adContent.title}</h4>
                             <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${getRequestStatusColor(req.status)}`}>
                                {req.status}
                             </span>
                          </div>
                          <div className="flex justify-between items-center text-[9px] opacity-50 font-bold uppercase">
                             <span>{req.advertiserName}</span>
                             <span>${req.totalPrice.toFixed(2)}</span>
                          </div>
                       </div>
                    ))
                 )
              )}

              {previewAd && (
                 <div className="fixed inset-0 z-[1000] bg-black/90 p-6 flex flex-col items-center justify-center animate-in fade-in">
                    <div className="bg-white rounded-3xl overflow-hidden w-full max-w-sm animate-in zoom-in-95">
                       <div className="aspect-video bg-black flex items-center justify-center relative">
                          {previewAd.adContent.videoUrl ? (
                             <video src={previewAd.adContent.videoUrl} autoPlay loop controls className="w-full h-full object-cover" />
                          ) : (
                             <div className="flex flex-col items-center text-white opacity-50">
                               <PlayCircle size={48} />
                               <span className="text-xs mt-2">No Video Preview</span>
                             </div>
                          )}
                          <button onClick={() => setPreviewAd(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"><XCircle size={20}/></button>
                       </div>
                       <div className="p-6">
                          <h4 className="font-black text-lg mb-2">{previewAd.adContent.title}</h4>
                          <p className="text-xs text-gray-500 mb-6 leading-relaxed">{previewAd.adContent.description}</p>
                          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                             <div>
                                <p className="text-[9px] uppercase font-bold opacity-40">Target Views</p>
                                <p className="font-black">{previewAd.targetViews.toLocaleString()}</p>
                             </div>
                             <div>
                                <p className="text-[9px] uppercase font-bold opacity-40">CPM</p>
                                <p className="font-black">${previewAd.pricePer1k.toFixed(2)}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              )}
           </div>
        )}

        {/* TAB: EARNINGS (WALLET) */}
        {activeTab === 'earnings' && (
           <div className="space-y-4 animate-in fade-in">
              <div className={`${cardClass} p-6 rounded-3xl bg-indigo-700 text-white border-0 shadow-xl`}>
                 <p className="text-[10px] font-black opacity-60 uppercase mb-1">Available Funds</p>
                 <h2 className="text-4xl font-black">${user.balance.toFixed(2)}</h2>
                 <div className="flex gap-2 mt-6">
                    <button 
                      onClick={onWithdraw}
                      disabled={user.balance <= 0}
                      className="flex-1 py-3 bg-white text-indigo-700 rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                    >
                      Withdraw Now
                    </button>
                    <button className="p-3 bg-white/20 text-white rounded-xl border border-white/10"><History size={18}/></button>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className={`${cardClass} p-4 rounded-2xl`}>
                    <p className="text-[9px] font-black opacity-40 uppercase">Pending Escrow</p>
                    <p className="text-lg font-black text-orange-600">${user.escrowBalance?.toFixed(2) || '0.00'}</p>
                 </div>
                 <div className={`${cardClass} p-4 rounded-2xl`}>
                    <p className="text-[9px] font-black opacity-40 uppercase">Life Earnings</p>
                    <p className="text-lg font-black text-indigo-700">${user.totalEarnings?.toFixed(2)}</p>
                 </div>
              </div>

              <div className={`${cardClass} p-5 rounded-2xl`}>
                 <h3 className="text-[10px] font-black uppercase opacity-40 mb-4 tracking-widest">Revenue Details</h3>
                 <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                       <span className="font-bold">Gross Total</span>
                       <span className="font-black">${(user.totalEarnings! / (1 - PLATFORM_COMMISSION)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-red-500">
                       <span className="font-bold">Platform Fee (20%)</span>
                       <span className="font-black">-${(user.totalEarnings! / (1 - PLATFORM_COMMISSION) * PLATFORM_COMMISSION).toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-50 flex justify-between font-black text-indigo-700">
                       <span>Net Income</span>
                       <span>${user.totalEarnings?.toFixed(2)}</span>
                    </div>
                 </div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};