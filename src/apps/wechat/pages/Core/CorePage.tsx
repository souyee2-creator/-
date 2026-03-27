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

/* ── High-Contrast Pure White Luxury Tokens ── */
const T = {
  bgPrimary:   '#ffffff',
  bgSubtle:    '#ffffff',
  bgMuted:     '#f8f8f8',

  textPrimary:   '#000000',
  textSecondary: '#2c2c2c',
  textHint:      '#6b6b6b',

  borderHairline: '0.5px solid rgba(0, 0, 0, 0.2)',
  borderSubtle:   '1px solid rgba(0, 0, 0, 0.12)',
  borderBold:     '1px solid rgba(0, 0, 0, 0.28)',

  overlayBg:     'rgba(255, 255, 255, 0.92)',
  overlayBorder: '1px solid rgba(0, 0, 0, 0.08)',
  shadowSoft:    '0 8px 24px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.02)',
  shadowCard:    '0 1px 2px rgba(0,0,0,0.04)',

  fontSerif: '"Cormorant Garamond", "Playfair Display", serif',
  fontSans:  '"DM Sans", "Helvetica Neue", sans-serif',
  fontMono:  '"IBM Plex Mono", "JetBrains Mono", monospace',
};

const GrainOverlay: React.FC = () => (
  <svg
    style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999, opacity: 0.018 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

const LineAccent: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.6) 20%, rgba(0,0,0,0.6) 80%, transparent)',
    ...style
  }} />
);

/* ── 磨砂气泡卡片菜单项（无缝紧贴，磨砂质感）── */
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
    transition={{ delay: 0.05 + index * 0.03, duration: 0.3 }}
    whileHover={{ y: -1, backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)' }}
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 18px',
      marginBottom: 0,                     // 无缝紧贴
      cursor: 'pointer',
      background: 'rgba(255, 255, 255, 0.7)',   // 半透白
      backdropFilter: 'blur(16px)',              // 磨砂模糊
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: 24,
      border: '1px solid rgba(255, 255, 255, 0.8)', // 淡色边框增加层次
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      transition: 'all 0.2s ease',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 38,
        height: 38,
        background: 'rgba(255,255,255,0.9)',
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}>
        <div style={{ color: '#1a1a1a' }}>{icon}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          fontSize: 15,
          fontWeight: 400,
          letterSpacing: '-0.01em',
          color: T.textPrimary,
          fontFamily: T.fontSans,
        }}>
          {label}
        </span>
        <span style={{
          fontSize: 8,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: T.textHint,
          fontFamily: T.fontMono,
        }}>
          {desc}
        </span>
      </div>
    </div>

    <div style={{
      width: 26,
      height: 26,
      border: '1px solid rgba(0,0,0,0.12)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255,255,255,0.8)',
    }}>
      <ChevronRight size={12} strokeWidth={2} color="#2c2c2c" />
    </div>
  </motion.div>
);

/* ── 头像：80px，适中 ── */
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
        width: 80,
        height: 80,
        borderRadius: '50%',
        border: '2px solid rgba(0,0,0,0.25)',
        background: T.bgMuted,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 10,
        boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
        transition: 'border 0.2s',
      }}
      whileHover={{ borderColor: 'rgba(0,0,0,0.5)' }}
    >
      {avatar ? (
        <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{
          fontSize: 34,
          color: '#1a1a1a',
          fontFamily: T.fontSerif,
          fontStyle: 'italic',
          lineHeight: 1,
          userSelect: 'none',
          fontWeight: 400,
        }}>
          {name ? name[0].toUpperCase() : '·'}
        </span>
      )}

      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.16 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.04)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Upload size={14} strokeWidth={1.6} color="#1f1f1f" />
      </motion.div>
    </motion.div>
  );
};

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
    { icon: <User size={16} strokeWidth={1.6} />,    label: '个人设定', desc: 'Masks / Persona',      onClick: () => setShowMasks(true) },
    { icon: <Star size={16} strokeWidth={1.6} />,    label: '收藏列表', desc: 'Stations / Dialogues', onClick: () => setShowCollections(true) },
    { icon: <Smile size={16} strokeWidth={1.6} />,   label: '表情管理', desc: 'Emoji / Assets',       onClick: () => setShowEmoji(true) },
    { icon: <Palette size={16} strokeWidth={1.6} />, label: '界面外观', desc: 'Appearance / Theme',   onClick: () => setShowAppearance(true) },
    { icon: <Settings size={16} strokeWidth={1.6} />,label: '设置',     desc: 'Preferences / API',    onClick: () => {} },
  ];

  return (
    <div style={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: T.bgPrimary,
      color: T.textPrimary,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <GrainOverlay />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '0 20px',
        paddingTop: 32,
      }}>
        <div style={{
          maxWidth: 680,
          margin: '0 auto',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          {/* 顶部区域 */}
          <div style={{ flexShrink: 0 }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45 }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 0,
                paddingBottom: 10,
              }}
            >
              <span style={{
                fontSize: 8,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: T.textHint,
                fontFamily: T.fontMono,
                fontWeight: 450,
              }}>
                Souyee OS
              </span>
              <span style={{
                fontSize: 8,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: T.textHint,
                fontFamily: T.fontMono,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                Core Protocol
                <ArrowUpRight size={8} strokeWidth={1.8} />
              </span>
            </motion.div>

            <LineAccent />

            {/* 头像区域：紧凑 */}
            <div style={{
              padding: '12px 0 8px',
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

              <div style={{ textAlign: 'center' }}>
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
                      fontSize: 26,
                      fontStyle: 'italic',
                      fontWeight: 420,
                      textAlign: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `1px solid rgba(0,0,0,0.3)`,
                      color: T.textPrimary,
                      outline: 'none',
                      width: '100%',
                      letterSpacing: '-0.01em',
                    }}
                  />
                ) : (
                  <motion.h2
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08, duration: 0.4 }}
                    onClick={() => setEditingName(true)}
                    style={{
                      margin: 0,
                      fontFamily: T.fontSerif,
                      fontSize: 26,
                      fontStyle: 'italic',
                      fontWeight: 420,
                      color: T.textPrimary,
                      cursor: 'text',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {profile.name || 'Undefined Identity'}
                  </motion.h2>
                )}
              </div>
            </div>

            <LineAccent style={{ marginBottom: 10 }} />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.04, duration: 0.35 }}
              style={{
                paddingTop: 4,
                paddingBottom: 6,
                fontSize: 8,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: T.textHint,
                fontFamily: T.fontMono,
              }}
            >
              Navigation
            </motion.div>

            {/* 气泡卡片列表：无缝紧贴，无间距 */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {menuItems.map((item, i) => (
                <MenuItem key={item.label} {...item} index={i} />
              ))}
            </div>
          </div>

          {/* 底部版本信息 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            style={{ marginTop: 8, marginBottom: 24, textAlign: 'center' }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              border: T.borderBold,
              borderRadius: 32,
              background: T.bgPrimary,
              boxShadow: T.shadowCard,
            }}>
              <div style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: '#000000',
                opacity: 0.65,
              }} />
              <span style={{
                fontSize: 7,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: T.textHint,
                fontFamily: T.fontMono,
                fontWeight: 470,
              }}>
                v1.0.2
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {[
          { show: showMasks,       Comp: MasksPage,       close: () => setShowMasks(false)       },
          { show: showCollections, Comp: CollectionsPage, close: () => setShowCollections(false), extra: { favorites, onRemove: onRemoveFavorite } },
          { show: showAppearance,  Comp: AppearancePage,  close: () => setShowAppearance(false)  },
          { show: showEmoji,       Comp: EmojiManagerPage,close: () => setShowEmoji(false)       },
        ].map(({ show, Comp, close, extra }) => show && (
          <motion.div
            key={Comp.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: T.overlayBg,
              backdropFilter: 'blur(32px) saturate(180%) brightness(1.01)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%) brightness(1.01)',
              border: 'none',
              borderLeft: '1px solid rgba(0,0,0,0.06)',
              borderRight: '1px solid rgba(0,0,0,0.06)',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.02), 0 12px 40px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{
              flex: 1,
              background: T.bgPrimary,
              color: T.textPrimary,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
            }}>
              <Comp onBack={close} {...extra} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};