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

const STORAGE_KEY = 'souyee_os_wechat_characters';
const FAVORITES_KEY = 'souyee_os_wechat_favorites';

/* ─── Design tokens ─────────────────────────────────────────── */
const t = {
  bg:            '#f5f5f3',
  bgWarm:        '#fafaf8',
  surface:       'rgba(255,255,255,0.72)',
  surfaceStrong: 'rgba(255,255,255,0.92)',
  border:        'rgba(0,0,0,0.07)',
  borderMid:     'rgba(0,0,0,0.12)',
  borderStrong:  'rgba(0,0,0,0.20)',
  ink:           '#111110',
  inkMid:        'rgba(17,17,16,0.50)',
  inkFaint:      'rgba(17,17,16,0.28)',
  inkGhost:      'rgba(17,17,16,0.14)',
  glass:         'rgba(245,245,243,0.80)',
  blur:          'blur(32px) saturate(180%)',
  fontDisplay:   '"Didot", "Bodoni MT", "Playfair Display", Georgia, serif',
  fontSans:      '"Helvetica Neue", Helvetica, Arial, sans-serif',
  fontMono:      '"SF Mono", "Fira Code", monospace',
};

/* ─── Noise grain overlay (磨砂感) ──────────────────────────── */
const GrainOverlay: React.FC = () => (
  <svg
    aria-hidden
    style={{
      position: 'fixed', inset: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none',
      zIndex: 9998,
      opacity: 0.032,
      mixBlendMode: 'multiply',
    }}
  >
    <filter id="g">
      <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#g)" />
  </svg>
);

/* ─── Soft background blobs ─────────────────────────────────── */
const BgCanvas: React.FC = () => (
  <div
    aria-hidden
    style={{
      position: 'fixed', inset: 0,
      pointerEvents: 'none',
      zIndex: 0,
      background: t.bg,
      backgroundImage: `
        radial-gradient(ellipse 70% 55% at 15% 10%,  rgba(220,220,218,0.60) 0%, transparent 65%),
        radial-gradient(ellipse 55% 45% at 88% 78%,  rgba(200,200,198,0.40) 0%, transparent 60%),
        radial-gradient(ellipse 40% 35% at 60% 30%,  rgba(235,235,232,0.70) 0%, transparent 55%)
      `,
    }}
  />
);

/* ─── Tab config ─────────────────────────────────────────────── */
const TABS = [
  { id: 'signals', label: 'Signals' },
  { id: 'souls',   label: 'Souls'   },
  { id: 'orbit',   label: 'Orbit'   },
  { id: 'core',    label: 'Core'    },
] as const;
type TabId = typeof TABS[number]['id'];

/* ─── Bottom nav ─────────────────────────────────────────────── */
const Nav: React.FC<{ active: TabId; onChange: (id: TabId) => void }> = ({ active, onChange }) => (
  <div
    style={{
      flexShrink: 0,
      background: t.glass,
      backdropFilter: t.blur,
      WebkitBackdropFilter: t.blur,
      borderTop: `1px solid ${t.border}`,
      paddingBottom: 'env(safe-area-inset-bottom)',
      display: 'flex',
      position: 'relative',
      zIndex: 10,
    }}
  >
    {TABS.map((tab) => {
      const on = tab.id === active;
      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            padding: '11px 0 13px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          {on && (
            <motion.div
              layoutId="nav-bar"
              style={{
                position: 'absolute',
                top: 0, left: '22%', right: '22%',
                height: 1.5,
                background: t.ink,
                borderRadius: 99,
              }}
              transition={{ type: 'spring', stiffness: 480, damping: 42 }}
            />
          )}
          <div
            style={{
              width: 4, height: 4,
              borderRadius: '50%',
              background: on ? t.ink : t.inkGhost,
              transition: 'background 0.25s',
            }}
          />
          <span
            style={{
              fontFamily: t.fontSans,
              fontSize: 9,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: on ? 600 : 400,
              color: on ? t.ink : t.inkMid,
              transition: 'color 0.25s',
            }}
          >
            {tab.label}
          </span>
        </button>
      );
    })}
  </div>
);

/* ─── Top bar ────────────────────────────────────────────────── */
const TopBar: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => {
  const dateStr = new Date()
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    .toUpperCase();

  return (
    <div
      style={{
        flexShrink: 0,
        background: t.glass,
        backdropFilter: t.blur,
        WebkitBackdropFilter: t.blur,
        borderBottom: `1px solid ${t.border}`,
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: 0,
        zIndex: 10,
        position: 'relative',
      }}
    >
      {/* Row 1: back / wordmark */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: t.inkMid,
            fontFamily: t.fontSans,
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = t.ink)}
          onMouseLeave={e => (e.currentTarget.style.color = t.inkMid)}
        >
          <span style={{ fontSize: 17, lineHeight: 1, marginTop: -2 }}>←</span>
          Back
        </button>

        <span
          style={{
            fontFamily: t.fontMono,
            fontSize: 8,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: t.inkFaint,
          }}
        >
          SOUYEE · OS
        </span>
      </div>

      {/* Row 2: editorial title + date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingBottom: 14,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.h1
            key={title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: -5 }}
            transition={{ duration: 0.2, ease: [0.25, 0, 0, 1] }}
            style={{
              margin: 0,
              fontFamily: t.fontDisplay,
              fontSize: 48,
              fontWeight: 700,
              fontStyle: 'italic',
              letterSpacing: '-0.025em',
              lineHeight: 1,
              color: t.ink,
            }}
          >
            {title}
          </motion.h1>
        </AnimatePresence>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 3,
            paddingBottom: 5,
          }}
        >
          <span
            style={{
              fontFamily: t.fontMono,
              fontSize: 7.5,
              letterSpacing: '0.24em',
              color: t.inkFaint,
              textTransform: 'uppercase',
            }}
          >
            {dateStr}
          </span>
          <div style={{ width: 24, height: 1, background: t.inkGhost }} />
        </div>
      </div>

      {/* hairline */}
      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 1,
          background: `linear-gradient(90deg, ${t.borderMid} 0%, ${t.border} 60%, transparent 100%)`,
        }}
      />
    </div>
  );
};

/* ─── App ────────────────────────────────────────────────────── */
export const WeChatApp: React.FC<WeChatAppProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabId>('signals');
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

  const handleAddCharacter     = (c: AICharacter) => setCharacters(p => [c, ...p]);
  const handleUpdateCharacter  = (u: AICharacter) => setCharacters(p => p.map(c => c.id === u.id ? u : c));
  const handleDeleteCharacter  = (id: string)      => setCharacters(p => p.filter(c => c.id !== id));
  const handleUpdateMessages   = (id: string, messages: any[]) =>
    setCharacters(p => p.map(c => c.id === id ? { ...c, messages } : c));
  const handleForwardToContact = (contactId: string, msg: any) =>
    setCharacters(p => p.map(c =>
      c.id !== contactId ? c : { ...c, messages: [...(c.messages ?? []), msg] }
    ));
  const handleAddFavorite    = (msg: FavoriteMessage) => {
    if (favorites.some(f => f.id === msg.id)) return;
    setFavorites(p => [msg, ...p]);
  };
  const handleRemoveFavorite = (id: string) => setFavorites(p => p.filter(f => f.id !== id));

  const getTitle = (): string =>
    ({ signals: 'Signals', souls: 'Souls', orbit: 'Orbit', core: 'Core' }[activeTab] ?? '');

  const renderContent = () => {
    switch (activeTab) {
      case 'signals': return <SignalsPage characters={characters} onChatClick={setActiveChat} />;
      case 'souls':   return (
        <SoulsPage
          characters={characters}
          onAddCharacter={handleAddCharacter}
          onUpdateCharacter={handleUpdateCharacter}
          onDeleteCharacter={handleDeleteCharacter}
        />
      );
      case 'orbit':  return <OrbitPage />;
      case 'core':   return <CorePage favorites={favorites} onRemoveFavorite={handleRemoveFavorite} />;
      default:       return null;
    }
  };

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0,      opacity: 1 }}
      exit={{    y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: t.fontSans,
      }}
    >
      <BgCanvas />
      <GrainOverlay />

      {activeTab !== 'core' && (
        <TopBar title={getTitle()} onClose={onClose} />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1,  y: 0  }}
          exit={{    opacity: 0,  y: -8 }}
          transition={{ duration: 0.20, ease: [0.25, 0, 0, 1] }}
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      <div style={{ position: 'relative', zIndex: 10 }}>
        <Nav active={activeTab} onChange={setActiveTab} />
      </div>

      <AnimatePresence>
        {activeChat && (
          <ChatPage
            contact={activeChat}
            onBack={() => setActiveChat(null)}
            onUpdateMessages={msgs => handleUpdateMessages(activeChat.id, msgs)}
            onFavorite={handleAddFavorite}
            allContacts={characters.map(c => ({
              id:       c.id,
              name:     c.remark || c.realName,
              avatar:   c.avatar,
              initials: (c.remark || c.realName)[0],
            }))}
            onForwardToContact={handleForwardToContact}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};