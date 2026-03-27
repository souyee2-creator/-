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

// 统一使用 SoulsPage 的设计 tokens
const T = {
  white: '#ffffff',
  bgPrimary: '#fafafa',
  black: '#000000',
  textPrimary: '#1a1a1a',
  textSecondary: '#5e5e5e',
  textHint: '#8e8e8e',
  error: '#ff3b30',
  
  fontSerif: '"Cormorant Garamond", "Playfair Display", serif',
  fontSans: '"Inter", sans-serif',
  fontMono: '"JetBrains Mono", monospace',

  borderHairline: '0.5px solid rgba(0,0,0,0.1)',
  shadowLg: '0 20px 40px rgba(0,0,0,0.1)',
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
      padding: '18px 0',
      cursor: 'pointer',
      borderBottom: T.borderHairline,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <div
        style={{
          width: 44,
          height: 44,
          border: T.borderHairline,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: T.white,
        }}
      >
        <span style={{ fontSize: 19, color: T.black, fontFamily: T.fontSerif, lineHeight: 1 }}>
          {symbol}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 16, fontWeight: 400, color: T.textPrimary, fontFamily: T.fontSerif }}>
          {label}
        </span>
        <span
          style={{
            fontSize: 8,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: T.textHint,
            fontFamily: T.fontMono,
          }}
        >
          {desc}
        </span>
      </div>
    </div>
    <span style={{ fontSize: 16, color: T.textHint, fontFamily: T.fontSerif }}>›</span>
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
      <div style={{ flex: 1, overflowY: 'auto', fontFamily: T.fontSerif }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 'calc(env(safe-area-inset-top) + 32px) 28px 28px' }}>
          {/* Identity block */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ height: 1, background: T.black, width: '100%', marginBottom: 8 }} />
            <div style={{ padding: '4px 0' }}>
              <span
                style={{
                  fontSize: 8,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: T.textHint,
                  fontFamily: T.fontMono,
                }}
              >
                Core Identity
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '16px 0 20px' }}>
              {/* Avatar */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 80,
                  height: 80,
                  border: T.borderHairline,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: T.white,
                  flexShrink: 0,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 32, color: T.black, fontFamily: T.fontSerif }}>{displayInitial}</span>
                )}
                <div
                  className="avatar-hover"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <Upload size={16} color={T.white} />
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
                      fontSize: 32,
                      fontWeight: 400,
                      letterSpacing: '-0.02em',
                      color: T.black,
                      background: 'transparent',
                      border: 'none',
                      borderBottom: T.borderHairline,
                      outline: 'none',
                      width: '100%',
                    }}
                  />
                ) : (
                  <h2
                    onClick={() => setEditingName(true)}
                    title="点击修改昵称"
                    style={{
                      margin: 0,
                      fontSize: 32,
                      fontWeight: 400,
                      letterSpacing: '-0.02em',
                      color: profile.name ? T.textPrimary : T.textHint,
                      fontFamily: T.fontSerif,
                      lineHeight: 1.1,
                      cursor: 'text',
                    }}
                  >
                    {profile.name ? `${profile.name}.` : '点击设置昵称'}
                  </h2>
                )}
              </div>
            </div>
            <div style={{ height: 1, background: T.black, width: '100%' }} />
          </div>

          {/* Menu */}
          {menuItems.map(item => (
            <MenuItem key={item.label} {...item} />
          ))}

          {/* Footer */}
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: T.borderHairline, textAlign: 'center' }}>
            <span
              style={{
                fontSize: 8,
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