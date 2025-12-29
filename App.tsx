import React, { useState, useEffect } from 'react';
import './index.css'; // Import global styles
import { User, UserType, AdZone, GeoPoint, AdRentalRequest, PaymentRecord, CollectedAd, ChatSession } from './types';
import { DUBAI_CENTER, INITIAL_ZONES, MOCK_USERS, PLATFORM_COMMISSION, MOCK_RENTAL_REQUESTS } from './constants';
import { BottomNav } from './components/BottomNav';
import { AdvertiserDashboard } from './components/AdvertiserDashboard';
import { ZoneOwnerDashboard } from './components/ZoneOwnerDashboard';
import { MapView } from './components/MapView';
import { AnalyticsScreen } from './components/AnalyticsScreen';
import { ChatScreen } from './components/ChatScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { PaymentScreen } from './components/PaymentScreen';
import { 
  Building, ShieldCheck, User as UserIcon, ArrowLeft, AtSign, Phone, Lock, 
  Shield, Loader2, Eye, EyeOff, PlayCircle, Gift, ChevronRight, Play, X, Zap,
  CheckCircle, Video, Clock, Wallet, Coins, ArrowRightLeft, History, Copy, MapPin, Globe, Hash
} from 'lucide-react';

// Re-using helper functions for cleaner App component
const getDistance = (p1: GeoPoint, p2: GeoPoint) => {
  const R = 6371e3; 
  const φ1 = p1.lat * Math.PI/180;
  const φ2 = p2.lat * Math.PI/180;
  const Δφ = (p2.lat - p1.lat) * Math.PI/180;
  const Δλ = (p2.lng - p1.lng) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const isPointInZone = (point: GeoPoint, zone: AdZone): boolean => {
  if (zone.shape === 'CIRCLE') return getDistance(point, zone.center) <= zone.radius;
  const latOffset = (zone.height / 2) / 111111;
  const lngOffset = (zone.width / 2) / (111111 * Math.cos(zone.center.lat * Math.PI / 180));
  return point.lat >= zone.center.lat - latOffset && point.lat <= zone.center.lat + latOffset && point.lng >= zone.center.lng - lngOffset && point.lng <= zone.center.lng + lngOffset;
};

const Logo = ({ size = "w-24 h-24" }: { size?: string }) => (
  <svg viewBox="0 0 200 200" className={`${size} mx-auto mb-4`} xmlns="http://www.w3.org/2000/svg">
    <path d="M 45 25 H 155 A 20 20 0 0 1 175 45 V 135 A 20 20 0 0 1 155 155 H 70 L 35 185 L 45 145 A 20 20 0 0 1 25 125 V 45 A 20 20 0 0 1 45 25 Z" fill="white" stroke="#3b82f6" strokeWidth="8"/>
    <g transform="translate(100, 90)"><path d="M 0 0 L 46 -17 A 50 50 0 1 1 12 -48 Z" fill="#84cc16"/><path d="M 8 -8 L 20 -56 A 50 50 0 0 1 54 -25 Z" fill="#3b82f6"/></g>
  </svg>
);

export default function App() {
  // --- STATE MANAGEMENT WITH PERSISTENCE ---
  const [user, setUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<string>('login'); 
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  // Data States
  const [zones, setZones] = useState<AdZone[]>(INITIAL_ZONES);
  const [rentalRequests, setRentalRequests] = useState<AdRentalRequest[]>(MOCK_RENTAL_REQUESTS);
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  
  // Wallet/Rewards State
  const [rewardTab, setRewardTab] = useState<'inbox' | 'wallet'>('inbox');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  // Load Data on Mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('adinci_user');
      const savedZones = localStorage.getItem('adinci_zones');
      const savedRequests = localStorage.getItem('adinci_requests');
      const savedAllUsers = localStorage.getItem('adinci_users');

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setScreen(parsedUser.type === UserType.REGULAR ? 'map' : 'dashboard');
      }
      if (savedZones) setZones(JSON.parse(savedZones));
      if (savedRequests) setRentalRequests(JSON.parse(savedRequests));
      if (savedAllUsers) setAllUsers(JSON.parse(savedAllUsers));
    } catch (e) {
      console.error("Failed to load session/data", e);
    }
  }, []);

  // Save Data on Change
  useEffect(() => {
    if (user) localStorage.setItem('adinci_user', JSON.stringify(user));
    else localStorage.removeItem('adinci_user');
  }, [user]);

  useEffect(() => { localStorage.setItem('adinci_zones', JSON.stringify(zones)); }, [zones]);
  useEffect(() => { localStorage.setItem('adinci_requests', JSON.stringify(rentalRequests)); }, [rentalRequests]);
  useEffect(() => { localStorage.setItem('adinci_users', JSON.stringify(allUsers)); }, [allUsers]);

  // Other UI States
  const [userLocation, setUserLocation] = useState<GeoPoint>(DUBAI_CENTER);
  const [viewingAd, setViewingAd] = useState<CollectedAd | null>(null);
  const [watchProgress, setWatchProgress] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<{ zone: AdZone, duration: number, price: string } | null>(null);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [authForm, setAuthForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    phoneNumber: '', 
    age: '',
    gender: '',
    country: '',
    city: '',
    zipCode: '',
    isVisuallyImpaired: false 
  });
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [advertiserTargetZone, setAdvertiserTargetZone] = useState<AdZone | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  const handleRoleSelect = (role: UserType) => {
    setSelectedRole(role);
    // Auto-fill credentials for demo purposes
    if (authMode === 'login') {
      let email = '';
      let password = '0000';
      
      switch(role) {
        case UserType.ZONE_OWNER:
          email = 'zone@test.com';
          break;
        case UserType.ADVERTISER:
          email = 'ads@test.com';
          break;
        case UserType.REGULAR:
          email = 'usr@test.com';
          break;
      }
      setAuthForm(prev => ({ ...prev, email, password }));
    } else {
      // Clear for signup
      setAuthForm(prev => ({ ...prev, email: '', password: '' }));
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !authForm.email || !authForm.password) {
      setToast("Please complete required fields");
      return;
    }

    if (authMode === 'signup') {
      if (authForm.password !== authForm.confirmPassword) {
        setToast("Passwords do not match!");
        return;
      }
      if (!authForm.phoneNumber) {
        setToast("Phone number is required");
        return;
      }
    }
    
    setIsLoadingAuth(true);

    setTimeout(() => {
      if (authMode === 'login') {
        // --- TEST ACCOUNT PASSWORD CHECK ---
        const testAccounts = ['zone@test.com', 'ads@test.com', 'usr@test.com'];
        if (testAccounts.includes(authForm.email) && authForm.password !== '0000') {
            setToast("Invalid Password. Use '0000'");
            setIsLoadingAuth(false);
            return;
        }

        const existingUser = allUsers.find(u => 
          u.type === selectedRole && 
          u.email === authForm.email
        );
        
        if (existingUser) {
          setUser(existingUser);
          if (existingUser.settings.isVisuallyImpaired) {
            setIsHighContrast(true);
          }
          setScreen(selectedRole === UserType.REGULAR ? 'map' : 'dashboard');
          setToast(`Welcome back, ${existingUser.name}!`);
        } else {
          setToast("Account not found. Please sign up.");
        }
      } else {
        const newUser: User = { 
          id: `u-${Date.now()}`, 
          name: authForm.name || (selectedRole === UserType.REGULAR ? 'Guest User' : selectedRole === UserType.ADVERTISER ? 'New Advertiser' : 'New Owner'), 
          type: selectedRole, 
          email: authForm.email, 
          phoneNumber: authForm.phoneNumber, 
          age: authForm.age ? parseInt(authForm.age) : undefined,
          gender: authForm.gender,
          location: {
             country: authForm.country,
             city: authForm.city,
             zipCode: authForm.zipCode
          },
          bio: "Just joined Adinci!", 
          settings: { isVisuallyImpaired: authForm.isVisuallyImpaired || isHighContrast }, 
          points: 0, 
          inventory: [], 
          balance: selectedRole === UserType.ADVERTISER ? 500 : 0, 
          totalEarnings: selectedRole === UserType.ZONE_OWNER ? 0 : undefined,
          escrowBalance: selectedRole === UserType.ZONE_OWNER ? 0 : undefined
        };
        setUser(newUser);
        setAllUsers(prev => [...prev, newUser]);
        setScreen(selectedRole === UserType.REGULAR ? 'map' : 'dashboard');
        setToast("Account created successfully!");
      }
      setIsLoadingAuth(false);
    }, 1500);
  };

  // --- AD COLLECTION LOGIC ---
  useEffect(() => {
    if (user && user.type === UserType.REGULAR && screen === 'map') {
      const activeZones = zones.filter(z => z.isActive && (z.expiryDate ? z.expiryDate > Date.now() : false));
      activeZones.forEach(zone => {
         const activeRental = rentalRequests.find(r => r.zoneId === zone.id && r.status === 'ACTIVE');
         const content = activeRental?.adContent || zone.adContent;
         
         if (content && isPointInZone(userLocation, zone)) {
             const alreadyCollected = user.inventory.find(ad => ad.campaignId === (activeRental?.id || zone.id) && !ad.redeemed);
             if (!alreadyCollected) {
                 const newAd: CollectedAd = { id: `col-${Date.now()}`, campaignId: activeRental?.id || zone.id, adContent: content, collectedAt: Date.now(), redeemed: false };
                 setUser(prev => prev ? { ...prev, inventory: [newAd, ...prev.inventory] } : null);
                 setToast(`🎁 Reward Collected: Check your Inbox!`);
             }
         }
      });
    }
  }, [userLocation, zones, user, screen, rentalRequests]);

  // --- WATCH AD LOGIC ---
  useEffect(() => {
    let interval: any;
    if (isWatching && watchProgress < 100) {
      interval = setInterval(() => {
        setWatchProgress(prev => Math.min(prev + 5, 100)); // Simulating ~6 seconds watch time
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isWatching, watchProgress]);

  const handleStartWatch = (ad: CollectedAd) => {
    setViewingAd(ad);
    setWatchProgress(0);
    setIsWatching(true);
  };

  const handleClaimPoints = () => {
    if (user && viewingAd) {
      const pointsToAdd = viewingAd.adContent.rewardPoints;
      setUser({ ...user, points: user.points + pointsToAdd, inventory: user.inventory.map(ad => ad.id === viewingAd.id ? { ...ad, redeemed: true } : ad)});
      
      const rental = rentalRequests.find(r => r.id === viewingAd.campaignId);
      if (rental && rental.status === 'ACTIVE') {
         const newViews = rental.currentViews + 1;
         const isFinished = newViews >= rental.targetViews;
         
         setRentalRequests(prev => prev.map(r => r.id === rental.id ? { ...r, currentViews: newViews, status: isFinished ? 'COMPLETED' : 'ACTIVE' } : r));

         if (isFinished) {
            const platformFee = rental.totalPrice * PLATFORM_COMMISSION;
            const payout = rental.totalPrice - platformFee;
            const zone = zones.find(z => z.id === rental.zoneId);
            if (zone) {
               setAllUsers(prev => prev.map(u => u.id === zone.ownerId ? { ...u, balance: (u.balance || 0) + payout, totalEarnings: (u.totalEarnings || 0) + payout, escrowBalance: Math.max(0, (u.escrowBalance || 0) - rental.totalPrice) } : u));
            }
         }
      }
      setViewingAd(null);
      setIsWatching(false);
      setToast(`🎉 Earned ${pointsToAdd} Points!`);
    }
  };

  // --- WALLET & WITHDRAW LOGIC ---
  const ADT_RATE = 100; // 100 Points = 1 ADT
  
  const handleWithdrawCrypto = () => {
     if (!user || user.points <= 0) {
        setToast("No points available to withdraw.");
        return;
     }
     if (!withdrawAddress) {
        setToast("Please enter a valid wallet address.");
        return;
     }
     if (user.points < 500) {
        setToast("Minimum withdrawal is 500 Points (5 ADT).");
        return;
     }

     setIsWithdrawing(true);
     setTimeout(() => {
        const withdrawAmount = user.points;
        const tokenAmount = withdrawAmount / ADT_RATE;
        setUser({ ...user, points: 0 });
        setWithdrawAddress('');
        setIsWithdrawing(false);
        setToast(`🚀 Success! ${tokenAmount} ADT sent to wallet.`);
     }, 2000);
  };
  
  const handleAddFunds = (amount: number) => {
    if (user) {
      const newBalance = (user.balance || 0) + amount;
      setUser({ ...user, balance: newBalance });
      setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, balance: newBalance } : u));
      setToast(`Success! Added $${amount.toFixed(2)} to wallet.`);
    }
  };

  // --- CAMPAIGN MANAGEMENT LOGIC ---
  const handleRentalRequest = (req: Partial<AdRentalRequest>) => {
     // Ensure we use the current user's ID
     const requestAdvertiserId = user?.id || req.advertiserId || 'unknown';
     
     const newReq: AdRentalRequest = {
        id: `rent-${Date.now()}`,
        status: 'PENDING',
        createdAt: Date.now(),
        currentViews: 0,
        ...req,
        advertiserId: requestAdvertiserId
     } as AdRentalRequest;
     
     setRentalRequests(prev => [...prev, newReq]);
     setToast("Ad Proposal Sent to Owner! Funds will be deducted upon approval.");
  };

  const handleApproval = (id: string, approve: boolean) => {
     const req = rentalRequests.find(r => r.id === id);
     if (!req) return;
     
     if (approve) {
        // Find fresh user data from state
        const adv = allUsers.find(u => u.id === req.advertiserId);
        const owner = allUsers.find(u => u.id === (zones.find(z => z.id === req.zoneId)?.ownerId));

        if (adv && adv.balance >= req.totalPrice) {
           // Update Users Balances
           setAllUsers(prev => prev.map(u => {
             if (u.id === req.advertiserId) return { ...u, balance: u.balance - req.totalPrice };
             if (u.id === owner?.id) return { ...u, escrowBalance: (u.escrowBalance || 0) + req.totalPrice };
             return u;
           }));
           
           // Update Request Status
           setRentalRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'ACTIVE' } : r));
           setToast("Campaign Approved & Live! Cost auto-deducted from Advertiser.");
        } else {
           setToast(`Advertiser has insufficient funds (Bal: $${adv?.balance.toFixed(2)}). Approval blocked.`);
        }
     } else {
        setRentalRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
        setToast("Campaign Proposal Declined.");
     }
  };

  const handleWithdraw = () => {
    if (user && user.type === UserType.ZONE_OWNER) {
      if (user.balance > 0) {
        const amount = user.balance;
        // Update local user state
        setUser({ ...user, balance: 0 });
        // Update persistent users state
        setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, balance: 0 } : u));
        setToast(`Withdrawal of $${amount.toFixed(2)} processed successfully!`);
      } else {
        setToast("No funds available for withdrawal.");
      }
    }
  };

  const handleZoneActivation = (zone: AdZone, duration: number, price: string) => {
    const amount = parseFloat(price);
    const newRecord: PaymentRecord = { id: `pay-${Date.now()}`, amount, date: Date.now(), duration };
    setZones(zones.map(z => {
      if (z.id === zone.id) {
        const currentExpiry = z.expiryDate && z.expiryDate > Date.now() ? z.expiryDate : Date.now();
        return { 
          ...z, 
          isActive: true, 
          expiryDate: currentExpiry + duration * 30 * 24 * 3600 * 1000,
          totalCostPaid: (z.totalCostPaid || 0) + amount,
          paymentHistory: [newRecord, ...(z.paymentHistory || [])]
        };
      }
      return z;
    }));
    setScreen('dashboard');
    setToast("Zone Activated Successfully!");
  };

  useEffect(() => {
    if (!user && screen !== 'login') {
      setScreen('login');
    }
  }, [user, screen]);

  return (
    <div className={`h-full w-full flex flex-col relative ${isHighContrast ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* --- Ad Viewing Modal --- */}
      {viewingAd && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col animate-in fade-in duration-300">
          <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
             {viewingAd.adContent.videoUrl ? (
                <video 
                  src={viewingAd.adContent.videoUrl} 
                  className="w-full h-full object-contain"
                  autoPlay 
                  playsInline
                  muted
                  controls
                  onEnded={() => setWatchProgress(100)} 
                />
             ) : (
                <div className="text-center p-8 opacity-50">
                   <Video size={64} className="mx-auto mb-4" />
                   <p className="font-black uppercase tracking-widest">Interactive Ad Experience</p>
                </div>
             )}
             
             <button 
               onClick={() => { setViewingAd(null); setIsWatching(false); setWatchProgress(0); }}
               className="absolute top-6 right-6 p-2 bg-black/40 text-white rounded-full backdrop-blur-md z-10 hover:bg-black/60 transition-colors"
             >
               <X size={24} />
             </button>

             {/* Progress Bar Overlay */}
             <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800">
                <div 
                  className="h-full bg-yellow-400 transition-all duration-300 ease-linear shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                  style={{ width: `${watchProgress}%` }}
                />
             </div>
          </div>

          <div className={`p-6 pb-10 ${isHighContrast ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
             <div className="flex justify-between items-start mb-4">
                <div>
                   <h2 className="text-2xl font-black leading-tight">{viewingAd.adContent.title}</h2>
                   <p className={`text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-1 ${isHighContrast ? 'opacity-50' : 'text-gray-600'}`}>
                      <ShieldCheck size={12}/> {viewingAd.adContent.companyName}
                   </p>
                </div>
                <div className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm">
                   +{viewingAd.adContent.rewardPoints} Pts
                </div>
             </div>
             
             <p className={`text-sm font-medium mb-8 leading-relaxed ${isHighContrast ? 'opacity-70' : 'text-gray-700'}`}>
                {viewingAd.adContent.description}
             </p>

             <button
               onClick={handleClaimPoints}
               disabled={watchProgress < 100}
               className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  watchProgress >= 100 
                    ? 'bg-green-600 text-white shadow-xl shadow-green-200 cursor-pointer' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
               }`}
             >
                {watchProgress >= 100 ? (
                   <>
                      <CheckCircle size={20} /> Claim Reward
                   </>
                ) : (
                   <>
                      <Loader2 size={18} className="animate-spin" /> Watching... {Math.round(watchProgress)}%
                   </>
                )}
             </button>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-hidden">
        {screen === 'login' ? (
          <div className={`h-full w-full overflow-y-auto ${isHighContrast ? 'bg-black' : 'bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-900 text-white'}`}>
             <div className="min-h-full flex flex-col items-center justify-center p-6 pt-20 pb-12">
                 {!selectedRole ? (
                   <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
                      <div className="text-center">
                        <Logo size="w-24 h-24 sm:w-32 sm:h-32" /> 
                        <h1 className="text-4xl sm:text-5xl font-black mb-2 tracking-tighter">Adinci</h1>
                        <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest ${isHighContrast ? 'opacity-80 text-yellow-400' : 'opacity-80 text-gray-200'}`}>Think Invisible. Ad Different</p>
                      </div>
                      
                      <div className={`p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] space-y-3 sm:space-y-4 ${isHighContrast ? 'bg-gray-900 border-2 border-yellow-400' : 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl'}`}>
                         <p className={`text-center text-xs font-black uppercase tracking-widest mb-4 ${isHighContrast ? 'opacity-80 text-yellow-400' : 'text-gray-100'}`}>Choose Your Path</p>
                         
                         <div className="grid grid-cols-1 gap-3">
                            <button onClick={() => handleRoleSelect(UserType.ZONE_OWNER)} className="flex items-center gap-4 p-4 sm:p-5 rounded-3xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group active:scale-95">
                               <div className="p-3 rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/20"><Building size={24}/></div>
                               <div className="text-left">
                                  <p className="font-black text-base">Zone Owner</p>
                                  <p className="text-[10px] font-bold text-gray-200 uppercase tracking-tighter">Monetize Physical Assets</p>
                               </div>
                            </button>
                            
                            <button onClick={() => handleRoleSelect(UserType.ADVERTISER)} className="flex items-center gap-4 p-4 sm:p-5 rounded-3xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group active:scale-95">
                               <div className="p-3 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/20"><ShieldCheck size={24}/></div>
                               <div className="text-left">
                                  <p className="font-black text-base">Advertiser</p>
                                  <p className="text-[10px] font-bold text-gray-200 uppercase tracking-tighter">Reach Local Audiences</p>
                               </div>
                            </button>
                            
                            <button onClick={() => handleRoleSelect(UserType.REGULAR)} className="flex items-center gap-4 p-4 sm:p-5 rounded-3xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group active:scale-95">
                               <div className="p-3 rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/20"><UserIcon size={24}/></div>
                               <div className="text-left">
                                  <p className="font-black text-base">Regular User</p>
                                  <p className="text-[10px] font-bold text-gray-200 uppercase tracking-tighter">Earn Rewards Daily</p>
                               </div>
                            </button>
                         </div>
                      </div>
                   </div>
                 ) : (
                   <div className="w-full max-w-sm animate-in slide-in-from-right-12 duration-500">
                      <button onClick={() => { setSelectedRole(null); setAuthMode('login'); }} className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/80 hover:text-white transition-opacity">
                         <ArrowLeft size={18}/> Back to roles
                      </button>

                      <div className="mb-8 text-center">
                         <h2 className="text-3xl font-black mb-2 text-white">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                         <p className="text-xs font-black text-white/70 uppercase tracking-widest">
                            {authMode === 'login' ? 'Continue as' : 'Register as'} {selectedRole.replace('_', ' ')}
                         </p>
                      </div>

                      <form onSubmit={handleAuthSubmit} className={`p-8 rounded-[40px] space-y-4 ${isHighContrast ? 'bg-gray-900 border-2 border-yellow-400' : 'bg-white text-gray-900 shadow-2xl'}`}>
                         {/* Form Fields Same as Before */}
                         {authMode === 'signup' && (
                            <>
                               <div className="space-y-1">
                                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isHighContrast ? 'text-yellow-400' : 'text-gray-600'}`}>Full Name</label>
                                  <div className="relative">
                                     <UserIcon className={`absolute left-4 top-1/2 -translate-y-1/2 ${isHighContrast ? 'text-yellow-400 opacity-60' : 'text-gray-500'}`} size={16}/>
                                     <input 
                                        type="text" 
                                        placeholder="John Doe" 
                                        value={authForm.name}
                                        onChange={e => setAuthForm({...authForm, name: e.target.value})}
                                        className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border outline-none transition-all font-bold text-sm ${isHighContrast ? 'bg-black border-yellow-400 text-white focus:border-white' : 'bg-gray-50 border-gray-100 focus:border-indigo-600 focus:bg-white'}`}
                                     />
                                  </div>
                               </div>

                               <div className="space-y-1">
                                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isHighContrast ? 'text-yellow-400' : 'text-gray-600'}`}>Phone Number</label>
                                  <div className="relative">
                                     <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 ${isHighContrast ? 'text-yellow-400 opacity-60' : 'text-gray-500'}`} size={16}/>
                                     <input 
                                        type="tel" 
                                        placeholder="+971 -- --- ----" 
                                        value={authForm.phoneNumber}
                                        onChange={e => setAuthForm({...authForm, phoneNumber: e.target.value})}
                                        className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border outline-none transition-all font-bold text-sm ${isHighContrast ? 'bg-black border-yellow-400 text-white focus:border-white' : 'bg-gray-50 border-gray-100 focus:border-indigo-600 focus:bg-white'}`}
                                     />
                                  </div>
                               </div>

                               {/* NEW FIELDS: AGE, GENDER, LOCATION */}
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isHighContrast ? 'text-yellow-400' : 'text-gray-600'}`}>Age</label>
                                    <div className="relative">
                                       <Hash className={`absolute left-4 top-1/2 -translate-y-1/2 ${isHighContrast ? 'text-yellow-400 opacity-60' : 'text-gray-500'}`} size={16}/>
                                       <input 
                                          type="number" 
                                          placeholder="Age" 
                                          value={authForm.age}
                                          onChange={e => setAuthForm({...authForm, age: e.target.value})}
                                          className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border outline-none transition-all font-bold text-sm ${isHighContrast ? 'bg-black border-yellow-400 text-white focus:border-white' : 'bg-gray-50 border-gray-100 focus:border-indigo-600 focus:bg-white'}`}
                                       />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isHighContrast ? 'text-yellow-400' : 'text-gray-600'}`}>Gender</label>
                                    <div className="relative">
                                        <select 
                                           value={authForm.gender}
                                           onChange={e => setAuthForm({...authForm, gender: e.target.value})}
                                           className={`w-full pl-4 pr-8 py-3.5 rounded-2xl border outline-none transition-all font-bold text-sm appearance-none ${isHighContrast ? 'bg-black border-yellow-400 text-white focus:border-white' : 'bg-gray-50 border-gray-100 focus:border-indigo-600 focus:bg-white text-gray-900'}`}
                                        >
                                           <option value="">Select</option>
                                           <option value="Male">Male</option>
                                           <option value="Female">Female</option>
                                        </select>
                                        <ChevronRight className={`absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none ${isHighContrast ? 'text-yellow-400 opacity-60' : 'text-gray-500'}`} size={16}/>
                                    </div>
                                  </div>
                               </div>
                               
                               <div className="space-y-1">
                                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isHighContrast ? 'text-yellow-400' : 'text-gray-600'}`}>Country & City</label>
                                  <div className="grid grid-cols-2 gap-2">
                                     <div className="relative">
                                        <Globe className={`absolute left-4 top-1/2 -translate-y-1/2 ${isHighContrast ? 'text-yellow-400 opacity-60' : 'text-gray-500'}`} size={16}/>
                                        <input 
                                            type="text" 
                                            placeholder="Country" 
                                            value={authForm.country}
                                            onChange={e => setAuthForm({...authForm, country: e.target.value})}
                                            className={`w-full pl-11 pr-2 py-3.5 rounded-2xl border outline-none transition-all font-bold text-sm ${isHighContrast ? 'bg-black border-yellow-400 text-white focus:border-white' : 'bg-gray-50 border-gray-100 focus:border-indigo-600 focus:bg-white'}`}
                                        />
                                     </div>
                                     <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="City" 
                                            value={authForm.city}
                                            onChange={e => setAuthForm({...authForm, city: e.target.value})}
                                            className={`w-full px-4 py-3.5 rounded-2xl border outline-none transition-all font-bold text-sm ${isHighContrast ? 'bg-black border-yellow-400 text-white focus:border-white' : 'bg-gray-50 border-gray-100 focus:border-indigo-600 focus:bg-white'}`}
                                        />
                                     </div>
                                  </div>
                               </div>

                               <div className="space-y-1">
                                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isHighContrast ? 'text-yellow-400' : 'text-gray-600'}`}>Zip Code</label>
                                  <div className="relative">
                                     <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 ${isHighContrast ? 'text-yellow-400 opacity-60' : 'text-gray-500'}`} size={16}/>
                                     <input 
                                        type="text" 
                                        placeholder="00000" 
                                        value={authForm.zipCode}
                                        onChange={e => setAuthForm({...authForm, zipCode: e.target.value})}
                                        className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border outline-none transition-all font-bold text-sm ${isHighContrast ? 'bg-black border-yellow-400 text-white focus:border-white' : 'bg-gray-50 border-gray-100 focus:border-indigo-600 focus:bg-white'}`}
                                     />
                                  </div>
                               </div>
                            </>
                         )}

                         <div className="space-y-1">
                            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isHighContrast ? 'text-yellow-400' : 'text-gray-600'}`}>Email Address</label>
                            <div className="relative">
                               <AtSign className={`absolute left-4 top-1/2 -translate-y-1/2 ${isHighContrast ? 'text-yellow-400 opacity-60' : 'text-gray-500'}`} size={16}/>
                               <input 
                                  type="email" 
                                  placeholder="name@company.com" 
                                  value={authForm.email}
                                  onChange={e => setAuthForm({...authForm, email: e.target.value})}
                                  className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border outline-none transition-all font-bold text-sm ${isHighContrast ? 'bg-black border-yellow-400 text-white focus:border-white' : 'bg-gray-50 border-gray-100 focus:border-indigo-600 focus:bg-white'}`}
                               />
                            </div>
                         </div>

                         <div className="space-y-1">
                            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isHighContrast ? 'text-yellow-400' : 'text-gray-600'}`}>Password</label>
                            <div className="relative">
                               <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${isHighContrast ? 'text-yellow-400 opacity-60' : 'text-gray-500'}`} size={16}/>
                               <input 
                                  type={showPassword ? "text" : "password"} 
                                  placeholder="••••••••" 
                                  value={authForm.password}
                                  onChange={e => setAuthForm({...authForm, password: e.target.value})}
                                  className={`w-full pl-11 pr-11 py-3.5 rounded-2xl border outline-none transition-all font-bold text-sm ${isHighContrast ? 'bg-black border-yellow-400 text-white focus:border-white' : 'bg-gray-50 border-gray-100 focus:border-indigo-600 focus:bg-white'}`}
                               />
                               <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isHighContrast ? 'text-yellow-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                               </button>
                            </div>
                         </div>

                         {authMode === 'signup' && (
                            <>
                              <div className="space-y-1">
                                 <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isHighContrast ? 'text-yellow-400' : 'text-gray-600'}`}>Confirm Password</label>
                                 <div className="relative">
                                    <Shield className={`absolute left-4 top-1/2 -translate-y-1/2 ${isHighContrast ? 'text-yellow-400 opacity-60' : 'text-gray-500'}`} size={16}/>
                                    <input 
                                       type={showPassword ? "text" : "password"} 
                                       placeholder="••••••••" 
                                       value={authForm.confirmPassword}
                                       onChange={e => setAuthForm({...authForm, confirmPassword: e.target.value})}
                                       className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border outline-none transition-all font-bold text-sm ${isHighContrast ? 'bg-black border-yellow-400 text-white focus:border-white' : 'bg-gray-50 border-gray-100 focus:border-indigo-600 focus:bg-white'}`}
                                    />
                                 </div>
                              </div>
                              {selectedRole === UserType.REGULAR && (
                                <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${isHighContrast ? 'bg-gray-800 border-yellow-400' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            id="visualCheck"
                                            checked={authForm.isVisuallyImpaired}
                                            onChange={e => {
                                                const isChecked = e.target.checked;
                                                setAuthForm({...authForm, isVisuallyImpaired: isChecked});
                                                if (isChecked && !isHighContrast) setIsHighContrast(true);
                                                if (!isChecked && isHighContrast) setIsHighContrast(false);
                                            }}
                                            className="w-5 h-5 accent-indigo-600 cursor-pointer"
                                        />
                                    </div>
                                    <label htmlFor="visualCheck" className={`text-xs font-black uppercase tracking-wide cursor-pointer flex items-center gap-2 select-none ${isHighContrast ? 'text-yellow-400' : 'text-gray-700'}`}>
                                        <Eye size={16} /> I am visually impaired / blind
                                    </label>
                                </div>
                              )}
                            </>
                         )}

                         <button 
                            type="submit" 
                            disabled={isLoadingAuth}
                            className={`w-full py-4.5 rounded-[24px] font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 mt-2 ${isHighContrast ? 'bg-yellow-400 text-black shadow-none' : 'bg-indigo-600 text-white shadow-indigo-100'}`}
                         >
                            {isLoadingAuth ? <Loader2 className="animate-spin" size={20}/> : (authMode === 'login' ? 'Sign In' : 'Register Now')}
                         </button>
                      </form>

                      <div className="mt-8 text-center pb-10">
                         <button 
                            onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setShowPassword(false); setAuthForm(prev => ({...prev, email: '', password: ''})); }}
                            className="text-xs font-black uppercase tracking-[0.2em] text-white/70 hover:text-white transition-opacity"
                         >
                            {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                         </button>
                      </div>
                   </div>
                 )}
             </div>
          </div>
        ) : user ? (
          <>
            {screen === 'dashboard' ? (
               user.type === UserType.ADVERTISER ? <AdvertiserDashboard 
                  user={user} 
                  ads={zones} 
                  onAddAd={handleRentalRequest as any} 
                  isHighContrast={isHighContrast} 
                  onNavigateToMap={() => { setScreen('map'); setAdvertiserTargetZone(null); }} 
                  onLogout={() => setUser(null)} 
                  rentalRequests={rentalRequests.filter(r => r.advertiserId === user.id)} 
                  screen={screen} 
                  initialSelectedZone={advertiserTargetZone}
                  onAddFunds={handleAddFunds}
               /> :
               user.type === UserType.ZONE_OWNER ? <ZoneOwnerDashboard 
                  user={user} 
                  zones={zones.filter(z => z.ownerId === user.id)} 
                  rentalRequests={rentalRequests} 
                  onApprove={handleApproval} 
                  isHighContrast={isHighContrast} 
                  onLogout={() => setUser(null)}
                  onWithdraw={handleWithdraw}
                  onEditZone={(z) => { setScreen('map'); setSelectedZoneId(z.id); setToast(`Editing ${z.name}`); }}
                  onRenewZone={(z) => { setScreen('map'); setSelectedZoneId(z.id); setToast(`Renewing ${z.name}`); }}
                  onDeleteZone={(id) => { 
                    const zone = zones.find(z => z.id === id);
                    if (zone?.isActive) {
                      setToast("Cannot delete active zone");
                    } else {
                      setZones(zones.filter(z => z.id !== id)); 
                      setToast("Zone Deleted"); 
                    }
                  }}
                  onToggleStatus={(id) => setZones(zones.map(z => z.id === id ? { ...z, isActive: !z.isActive } : z))}
                  onNavigateToMap={() => setScreen('map')}
                /> :
               <AnalyticsScreen isHighContrast={isHighContrast} />
            ) : screen === 'map' ? (
               <MapView 
                  userType={user.type} 
                  zones={zones.filter(z => user.type === UserType.REGULAR ? (z.isActive && (z.expiryDate ? z.expiryDate > Date.now() : false)) : true)} 
                  userLocation={userLocation} 
                  onUserMove={setUserLocation} 
                  isHighContrast={isHighContrast} 
                  onAddZone={(p,s) => {
                    const newZone: AdZone = { 
                      id: `z-${Date.now()}`, 
                      ownerId: user.id, 
                      name: `Zone @ ${p.lat.toFixed(4)}`, 
                      shape: s, 
                      center: p, 
                      radius: s === 'CIRCLE' ? 50 : 0, 
                      width: s === 'RECTANGLE' ? 50 : 0, 
                      height: s === 'RECTANGLE' ? 50 : 0, 
                      isActive: true, // PROTOTYPE: Auto-activate new zones so Advertisers can see them immediately
                      pricePer1k: 15, 
                      paymentHistory: [], 
                      totalCostPaid: 0 
                    };
                    setZones([...zones, newZone]);
                    setSelectedZoneId(newZone.id);
                    setToast("New Zone Created & Activated!");
                  }} 
                  onUpdateZone={(uz) => setZones(zones.map(z => z.id === uz.id ? uz : z))}
                  onDeleteZone={(id) => setZones(zones.filter(z => z.id !== id))}
                  onInitiatePayment={(z, d, p) => { setPaymentConfig({ zone: z, duration: d, price: p }); setScreen('payment'); }} 
                  selectedZoneId={selectedZoneId}
                  onSelectZone={setSelectedZoneId}
                  onStartCampaign={(z) => {
                    setAdvertiserTargetZone(z);
                    setScreen('dashboard');
                  }}
                />
            ) : screen === 'payment' && paymentConfig ? (
               <PaymentScreen zone={paymentConfig.zone} durationMonths={paymentConfig.duration} price={paymentConfig.price} onConfirm={() => handleZoneActivation(paymentConfig.zone, paymentConfig.duration, paymentConfig.price)} onCancel={() => setScreen('map')} isHighContrast={isHighContrast} />
            ) : screen === 'chat' ? (
               <ChatScreen currentUser={user} allUsers={allUsers} chats={chats} onSendMessage={(sid, txt) => setChats(chats.map(c => c.id === sid ? { ...c, messages: [...c.messages, { id: `m-${Date.now()}`, senderId: user.id, text: txt, timestamp: Date.now() }], lastMessageTime: Date.now() } : c))} onCreateChat={(oid) => setChats([{ id: `c-${Date.now()}`, participants: [user.id, oid], messages: [], lastMessageTime: Date.now() }, ...chats])} isHighContrast={isHighContrast} />
            ) : screen === 'profile' ? (
               <ProfileScreen user={user} onLogout={() => setUser(null)} isHighContrast={isHighContrast} toggleHighContrast={() => setIsHighContrast(!isHighContrast)} onUpdateUser={(f) => setUser({ ...user, ...f })} />
            ) : screen === 'points' ? (
               <div className={`h-full flex flex-col ${isHighContrast ? 'bg-black' : 'bg-[#f7f8fa]'}`}>
                  <div className={`p-6 pb-4 ${isHighContrast ? 'bg-gray-900 border-b border-yellow-400' : 'bg-indigo-700 text-white shadow-xl'}`}>
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-black uppercase tracking-tight">Rewards Hub</h2>
                        <Gift size={24} className="text-gray-300 opacity-80" />
                     </div>
                     
                     <div className="flex bg-black/20 p-1 rounded-xl">
                        <button 
                           onClick={() => setRewardTab('inbox')}
                           className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${rewardTab === 'inbox' ? 'bg-white text-indigo-700 shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                        >
                           Ad Inbox
                        </button>
                        <button 
                           onClick={() => setRewardTab('wallet')}
                           className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${rewardTab === 'wallet' ? 'bg-white text-indigo-700 shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                        >
                           Crypto Wallet
                        </button>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 pb-20">
                     {rewardTab === 'inbox' ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                           <h3 className={`text-xs font-black uppercase tracking-widest px-1 ${isHighContrast ? 'opacity-40' : 'text-gray-500'}`}>Watch & Earn Queue</h3>
                           
                           {user.inventory.filter(ad => !ad.redeemed).length === 0 ? (
                              <div className="py-20 text-center space-y-4">
                                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                    <Play size={40} className="text-gray-400" />
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Inbox Empty</p>
                                    <p className={`text-[11px] max-w-[220px] mx-auto font-bold leading-relaxed ${isHighContrast ? 'opacity-40' : 'text-gray-500'}`}>
                                       Move around the map to collect location-based ads!
                                    </p>
                                 </div>
                                 <button onClick={() => setScreen('map')} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest bg-indigo-50 px-6 py-2.5 rounded-full transition-all active:scale-95">Explore Map</button>
                              </div>
                           ) : (
                              user.inventory.filter(ad => !ad.redeemed).map(ad => (
                                 <div 
                                    key={ad.id} 
                                    onClick={() => handleStartWatch(ad)} 
                                    className={`p-4 rounded-[24px] flex justify-between items-center group transition-all active:scale-[0.98] ${
                                       isHighContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-white shadow-sm border border-gray-100'
                                    }`}
                                 >
                                    <div className="flex items-center gap-4">
                                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden ${isHighContrast ? 'bg-yellow-400 text-black' : 'bg-indigo-50 text-indigo-600'}`}>
                                          <Play size={20} fill="currentColor" />
                                          {ad.adContent.videoUrl && (
                                             <div className="absolute inset-0 bg-black/10" />
                                          )}
                                       </div>
                                       <div className="max-w-[180px]">
                                          <h4 className="font-black text-sm truncate">{ad.adContent.title}</h4>
                                          <div className="flex items-center gap-2 mt-0.5">
                                             <Clock size={10} className={`${isHighContrast ? 'opacity-40' : 'text-gray-600'}`} />
                                             <p className={`text-[10px] font-black uppercase tracking-tighter ${isHighContrast ? 'opacity-40' : 'text-gray-500'}`}>
                                                {new Date(ad.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                             </p>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <div className="flex items-center gap-1 text-green-600 font-black text-sm">
                                          <span>+{ad.adContent.rewardPoints}</span>
                                          <ChevronRight size={14} className={`${isHighContrast ? 'opacity-40' : 'text-gray-600'}`} />
                                       </div>
                                       <p className={`text-[8px] font-black uppercase ${isHighContrast ? 'opacity-30' : 'text-gray-400'}`}>Points</p>
                                    </div>
                                 </div>
                              ))
                           )}
                        </div>
                     ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                           {/* Wallet Balance Card */}
                           <div className={`p-6 rounded-[32px] relative overflow-hidden ${isHighContrast ? 'bg-gray-900 border-2 border-yellow-400' : 'bg-gradient-to-br from-indigo-900 to-purple-900 text-white shadow-xl'}`}>
                              <div className="relative z-10">
                                 <div className="flex items-center gap-2 opacity-90 mb-2">
                                    <Wallet size={16} className="text-white" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Total Balance</p>
                                 </div>
                                 <h2 className="text-4xl font-black mb-1">{user.points.toLocaleString()} <span className="text-lg opacity-50">PTS</span></h2>
                                 <p className="text-sm font-bold opacity-60 flex items-center gap-2">
                                    ≈ {(user.points / 100).toFixed(2)} ADT Tokens
                                 </p>
                              </div>
                              <Coins className="absolute -right-6 -bottom-6 opacity-10" size={120} />
                           </div>

                           {/* Swap/Convert Section */}
                           <div className={`p-5 rounded-3xl space-y-4 ${isHighContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-white shadow-sm border border-gray-100'}`}>
                              <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${isHighContrast ? 'opacity-40' : 'text-gray-600'}`}>
                                 <ArrowRightLeft size={14} className="text-gray-500" /> Conversion Rate
                              </h3>
                              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl">
                                 <span className="text-xs font-black text-gray-700">100 Points</span>
                                 <ArrowRightLeft size={14} className="text-gray-500" />
                                 <span className="text-xs font-black text-indigo-600">1.00 ADT</span>
                              </div>
                              <p className={`text-[10px] leading-relaxed ${isHighContrast ? 'opacity-40' : 'text-gray-500'}`}>
                                 Points are automatically converted to Adinci Tokens (ADT) upon withdrawal. Minimum withdrawal is 500 Points.
                              </p>
                           </div>

                           {/* Withdraw Section */}
                           <div className={`p-5 rounded-3xl space-y-4 ${isHighContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-white shadow-sm border border-gray-100'}`}>
                              <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${isHighContrast ? 'opacity-40' : 'text-gray-600'}`}>
                                 <Zap size={14} className="text-gray-500" /> Withdraw to Crypto
                              </h3>
                              
                              <div className="space-y-2">
                                 <label className={`text-[10px] font-bold uppercase ml-1 ${isHighContrast ? 'opacity-60' : 'text-gray-700'}`}>Wallet Address (Polygon / ETH)</label>
                                 <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 ring-indigo-100 transition-all">
                                    <Wallet size={16} className="ml-3 text-gray-600" />
                                    <input 
                                       value={withdrawAddress}
                                       onChange={(e) => setWithdrawAddress(e.target.value)}
                                       placeholder="0x..." 
                                       className="w-full bg-transparent p-3 outline-none text-xs font-mono font-medium"
                                    />
                                 </div>
                              </div>

                              <button 
                                 onClick={handleWithdrawCrypto}
                                 disabled={isWithdrawing || user.points < 500}
                                 className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                    isWithdrawing || user.points < 500
                                       ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                       : (isHighContrast ? 'bg-yellow-400 text-black' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200')
                                 }`}
                              >
                                 {isWithdrawing ? (
                                    <>
                                       <Loader2 size={16} className="animate-spin" /> Processing...
                                    </>
                                 ) : (
                                    <>
                                       Withdraw {(user.points / 100).toFixed(2)} ADT
                                    </>
                                 )}
                              </button>
                           </div>

                           {/* Mock History */}
                           <div className="pt-2">
                              <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${isHighContrast ? 'opacity-60' : 'text-gray-700'}`}>
                                 <History size={12} className="text-gray-600" /> Recent Transactions
                              </h3>
                              <div className="space-y-2">
                                 <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                          <ArrowRightLeft size={14} />
                                       </div>
                                       <div>
                                          <p className="text-[10px] font-black uppercase">Withdrawal</p>
                                          <p className={`text-[9px] ${isHighContrast ? 'opacity-60' : 'text-gray-500'}`}>2 days ago</p>
                                       </div>
                                    </div>
                                    <span className="text-xs font-black text-gray-600">- 15.00 ADT</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            ) : null}
          </>
        ) : null}
      </div>

      {user && screen !== 'payment' && screen !== 'login' && <BottomNav userType={user.type} currentScreen={screen} setScreen={setScreen} isHighContrast={isHighContrast} />}
    </div>
  );
}
