import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, User, Star, Smile, Palette, Settings, ChevronRight, ArrowUpRight } from 'lucide-react';
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

/* ── Pure White Luxury Tokens ── */
const T = {
  /* Backgrounds */
  bgPrimary:   '#ffffff',
  bgSubtle:    '#f8f8f6',
  bgMuted:     '#f2f2ef',

  /* Text */
  textPrimary:   '#0a0a0a',
  textSecondary: 'rgba(10, 10, 10, 0.55)',
  textHint:      'rgba(10, 10, 10, 0.35)',

  /* Borders */
  borderHairline: '0.5px solid rgba(0, 0, 0, 0.08)',
  borderSubtle:   '1px solid rgba(0, 0, 0, 0.06)',

  /* Frosted overlay */
  overlayBg:     'rgba(255, 255, 255, 0.75)',
  overlayBorder: '1px solid rgba(255, 255, 255, 0.9)',
  shadowSoft:    '0 8px 48px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.04)',
  shadowCard:    '0 1px 3px rgba(0,0,0,0.05)',

  /* Typography */
  fontSerif: '"Cormorant Garamond", "Playfair Display", serif',
  fontSans:  '"DM Sans", "Helvetica Neue", sans-serif',
  fontMono:  '"IBM Plex Mono", "JetBrains Mono", monospace',
};

/* ── Grain texture overlay for tactile luxury feel ── */
const GrainOverlay: React.FC = () => (
  <svg
    style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999, opacity: 0.025 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

/* ── Decorative line accent ── */
const LineAccent: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.12) 30%, rgba(0,0,0,0.12) 70%, transparent)',
    ...style
  }} />
);

/* ── Menu Item: white surface, editorial typographic hierarchy ── */
const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  desc: string;
  index: number;
  onClick: () => void;
}> = ({ icon, label, desc, index, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.08 + index * 0.05, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    whileHover={{ backgroundColor: 'rgba(0,0,0,0.018)' }}
    whileTap={{ scale: 0.998 }}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '22px 0',
      cursor: 'pointer',
      borderBottom: T.borderHairline,
      transition: 'background 0.2s ease',
      borderRadius: 2,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      {/* Icon pill */}
      <div style={{
        width: 36, height: 36,
        background: T.bgMuted,
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: T.borderSubtle,
        flexShrink: 0,
      }}>
        <div style={{ color: T.textSecondary }}>{icon}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{
          fontSize: 15,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: T.textPrimary,
          fontFamily: T.fontSans,
        }}>
          {label}
        </span>
        <span style={{
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: T.textHint,
          fontFamily: T.fontMono,
        }}>
          {desc}
        </span>
      </div>
    </div>

    <div style={{
      width: 24, height: 24,
      border: T.borderSubtle,
      borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: T.bgSubtle,
    }}>
      <ChevronRight size={11} strokeWidth={1.5} color={T.textHint} />
    </div>
  </motion.div>
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
      style={{
        width: 96, height: 96,
        borderRadius: '50%',
        border: '1.5px solid rgba(0,0,0,0.08)',
        background: T.bgSubtle,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 24,
        boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
      }}
    >
      {avatar ? (
        <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{
          fontSize: 38,
          color: T.textSecondary,
          fontFamily: T.fontSerif,
          fontStyle: 'italic',
          lineHeight: 1,
          userSelect: 'none',
        }}>
          {name ? name[0].toUpperCase() : '·'}
        </span>
      )}

      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.18 }}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Upload size={16} color={T.textSecondary} strokeWidth={1.5} />
      </motion.div>
    </motion.div>
  );
};

/* ── Main ── */
export const CorePage: React.FC<CorePageProps> = ({ favorites, onRemoveFavorite }) => {
  const [showCollections, setShowCollections] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showMasks, setShowMasks] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [editingName, setEditingName] = useState(false);
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

  const menuItems = [
    { icon: <User size={17} strokeWidth={1.4} />,    label: '个人设定', desc: 'Masks / Persona',      onClick: () => setShowMasks(true) },
    { icon: <Star size={17} strokeWidth={1.4} />,    label: '收藏列表', desc: 'Stations / Dialogues', onClick: () => setShowCollections(true) },
    { icon: <Smile size={17} strokeWidth={1.4} />,   label: '表情管理', desc: 'Emoji / Assets',       onClick: () => setShowEmoji(true) },
    { icon: <Palette size={17} strokeWidth={1.4} />, label: '界面外观', desc: 'Appearance / Theme',   onClick: () => setShowAppearance(true) },
    { icon: <Settings size={17} strokeWidth={1.4} />,label: '设置',     desc: 'Preferences / API',    onClick: () => {} },
  ];

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: T.bgPrimary,
      color: T.textPrimary,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <GrainOverlay />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', paddingBottom: 120 }}>

          {/* ── Header strip ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 32,
              paddingBottom: 20,
            }}
          >
            <span style={{
              fontSize: 8,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: T.textHint,
              fontFamily: T.fontMono,
            }}>
              Souyee OS
            </span>
            <span style={{
              fontSize: 8,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: T.textHint,
              fontFamily: T.fontMono,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Core Protocol
              <ArrowUpRight size={9} strokeWidth={1.5} />
            </span>
          </motion.div>

          <LineAccent />

          {/* ── Profile ── */}
          <div style={{
            padding: '56px 0 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <Avatar
              avatar={profile.avatar}
              name={profile.name}
              onClick={() => fileInputRef.current?.click()}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              style={{ display: 'none' }}
            />

            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              {editingName ? (
                <input
                  autoFocus
                  defaultValue={profile.name}
                  onBlur={e => {
                    setProfile({ ...profile, name: e.target.value });
                    setEditingName(false);
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  style={{
                    fontFamily: T.fontSerif,
                    fontSize: 34,
                    fontStyle: 'italic',
                    fontWeight: 400,
                    textAlign: 'center',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid rgba(0,0,0,0.2)`,
                    color: T.textPrimary,
                    outline: 'none',
                    width: '100%',
                    letterSpacing: '-0.01em',
                  }}
                />
              ) : (
                <motion.h2
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  onClick={() => setEditingName(true)}
                  style={{
                    margin: 0,
                    fontFamily: T.fontSerif,
                    fontSize: 34,
                    fontStyle: 'italic',
                    fontWeight: 400,
                    color: T.textPrimary,
                    cursor: 'text',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {profile.name || 'Undefined Identity'}
                </motion.h2>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{
                fontSize: 9,
                fontFamily: T.fontMono,
                letterSpacing: '0.2em',
                color: T.textHint,
                textTransform: 'uppercase',
              }}
            >
              {profile.bio || 'Awaiting protocol...'}
            </motion.div>
          </div>

          <LineAccent style={{ marginBottom: 8 }} />

          {/* ── Section label ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.06, duration: 0.4 }}
            style={{
              paddingTop: 20,
              paddingBottom: 4,
              fontSize: 8,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: T.textHint,
              fontFamily: T.fontMono,
            }}
          >
            Navigation
          </motion.div>

          {/* ── Menu ── */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {menuItems.map((item, i) => (
              <MenuItem key={item.label} {...item} index={i} />
            ))}
          </div>

          {/* ── Footer ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            style={{ marginTop: 72, textAlign: 'center' }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 20px',
              border: T.borderSubtle,
              borderRadius: 40,
              background: T.bgSubtle,
            }}>
              <div style={{
                width: 5, height: 5,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.2)',
              }} />
              <span style={{
                fontSize: 8,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: T.textHint,
                fontFamily: T.fontMono,
              }}>
                v1.0.2
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Overlay layers: frosted white glass ── */}
      <AnimatePresence>
        {[
          { show: showMasks,       Comp: MasksPage,       close: () => setShowMasks(false)       },
          { show: showCollections, Comp: CollectionsPage, close: () => setShowCollections(false), extra: { favorites, onRemove: onRemoveFavorite } },
          { show: showAppearance,  Comp: AppearancePage,  close: () => setShowAppearance(false)  },
          { show: showEmoji,       Comp: EmojiManagerPage,close: () => setShowEmoji(false)       },
        ].map(({ show, Comp, close, extra }) => show && (
          <motion.div
            key={Comp.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: T.overlayBg,
              backdropFilter: 'blur(40px) saturate(160%) brightness(1.02)',
              WebkitBackdropFilter: 'blur(40px) saturate(160%) brightness(1.02)',
              border: T.overlayBorder,
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            <div style={{
              flex: 1,
              background: T.bgPrimary,
              color: T.textPrimary,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <Comp onBack={close} {...extra} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};