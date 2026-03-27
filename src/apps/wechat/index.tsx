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

/* ── tokens (极致黑白高对比度) ────────────────────────────────── */
const T = {
  white:      '#ffffff',
  offWhite:   '#ffffff',                   // 舍弃灰调，全局纯白底色
  black:      '#000000',
  ink:        '#000000',                   // 纯黑文字与线条
  dim:        '#666666',                   // 次级信息使用高对比度的深灰
  ghost:      'rgba(0,0,0,0.1)',
  rule:       '#000000',                   // 分割线全部改为纯黑实线
  navH:       60,                          // 【调整】底栏高度从 80px 缩减为 60px
  fontSerif:  '"Didot", "Bodoni MT", "Playfair Display", Georgia, serif',
  fontSans:   '"Helvetica Neue", "Inter", Helvetica, Arial, sans-serif',
  fontMono:   '"SF Mono", "Fira Code", monospace',
};

/* ── Grain (保留胶片颗粒，增加高对比风格的质感) ────────────────── */
const Grain = () => (
  <svg aria-hidden style={{
    position:'fixed', inset:0, width:'100%', height:'100%',
    pointerEvents:'none', zIndex:9999,
    opacity: 0.05, mixBlendMode: 'multiply',
  }}>
    <filter id="gr">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
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

/* ── Wide bottom nav (纯黑底栏，更窄) ────────────────────────── */
const Nav: React.FC<{ active: TabId; onChange: (id: TabId) => void }> = ({ active, onChange }) => (
  <div style={{
    flexShrink: 0,
    height: T.navH + 'px',
    paddingBottom: 'env(safe-area-inset-bottom)',
    background: T.black, // 纯黑背景
    display: 'flex',
    alignItems: 'stretch',
    position: 'relative',
    zIndex: 20,
    borderTop: `2px solid ${T.black}`, // 强化顶部边缘
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
            flexDirection: 'column', // 改为横向排布可以更省空间，但保持原设计堆叠
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2, // 缩小间距以适应更窄的高度
            background: 'transparent',
            border: 'none',
            borderRight: i < TABS.length - 1 ? `1px solid rgba(255,255,255,0.2)` : 'none', // 锐利的白色分割线
            cursor: 'pointer',
            position: 'relative',
            padding: 0,
          }}
        >
          {/* animated fill - 纯白滑块 */}
          {on && (
            <motion.div
              layoutId="nav-fill"
              style={{
                position:'absolute', inset:0,
                background: T.white, 
                zIndex: 0,
              }}
              transition={{ type:'spring', stiffness:400, damping:35 }}
            />
          )}

          <span style={{
            position:'relative', zIndex:1,
            fontFamily: T.fontMono,
            fontSize: 9,
            letterSpacing: '0.15em',
            color: on ? T.black : 'rgba(255,255,255,0.5)',
            transition: 'color 0.2s',
            lineHeight: 1,
          }}>
            {tab.idx}
          </span>

          <span style={{
            position:'relative', zIndex:1,
            fontFamily: T.fontSans,
            fontSize: 12, // 字体略微缩小以适应底栏
            fontWeight: on ? 700 : 500,
            letterSpacing: on ? '0.04em' : '0.08em',
            textTransform: 'uppercase',
            color: on ? T.ink : T.white, // 高对比：选中为纯黑，未选中为纯白
            transition: 'color 0.2s, font-weight 0.2s',
          }}>
            {tab.label}
          </span>
        </button>
      );
    })}
  </div>
);

/* ── Top bar (纯白高对比顶栏) ────────────────────────────────── */
const TopBar: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => {
  const dateStr = new Date()
    .toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    .toUpperCase();

  return (
    <div style={{
      flexShrink: 0,
      background: T.white, // 纯白背景
      borderBottom: `2px solid ${T.black}`, // 粗重纯黑分割线，强化高对比
      paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
      paddingLeft: 24,
      paddingRight: 24,
      paddingBottom: 16,
      position: 'relative',
      zIndex: 10,
    }}>

      {/* row 1 */}
      <div style={{
        display:'flex', alignItems:'center',
        justifyContent:'space-between', marginBottom: 16,
      }}>
        <button
          onClick={onClose}
          style={{
            display:'flex', alignItems:'center', gap:6,
            background:'none', border:'none', padding:0,
            cursor:'pointer',
            fontFamily: T.fontSans,
            fontSize: 11,
            fontWeight: 700, // 加粗 Back 按钮
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: T.black,
          }}
        >
          <span style={{ fontSize:16, lineHeight:1, marginTop:-1 }}>←</span>
          BACK
        </button>

        <span style={{
          fontFamily: T.fontMono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: T.black,
        }}>
          SOUYEE·OS
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
            transition={{ duration:0.20, ease:[0.25,0,0,1] }}
            style={{
              margin:0,
              fontFamily: T.fontSerif,
              fontSize: 52,
              fontWeight: 700,
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
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.20em',
          color: T.black,
          paddingBottom: 5,
          textTransform: 'uppercase',
        }}>
          {dateStr}
        </span>
      </div>
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

  // ... (状态处理函数与之前相同，为了简洁在此略去，保持原代码逻辑即可) ...
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
        background: T.offWhite, // 纯白全局底色
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
          transition={{ duration:0.18, ease:[0.25,0,0,1] }}
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