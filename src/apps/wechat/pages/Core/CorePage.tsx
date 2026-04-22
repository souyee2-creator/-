import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, User, Star, Smile, Palette, Settings } from 'lucide-react';
import { MasksPage } from './MasksPage';
import { CollectionsPage, FavoriteMessage } from './CollectionsPage';
import { AppearancePage } from './AppearancePage';
import { EmojiManagerPage } from './EmojiManagerPage';

interface CorePageProps {
  favorites: FavoriteMessage[];
  onRemoveFavorite: (id: string) => void;
}

const PROFILE_KEY    = 'souyee_os_core_identity';
const DEFAULT_PROFILE = { name: '', id: '', bio: '', location: '', avatar: '' };

/* ── Design Tokens (aligned with index.tsx) ── */
const T = {
  paper:      '#f5f4f1',
  ink:        '#111110',
  inkFaint:   '#8a8984',
  inkGhost:   '#c4c3c0',
  surface:    '#ffffff',
  line:       'rgba(17,17,16,0.10)',
  lineStrong: 'rgba(17,17,16,0.20)',

  serif: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
  mono:  '"DM Mono", "JetBrains Mono", "SF Mono", monospace',
  sans:  '"Helvetica Neue", "Helvetica", Arial, sans-serif',

  ease: [0.22, 1, 0.36, 1] as const,
};

/* ── Hairline Rule ── */
const Rule = () => (
  <div style={{ height: '0.5px', background: T.line, flexShrink: 0 }} />
);

/* ── Menu Row ── */
const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  sub: string;
  isLast: boolean;
  index: number;
  onClick: () => void;
}> = ({ icon, label, sub, isLast, index, onClick }) => (
  <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.06 * index, duration: 0.35, ease: T.ease }}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 0',
        cursor: 'pointer',
        transition: 'opacity 0.2s',
      }}
      whileHover={{ opacity: 0.6 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Icon: thin square container */}
        <div style={{
          width: 36,
          height: 36,
          border: `0.5px solid ${T.lineStrong}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: T.inkFaint,
        }}>
          {icon}
        </div>

        <div>
          <div style={{
            fontFamily: T.serif,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 19,
            color: T.ink,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            marginBottom: 3,
          }}>
            {label}
          </div>
          <div style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: '0.18em',
            color: T.inkGhost,
            textTransform: 'uppercase',
          }}>
            {sub}
          </div>
        </div>
      </div>

      {/* Arrow */}
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none" style={{ flexShrink: 0 }}>
        <line x1="0" y1="5" x2="14" y2="5" stroke={T.inkGhost} strokeWidth="0.8"/>
        <polyline points="10,1 14,5 10,9" fill="none" stroke={T.inkGhost} strokeWidth="0.8"/>
      </svg>
    </motion.div>
    {!isLast && <Rule />}
  </>
);

/* ── Avatar ── */
const Avatar: React.FC<{
  avatar: string;
  name: string;
  onClick: () => void;
}> = ({ avatar, name, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.97 }}
      style={{
        width: 96,
        height: 96,
        border: `0.5px solid ${T.lineStrong}`,
        background: T.surface,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {avatar ? (
        <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{
          fontFamily: T.serif,
          fontStyle: 'italic',
          fontSize: 42,
          fontWeight: 400,
          color: T.inkGhost,
        }}>
          {name ? name[0].toUpperCase() : '?'}
        </span>
      )}

      {/* Upload overlay */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(17,17,16,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Upload size={18} strokeWidth={1} color={T.paper} />
      </motion.div>
    </motion.div>
  );
};

export const CorePage: React.FC<CorePageProps> = ({ favorites, onRemoveFavorite }) => {
  const [showCollections, setShowCollections] = useState(false);
  const [showAppearance,  setShowAppearance]  = useState(false);
  const [showMasks,       setShowMasks]       = useState(false);
  const [showEmoji,       setShowEmoji]       = useState(false);
  const [editingName,     setEditingName]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfile(prev => ({ ...prev, avatar: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const menuItems = [
    { icon: <User size={16} strokeWidth={1} />,    label: '个人设定', sub: 'Masks & Persona',      onClick: () => setShowMasks(true)       },
    { icon: <Star size={16} strokeWidth={1} />,    label: '收藏列表', sub: 'Stations & Dialogues', onClick: () => setShowCollections(true) },
    { icon: <Smile size={16} strokeWidth={1} />,   label: '表情管理', sub: 'Emoji & Assets',       onClick: () => setShowEmoji(true)       },
    { icon: <Palette size={16} strokeWidth={1} />, label: '界面外观', sub: 'Appearance & Theme',   onClick: () => setShowAppearance(true)  },
    { icon: <Settings size={16} strokeWidth={1} />,label: '系统设置', sub: 'Preferences & API',    onClick: () => {}                      },
  ];

  return (
    <div style={{
      height: '100vh',
      width: '100%',
      background: T.paper,
      color: T.ink,
      fontFamily: T.sans,
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Top Bar (matches index.tsx TopBar aesthetic) ── */}
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
          <span style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: '0.22em',
            color: T.inkGhost,
            textTransform: 'uppercase',
          }}>
            Souyee OS
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{
              fontFamily: T.mono,
              fontSize: 9,
              letterSpacing: '0.18em',
              color: T.inkGhost,
            }}>
              V.02
            </span>
            <div style={{ width: '0.5px', height: 10, background: T.lineStrong }}/>
            <span style={{
              fontFamily: T.mono,
              fontSize: 9,
              letterSpacing: '0.18em',
              color: T.inkGhost,
              textTransform: 'uppercase',
            }}>
              Core
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          margin: 0,
          fontFamily: T.serif,
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 38,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: T.ink,
        }}>
          Core
        </h1>

        <div style={{ height: '0.5px', background: T.line, marginTop: 16 }}/>
      </div>

      {/* ── Scrollable Content ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px 24px 140px',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>

          {/* Identity block */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: T.ease }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 24,
              marginBottom: 48,
            }}
          >
            <Avatar
              avatar={profile.avatar}
              name={profile.name}
              onClick={() => fileInputRef.current?.click()}
            />
            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" style={{ display: 'none' }} />

            {/* Name + hint */}
            <div style={{ paddingTop: 8 }}>
              <div style={{
                fontFamily: T.mono,
                fontSize: 9,
                letterSpacing: '0.22em',
                color: T.inkGhost,
                textTransform: 'uppercase',
                marginBottom: 10,
              }}>
                Identity
              </div>

              {editingName ? (
                <input
                  autoFocus
                  defaultValue={profile.name}
                  onBlur={e => {
                    setProfile(p => ({ ...p, name: e.target.value }));
                    setEditingName(false);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                  style={{
                    fontFamily: T.serif,
                    fontStyle: 'italic',
                    fontSize: 30,
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `0.5px solid ${T.lineStrong}`,
                    color: T.ink,
                    outline: 'none',
                    width: 200,
                    paddingBottom: 4,
                  }}
                />
              ) : (
                <div
                  onClick={() => setEditingName(true)}
                  style={{
                    fontFamily: T.serif,
                    fontStyle: 'italic',
                    fontSize: 30,
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    color: profile.name ? T.ink : T.inkGhost,
                    cursor: 'text',
                    lineHeight: 1.1,
                  }}
                >
                  {profile.name || 'Undefined'}
                </div>
              )}

              <div style={{
                fontFamily: T.mono,
                fontSize: 9,
                letterSpacing: '0.18em',
                color: T.inkGhost,
                textTransform: 'uppercase',
                marginTop: 8,
              }}>
                Tap to edit
              </div>
            </div>
          </motion.div>

          {/* Separator with label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <span style={{
              fontFamily: T.mono,
              fontSize: 9,
              letterSpacing: '0.22em',
              color: T.inkGhost,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              Navigation
            </span>
            <div style={{ flex: 1, height: '0.5px', background: T.line }}/>
          </div>

          {/* Menu items */}
          <div style={{ marginBottom: 40 }}>
            <Rule />
            {menuItems.map((item, i) => (
              <MenuItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                sub={item.sub}
                onClick={item.onClick}
                index={i}
                isLast={i === menuItems.length - 1}
              />
            ))}
            <Rule />
          </div>

          {/* Version */}
          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontFamily: T.mono,
              fontSize: 9,
              letterSpacing: '0.2em',
              color: T.inkGhost,
              textTransform: 'uppercase',
            }}>
              Version 1.0.2 · Protocol-01
            </span>
          </div>
        </div>
      </div>

      {/* ── Sub-pages (slide up from bottom) ── */}
      <AnimatePresence>
        {showMasks && (
          <motion.div key="masks" initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.42, ease: T.ease }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: T.paper, display: 'flex', flexDirection: 'column', borderTop: `0.5px solid ${T.lineStrong}` }}>
            <MasksPage onBack={() => setShowMasks(false)} />
          </motion.div>
        )}
        {showCollections && (
          <motion.div key="collections" initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.42, ease: T.ease }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: T.paper, display: 'flex', flexDirection: 'column', borderTop: `0.5px solid ${T.lineStrong}` }}>
            <CollectionsPage onBack={() => setShowCollections(false)} favorites={favorites} onRemove={onRemoveFavorite} />
          </motion.div>
        )}
        {showAppearance && (
          <motion.div key="appearance" initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.42, ease: T.ease }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: T.paper, display: 'flex', flexDirection: 'column', borderTop: `0.5px solid ${T.lineStrong}` }}>
            <AppearancePage onBack={() => setShowAppearance(false)} />
          </motion.div>
        )}
        {showEmoji && (
          <motion.div key="emoji" initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.42, ease: T.ease }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: T.paper, display: 'flex', flexDirection: 'column', borderTop: `0.5px solid ${T.lineStrong}` }}>
            <EmojiManagerPage onBack={() => setShowEmoji(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};