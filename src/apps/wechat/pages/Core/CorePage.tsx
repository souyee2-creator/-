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

const PROFILE_KEY = 'souyee_os_core_identity';
const DEFAULT_PROFILE = { name: '', id: '', bio: '', location: '', avatar: '' };

// 柔和黑白高对比度设计 tokens
const T = {
  white: '#ffffff',
  bgPrimary: '#ffffff',        // 纯白背景
  black: '#1a1a1a',            // 深灰而非纯黑
  textPrimary: '#1a1a1a',
  textSecondary: '#5e5e5e',
  textHint: '#9b9b9b',
  error: '#e03a3a',
  
  fontSerif: `'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', serif`,
  fontSans: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
  fontMono: `'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', monospace`,

  borderLight: '1px solid rgba(0,0,0,0.08)',
  shadowCard: '0 2px 12px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
  shadowHover: '0 8px 24px rgba(0,0,0,0.06)',
  radiusCard: '24px',
  radiusItem: '20px',
  radiusSm: '16px',
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, desc, onClick }) => (
  <motion.div
    whileHover={{ y: -2, boxShadow: T.shadowHover }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 24px',
      marginBottom: '12px',
      cursor: 'pointer',
      background: T.white,
      borderRadius: T.radiusItem,
      boxShadow: T.shadowCard,
      transition: 'all 0.2s ease',
      border: T.borderLight,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: T.radiusSm,
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: T.black,
        }}
      >
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 17, fontWeight: 500, color: T.textPrimary, fontFamily: T.fontSans }}>
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
    <span style={{ fontSize: 20, color: T.textHint, fontFamily: T.fontSerif, fontWeight: 300 }}>›</span>
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
    { icon: <User size={22} strokeWidth={1.5} />, label: '个人设定', desc: 'Masks / Persona', onClick: () => setShowMasks(true) },
    { icon: <Star size={22} strokeWidth={1.5} />, label: '收藏列表', desc: 'Stations / Dialogues', onClick: () => setShowCollections(true) },
    { icon: <Smile size={22} strokeWidth={1.5} />, label: '表情管理', desc: 'Emoji / Assets', onClick: () => setShowEmoji(true) },
    { icon: <Palette size={22} strokeWidth={1.5} />, label: '界面外观', desc: 'Appearance / Theme', onClick: () => setShowAppearance(true) },
    { icon: <Settings size={22} strokeWidth={1.5} />, label: '设置', desc: 'Preferences / API', onClick: () => console.log('设置') },
  ];

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', background: T.bgPrimary }}>
      <div style={{ flex: 1, overflowY: 'auto', fontFamily: T.fontSans }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 'calc(env(safe-area-inset-top) + 32px) 20px 32px' }}>
          
          {/* 个人资料卡片 */}
          <div
            style={{
              background: T.white,
              borderRadius: T.radiusCard,
              padding: '24px',
              marginBottom: '32px',
              boxShadow: T.shadowCard,
              border: T.borderLight,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* 头像 */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: T.radiusSm,
                  border: T.borderLight,
                  background: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 36, color: T.black, fontFamily: T.fontSerif, fontStyle: 'italic' }}>
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

              {/* 昵称区域 */}
              <div style={{ flex: 1 }}>
                {editingName ? (
                  <input
                    autoFocus
                    defaultValue={profile.name}
                    onBlur={e => handleNameSave(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleNameSave(e.currentTarget.value)}
                    placeholder="输入昵称"
                    style={{
                      fontFamily: T.fontSerif,
                      fontSize: 26,
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
                      fontSize: 26,
                      fontWeight: 400,
                      letterSpacing: '-0.01em',
                      color: profile.name ? T.textPrimary : T.textHint,
                      fontFamily: T.fontSerif,
                      lineHeight: 1.2,
                      cursor: 'text',
                      borderBottom: '1px dotted transparent',
                      transition: 'border-color 0.2s',
                      display: 'inline-block',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderBottomColor = T.textHint)}
                    onMouseLeave={e => (e.currentTarget.style.borderBottomColor = 'transparent')}
                  >
                    {profile.name || '点击设置昵称'}
                  </h2>
                )}
                {/* 可选：加入 bio/location 占位 */}
                <div style={{ marginTop: 8, fontSize: 12, color: T.textHint, fontFamily: T.fontMono }}>
                  {profile.bio || '未设置简介'}
                </div>
              </div>
            </div>
          </div>

          {/* 菜单卡片列表 */}
          <div>
            {menuItems.map(item => (
              <MenuItem key={item.label} {...item} />
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 48, paddingTop: 24, textAlign: 'center' }}>
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