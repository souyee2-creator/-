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

// 柔和黑白高对比度设计 tokens
const T = {
  white: '#ffffff',
  bgPrimary: '#f8f8f8',       // 极浅灰背景，温和不刺眼
  black: '#1a1a1a',           // 深灰而非纯黑，降低硬度
  textPrimary: '#1a1a1a',
  textSecondary: '#5e5e5e',
  textHint: '#9b9b9b',
  error: '#e03a3a',
  
  // 字体：标题用优雅衬线，正文用现代无衬线，提升可读性与温度
  fontSerif: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
  fontSans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif',
  fontMono: '"JetBrains Mono", monospace',

  borderLight: '1px solid rgba(0,0,0,0.08)',
  shadowSm: '0 2px 4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02)',
  radiusMd: '16px',
  radiusSm: '12px',
  radiusXs: '8px',
};

interface MenuItemProps {
  symbol: string;
  label: string;
  desc: string;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ symbol, label, desc, onClick }) => (
  <motion.div
    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 0',
      cursor: 'pointer',
      borderBottom: T.borderLight,
      transition: 'background-color 0.2s ease',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: T.radiusSm,
          backgroundColor: T.white,
          border: T.borderLight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: T.shadowSm,
        }}
      >
        <span style={{ fontSize: 20, color: T.black, fontFamily: T.fontSerif, lineHeight: 1 }}>
          {symbol}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 17, fontWeight: 450, color: T.textPrimary, fontFamily: T.fontSans }}>
          {label}
        </span>
        <span
          style={{
            fontSize: 9,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: T.textHint,
            fontFamily: T.fontMono,
          }}
        >
          {desc}
        </span>
      </div>
    </div>
    <span style={{ fontSize: 18, color: T.textHint, fontFamily: T.fontSerif, fontWeight: 300 }}>›</span>
  </motion.div>
);

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

  const handleNameSave = (value: string) => {
    if (value.trim()) setProfile(prev => ({ ...prev, name: value.trim() }));
    setEditingName(false);
  };

  const displayInitial = profile.name ? profile.name.charAt(0).toUpperCase() : '·';

  const menuItems = [
    { symbol: '◈', label: '个人设定', desc: 'Masks / Persona', onClick: () => setShowMasks(true) },
    { symbol: '☆', label: '收藏列表', desc: 'Stations / Dialogues', onClick: () => setShowCollections(true) },
    { symbol: '☺', label: '表情管理', desc: 'Emoji / Assets', onClick: () => setShowEmoji(true) },
    { symbol: '◆', label: '界面外观', desc: 'Appearance / Theme', onClick: () => setShowAppearance(true) },
    { symbol: '◎', label: '设置', desc: 'Preferences / API', onClick: () => console.log('设置') },
  ];

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', background: T.bgPrimary }}>
      <div style={{ flex: 1, overflowY: 'auto', fontFamily: T.fontSans }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 'calc(env(safe-area-inset-top) + 32px) 24px 32px' }}>
          {/* Identity block */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ height: 1, background: T.black, width: '100%', marginBottom: 10, opacity: 0.3 }} />
            <div style={{ padding: '4px 0' }}>
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: T.textHint,
                  fontFamily: T.fontMono,
                }}
              >
                Core Identity
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '20px 0 24px' }}>
              {/* Avatar */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: T.radiusMd,
                  border: T.borderLight,
                  backgroundColor: T.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: T.shadowSm,
                }}
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 34, color: T.black, fontFamily: T.fontSerif, fontStyle: 'italic' }}>
                    {displayInitial}
                  </span>
                )}
                <div
                  className="avatar-hover"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    backdropFilter: 'blur(2px)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <Upload size={18} color={T.white} strokeWidth={1.5} />
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" style={{ display: 'none' }} />

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
                      fontSize: 34,
                      fontWeight: 400,
                      letterSpacing: '-0.01em',
                      color: T.black,
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${T.textHint}`,
                      outline: 'none',
                      width: '100%',
                      padding: '4px 0',
                    }}
                  />
                ) : (
                  <h2
                    onClick={() => setEditingName(true)}
                    title="点击修改昵称"
                    style={{
                      margin: 0,
                      fontSize: 34,
                      fontWeight: 400,
                      letterSpacing: '-0.01em',
                      color: profile.name ? T.textPrimary : T.textHint,
                      fontFamily: T.fontSerif,
                      lineHeight: 1.2,
                      cursor: 'text',
                      borderBottom: '1px dotted transparent',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderBottomColor = T.textHint)}
                    onMouseLeave={e => (e.currentTarget.style.borderBottomColor = 'transparent')}
                  >
                    {profile.name ? `${profile.name}.` : '点击设置昵称'}
                  </h2>
                )}
              </div>
            </div>
            <div style={{ height: 1, background: T.black, width: '100%', opacity: 0.3 }} />
          </div>

          {/* Menu */}
          {menuItems.map(item => (
            <MenuItem key={item.label} {...item} />
          ))}

          {/* Footer */}
          <div style={{ marginTop: 56, paddingTop: 24, borderTop: T.borderLight, textAlign: 'center' }}>
            <span
              style={{
                fontSize: 9,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: T.textHint,
                fontFamily: T.fontMono,
              }}
            >
              V 1.0.2 — SOUYEE
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMasks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, overflow: 'hidden', background: T.white }}
          >
            <MasksPage onBack={() => setShowMasks(false)} />
          </motion.div>
        )}
        {showCollections && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
            style={{ position: 'absolute', inset: 0, zIndex: 50, overflow: 'hidden', background: T.white }}
          >
            <CollectionsPage favorites={favorites} onRemove={onRemoveFavorite} onBack={() => setShowCollections(false)} />
          </motion.div>
        )}
        {showAppearance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
            style={{ position: 'absolute', inset: 0, zIndex: 50, overflow: 'hidden', background: T.white }}
          >
            <AppearancePage onBack={() => setShowAppearance(false)} />
          </motion.div>
        )}
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, overflow: 'hidden', background: T.white }}
          >
            <EmojiManagerPage onBack={() => setShowEmoji(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};