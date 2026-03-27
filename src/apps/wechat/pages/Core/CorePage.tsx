import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload } from 'lucide-react';
import { MasksPage } from './MasksPage';
import { CollectionsPage, FavoriteMessage } from './CollectionsPage';
import { AppearancePage } from './AppearancePage';
import { EmojiManagerPage } from './EmojiManagerPage';

interface CorePageProps {
  favorites: FavoriteMessage[];
  onRemoveFavorite: (id: string) => void;
}

const PROFILE_KEY = 'souyee_os_core_identity';
const DEFAULT_PROFILE = { name: '', id: '', bio: '', location: '', avatar: '' };

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:        '#F4F2EF',   // warm off-white matte
  ink:       '#111010',   // near-black
  inkMid:    '#5a5755',   // mid grey
  inkFaint:  '#C4C0BB',   // faint warm grey
  rule:      '#D6D2CD',   // separator
  surface:   '#EDEAE6',   // slightly darker surface for avatar bg
  hover:     'rgba(17,16,16,0.04)',
  fontSerif: '"Georgia", "Times New Roman", serif',
};

// ─── Noise texture overlay (SVG data URI) ─────────────────────────────────────
const noiseOverlay = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`;

// ─── Global styles injected once ─────────────────────────────────────────────
const globalCSS = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .core-menu-item:hover { background: ${T.hover}; }
  .core-menu-item:hover .arrow-glyph { color: ${T.inkMid}; }
  .avatar-upload-overlay { opacity: 0; transition: opacity 0.18s ease; }
  .avatar-wrap:hover .avatar-upload-overlay { opacity: 1; }
  .core-menu-item { transition: background 0.14s ease; }
`;

interface MenuItemProps {
  symbol: string;
  label: string;
  desc: string;
  onClick: () => void;
  delay?: number;
}

const MenuItem: React.FC<MenuItemProps> = ({ symbol, label, desc, onClick, delay = 0 }) => (
  <motion.div
    className="core-menu-item"
    onClick={onClick}
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.32, ease: 'easeOut', delay }}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 10px 16px 4px',
      cursor: 'pointer',
      borderRadius: 2,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* Symbol badge */}
      <div style={{
        width: 40, height: 40,
        border: `1px solid ${T.rule}`,
        background: T.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
      }}>
        <span style={{ fontSize: 17, color: T.ink, fontFamily: T.fontSerif, lineHeight: 1 }}>{symbol}</span>
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{
          fontSize: 15,
          fontWeight: 700,
          color: T.ink,
          fontFamily: T.fontSerif,
          letterSpacing: '0.01em',
        }}>
          {label}
        </span>
        <span style={{
          fontSize: 8,
          letterSpacing: '0.30em',
          textTransform: 'uppercase',
          color: T.inkFaint,
          fontFamily: T.fontSerif,
        }}>
          {desc}
        </span>
      </div>
    </div>

    <span
      className="arrow-glyph"
      style={{
        fontSize: 18,
        color: T.inkFaint,
        fontFamily: T.fontSerif,
        transition: 'color 0.14s ease',
        lineHeight: 1,
      }}
    >
      ›
    </span>
  </motion.div>
);

// ─── Divider ──────────────────────────────────────────────────────────────────
const Divider: React.FC<{ thick?: boolean }> = ({ thick }) => (
  <div style={{
    height: thick ? 1 : '0.5px',
    background: thick ? T.rule : `${T.rule}88`,
    width: '100%',
  }} />
);

// ─── Main component ───────────────────────────────────────────────────────────
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
    } catch { return DEFAULT_PROFILE; }
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

  const handleNameSave = (value: string) => {
    if (value.trim()) setProfile(prev => ({ ...prev, name: value.trim() }));
    setEditingName(false);
  };

  const displayInitial = profile.name ? profile.name.charAt(0).toUpperCase() : '·';

  const menuItems: MenuItemProps[] = [
    { symbol: '◈', label: '个人设定', desc: 'Masks / Persona',       onClick: () => setShowMasks(true) },
    { symbol: '☆', label: '收藏列表', desc: 'Stations / Dialogues', onClick: () => setShowCollections(true) },
    { symbol: '☺', label: '表情管理', desc: 'Emoji / Assets',        onClick: () => setShowEmoji(true) },
    { symbol: '◆', label: '界面外观', desc: 'Appearance / Theme',    onClick: () => setShowAppearance(true) },
    { symbol: '◎', label: '设置',     desc: 'Preferences / API',     onClick: () => console.log('设置') },
  ];

  return (
    <>
      {/* Inject global CSS once */}
      <style>{globalCSS}</style>

      <div style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
      }}>
        {/* ── Scrollable content ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: T.bg,
          backgroundImage: noiseOverlay,
          backgroundRepeat: 'repeat',
          fontFamily: T.fontSerif,
        }}>
          <div style={{
            maxWidth: 520,
            margin: '0 auto',
            padding: 'calc(env(safe-area-inset-top) + 36px) 28px 36px',
          }}>

            {/* ── Identity block ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{ marginBottom: 32 }}
            >
              {/* Section label */}
              <div style={{ paddingBottom: 10 }}>
                <span style={{
                  fontSize: 8,
                  letterSpacing: '0.42em',
                  textTransform: 'uppercase',
                  color: T.inkFaint,
                  fontFamily: T.fontSerif,
                }}>
                  Core Identity
                </span>
              </div>

              <Divider thick />

              {/* Avatar + name row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '20px 0 22px',
              }}>
                {/* Avatar */}
                <div
                  className="avatar-wrap"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 76, height: 76,
                    border: `1.5px solid ${T.ink}`,
                    background: T.surface,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '2px 3px 12px rgba(0,0,0,0.10)',
                  }}
                >
                  {profile.avatar
                    ? <img
                        src={profile.avatar}
                        alt="avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(20%)' }}
                      />
                    : <span style={{
                        fontSize: 30, color: T.ink,
                        fontFamily: T.fontSerif, lineHeight: 1,
                        opacity: 0.75,
                      }}>
                        {displayInitial}
                      </span>
                  }
                  {/* Upload overlay */}
                  <div
                    className="avatar-upload-overlay"
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(17,16,16,0.55)',
                      backdropFilter: 'blur(2px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Upload size={14} color="#F4F2EF" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingName ? (
                    <input
                      autoFocus
                      defaultValue={profile.name}
                      onBlur={e => handleNameSave(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleNameSave(e.currentTarget.value)}
                      placeholder="输入昵称"
                      style={{
                        fontFamily: T.fontSerif,
                        fontSize: 30,
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: T.ink,
                        background: 'transparent',
                        border: 'none',
                        borderBottom: `1.5px solid ${T.ink}`,
                        outline: 'none',
                        width: '100%',
                        padding: '2px 0',
                        lineHeight: 1.15,
                      }}
                    />
                  ) : (
                    <h2
                      onClick={() => setEditingName(true)}
                      title="点击修改昵称"
                      style={{
                        margin: 0,
                        fontSize: 30,
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: profile.name ? T.ink : T.inkFaint,
                        fontFamily: T.fontSerif,
                        lineHeight: 1.15,
                        cursor: 'text',
                      }}
                    >
                      {profile.name ? `${profile.name}.` : '点击设置昵称'}
                    </h2>
                  )}
                  {profile.name && (
                    <p style={{
                      margin: '6px 0 0',
                      fontSize: 9,
                      letterSpacing: '0.30em',
                      textTransform: 'uppercase',
                      color: T.inkFaint,
                      fontFamily: T.fontSerif,
                    }}>
                      点击修改昵称
                    </p>
                  )}
                </div>
              </div>

              <Divider thick />
            </motion.div>

            {/* ── Menu items ── */}
            <div>
              {menuItems.map((item, i) => (
                <React.Fragment key={item.label}>
                  <MenuItem {...item} delay={0.08 + i * 0.055} />
                  {i < menuItems.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </div>

            {/* ── Footer ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              style={{
                marginTop: 44,
                paddingTop: 20,
                borderTop: `0.5px solid ${T.rule}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 7, letterSpacing: '0.45em', textTransform: 'uppercase', color: T.inkFaint, fontFamily: T.fontSerif }}>
                V 1.0.2
              </span>
              <span style={{ color: T.inkFaint, fontSize: 8 }}>—</span>
              <span style={{ fontSize: 7, letterSpacing: '0.45em', textTransform: 'uppercase', color: T.inkFaint, fontFamily: T.fontSerif }}>
                SOUYEE
              </span>
            </motion.div>

          </div>
        </div>

        {/* ── Overlays ── */}
        <AnimatePresence>
          {showMasks && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.22 }}
              style={{ position: 'fixed', inset: 0, zIndex: 100, overflow: 'hidden', background: T.bg }}
            >
              <MasksPage onBack={() => setShowMasks(false)} />
            </motion.div>
          )}
          {showCollections && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.22 }}
              style={{ position: 'absolute', inset: 0, zIndex: 50, overflow: 'hidden', background: T.bg }}
            >
              <CollectionsPage favorites={favorites} onRemove={onRemoveFavorite} onBack={() => setShowCollections(false)} />
            </motion.div>
          )}
          {showAppearance && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.22 }}
              style={{ position: 'absolute', inset: 0, zIndex: 50, overflow: 'hidden', background: T.bg }}
            >
              <AppearancePage onBack={() => setShowAppearance(false)} />
            </motion.div>
          )}
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.22 }}
              style={{ position: 'fixed', inset: 0, zIndex: 200, overflow: 'hidden', background: T.bg }}
            >
              <EmojiManagerPage onBack={() => setShowEmoji(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};