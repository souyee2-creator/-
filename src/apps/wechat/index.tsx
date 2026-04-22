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

const STORAGE_KEY   = 'souyee_os_wechat_characters';
const FAVORITES_KEY = 'souyee_os_wechat_favorites';

/* ─── Design Tokens ──────────────────────────────────────────────
   Maison / System / Rick Owens 级别的冷质感
   极简、精准、无冗余——每一像素都有意图
──────────────────────────────────────────────────────────────── */
const T = {
  /* palette */
  paper:      '#f5f4f1',   // 偏暖白，微微羊皮纸感
  ink:        '#111110',   // 近黑但不刺眼
  inkFaint:   '#8a8984',   // 次要文字
  inkGhost:   '#c4c3c0',   // hint / disabled
  surface:    '#ffffff',
  surfaceHigh:'#efefed',   // elevated hover bg

  /* stroke */
  line:       'rgba(17,17,16,0.10)',   // hairline divider
  lineStrong: 'rgba(17,17,16,0.20)',

  /* dark bar */
  barBg:      'rgba(14,14,13,0.94)',
  barLine:    'rgba(255,255,255,0.07)',
  barText:    'rgba(245,244,241,0.90)',
  barFaint:   'rgba(245,244,241,0.38)',
  barActive:  '#f5f4f1',

  /* typography */
  serif:  '"Cormorant Garamond", "Playfair Display", Georgia, serif',
  mono:   '"DM Mono", "JetBrains Mono", "SF Mono", monospace',
  sans:   '"Helvetica Neue", "Helvetica", Arial, sans-serif',

  /* rhythm */
  navH: 56,
  topH: 88,

  /* easing */
  ease: [0.22, 1, 0.36, 1] as const,
  easeSoft: [0.4, 0, 0.2, 1] as const,
};

/* ─── Font Import ────────────────────────────────────────────── */
const FontInjector = () => {
  useEffect(() => {
    const id = 'souyee-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id   = id;
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400;1,500&family=DM+Mono:wght@300;400&display=swap';
    document.head.appendChild(link);
  }, []);
  return null;
};

/* ─── Film Grain ─────────────────────────────────────────────── */
const Grain = () => (
  <svg
    aria-hidden
    style={{
      position: 'fixed', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 9999,
      opacity: 0.028,
      mixBlendMode: 'multiply' as const,
    }}
  >
    <filter id="g">
      <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#g)"/>
  </svg>
);

/* ─── Hairline Rule ──────────────────────────────────────────── */
const Rule: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{
    height: '0.5px',
    background: T.line,
    flexShrink: 0,
    ...style,
  }}/>
);

/* ─── Tab config ─────────────────────────────────────────────── */
const TABS = [
  { id: 'signals', label: 'Signals' },
  { id: 'souls',   label: 'Souls'   },
  { id: 'orbit',   label: 'Orbit'   },
  { id: 'core',    label: 'Core'    },
] as const;
type TabId = typeof TABS[number]['id'];

/* ─── Bottom Navigation ──────────────────────────────────────── */
/*
   Architecture: thin floating rectangular bar — no pill, no radius exaggeration.
   Sharp 4px radius, near-black with 94% opacity.
   Active state: a lone hairline mark above the label, nothing else.
   No numbers. No icons. Pure typography.
*/
const Nav: React.FC<{ active: TabId; onChange: (id: TabId) => void }> = ({ active, onChange }) => (
  <div style={{
    position: 'fixed',
    bottom: 'max(18px, env(safe-area-inset-bottom))',
    left: 0, right: 0,
    display: 'flex',
    justifyContent: 'center',
    zIndex: 20,
    pointerEvents: 'none',
  }}>
    <div style={{
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'stretch',
      background: T.barBg,
      backdropFilter: 'blur(16px) saturate(160%)',
      WebkitBackdropFilter: 'blur(16px) saturate(160%)',
      borderRadius: 4,
      boxShadow: '0 12px 32px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(255,255,255,0.06)',
      height: T.navH + 'px',
      minWidth: 320,
      maxWidth: 'calc(100vw - 32px)',
      overflow: 'hidden',
    }}>
      {TABS.map((tab, i) => {
        const on = tab.id === active;
        return (
          <React.Fragment key={tab.id}>
            {i > 0 && (
              <div style={{
                width: '0.5px',
                background: T.barLine,
                flexShrink: 0,
                margin: '12px 0',
              }}/>
            )}
            <button
              onClick={() => onChange(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                padding: '0 20px',
                transition: 'background 0.25s',
                minWidth: 0,
              }}
              onMouseEnter={e => !on && (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Active hairline mark */}
              <AnimatePresence>
                {on && (
                  <motion.div
                    layoutId="nav-mark"
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: '30%',
                      width: '40%',
                      height: '1px',
                      background: T.barActive,
                    }}
                    transition={{ type: 'spring', stiffness: 600, damping: 40 }}
                  />
                )}
              </AnimatePresence>

              <span style={{
                fontFamily: T.mono,
                fontSize: 10,
                fontWeight: 300,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: on ? T.barActive : T.barFaint,
                transition: 'color 0.25s, opacity 0.25s',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}>
                {tab.label}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

/* ─── Top Bar ────────────────────────────────────────────────── */
/*
   Radical restraint: one large italic serif title, two metadata
   slivers in hairline mono, an exit arrow.
   No background blur gimmick — a simple paper white with a
   single 0.5px bottom rule.
*/
const TopBar: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => {
  const dateStr = new Date()
    .toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
    .toUpperCase();

  return (
    <div style={{
      flexShrink: 0,
      background: T.paper,
      paddingTop: `calc(env(safe-area-inset-top) + 14px)`,
      paddingLeft: 24,
      paddingRight: 24,
      paddingBottom: 16,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Meta row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        {/* Exit */}
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          {/* thin arrow — drawn, not a character */}
          <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
            <line x1="17" y1="5" x2="1" y2="5" stroke={T.ink} strokeWidth="0.8"/>
            <polyline points="5,1 1,5 5,9" fill="none" stroke={T.ink} strokeWidth="0.8"/>
          </svg>
          <span style={{
            fontFamily: T.mono,
            fontSize: 9,
            fontWeight: 400,
            letterSpacing: '0.20em',
            color: T.inkFaint,
            textTransform: 'uppercase',
          }}>
            Exit
          </span>
        </button>

        {/* Right meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: '0.18em',
            color: T.inkGhost,
            textTransform: 'uppercase',
          }}>
            {dateStr}
          </span>
          <div style={{ width: '0.5px', height: 10, background: T.lineStrong }}/>
          <span style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: '0.18em',
            color: T.inkGhost,
          }}>
            V.02
          </span>
        </div>
      </div>

      {/* Title */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <AnimatePresence mode="wait">
          <motion.h1
            key={title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: T.ease }}
            style={{
              margin: 0,
              fontFamily: T.serif,
              fontSize: 38,
              fontWeight: 400,
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              color: T.ink,
            }}
          >
            {title}
          </motion.h1>
        </AnimatePresence>

        <span style={{
          fontFamily: T.mono,
          fontSize: 8,
          letterSpacing: '0.22em',
          color: T.inkGhost,
          textTransform: 'uppercase',
          paddingBottom: 4,
          whiteSpace: 'nowrap',
        }}>
          Protocol·01
        </span>
      </div>

      {/* Hairline bottom rule */}
      <Rule style={{ marginTop: 16, background: T.line }}/>
    </div>
  );
};

/* ─── Main App ───────────────────────────────────────────────── */
export const WeChatApp: React.FC<WeChatAppProps> = ({ onClose }) => {
  const [activeTab, setActiveTab]   = useState<TabId>('signals');
  const [activeChat, setActiveChat] = useState<any | null>(null);

  const [characters, setCharacters] = useState<AICharacter[]>(() => {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  });

  const [favorites, setFavorites] = useState<FavoriteMessage[]>(() => {
    const s = localStorage.getItem(FAVORITES_KEY);
    return s ? JSON.parse(s) : [];
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY,   JSON.stringify(characters)); }, [characters]);
  useEffect(() => { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));  }, [favorites]);

  const handleAddCharacter    = (c: AICharacter) => setCharacters(p => [c, ...p]);
  const handleUpdateCharacter = (u: AICharacter) => setCharacters(p => p.map(c => c.id === u.id ? u : c));
  const handleDeleteCharacter = (id: string)     => setCharacters(p => p.filter(c => c.id !== id));
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

  const getTitle = () =>
    ({ signals: 'Signals', souls: 'Souls', orbit: 'Orbit', core: 'Core' }[activeTab] ?? '');

  const renderContent = () => {
    switch (activeTab) {
      case 'signals': return <SignalsPage characters={characters} onChatClick={setActiveChat}/>;
      case 'souls':   return (
        <SoulsPage
          characters={characters}
          onAddCharacter={handleAddCharacter}
          onUpdateCharacter={handleUpdateCharacter}
          onDeleteCharacter={handleDeleteCharacter}
        />
      );
      case 'orbit':  return <OrbitPage/>;
      case 'core':   return <CorePage favorites={favorites} onRemoveFavorite={handleRemoveFavorite}/>;
      default:       return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0  }}
      exit={{    opacity: 0, y: 16 }}
      transition={{ duration: 0.5, ease: T.ease }}
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        background: T.paper,
        fontFamily: T.sans,
      }}
    >
      <FontInjector/>
      <Grain/>

      {activeTab !== 'core' && <TopBar title={getTitle()} onClose={onClose}/>}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{    opacity: 0 }}
          transition={{ duration: 0.3, ease: T.easeSoft }}
          style={{
            flex: 1, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            position: 'relative', zIndex: 1,
          }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      <Nav active={activeTab} onChange={setActiveTab}/>

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