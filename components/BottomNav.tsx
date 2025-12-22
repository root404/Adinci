import React from 'react';
import { Map, LayoutDashboard, MessageCircle, User, PlayCircle } from 'lucide-react';
import { UserType } from '../types';

interface BottomNavProps {
  userType: UserType;
  currentScreen: string;
  setScreen: (screen: string) => void;
  isHighContrast: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ userType, currentScreen, setScreen, isHighContrast }) => {
  const baseClass = `fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around border-t z-50 transition-colors duration-300 ${
    isHighContrast ? 'bg-black border-yellow-400' : 'bg-white border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]'
  }`;

  const buttonClass = (isActive: boolean) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${
    isActive 
      ? (isHighContrast ? 'text-yellow-400 font-bold' : 'text-blue-600') 
      : (isHighContrast ? 'text-white' : 'text-gray-500 hover:text-gray-900')
  }`;

  if (userType === UserType.ZONE_OWNER) {
    return (
      <nav className={baseClass}>
        <button onClick={() => setScreen('dashboard')} className={buttonClass(currentScreen === 'dashboard')}>
          <LayoutDashboard size={20} />
          <span className="text-[10px]">Home</span>
        </button>
        <button onClick={() => setScreen('map')} className={buttonClass(currentScreen === 'map')}>
          <Map size={20} />
          <span className="text-[10px]">Map</span>
        </button>
        <button onClick={() => setScreen('chat')} className={buttonClass(currentScreen === 'chat')}>
          <MessageCircle size={20} />
          <span className="text-[10px]">Chat</span>
        </button>
        <button onClick={() => setScreen('profile')} className={buttonClass(currentScreen === 'profile')}>
          <User size={20} />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>
    );
  }

  if (userType === UserType.ADVERTISER) {
    return (
      <nav className={baseClass}>
        <button onClick={() => setScreen('dashboard')} className={buttonClass(currentScreen === 'dashboard')}>
          <LayoutDashboard size={20} />
          <span className="text-[10px]">Rentals</span>
        </button>
        <button onClick={() => setScreen('map')} className={buttonClass(currentScreen === 'map')}>
          <Map size={20} />
          <span className="text-[10px]">Map</span>
        </button>
        <button onClick={() => setScreen('chat')} className={buttonClass(currentScreen === 'chat')}>
          <MessageCircle size={20} />
          <span className="text-[10px]">Chat</span>
        </button>
        <button onClick={() => setScreen('profile')} className={buttonClass(currentScreen === 'profile')}>
          <User size={20} />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>
    );
  }

  return (
    <nav className={baseClass}>
      <button onClick={() => setScreen('map')} className={buttonClass(currentScreen === 'map')}>
        <Map size={24} />
        <span className="text-xs font-bold">Explore</span>
      </button>
      <button onClick={() => setScreen('points')} className={buttonClass(currentScreen === 'points')}>
        <PlayCircle size={24} />
        <span className="text-xs font-bold">Rewards</span>
      </button>
      <button onClick={() => setScreen('chat')} className={buttonClass(currentScreen === 'chat')}>
        <MessageCircle size={24} />
        <span className="text-xs font-bold">Chat</span>
      </button>
      <button onClick={() => setScreen('profile')} className={buttonClass(currentScreen === 'profile')}>
        <User size={24} />
        <span className="text-xs font-bold">Me</span>
      </button>
    </nav>
  );
};