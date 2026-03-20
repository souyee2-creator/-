import React from 'react';
import { MessageSquare, Sparkles, Orbit, User } from 'lucide-react';

interface WeChatNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const WeChatNav: React.FC<WeChatNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'signals', label: 'Signals', icon: MessageSquare },
    { id: 'souls', label: 'Souls', icon: Sparkles },
    { id: 'orbit', label: 'Orbit', icon: Orbit },
    { id: 'core', label: 'Core', icon: User },
  ];

  return (
    <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2 z-10">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-around items-center px-2 h-[64px] shadow-2xl">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 flex-1 py-2 transition-all duration-300 ${activeTab === tab.id ? 'text-white scale-110' : 'text-white/30 hover:text-white/50'}`}
          >
            <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-wider uppercase">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
