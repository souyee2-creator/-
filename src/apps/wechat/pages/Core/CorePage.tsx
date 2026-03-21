import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload } from 'lucide-react';
import { MasksPage } from './MasksPage';
import { CollectionsPage, FavoriteMessage } from './CollectionsPage';
import { AppearancePage } from './AppearancePage';

interface CorePageProps {
  favorites: FavoriteMessage[];
  onRemoveFavorite: (id: string) => void;
}

const PROFILE_KEY = 'starry_os_core_identity';

const DEFAULT_PROFILE = { name: '', id: '', bio: '', location: '', avatar: '' };

const ef: Record<string, React.CSSProperties> = {
  serif: { fontFamily: 'Georgia, "Times New Roman", serif' },
  rule: { height: 1, background: '#111', width: '100%' },
  ruleThin: { height: '0.5px', background: '#ddd', width: '100%' },
};

interface MenuItemProps { symbol: string; label: string; desc: string; onClick: () => void; }

const MenuItem: React.FC<MenuItemProps> = ({ symbol, label, desc, onClick }) => (
  <motion.div
    whileTap={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', cursor: 'pointer' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 38, height: 38, border: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 16, color: '#111', fontFamily: 'Georgia, serif', lineHeight: 1 }}>{symbol}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111', fontFamily: 'Georgia, serif' }}>{label}</span>
        <span style={{ fontSize: 8, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#bbb', fontFamily: 'Georgia, serif' }}>{desc}</span>
      </div>
    </div>
    <span style={{ fontSize: 14, color: '#ccc', fontFamily: 'Georgia, serif' }}>›</span>
  </motion.div>
);

export const CorePage: React.FC<CorePageProps> = ({ favorites, onRemoveFavorite }) => {
  const [showCollections, setShowCollections] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showMasks, setShowMasks] = useState(false);
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

  const handleNameSave = (value: string) => {
    if (value.trim()) setProfile(prev => ({ ...prev, name: value.trim() }));
    setEditingName(false);
  };

  const displayInitial = profile.name ? profile.name.charAt(0).toUpperCase() : '·';

  const menuItems = [
    { symbol: '◈', label: '个人设定', desc: 'Masks / Persona',       onClick: () => setShowMasks(true) },
    { symbol: '◇', label: '收藏列表', desc: 'Stations / Dialogues', onClick: () => setShowCollections(true) },
    { symbol: '○', label: '表情管理', desc: 'Emoji / Assets',        onClick: () => console.log('表情管理') },
    { symbol: '◆', label: '界面外观', desc: 'Appearance / Theme',    onClick: () => setShowAppearance(true) },
    { symbol: '◎', label: '设置',     desc: 'Preferences / API',     onClick: () => console.log('设置') },
  ];

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', background: '#fafaf8', fontFamily: 'Georgia, serif' }}>
        <div style={{ maxWidth: 440, margin: '0 auto', padding: '28px 24px' }}>

          {/* Identity block */}
          <div style={{ marginBottom: 28 }}>
            <div style={ef.rule} />
            <div style={{ padding: '6px 0 4px' }}>
              <span style={{ fontSize: 9, letterSpacing: '0.34em', textTransform: 'uppercase', color: '#bbb', fontFamily: 'Georgia, serif' }}>
                Core Identity
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0 14px' }}>
              {/* Avatar */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ width: 64, height: 64, border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', flexShrink: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
              >
                {profile.avatar
                  ? <img src={profile.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 26, color: '#fafaf8', fontFamily: 'Georgia, serif' }}>{displayInitial}</span>
                }
                <div
                  className="avatar-hover"
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <Upload size={16} color="#fff" />
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
                    style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: '#111', background: 'transparent', border: 'none', borderBottom: '1px solid #111', outline: 'none', width: '100%' }}
                  />
                ) : (
                  <h2
                    onClick={() => setEditingName(true)}
                    title="点击修改昵称"
                    style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: profile.name ? '#111' : '#ccc', fontFamily: 'Georgia, serif', lineHeight: 1.1, cursor: 'text' }}
                  >
                    {profile.name ? `${profile.name}.` : '点击设置昵称'}
                  </h2>
                )}
                <p style={{ margin: '6px 0 0', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ccc', fontFamily: 'Georgia, serif' }}>
                  点击头像或昵称可修改
                </p>
              </div>
            </div>
            <div style={ef.rule} />
          </div>

          {/* Menu */}
          {menuItems.map(item => (
            <React.Fragment key={item.label}>
              <MenuItem {...item} />
              <div style={ef.ruleThin} />
            </React.Fragment>
          ))}

          {/* Footer */}
          <div style={{ marginTop: 36, paddingTop: 16, borderTop: '1px solid #eee', textAlign: 'center' }}>
            <span style={{ fontSize: 8, letterSpacing: '0.36em', textTransform: 'uppercase', color: '#ddd', fontFamily: 'Georgia, serif' }}>
              V 1.0.2 — STARRY
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMasks && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
            style={{ position: 'absolute', inset: 0, zIndex: 50, overflow: 'hidden', background: '#fafaf8' }}
          >
            <MasksPage onBack={() => setShowMasks(false)} />
          </motion.div>
        )}
        {showCollections && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
            style={{ position: 'absolute', inset: 0, zIndex: 50, overflow: 'hidden', background: '#fafaf8' }}>
            <CollectionsPage favorites={favorites} onRemove={onRemoveFavorite} onBack={() => setShowCollections(false)} />
          </motion.div>
        )}
        {showAppearance && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
            style={{ position: 'absolute', inset: 0, zIndex: 50, overflow: 'hidden', background: '#fafaf8' }}>
            <AppearancePage onBack={() => setShowAppearance(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};