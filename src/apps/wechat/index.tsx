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

/* ── 高级黑白质感 tokens（保留高对比，增加灰度层次与细腻阴影）────────────────── */
const T = {
  // 基础色（兼容旧代码）
  white:      '#ffffff',
  offWhite:   '#fafafa',
  black:      '#000000',
  ink:        '#1a1a1a',

  // 灰度系统
  bgPrimary:    '#fafafa',
  bgElevated:   '#ffffff',
  bgInverse:    '#111111',

  textPrimary:  '#1a1a1a',
  textSecondary:'#5e5e5e',
  textHint:     '#8e8e8e',
  textOnDark:   '#eeeeee',

  borderLight:  '#eaeef2',
  borderStrong: '#dddddd',

  hoverBg:      'rgba(0,0,0,0.04)',
  activeBg:     'rgba(0,0,0,0.08)',

  // 阴影
  shadowSm: '0 2px 8px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03)',
  shadowMd: '0 8px 20px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.02)',
  shadowLg: '0 20px 32px -12px rgba(0,0,0,0.1)',

  // 颗粒纹理
  grainOpacity: 0.03,
  grainBlend:   'overlay' as const,   // 修复：使用 as const 确保字面量类型

  // 字体系统
  fontSerif: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
  fontSans:  '"Inter", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
  fontMono:  '"JetBrains Mono", "SF Mono", monospace',

  // 尺寸
  navH: 60,
  topBarPadding: 12,
};

/* ── 优化后的胶片颗粒（更细腻，混合模式为 overlay）────────────────── */
const Grain = () => (
  <svg aria-hidden style={{
    position:'fixed', inset:0, width:'100%', height:'100%',
    pointerEvents:'none', zIndex:9999,
    opacity: T.grainOpacity,
    mixBlendMode: T.grainBlend, // 现在类型正确
  }}>
    <filter id="grainFilter">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncR type="linear" slope="0.5" intercept="0"/>
        <feFuncG type="linear" slope="0.5" intercept="0"/>
        <feFuncB type="linear" slope="0.5" intercept="0"/>
      </feComponentTransfer>
    </filter>
    <rect width="100%" height="100%" filter="url(#grainFilter)"/>
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

/* ── 底部导航（悬浮居中，圆角，不贴底）────────────────── */
const Nav: React.FC<{ active: TabId; onChange: (id: TabId) => void }> = ({ active, onChange }) => (
  <div
    style={{
      position: 'fixed',
      bottom: 'max(20px, env(safe-area-inset-bottom))',
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 20,
      pointerEvents: 'none',
    }}
  >
    <div
      style={{
        pointerEvents: 'auto',
        width: 'auto',
        minWidth: 280,
        maxWidth: 'calc(100% - 32px)',
        backdropFilter: 'blur(12px)',
        background: 'rgba(17, 17, 17, 0.92)',   // 只保留这一行，删除 T.bgInverse
        borderRadius: 40,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(255,255,255,0.05)',
        padding: '0 8px',
        height: T.navH + 'px',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
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
              cursor: 'pointer',
              position: 'relative',
              padding: '0 12px',
              transition: 'background 0.2s',
              borderRadius: 32,
              margin: '4px 0',
            }}
            onMouseEnter={(e) => {
              if (!on) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {on && (
              <motion.div
                layoutId="nav-indicator"
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: '25%',
                  width: '50%',
                  height: 2,
                  background: T.white,
                  borderRadius: 2,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}

            <span
              style={{
                position: 'relative',
                zIndex: 1,
                fontFamily: T.fontMono,
                fontSize: 9,
                letterSpacing: '0.15em',
                color: on ? T.white : 'rgba(255,255,255,0.6)',
                transition: 'color 0.2s',
                lineHeight: 1,
              }}
            >
              {tab.idx}
            </span>

            <span
              style={{
                position: 'relative',
                zIndex: 1,
                fontFamily: T.fontSans,
                fontSize: 13,
                fontWeight: on ? 600 : 450,
                letterSpacing: on ? '0.02em' : '0.06em',
                textTransform: 'uppercase',
                color: on ? T.white : T.textOnDark,
                transition: 'color 0.2s, font-weight 0.2s',
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

/* ── 顶栏（纯白浮层，阴影替代粗边框）────────────────── */
const TopBar: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => {
  const dateStr = new Date()
    .toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
    .toUpperCase();

  return (
    <div style={{
      flexShrink: 0,
      background: 'rgba(255, 255, 255, 0.8)', // 半透明背景
      backdropFilter: 'blur(20px) saturate(180%)', // 磨砂质感
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '0.5px solid rgba(0,0,0,0.08)', // 极细发丝线
      paddingTop: `calc(env(safe-area-inset-top) + 12px)`,
      paddingLeft: 20,
      paddingRight: 20,
      paddingBottom: 12,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* 顶层辅助信息行 */}
      <div style={{
        display:'flex', alignItems:'center',
        justifyContent:'space-between', marginBottom: 8,
      }}>
        <button
          onClick={onClose}
          style={{
            display:'flex', alignItems:'center', gap:4,
            background:'none', border:'none', padding:0,
            cursor:'pointer',
            fontFamily: T.fontSans,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: T.textSecondary,
          }}
        >
          <span style={{ fontSize:14 }}>←</span>
          EXIT
        </button>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{
            fontFamily: T.fontMono,
            fontSize: 8,
            letterSpacing: '0.2em',
            color: T.textHint,
            opacity: 0.6
          }}>
            {dateStr}
          </span>
          <div style={{ width: 1, height: 8, background: 'rgba(0,0,0,0.1)' }} />
          <span style={{
            fontFamily: T.fontMono,
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: T.textHint,
          }}>
            V.02
          </span>
        </div>
      </div>

      {/* 主标题行：显著缩小字号 */}
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
        <AnimatePresence mode="wait">
          <motion.h1
            key={title}
            initial={{ opacity:0, x:-5 }}
            animate={{ opacity:1, x:0  }}
            exit={{    opacity:0, x:5 }}
            transition={{ duration:0.3 }}
            style={{
              margin:0,
              fontFamily: T.fontSerif,
              fontSize: 32, // 从 52px 缩减到 32px
              fontWeight: 500,
              fontStyle: 'italic',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
              color: T.textPrimary,
            }}
          >
            {title}
            <span style={{ color: T.textHint, fontSize: 14, marginLeft: 4, fontStyle: 'normal' }}>.</span>
          </motion.h1>
        </AnimatePresence>

        <span style={{
          fontFamily: T.fontMono,
          fontSize: 8,
          letterSpacing: '0.15em',
          color: T.textHint,
          textTransform: 'uppercase',
        }}>
          Protocol-01
        </span>
      </div>
    </div>
  );
};

/* ── 主应用 ─────────────────────────────────────────────────── */
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
      transition={{ type:'spring', damping:30, stiffness:280 }}
      onClick={e => e.stopPropagation()}
      style={{
        position:'fixed', inset:0, zIndex:50,
        display:'flex', flexDirection:'column',
        overflow:'hidden',
        background: T.bgPrimary,
        fontFamily: T.fontSans,
      }}
    >
      <Grain/>

      {activeTab !== 'core' && <TopBar title={getTitle()} onClose={onClose}/>}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity:0, y:8  }}
          animate={{ opacity:1, y:0  }}
          exit={{    opacity:0, y:-6 }}
          transition={{ duration:0.2, ease:[0.2, 0.9, 0.4, 1.1] }}
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