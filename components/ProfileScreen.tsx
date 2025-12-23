import React, { useState, useRef } from 'react';
import { User, UserType, PrivacyLevel, UserSettings } from '../types';
import { LogOut, User as UserIcon, Shield, Bell, Eye, ChevronRight, Settings, CreditCard, HelpCircle, Camera, Edit2, Phone, Info, Save, X, Lock, Check } from 'lucide-react';

interface ProfileScreenProps {
  user: User;
  onLogout: () => void;
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  onUpdateUser: (updatedUser: Partial<User>) => void;
}

const Section = ({ title, children, isHighContrast }: { title: string, children?: React.ReactNode, isHighContrast: boolean }) => (
  <div className={`mb-6 rounded-xl overflow-hidden ${isHighContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-white shadow-sm'}`}>
    <div className={`px-4 py-3 border-b ${isHighContrast ? 'border-gray-800' : 'border-gray-100 bg-gray-50'}`}>
      <h3 className={`font-bold text-sm ${isHighContrast ? 'text-yellow-400' : 'text-gray-800 uppercase tracking-wider'}`}>{title}</h3>
    </div>
    <div>{children}</div>
  </div>
);

const Item = ({ icon: Icon, label, value, onClick, toggle, isHighContrast, subtext }: any) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between p-4 border-b last:border-0 cursor-pointer transition-colors ${
      isHighContrast 
        ? 'border-gray-800 hover:bg-gray-800 text-white' 
        : 'border-gray-50 hover:bg-gray-50 text-gray-900'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${isHighContrast ? 'bg-black text-yellow-400' : 'bg-gray-100 text-gray-700'}`}>
         <Icon size={18} />
      </div>
      <div className="flex flex-col">
        <span className="font-medium">{label}</span>
        {subtext && <span className={`text-xs ${isHighContrast ? 'text-gray-400' : 'text-gray-600'}`}>{subtext}</span>}
      </div>
    </div>
    <div className="flex items-center gap-2">
       {value && <span className={`text-sm text-right max-w-[150px] truncate ${isHighContrast ? 'opacity-60' : 'text-gray-700'}`}>{value}</span>}
       {toggle !== undefined ? (
           <div className={`w-10 h-6 rounded-full relative transition-colors ${toggle ? (isHighContrast ? 'bg-yellow-400' : 'bg-green-500') : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${toggle ? 'left-5' : 'left-1'}`} />
           </div>
       ) : (
          <ChevronRight size={16} className={`${isHighContrast ? 'opacity-40' : 'text-gray-600'}`} />
       )}
    </div>
  </div>
);

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout, isHighContrast, toggleHighContrast, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editForm, setEditForm] = useState({
    name: user.name,
    bio: user.bio || '',
    phoneNumber: user.phoneNumber || ''
  });

  const handleSave = () => {
    onUpdateUser(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      name: user.name,
      bio: user.bio || '',
      phoneNumber: user.phoneNumber || ''
    });
    setIsEditing(false);
  };

  const updatePrivacy = (key: keyof UserSettings, value: any) => {
    const newSettings = { ...user.settings, [key]: value };
    onUpdateUser({ settings: newSettings });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
           onUpdateUser({ avatar: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const bgClass = isHighContrast ? 'bg-black text-white' : 'bg-gray-50 text-gray-900';
  
  // Privacy Defaults
  const lastSeen = user.settings.lastSeen || 'Everyone';
  const profilePhoto = user.settings.profilePhoto || 'Everyone';
  const readReceipts = user.settings.readReceipts !== undefined ? user.settings.readReceipts : true;

  const PrivacyOption = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
    <div className={`flex justify-between items-center p-3 rounded ${isHighContrast ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <span className={isHighContrast ? '' : 'text-gray-800'}>{label}</span>
        <select 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`font-bold text-sm bg-transparent outline-none cursor-pointer ${isHighContrast ? 'text-yellow-400' : 'text-blue-600'}`}
        >
            <option value="Everyone">Everyone</option>
            <option value="My Contacts">My Contacts</option>
            <option value="Nobody">Nobody</option>
        </select>
    </div>
  );

  // --- Modal Content Renderer ---
  const renderModalContent = () => {
     switch(activeModal) {
        case 'privacy':
           return (
              <div className="space-y-4">
                 <PrivacyOption 
                    label="Last Seen" 
                    value={lastSeen} 
                    onChange={(val) => updatePrivacy('lastSeen', val as PrivacyLevel)} 
                 />
                 <PrivacyOption 
                    label="Profile Photo" 
                    value={profilePhoto} 
                    onChange={(val) => updatePrivacy('profilePhoto', val as PrivacyLevel)} 
                 />
                 
                 <div 
                    className={`flex justify-between items-center p-3 rounded cursor-pointer ${isHighContrast ? 'bg-gray-800' : 'bg-gray-50'}`}
                    onClick={() => updatePrivacy('readReceipts', !readReceipts)}
                 >
                    <div className="flex flex-col">
                        <span className={isHighContrast ? '' : 'text-gray-800'}>Read Receipts</span>
                        <span className={`text-[10px] ${isHighContrast ? 'opacity-60' : 'text-gray-600'}`}>If turned off, you won't send or receive Read Receipts.</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${readReceipts ? (isHighContrast ? 'bg-yellow-400' : 'bg-green-500') : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${readReceipts ? 'left-5' : 'left-1'}`} />
                    </div>
                 </div>
                 
                 <p className="text-xs text-gray-500 text-center pt-2">End-to-end encryption enabled.</p>
              </div>
           );
        case 'help':
           return (
              <div className="space-y-4">
                 <div className="p-4 bg-blue-50 text-blue-800 rounded-lg">
                    <h4 className="font-bold mb-1">Contact Support</h4>
                    <p className="text-sm">Need help? Chat with our support team directly from the chat screen.</p>
                 </div>
                 <div className="space-y-2">
                    <div className="p-3 border rounded text-gray-700">FAQ: How to earn points?</div>
                    <div className="p-3 border rounded text-gray-700">FAQ: Withdrawing cash</div>
                 </div>
              </div>
           );
        case 'billing':
           return (
              <div className="space-y-4">
                 <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg">
                    <div className="flex justify-between mb-4">
                       <span className="opacity-80">Current Balance</span>
                       <CreditCard />
                    </div>
                    <div className="text-2xl font-mono mb-4">**** **** **** 4242</div>
                    <div className="flex justify-between text-sm">
                       <span>VISA DEBIT</span>
                       <span>EXP 12/25</span>
                    </div>
                 </div>
                 <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-50">
                    + Add New Method
                 </button>
              </div>
           );
        default: return null;
     }
  };

  return (
    <div className={`h-full overflow-y-auto pb-20 ${bgClass}`}>
      
      {/* Hidden File Input */}
      <input 
         type="file" 
         ref={fileInputRef} 
         className="hidden" 
         accept="image/*"
         onChange={handleImageUpload}
      />

      {/* Modal Overlay */}
      {activeModal && (
         <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className={`w-full max-w-sm p-6 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 ${isHighContrast ? 'bg-gray-900 border border-yellow-400 text-white' : 'bg-white text-gray-900'}`}>
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold capitalize">{activeModal}</h2>
                  <button onClick={() => setActiveModal(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200"><X size={20}/></button>
               </div>
               {renderModalContent()}
            </div>
         </div>
      )}

      {/* WhatsApp Style Header / Avatar Area */}
      <div className={`relative pt-10 pb-6 flex flex-col items-center ${isHighContrast ? 'bg-gray-900 border-b border-yellow-400' : 'bg-white shadow-sm'}`}>
         
         <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div 
              className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white shadow-lg overflow-hidden transition-all hover:opacity-90"
              style={{ backgroundColor: !user.avatar?.startsWith('data:') && !user.avatar?.startsWith('http') ? (user.avatar || (isHighContrast ? '#ffd700' : '#3b82f6')) : undefined }}
            >
               {user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:')) ? (
                 <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
               ) : (
                 <span className={isHighContrast && !user.avatar ? 'text-black' : 'text-white'}>{user.name.charAt(0)}</span>
               )}
            </div>
            <div className="absolute bottom-1 right-1 bg-green-500 p-2 rounded-full text-white shadow-md">
               <Camera size={16} />
            </div>
         </div>

         {!isEditing ? (
           <div className="text-center mt-4 px-6">
             <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
               {user.name}
               <button onClick={() => setIsEditing(true)} className={`hover:opacity-100 ${isHighContrast ? 'opacity-50' : 'text-gray-700'}`}>
                 <Edit2 size={16} />
               </button>
             </h1>
             <p className={`text-sm mt-1 ${isHighContrast ? 'opacity-60' : 'text-gray-600'}`}>{user.phoneNumber || '+971 -- --- ----'}</p>
             <p className={`mt-3 text-sm px-4 py-1 rounded-full inline-block ${isHighContrast ? 'bg-yellow-400/20 text-yellow-400' : 'bg-gray-100 text-gray-700'}`}>
                {user.bio || 'Hey there! I am using Rewarded AD.'}
             </p>
           </div>
         ) : (
           <div className="w-full max-w-xs mt-4 space-y-3 animate-in fade-in slide-in-from-top-4">
              <input 
                value={editForm.name}
                onChange={e => setEditForm({...editForm, name: e.target.value})}
                placeholder="Name"
                className={`w-full p-2 rounded border ${isHighContrast ? 'bg-black border-yellow-400 text-white' : 'border-gray-300'}`}
              />
              <input 
                value={editForm.phoneNumber}
                onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})}
                placeholder="Phone Number"
                className={`w-full p-2 rounded border ${isHighContrast ? 'bg-black border-yellow-400 text-white' : 'border-gray-300'}`}
              />
              <textarea 
                value={editForm.bio}
                onChange={e => setEditForm({...editForm, bio: e.target.value})}
                placeholder="Bio / About"
                rows={2}
                className={`w-full p-2 rounded border ${isHighContrast ? 'bg-black border-yellow-400 text-white' : 'border-gray-300'}`}
              />
              <div className="flex gap-2">
                 <button onClick={handleCancel} className="flex-1 py-2 bg-gray-200 text-gray-800 rounded font-bold">Cancel</button>
                 <button onClick={handleSave} className="flex-1 py-2 bg-green-500 text-white rounded font-bold">Save</button>
              </div>
           </div>
         )}
      </div>

      <div className="p-4">
         <Section title="Info" isHighContrast={isHighContrast}>
            <Item icon={Phone} label="Phone" value={user.phoneNumber || 'Not Set'} isHighContrast={isHighContrast} />
            <Item icon={Info} label="About" subtext={user.bio || 'Available'} isHighContrast={isHighContrast} />
            <Item icon={UserIcon} label="Account Type" value={user.type} isHighContrast={isHighContrast} />
         </Section>

         <Section title="Settings" isHighContrast={isHighContrast}>
             <Item 
                icon={Eye} 
                label="Blind / Visually Impaired Mode" 
                toggle={isHighContrast} 
                onClick={toggleHighContrast}
                isHighContrast={isHighContrast}
             />
             <Item 
                icon={Bell} 
                label="Notifications" 
                toggle={notificationsEnabled} 
                onClick={() => setNotificationsEnabled(!notificationsEnabled)} 
                isHighContrast={isHighContrast} 
             />
              <Item 
                icon={Shield} 
                label="Privacy" 
                onClick={() => setActiveModal('privacy')} 
                isHighContrast={isHighContrast} 
             />
             <Item 
                icon={Lock} 
                label="Security" 
                onClick={() => alert("Security settings are up to date.")} 
                isHighContrast={isHighContrast} 
             />
         </Section>
         
          {user.type === UserType.ADVERTISER && (
            <Section title="Business Tools" isHighContrast={isHighContrast}>
                <Item 
                    icon={CreditCard} 
                    label="Billing Methods" 
                    value="Visa •••• 4242" 
                    onClick={() => setActiveModal('billing')}
                    isHighContrast={isHighContrast} 
                />
            </Section>
          )}

         <Section title="Help & Support" isHighContrast={isHighContrast}>
            <Item icon={HelpCircle} label="Help Center" onClick={() => setActiveModal('help')} isHighContrast={isHighContrast} />
         </Section>

         <button 
           onClick={onLogout}
           className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${
               isHighContrast 
               ? 'bg-red-900 text-yellow-400 border-2 border-red-500' 
               : 'bg-white text-red-600 border border-red-100 shadow-sm hover:bg-red-50'
           }`}
         >
           <LogOut size={20} />
           Sign Out
         </button>
      </div>
    </div>
  );
};