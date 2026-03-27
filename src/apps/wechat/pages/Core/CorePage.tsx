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

/* ── 极简黑白高对比度 iOS 设计 Token ── */
const T = {
  bgPrimary:   '#ffffff', // 纯白底色
  bgActive:    '#f2f2f7', // iOS 经典的点击高亮灰色

  textPrimary:   '#000000', // 纯黑文字
  textSecondary: '#666666', // 深灰色辅助文字，保证高对比
  textHint:      '#8e8e93', // iOS 经典提示灰

  borderStark:    '1.5px solid #000000', // 高对比纯黑边框
  borderSubtle:   '0.5px solid rgba(0, 0, 0, 0.15)', // 分割线

  overlayBg:     'rgba(255, 255, 255, 0.75)', // 磨砂玻璃白色背景
  blurEffect:    'blur(40px) saturate(150%)', // 强效磨砂毛玻璃

  // 默认使用系统苹方/SF Pro字体，辅以衬线体提升高级感
  fontSans:  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
  fontSerif: '"Playfair Display", "Times New Roman", serif',
  fontMono:  'ui-monospace, "SF Mono", Menlo, Monaco, monospace',
};

/* ── iOS 风格列表项 ── */
const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  desc: string;
  index: number;
  isLast: boolean;
  onClick: () => void;
}> = ({ icon, label, desc, index, isLast, onClick }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.1 + index * 0.05, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
    whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
    whileTap={{ backgroundColor: T.bgActive }}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      cursor: 'pointer',
      borderBottom: isLast ? 'none' : T.borderSubtle,
      background: 'transparent',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* 黑底白图标：极强对比度 */}
      <div style={{
        width: 36,
        height: 36,
        background: '#000000',
        borderRadius: 10, // iOS 圆角
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
      }}>
        {icon}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          fontSize: 17, // iOS 标准列表字号
          fontWeight: 600,
          color: T.textPrimary,
          fontFamily: T.fontSans,
          letterSpacing: '-0.02em',
        }}>
          {label}
        </span>
        <span style={{
          fontSize: 12,
          color: T.textSecondary,
          fontFamily: T.fontSans,
          fontWeight: 400,
        }}>
          {desc}
        </span>
      </div>
    </div>

    <ChevronRight size={20} color="#c7c7cc" strokeWidth={2.5} />
  </motion.div>
);

/* ── 头像组件 ── */
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
      whileTap={{ scale: 0.96 }}
      style={{
        width: 110,
        height: 110,
        borderRadius: '50%',
        border: T.borderStark, // 纯黑描边
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)', // 干净的浅阴影
      }}
    >
      {avatar ? (
        <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{
          fontSize: 48,
          color: '#000000',
          fontFamily: T.fontSerif,
          fontStyle: 'italic',
          fontWeight: 600,
        }}>
          {name ? name[0].toUpperCase() : '?'}
        </span>
      )}

      {/* 头像悬浮磨砂遮罩 */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ 
          background: '#000', 
          padding: '8px', 
          borderRadius: '50%',
          display: 'flex',
          color: '#fff'
        }}>
          <Upload size={18} strokeWidth={2} />
        </div>
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
    { icon: <User size={20} />,    label: '个人设定', desc: 'Masks & Persona',      onClick: () => setShowMasks(true) },
    { icon: <Star size={20} />,    label: '收藏列表', desc: 'Stations & Dialogues', onClick: () => setShowCollections(true) },
    { icon: <Smile size={20} />,   label: '表情管理', desc: 'Emoji & Assets',       onClick: () => setShowEmoji(true) },
    { icon: <Palette size={20} />, label: '界面外观', desc: 'Appearance & Theme',   onClick: () => setShowAppearance(true) },
    { icon: <Settings size={20} />,label: '系统设置', desc: 'Preferences & API',    onClick: () => {} },
  ];

  return (
    <div style={{
      height: '100vh',
      width: '100%',
      background: T.bgPrimary,
      color: T.textPrimary,
      fontFamily: T.fontSans,
      overflowY: 'auto',
      overflowX: 'hidden',
      position: 'relative',
    }}>
      {/* 顶部磨砂导航栏 (模拟 iOS Sticky Header) */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 60,
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: T.blurEffect,
        WebkitBackdropFilter: T.blurEffect,
        borderBottom: T.borderSubtle,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Souyee OS
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
          Core Protocol <ArrowUpRight size={14} strokeWidth={2.5} />
        </span>
      </div>

      <div style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '40px 20px 80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        
        {/* 头像与身份区域 */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 48 }}
        >
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

          <div style={{ marginTop: 24, textAlign: 'center', width: '100%' }}>
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
                  fontFamily: T.fontSans,
                  fontSize: 32,
                  fontWeight: 800,
                  textAlign: 'center',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: T.borderStark,
                  color: T.textPrimary,
                  outline: 'none',
                  width: '80%',
                  paddingBottom: 4,
                }}
              />
            ) : (
              <h2
                onClick={() => setEditingName(true)}
                style={{
                  margin: 0,
                  fontFamily: T.fontSans,
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: T.textPrimary,
                  cursor: 'text',
                }}
              >
                {profile.name || 'Undefined'}
              </h2>
            )}
            <p style={{ marginTop: 8, color: T.textHint, fontSize: 14, fontWeight: 500 }}>
              Tap to edit identity
            </p>
          </div>
        </motion.div>

        {/* 核心菜单：纯白底色 + 高对比纯黑粗边框 */}
        <div style={{
          width: '100%',
          background: '#ffffff',
          borderRadius: 20,
          border: T.borderStark,
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)', // 增加一点呼吸感
        }}>
          {menuItems.map((item, i) => (
            <MenuItem 
              key={item.label} 
              {...item} 
              index={i} 
              isLast={i === menuItems.length - 1} 
            />
          ))}
        </div>

        {/* 底部版本 */}
        <div style={{ marginTop: 40 }}>
          <span style={{
            padding: '6px 14px',
            background: '#000000',
            color: '#ffffff',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            fontFamily: T.fontMono,
          }}>
            VERSION 1.0.2
          </span>
        </div>
      </div>

      {/* 弹窗/子页面：强效磨砂玻璃 iOS 风 */}
      <AnimatePresence>
        {[
          { show: showMasks,       Comp: MasksPage,       close: () => setShowMasks(false)       },
          { show: showCollections, Comp: CollectionsPage, close: () => setShowCollections(false), extra: { favorites, onRemove: onRemoveFavorite } },
          { show: showAppearance,  Comp: AppearancePage,  close: () => setShowAppearance(false)  },
          { show: showEmoji,       Comp: EmojiManagerPage,close: () => setShowEmoji(false)       },
        ].map(({ show, Comp, close, extra }) => show && (
          <motion.div
            key={Comp.name}
            initial={{ opacity: 0, y: '100%' }} // iOS 经典的自下而上弹出
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed', 
              inset: 0, 
              zIndex: 100,
              background: T.overlayBg, // 半透明白
              backdropFilter: T.blurEffect, // 强效磨砂
              WebkitBackdropFilter: T.blurEffect,
              display: 'flex', 
              flexDirection: 'column',
            }}
          >
            {/* 子页面的内部容器 */}
            <div style={{
              flex: 1,
              background: 'transparent', 
              color: T.textPrimary,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
            }}>
              {/* 这里假设你的 Comp 组件内部有自己的背景，建议在它们里面也设为透明以透出外层的毛玻璃效果 */}
              <Comp onBack={close} {...extra} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};