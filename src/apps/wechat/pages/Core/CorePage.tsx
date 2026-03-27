import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, User, Star, Smile, Palette, Settings, ChevronRight } from 'lucide-react';
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

/* ── 对齐全局的高级黑白质感 Tokens ── */
const T = {
  white: '#ffffff',
  bgPrimary: '#fafafa',
  black: '#000000',
  textPrimary: '#1a1a1a',
  textSecondary: '#5e5e5e',
  textHint: '#8e8e8e',
  
  fontSerif: '"Cormorant Garamond", "Playfair Display", serif',
  fontSans: '"Inter", sans-serif',
  fontMono: '"JetBrains Mono", monospace',

  borderHairline: '0.5px solid rgba(0,0,0,0.08)',
};

/* ── 列表项组件：去卡片化，增强精致感 ── */
const MenuItem: React.FC<{ icon: React.ReactNode; label: string; desc: string; onClick: () => void }> = ({ icon, label, desc, onClick }) => (
  <motion.div
    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
    whileTap={{ scale: 0.995 }}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '24px 0',
      cursor: 'pointer',
      borderBottom: T.borderHairline,
      transition: 'background 0.2s ease',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <div style={{ color: T.black, opacity: 0.8 }}>{icon}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: T.textPrimary, fontFamily: T.fontSans }}>
          {label}
        </span>
        <span style={{ 
          fontSize: 9, 
          letterSpacing: '0.15em', 
          textTransform: 'uppercase', 
          color: T.textHint, 
          fontFamily: T.fontMono 
        }}>
          {desc}
        </span>
      </div>
    </div>
    <ChevronRight size={14} strokeWidth={1} color={T.textHint} />
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
    { icon: <User size={20} strokeWidth={1.2} />, label: '个人设定', desc: 'Masks / Persona', onClick: () => setShowMasks(true) },
    { icon: <Star size={20} strokeWidth={1.2} />, label: '收藏列表', desc: 'Stations / Dialogues', onClick: () => setShowCollections(true) },
    { icon: <Smile size={20} strokeWidth={1.2} />, label: '表情管理', desc: 'Emoji / Assets', onClick: () => setShowEmoji(true) },
    { icon: <Palette size={20} strokeWidth={1.2} />, label: '界面外观', desc: 'Appearance / Theme', onClick: () => setShowAppearance(true) },
    { icon: <Settings size={20} strokeWidth={1.2} />, label: '设置', desc: 'Preferences / API', onClick: () => {} },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.bgPrimary, overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 120 }}>
          
          {/* ── 个人资料头部：更像个人名片 ── */}
          <div style={{ 
            padding: '64px 0 48px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderBottom: T.borderHairline,
            marginBottom: 20
          }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 100,
                height: 100,
                border: T.borderHairline,
                background: T.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: 24
              }}
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 40, color: T.black, fontFamily: T.fontSerif, fontStyle: 'italic' }}>
                  {profile.name ? profile.name[0].toUpperCase() : '·'}
                </span>
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0 }} onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0'}>
                <Upload size={18} color={T.black} strokeWidth={1} />
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" style={{ display: 'none' }} />

            <div style={{ textAlign: 'center' }}>
              {editingName ? (
                <input
                  autoFocus
                  defaultValue={profile.name}
                  onBlur={e => { setProfile({...profile, name: e.target.value}); setEditingName(false); }}
                  style={{
                    fontFamily: T.fontSerif, fontSize: 32, fontStyle: 'italic', textAlign: 'center',
                    background: 'transparent', border: 'none', borderBottom: '1px solid black', outline: 'none'
                  }}
                />
              ) : (
                <h2 
                  onClick={() => setEditingName(true)}
                  style={{ margin: 0, fontFamily: T.fontSerif, fontSize: 32, fontStyle: 'italic', fontWeight: 500, color: T.textPrimary, cursor: 'text' }}
                >
                  {profile.name || 'Undefined Identity'}
                </h2>
              )}
              <div style={{ 
                marginTop: 8, fontSize: 10, fontFamily: T.fontMono, 
                letterSpacing: '0.2em', color: T.textHint, textTransform: 'uppercase' 
              }}>
                {profile.bio || 'Waiting for protocol...'}
              </div>
            </div>
          </div>

          {/* ── 极简菜单列表 ── */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {menuItems.map(item => (
              <MenuItem key={item.label} {...item} />
            ))}
          </div>

          {/* ── 页脚版本号 ── */}
          <div style={{ marginTop: 64, textAlign: 'center' }}>
            <span style={{
              fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase',
              color: T.textHint, fontFamily: T.fontMono, opacity: 0.6
            }}>
              Core Protocol v1.0.2 / Souyee OS
            </span>
          </div>
        </div>
      </div>

      {/* ── 全屏覆盖层：磨砂质感 ── */}
      <AnimatePresence>
        {[
          { show: showMasks, Comp: MasksPage, close: () => setShowMasks(false) },
          { show: showCollections, Comp: CollectionsPage, close: () => setShowCollections(false), extra: { favorites, onRemove: onRemoveFavorite } },
          { show: showAppearance, Comp: AppearancePage, close: () => setShowAppearance(false) },
          { show: showEmoji, Comp: EmojiManagerPage, close: () => setShowEmoji(false) }
        ].map(({ show, Comp, close, extra }) => show && (
          <motion.div
            key={Comp.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ 
              position: 'fixed', inset: 0, zIndex: 100, 
              background: T.white, overflow: 'hidden' 
            }}
          >
            <Comp onBack={close} {...extra} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};