import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { SignalsPage } from './pages/SignalsPage';
import { SoulsPage } from './pages/SoulsPage';
import { OrbitPage } from './pages/OrbitPage';
import { CorePage } from './pages/Core/CorePage';
import { ChatPage } from './pages/ChatPage';
import { WeChatNav } from './components/WeChatNav';
import { AICharacter } from './types';
import { FavoriteMessage } from './pages/Core/CollectionsPage'; // 引入类型

interface WeChatAppProps {
  onClose: () => void;
}

const STORAGE_KEY = 'starry_os_wechat_characters';
const FAVORITES_KEY = 'starry_os_wechat_favorites'; // 新增收藏存储Key

export const WeChatApp: React.FC<WeChatAppProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('signals');
  const [activeChat, setActiveChat] = useState<any | null>(null);

  // 1. 联系人与聊天记录状态
  const [characters, setCharacters] = useState<AICharacter[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // 2. 收藏夹状态 (初始化从本地读取)
  const [favorites, setFavorites] = useState<FavoriteMessage[]>(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // 保存联系人数据
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  }, [characters]);

  // 保存收藏数据
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const handleAddCharacter = (char: AICharacter) => {
    setCharacters(prev => [char, ...prev]);
  };

  const handleUpdateCharacter = (updatedChar: AICharacter) => {
    setCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
  };

  const handleDeleteCharacter = (id: string) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateMessages = (id: string, messages: any[]) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, messages } : c));
  };

  // --- 处理合并转发到指定联系人 ---
  const handleForwardToContact = (contactId: string, msg: any) => {
    setCharacters(prev => prev.map(c => {
      if (c.id !== contactId) return c;
      const existing = c.messages ?? [];
      return { ...c, messages: [...existing, msg] };
    }));
  };

  // --- 新增：处理收藏动作 ---
  const handleAddFavorite = (msg: FavoriteMessage) => {
    // 防止重复收藏
    if (favorites.some(f => f.id === msg.id)) return;
    setFavorites(prev => [msg, ...prev]);
  };

  // --- 新增：处理删除收藏 ---
  const handleRemoveFavorite = (id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'signals': return <SignalsPage characters={characters} onChatClick={setActiveChat} />;
      case 'souls': return (
        <SoulsPage 
          characters={characters} 
          onAddCharacter={handleAddCharacter} 
          onUpdateCharacter={handleUpdateCharacter}
          onDeleteCharacter={handleDeleteCharacter}
        />
      );
      case 'orbit': return <OrbitPage />;
      case 'core': return (
        <CorePage 
          favorites={favorites} 
          onRemoveFavorite={handleRemoveFavorite} 
        />
      );
      default: return null;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'signals': return 'Signals';
      case 'souls': return 'Souls';
      case 'orbit': return 'Orbit';
      case 'core': return 'Core';
      default: return '';
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-[#fcfcfc] flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 flex items-center justify-between z-10" style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(env(safe-area-inset-top) + 50px)' }}>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-white" />
          </button>
          <h2 className="text-lg font-bold text-white">{getTitle()}</h2>
        </div>
      </div>

      {renderContent()}

      <WeChatNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <AnimatePresence>
        {activeChat && (
          <ChatPage 
            contact={activeChat} 
            onBack={() => setActiveChat(null)} 
            onUpdateMessages={(msgs) => handleUpdateMessages(activeChat.id, msgs)}
            onFavorite={handleAddFavorite}
            allContacts={characters.map(c => ({
              id: c.id,
              name: c.remark || c.realName,
              avatar: c.avatar,
              initials: (c.remark || c.realName)[0],
            }))}
            onForwardToContact={handleForwardToContact}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};