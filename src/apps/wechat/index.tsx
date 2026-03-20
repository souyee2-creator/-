import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SignalsPage } from './pages/SignalsPage';
import { SoulsPage } from './pages/SoulsPage';
import { OrbitPage } from './pages/OrbitPage';
import { CorePage } from './pages/Core/CorePage';
import { ChatPage } from './pages/ChatPage';
import { WeChatNav } from './components/WeChatNav';
import { AICharacter } from './types';
import { FavoriteMessage } from './pages/Core/CollectionsPage';

interface WeChatAppProps {
  onClose: () => void;
}

const STORAGE_KEY = 'starry_os_wechat_characters';
const FAVORITES_KEY = 'starry_os_wechat_favorites';

export const WeChatApp: React.FC<WeChatAppProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('signals');
  const [activeChat, setActiveChat] = useState<any | null>(null);

  const [characters, setCharacters] = useState<AICharacter[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [favorites, setFavorites] = useState<FavoriteMessage[]>(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  }, [characters]);

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

  const handleForwardToContact = (contactId: string, msg: any) => {
    setCharacters(prev => prev.map(c => {
      if (c.id !== contactId) return c;
      const existing = c.messages ?? [];
      return { ...c, messages: [...existing, msg] };
    }));
  };

  const handleAddFavorite = (msg: FavoriteMessage) => {
    if (favorites.some(f => f.id === msg.id)) return;
    setFavorites(prev => [msg, ...prev]);
  };

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
      case 'souls':   return 'Souls';
      case 'orbit':   return 'Orbit';
      case 'core':    return 'Core';
      default: return '';
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: '#fafaf8',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Editorial top bar ── */}
      <div
        style={{
          background: '#fafaf8',
          paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 0,
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        {/* Thin top rule */}
        <div style={{ height: 2, background: '#111', marginBottom: 6 }} />

        {/* Kicker row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#999',
              fontFamily: 'Georgia, "Times New Roman", serif',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span style={{ fontSize: 13, color: '#888' }}>‹</span>
            <span>Back</span>
          </button>
          <span
            style={{
              fontSize: 8,
              letterSpacing: '0.36em',
              textTransform: 'uppercase',
              color: '#ccc',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
            }}
          >
            SOUYEE PHONE
          </span>
        </div>

        {/* Main title */}
        <h1
          style={{
            margin: '2px 0 6px',
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            color: '#111',
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          {getTitle()}.
        </h1>

        {/* Bottom rule */}
        <div style={{ height: 1, background: '#111' }} />
      </div>

      {/* ── Page content ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {renderContent()}
      </div>

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