import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CollectionsPage, FavoriteMessage } from './CollectionsPage';
import { AppearancePage } from './AppearancePage';

interface CorePageProps {
  favorites: FavoriteMessage[];
  onRemoveFavorite: (id: string) => void;
}

const ef: Record<string, React.CSSProperties> = {
  serif: { fontFamily: 'Georgia, "Times New Roman", serif' },
  rule: { height: 1, background: '#111', width: '100%' },
  ruleThin: { height: '0.5px', background: '#ddd', width: '100%' },
};

interface MenuItemProps {
  symbol: string;
  label: string;
  desc: string;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ symbol, label, desc, onClick }) => (
  <motion.div
    whileTap={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 0', cursor: 'pointer', background: 'transparent',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* Symbol badge */}
      <div style={{
        width: 38, height: 38, border: '1px solid #111',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 16, color: '#111', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
          {symbol}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111', fontFamily: 'Georgia, serif' }}>
          {label}
        </span>
        <span style={{ fontSize: 8, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#bbb', fontFamily: 'Georgia, serif' }}>
          {desc}
        </span>
      </div>
    </div>
    <span style={{ fontSize: 14, color: '#ccc', fontFamily: 'Georgia, serif' }}>›</span>
  </motion.div>
);

export const CorePage: React.FC<CorePageProps> = ({ favorites, onRemoveFavorite }) => {
  const [showCollections, setShowCollections] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);

  const menuItems = [
    { symbol: '◈', label: '个人设定', desc: 'Masks / Persona',       onClick: () => console.log('进入个人设定') },
    { symbol: '◇', label: '收藏列表', desc: 'Stations / Dialogues', onClick: () => setShowCollections(true) },
    { symbol: '○', label: '表情管理', desc: 'Emoji / Assets',        onClick: () => console.log('进入表情管理') },
    { symbol: '◆', label: '界面外观', desc: 'Appearance / Theme',    onClick: () => setShowAppearance(true) },
    { symbol: '◎', label: '设置',     desc: 'Preferences / API',     onClick: () => console.log('进入设置') },
  ];

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>

      {/* ── Main scroll area ── */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#fafaf8', fontFamily: 'Georgia, serif' }}>
        <div style={{ maxWidth: 440, margin: '0 auto', padding: '28px 24px' }}>

          {/* Identity block */}
          <div style={{ marginBottom: 28 }}>
            <div style={ef.rule} />
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '6px 0 4px' }}>
              <span style={{ fontSize: 9, letterSpacing: '0.34em', textTransform: 'uppercase', color: '#bbb', fontFamily: 'Georgia, serif' }}>
                Core Identity
              </span>
            </div>

            {/* Name + avatar row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0 14px' }}>
              <div style={{
                width: 64, height: 64, border: '2px solid #111',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#111', flexShrink: 0,
              }}>
                <span style={{ fontSize: 28, color: '#fafaf8', fontFamily: 'Georgia, serif' }}>S</span>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: '#111', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
                  SYLVIA.
                </h2>
                <p style={{ margin: '5px 0 0', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#ccc', fontFamily: 'Georgia, serif' }}>
                  souyee494
                </p>
              </div>
            </div>

            <div style={ef.rule} />
          </div>

          {/* Menu items */}
          {menuItems.map((item, i) => (
            <React.Fragment key={item.label}>
              <MenuItem {...item} />
              <div style={ef.ruleThin} />
            </React.Fragment>
          ))}

          {/* Version footer */}
          <div style={{ marginTop: 36, paddingTop: 16, borderTop: '1px solid #eee', textAlign: 'center' }}>
            <span style={{ fontSize: 8, letterSpacing: '0.36em', textTransform: 'uppercase', color: '#ddd', fontFamily: 'Georgia, serif' }}>
              V 1.0.2 — STARRY
            </span>
          </div>

        </div>
      </div>

      {/* ── Sub-page overlays (logic unchanged) ── */}
      <AnimatePresence>
        {showCollections && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
            style={{ position: 'absolute', inset: 0, zIndex: 50, overflow: 'hidden', background: '#fafaf8' }}
          >
            <CollectionsPage
              favorites={favorites}
              onRemove={onRemoveFavorite}
              onBack={() => setShowCollections(false)}
            />
          </motion.div>
        )}
        {showAppearance && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
            style={{ position: 'absolute', inset: 0, zIndex: 50, overflow: 'hidden', background: '#fafaf8' }}
          >
            <AppearancePage onBack={() => setShowAppearance(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};