import React, { useState, useEffect, ReactNode, useRef } from 'react';
import { 
  MessageCircle, Settings, Book, Palette, Heart, 
  Battery, Wifi, Signal, MapPin, Upload 
} from 'lucide-react'; 
import { motion, AnimatePresence } from 'motion/react';

// --- App 引入 ---
import { WeChatApp } from './apps/wechat';
import { SettingsApp } from './apps/settings';
import { DiaryApp } from './apps/diary';
import { BeautifyApp } from './apps/beautify';
import { CouplesApp } from './apps/couples';

// 1. 交互式个人名片组件
const HeroCard = () => {
  const [profile, setProfile] = useState({
    name: 'Sylvia',
    id: 'souyee494',
    bio: '“ 人生小满胜万全 ”',
    location: '冰岛',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sylvia'
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = (field: string, value: string) => {
    if (value.trim() !== "") {
      setProfile(prev => ({ ...prev, [field]: value }));
    }
    setEditingField(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-[90%] max-w-md relative mt-12 mb-10"
    >
      <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
      <div className="backdrop-blur-2xl bg-white/30 border border-white/40 rounded-[2.5rem] p-8 pt-16 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] relative text-center space-y-4">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-[6px] border-[#F5F5F7] bg-gray-200 shadow-xl cursor-pointer overflow-hidden group"
        >
          <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover group-hover:opacity-60 transition-opacity" />
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 text-white">
            <Upload size={20} />
          </div>
        </div>

        <div>
          {editingField === 'name' ? (
            <input 
              autoFocus
              className="bg-black/5 border-none text-black text-2xl font-semibold text-center rounded-lg outline-none w-full px-2"
              defaultValue={profile.name}
              onBlur={(e) => handleUpdate('name', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdate('name', e.currentTarget.value)}
            />
          ) : (
            <h2 onClick={() => setEditingField('name')} className="text-2xl font-semibold text-black/80 cursor-pointer">{profile.name}</h2>
          )}
          <div className="mt-1">
            {editingField === 'id' ? (
              <input 
                autoFocus
                className="bg-black/5 border-none text-black/60 text-[9px] uppercase tracking-[0.3em] text-center rounded outline-none w-3/4 mx-auto block"
                defaultValue={profile.id}
                onBlur={(e) => handleUpdate('id', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdate('id', e.currentTarget.value)}
              />
            ) : (
              <p onClick={() => setEditingField('id')} className="text-[9px] uppercase tracking-[0.3em] text-black/20 cursor-pointer font-medium">{profile.id}</p>
            )}
          </div>
        </div>

        <div className="px-4">
          {editingField === 'bio' ? (
            <textarea 
              autoFocus
              className="bg-black/5 border-none text-black text-sm text-center rounded-lg outline-none w-full resize-none p-2"
              defaultValue={profile.bio}
              onBlur={(e) => handleUpdate('bio', e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') handleUpdate('bio', e.currentTarget.value); }}
            />
          ) : (
            <p onClick={() => setEditingField('bio')} className="text-sm text-black/50 font-light italic cursor-pointer leading-relaxed">{profile.bio}</p>
          )}
        </div>

        <div className="flex justify-center">
          {editingField === 'location' ? (
            <input 
              autoFocus
              className="bg-black/5 border-none text-black text-[10px] text-center rounded-full outline-none px-4 py-1"
              defaultValue={profile.location}
              onBlur={(e) => handleUpdate('location', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdate('location', e.currentTarget.value)}
            />
          ) : (
            <div onClick={() => setEditingField('location')} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.05] cursor-pointer text-black/30">
              <MapPin size={10} />
              <span className="text-[10px] tracking-wider font-medium">{profile.location}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// 2. App图标组件
interface AppIconProps {
  key?: string | number;   // ✨ 就是这一行！加上它，红线立刻消失
  icon: ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

const AppIcon = ({ icon, label, color, onClick }: AppIconProps) => (
  <motion.div 
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="flex flex-col items-center gap-2 cursor-pointer group"
  >
    <div className={`w-16 h-16 rounded-3xl ${color} flex items-center justify-center shadow-lg border border-white/20`}>
      {React.cloneElement(icon as React.ReactElement, { className: "text-white w-8 h-8" })}
    </div>
    <span className="text-black/40 text-[10px] font-medium tracking-tight">{label}</span>
  </motion.div>
);

// 3. 主程序
export default function App() {
  const [wallpaper, setWallpaper] = useState<string>('#F5F5F7');
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 🔐 API 配置逻辑
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('starry_os_api_key') || '');
  const [baseUrl, setBaseUrl] = useState<string>(() => localStorage.getItem('starry_os_base_url') || 'https://api.openai.com/v1');

  useEffect(() => {
    localStorage.setItem('starry_os_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('starry_os_base_url', baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const apps = [
    { id: 'wechat', label: '微信', icon: <MessageCircle />, color: 'bg-[#28C445]' },
    { id: 'settings', label: '设置', icon: <Settings />, color: 'bg-[#555]' },
    { id: 'diary', label: '日记', icon: <Book />, color: 'bg-[#4A90E2]' },
    { id: 'beautify', label: '美化', icon: <Palette />, color: 'bg-[#F06292]' },
    { id: 'couples', label: '情侣空间', icon: <Heart />, color: 'bg-[#FF5252]' },
  ];

  const formatTime = (date: Date) => date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div 
      className="fixed inset-0 overflow-hidden select-none transition-all duration-700" 
      onClick={() => setActiveApp(null)}
      style={{ background: wallpaper.startsWith('http') || wallpaper.startsWith('data') ? `url(${wallpaper}) center/cover no-repeat` : wallpaper }}
    >
      <div className="h-full w-full flex flex-col relative z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Status Bar */}
        <div className="w-full px-8 py-4 flex justify-between items-center text-black/40 text-[11px] tracking-tight font-bold">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center gap-2">
            <Signal size={14} /> <Wifi size={14} /> <Battery size={16} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center">
          <HeroCard />
          <div className="grid grid-cols-4 gap-x-4 gap-y-8 px-8 w-full max-w-sm">
            {apps.map((app) => (
              <AppIcon key={app.id} icon={app.icon} label={app.label} color={app.color} onClick={() => setActiveApp(app.id)} />
            ))}
          </div>
        </div>

        {/* Bottom Dock */}
        <div className="mb-10 mx-auto w-[85%] max-w-sm h-20 bg-black/[0.04] backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-around px-6 border border-black/[0.02]">
          {apps.slice(0, 4).map((app) => (
            <div key={`dock-${app.id}`} onClick={(e) => { e.stopPropagation(); setActiveApp(app.id); }} className={`w-12 h-12 rounded-2xl ${app.color} flex items-center justify-center cursor-pointer shadow-sm active:scale-90 transition-transform`}>
              {React.cloneElement(app.icon as React.ReactElement, { size: 24, className: "text-white" })}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeApp === 'wechat' && <WeChatApp onClose={() => setActiveApp(null)} apiKey={apiKey} baseUrl={baseUrl} />}
        {activeApp === 'settings' && (
          <SettingsApp 
            onClose={() => setActiveApp(null)} 
            apiKey={apiKey} 
            onUpdateApiKey={setApiKey} 
            baseUrl={baseUrl} 
            onUpdateBaseUrl={setBaseUrl} 
          />
        )}
        {activeApp === 'diary' && <DiaryApp onClose={() => setActiveApp(null)} apiKey={apiKey} />}
        {activeApp === 'beautify' && <BeautifyApp onClose={() => setActiveApp(null)} onSetWallpaper={setWallpaper} currentWallpaper={wallpaper} />}
        {activeApp === 'couples' && <CouplesApp onClose={() => setActiveApp(null)} />}
      </AnimatePresence>
    </div>
  );
}