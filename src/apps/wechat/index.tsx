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

const STORAGE_KEY    = 'souyee_os_wechat_characters';
const FAVORITES_KEY  = 'souyee_os_wechat_favorites';

/* ── tokens (极致黑白灰调色板) ────────────────────────────────── */
const T = {
  white:      '#ffffff',
  offWhite:   '#f0f0f2',                   // 偏冷调的哑光白，作为全局底色
  black:      '#000000',
  ink:        '#121212',                   // 哑光黑，比纯黑更具高级感
  dim:        'rgba(0,0,0,0.45)',
  ghost:      'rgba(0,0,0,0.06)',
  rule:       'rgba(0,0,0,0.06)',          // 极弱的分割线
  navH:       80,                          
  fontSerif:  '"Didot", "Bodoni MT", "Playfair Display", Georgia, serif',
  fontSans:   '"Helvetica Neue", "Inter", Helvetica, Arial, sans-serif',
  fontMono:   '"SF Mono", "Fira Code", monospace',
};

/* ── Grain (强化胶片颗粒质感) ─────────────────────────────────── */
const Grain = () => (
  <svg aria-hidden style={{
    position:'fixed', inset:0, width:'100%', height:'100%',
    pointerEvents:'none', zIndex:9999,
    opacity: 0.045, mixBlendMode: 'multiply', // 提升透明度，强化物理质感
  }}>
    <filter id="gr">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#gr)"/>
  </svg>
);

/* ── Tab config ──────────────────────────────────────────────── */
const TABS = [
  { id:'signals', label:'Signals', idx:'01' },
  { id:'souls',   label:'Souls',   idx:'02' },
  { id:'orbit',   label:'Orbit',   idx:'03' },
  { id:'core',    label:'Core',    idx:'04' },
] as const;
type TabId = typeof TABS[number]['id'];

/* ── Wide bottom nav (深色磨砂底栏) ──────────────────────────── */
const Nav: React.FC<{ active: TabId; onChange: (id: TabId) => void }> = ({ active, onChange }) => (
  <div style={{
    flexShrink: 0,
    height: T.navH + 'px',
    paddingBottom: 'env(safe-area-inset-bottom)',
    background: 'rgba(18, 18, 18, 0.82)', // 哑光黑半透明
    backdropFilter: 'blur(24px) saturate(1.2)', // 毛玻璃磨砂滤镜
    WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
    display: 'flex',
    alignItems: 'stretch',
    position: 'relative',
    zIndex: 20,
    borderTop: '1px solid rgba(255,255,255,0.08)', // 顶部微光边缘
  }}>
    {TABS.map((tab, i) => {
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
            justifyContent: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            borderRight: i < TABS.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none',
            cursor: 'pointer',
            position: 'relative',
            padding: 0,
          }}
        >
          {/* animated fill - 柔和的白色滑块 */}
          {on && (
            <motion.div
              layoutId="nav-fill"
              style={{
                position:'absolute', inset:0,
                background: 'rgba(255, 255, 255, 0.95)', 
                zIndex: 0,
              }}
              transition={{ type:'spring', stiffness:400, damping:35 }}
            />
          )}

          <span style={{
            position:'relative', zIndex:1,
            fontFamily: T.fontMono,
            fontSize: 8,
            letterSpacing: '0.20em',
            color: on ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)',
            transition: 'color 0.3s ease',
            lineHeight: 1,
          }}>
            {tab.idx}
          </span>

          <span style={{
            position:'relative', zIndex:1,
            fontFamily: T.fontSans,
            fontSize: 13,
            fontWeight: on ? 600 : 400,
            letterSpacing: on ? '0.04em' : '0.08em',
            textTransform: 'uppercase',
            color: on ? T.ink : 'rgba(255,255,255,0.6)',
            transition: 'color 0.3s ease, font-weight 0.3s ease',
          }}>
            {tab.label}
          </span>
        </button>
      );
    })}
  </div>
);

/* ── Top bar (浅色磨砂顶栏) ──────────────────────────────────── */
const TopBar: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => {
  const dateStr = new Date()
    .toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    .toUpperCase();

  return (
    <div style={{
      flexShrink: 0,
      background: 'rgba(240, 240, 242, 0.65)', // 配合全局底色的半透明白
      backdropFilter: 'blur(24px) saturate(1.2)', // 核心磨砂效果
      WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
      borderBottom: `1px solid rgba(0,0,0,0.04)`,
      paddingTop: 'calc(env(safe-area-inset-top) + 18px)',
      paddingLeft: 24,
      paddingRight: 24,
      paddingBottom: 18,
      position: 'relative',
      zIndex: 10,
    }}>

      {/* row 1 */}
      <div style={{
        display:'flex', alignItems:'center',
        justifyContent:'space-between', marginBottom: 20,
      }}>
        <button
          onClick={onClose}
          style={{
            display:'flex', alignItems:'center', gap:6,
            background:'none', border:'none', padding:0,
            cursor:'pointer',
            fontFamily: T.fontSans,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: T.dim,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = T.ink)}
          onMouseLeave={e => (e.currentTarget.style.color = T.dim)}
        >
          <span style={{ fontSize:16, lineHeight:1, marginTop:-1 }}>←</span>
          Back
        </button>

        <span style={{
          fontFamily: T.fontMono,
          fontSize: 8,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'rgba(0,0,0,0.3)',
        }}>
          SOUYEE · OS
        </span>
      </div>

      {/* row 2: big title */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
        <AnimatePresence mode="wait">
          <motion.h1
            key={title}
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0  }}
            exit={{    opacity:0, y:-6 }}
            transition={{ duration:0.25, ease:[0.25,0,0,1] }}
            style={{
              margin:0,
              fontFamily: T.fontSerif,
              fontSize: 52,
              fontWeight: 600, // 稍微降低字重，增加优雅感
              fontStyle: 'italic',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: T.ink,
            }}
          >
            {title}
          </motion.h1>
        </AnimatePresence>

        <span style={{
          fontFamily: T.fontMono,
          fontSize: 8,
          letterSpacing: '0.20em',
          color: 'rgba(0,0,0,0.3)',
          paddingBottom: 5,
          textTransform: 'uppercase',
        }}>
          {dateStr}
        </span>
      </div>

      {/* thick bottom rule - 柔和的黑色分割线 */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        height: 1.5, background: T.ink, opacity: 0.9
      }}/>
    </div>
  );
};

/* ── App ─────────────────────────────────────────────────────── */
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

  const handleAddCharacter     = (c: AICharacter) => setCharacters(p => [c, ...p]);
  const handleUpdateCharacter  = (u: AICharacter) => setCharacters(p => p.map(c => c.id===u.id ? u : c));
  const handleDeleteCharacter  = (id: string)      => setCharacters(p => p.filter(c => c.id!==id));
  const handleUpdateMessages   = (id: string, messages: any[]) =>
    setCharacters(p => p.map(c => c.id===id ? {...c, messages} : c));
  const handleForwardToContact = (contactId: string, msg: any) =>
    setCharacters(p => p.map(c =>
      c.id!==contactId ? c : {...c, messages:[...(c.messages??[]), msg]}
    ));
  const handleAddFavorite    = (msg: FavoriteMessage) => {
    if (favorites.some(f => f.id===msg.id)) return;
    setFavorites(p => [msg, ...p]);
  };
  const handleRemoveFavorite = (id: string) => setFavorites(p => p.filter(f => f.id!==id));

  const getTitle = () =>
    ({signals:'Signals', souls:'Souls', orbit:'Orbit', core:'Core'}[activeTab] ?? '');

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
      initial={{ y:'100%', opacity:0 }}
      animate={{ y:0,      opacity:1 }}
      exit={{    y:'100%', opacity:0 }}
      transition={{ type:'spring', damping:32, stiffness:260 }}
      onClick={e => e.stopPropagation()}
      style={{
        position:'fixed', inset:0, zIndex:50,
        display:'flex', flexDirection:'column',
        overflow:'hidden',
        background: T.offWhite, // 全局底色切换为带有灰度的冷调白
        fontFamily: T.fontSans,
      }}
    >
      <Grain/>

      {activeTab !== 'core' && <TopBar title={getTitle()} onClose={onClose}/>}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity:0, y:10  }}
          animate={{ opacity:1, y:0  }}
          exit={{    opacity:0, y:-8 }}
          transition={{ duration:0.25, ease:[0.22,1,0.36,1] }} // 更顺滑的阻尼动画
          style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', position:'relative', zIndex:1 }}
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