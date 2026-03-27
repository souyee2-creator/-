import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SignalsPage } from './pages/SignalsPage';
import { SoulsPage } from './pages/SoulsPage';
import { OrbitPage } from './pages/OrbitPage';
import { CorePage } from './pages/Core/CorePage';
import { ChatPage } from './pages/ChatPage';
import { AICharacter } from './types';
import { FavoriteMessage } from './pages/Core/CollectionsPage';

interface WeChatAppProps {
  onClose: () => void;
}

const STORAGE_KEY = 'souyee_os_wechat_characters';
const FAVORITES_KEY = 'souyee_os_wechat_favorites';

/* ─── Design tokens — B&W high-end INS ──────────────────────── */
const t = {
  // Pure black & white core
  bg:            '#FFFFFF',
  bgOff:         '#F8F8F8',
  surface:       'rgba(255,255,255,0.96)',
  surfaceStrong: '#FFFFFF',

  // Ink scale
  ink:           '#000000',
  inkDark:       '#111111',
  inkMid:        'rgba(0,0,0,0.45)',
  inkFaint:      'rgba(0,0,0,0.25)',
  inkGhost:      'rgba(0,0,0,0.10)',
  inkHair:       'rgba(0,0,0,0.07)',

  // Borders — ultra-thin editorial lines
  border:        'rgba(0,0,0,0.09)',
  borderMid:     'rgba(0,0,0,0.18)',
  borderStrong:  '#000000',

  // Glass
  glass:         'rgba(255,255,255,0.94)',
  blur:          'blur(24px) saturate(160%)',

  // Typography — editorial contrast pairing
  fontDisplay:   '"Didot", "Bodoni MT", "Playfair Display", "Times New Roman", serif',
  fontSans:      '"Helvetica Neue", Helvetica, Arial, sans-serif',
  fontMono:      '"SF Mono", "Fira Code", "Courier New", monospace',

  // Spacing rhythm
  radius:        '0px',   // no radius — stark/editorial
  radiusSm:      '2px',
};

/* ─── Noise grain overlay ────────────────────────────────────── */
const GrainOverlay: React.FC = () => (
  <svg
    aria-hidden
    style={{
      position: 'fixed', inset: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none',
      zIndex: 9998,
      opacity: 0.018,
      mixBlendMode: 'multiply',
    }}
  >
    <filter id="grain-bw">
      <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain-bw)" />
  </svg>
);

/* ─── Clean white canvas — no blobs, just structure ─────────── */
const BgCanvas: React.FC = () => (
  <div
    aria-hidden
    style={{
      position: 'fixed', inset: 0,
      pointerEvents: 'none',
      zIndex: 0,
      background: t.bg,
    }}
  >
    {/* Subtle vertical rhythm lines — INS grid feel */}
    <div style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: `
        linear-gradient(90deg, ${t.inkHair} 1px, transparent 1px)
      `,
      backgroundSize: '25% 100%',
      backgroundPosition: '0 0',
    }} />
  </div>
);

/* ─── Tab config ─────────────────────────────────────────────── */
const TABS = [
  { id: 'signals', label: 'Signals', num: '01' },
  { id: 'souls',   label: 'Souls',   num: '02' },
  { id: 'orbit',   label: 'Orbit',   num: '03' },
  { id: 'core',    label: 'Core',    num: '04' },
] as const;
type TabId = typeof TABS[number]['id'];

/* ─── Bottom nav — stark editorial bar ──────────────────────── */
const Nav: React.FC<{ active: TabId; onChange: (id: TabId) => void }> = ({ active, onChange }) => (
  <div
    style={{
      flexShrink: 0,
      background: t.surface,
      backdropFilter: t.blur,
      WebkitBackdropFilter: t.blur,
      borderTop: `1px solid ${t.borderStrong}`,
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
            gap: 4,
            padding: '14px 0 16px',
            background: on ? t.ink : 'none',
            border: 'none',
            borderRight: `1px solid ${t.borderMid}`,
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.22s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Number indicator */}
          <span
            style={{
              fontFamily: t.fontMono,
              fontSize: 7,
              letterSpacing: '0.20em',
              color: on ? 'rgba(255,255,255,0.40)' : t.inkGhost,
              transition: 'color 0.22s',
            }}
          >
            {tab.num}
          </span>
          {/* Label */}
          <span
            style={{
              fontFamily: t.fontSans,
              fontSize: 9.5,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontWeight: on ? 700 : 400,
              color: on ? '#FFFFFF' : t.inkMid,
              transition: 'color 0.22s, font-weight 0.22s',
            }}
          >
            {tab.label}
          </span>
        </button>
      );
    })}
  </div>
);

/* ─── Top bar — magazine masthead style ──────────────────────── */
const TopBar: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => {
  const dateStr = new Date()
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    .toUpperCase();
  const yearStr = new Date().getFullYear();

  return (
    <div
      style={{
        flexShrink: 0,
        background: t.surface,
        backdropFilter: t.blur,
        WebkitBackdropFilter: t.blur,
        borderBottom: `1px solid ${t.borderStrong}`,
        paddingTop: 'calc(env(safe-area-inset-top) + 14px)',
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 0,
        zIndex: 10,
        position: 'relative',
      }}
    >
      {/* Row 1: meta strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: t.inkMid,
            fontFamily: t.fontSans,
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = t.ink)}
          onMouseLeave={e => (e.currentTarget.style.color = t.inkMid)}
        >
          {/* Arrow glyph */}
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="1" y1="5" x2="13" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Back
        </button>

        {/* Wordmark — SOUYEE · OS */}
        <span
          style={{
            fontFamily: t.fontMono,
            fontSize: 7.5,
            letterSpacing: '0.40em',
            textTransform: 'uppercase',
            color: t.inkFaint,
          }}
        >
          SOUYEE&nbsp;·&nbsp;OS
        </span>

        {/* Year */}
        <span
          style={{
            fontFamily: t.fontMono,
            fontSize: 7.5,
            letterSpacing: '0.18em',
            color: t.inkGhost,
          }}
        >
          {yearStr}
        </span>
      </div>

      {/* Hairline divider */}
      <div style={{ height: 1, background: t.border, marginBottom: 14 }} />

      {/* Row 2: editorial title block */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingBottom: 16,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.h1
            key={title}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1,  x: 0   }}
            exit={{    opacity: 0,  x:  8  }}
            transition={{ duration: 0.18, ease: [0.25, 0, 0, 1] }}
            style={{
              margin: 0,
              fontFamily: t.fontDisplay,
              fontSize: 52,
              fontWeight: 700,
              fontStyle: 'italic',
              letterSpacing: '-0.03em',
              lineHeight: 0.92,
              color: t.ink,
            }}
          >
            {title}
          </motion.h1>
        </AnimatePresence>

        {/* Date stamp — rotated editorial feel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 4,
            paddingBottom: 4,
          }}
        >
          <div
            style={{
              width: 1,
              height: 28,
              background: t.borderMid,
              marginBottom: 6,
              alignSelf: 'flex-end',
            }}
          />
          <span
            style={{
              fontFamily: t.fontMono,
              fontSize: 7,
              letterSpacing: '0.26em',
              color: t.inkFaint,
              textTransform: 'uppercase',
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
            }}
          >
            {dateStr}
          </span>
        </div>
      </div>

      {/* Bold bottom border accent */}
      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 2,
          background: t.ink,
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

  const handleAddCharacter    = (c: AICharacter) => setCharacters(p => [c, ...p]);
  const handleUpdateCharacter = (u: AICharacter) => setCharacters(p => p.map(c => c.id === u.id ? u : c));
  const handleDeleteCharacter = (id: string)      => setCharacters(p => p.filter(c => c.id !== id));
  const handleUpdateMessages  = (id: string, messages: any[]) =>
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
      transition={{ type: 'spring', damping: 32, stiffness: 300 }}
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: t.fontSans,
        background: t.bg,
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
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1,  y: 0  }}
          exit={{    opacity: 0,  y: -10 }}
          transition={{ duration: 0.22, ease: [0.25, 0, 0, 1] }}
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