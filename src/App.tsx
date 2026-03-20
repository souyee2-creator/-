import React, { useState, useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- App 引入 ---
import { WeChatApp } from './apps/wechat';
import { SettingsApp } from './apps/settings';
import { DiaryApp } from './apps/diary';
import { BeautifyApp } from './apps/beautify';
import { CouplesApp } from './apps/couples';

// ─── 字体注入：确保衬线字体生效 ───
const editorialStyle = `
  .editorial-root * { box-sizing: border-box; }
  .editorial-root { font-family: Georgia, 'Times New Roman', serif; }
  .ef-serif { font-family: Georgia, 'Times New Roman', serif; }
  .ef-rule { height: 1px; background: #111; width: 100%; }
  .ef-rule-thin { height: 0.5px; background: #bbb; width: 100%; }
  .ef-app-icon {
    width: 64px; height: 64px;
    border: 1px solid #111;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    background: #fafaf8;
    transition: background 0.12s, color 0.12s;
    cursor: pointer;
  }
  .ef-app-icon:hover { background: #111; color: #fafaf8; }
  .ef-app-icon:hover .ef-symbol { color: #fafaf8; }
  .ef-symbol {
    font-size: 22px;
    color: #111;
    font-family: Georgia, 'Times New Roman', serif;
    line-height: 1;
    user-select: none;
  }
  .ef-dock-icon {
    width: 48px; height: 48px;
    border: 1px solid #111;
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    background: #fafaf8;
    transition: background 0.12s;
    cursor: pointer;
  }
  .ef-dock-icon:active { background: #111; }
  .ef-dock-icon:active .ef-symbol { color: #fafaf8; }
  .ef-input-edit {
    font-family: Georgia, 'Times New Roman', serif;
    border: none;
    border-bottom: 1px solid #111;
    outline: none;
    background: transparent;
    text-align: center;
    width: 100%;
  }
`;

// ─── 1. 个人名片 ───────────────────────────────────────────────
const HeroCard = () => {
  const [profile, setProfile] = useState({
    name: 'Sylvia',
    id: 'souyee494',
    bio: '" 人生小满胜万全 "',
    location: '冰岛',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sylvia',
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setProfile((prev) => ({ ...prev, avatar: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = (field: string, value: string) => {
    if (value.trim() !== '') setProfile((prev) => ({ ...prev, [field]: value }));
    setEditingField(null);
  };

  const now = new Date();
  const dateStr = now
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        width: '90%',
        maxWidth: 400,
        marginTop: 20,
        marginBottom: 28,
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Masthead rule top */}
      <div style={{ height: 2, background: '#111', marginBottom: 4 }} />

      {/* Kicker */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 8,
            letterSpacing: '0.38em',
            color: '#aaa',
            textTransform: 'uppercase',
            fontFamily: 'Georgia, serif',
          }}
        >
          SOUYEE PHONE
        </span>
        <span
          style={{
            fontSize: 8,
            color: '#ccc',
            fontStyle: 'italic',
            fontFamily: 'Georgia, serif',
          }}
        >
          {dateStr}
        </span>
      </div>

      {/* Thin rule */}
      <div style={{ height: 1, background: '#111', marginBottom: 12 }} />

      {/* Card body */}
      <div
        style={{
          border: '1px solid #111',
          padding: '20px 24px 18px',
          background: '#fafaf8',
          position: 'relative',
        }}
      >
        {/* Avatar — square crop, top-center, overlapping */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            position: 'absolute',
            top: -28,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 56,
            height: 56,
            border: '2px solid #111',
            overflow: 'hidden',
            cursor: 'pointer',
            background: '#e8e6e1',
          }}
        >
          <img
            src={profile.avatar}
            alt="avatar"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.35)',
              opacity: 0,
              transition: 'opacity 0.15s',
            }}
            className="avatar-hover-overlay"
          >
            <Upload size={14} color="#fff" />
          </div>
        </div>

        {/* Spacer for avatar */}
        <div style={{ height: 34 }} />

        {/* Name */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          {editingField === 'name' ? (
            <input
              autoFocus
              className="ef-input-edit"
              style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}
              defaultValue={profile.name}
              onBlur={(e) => handleUpdate('name', e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && handleUpdate('name', e.currentTarget.value)
              }
            />
          ) : (
            <h2
              onClick={() => setEditingField('name')}
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#111',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
              }}
            >
              {profile.name}
            </h2>
          )}

          {/* ID */}
          {editingField === 'id' ? (
            <input
              autoFocus
              className="ef-input-edit"
              style={{
                fontSize: 9,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: '#888',
                marginTop: 4,
              }}
              defaultValue={profile.id}
              onBlur={(e) => handleUpdate('id', e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && handleUpdate('id', e.currentTarget.value)
              }
            />
          ) : (
            <p
              onClick={() => setEditingField('id')}
              style={{
                margin: '4px 0 0',
                fontSize: 9,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: '#bbb',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
              }}
            >
              {profile.id}
            </p>
          )}
        </div>

        {/* Thin rule */}
        <div style={{ height: 1, background: '#e0ddd7', margin: '10px 0' }} />

        {/* Bio */}
        <div style={{ textAlign: 'center', padding: '0 8px', marginBottom: 10 }}>
          {editingField === 'bio' ? (
            <textarea
              autoFocus
              className="ef-input-edit"
              style={{
                fontSize: 12,
                fontStyle: 'italic',
                resize: 'none',
                lineHeight: 1.6,
                color: '#555',
              }}
              defaultValue={profile.bio}
              onBlur={(e) => handleUpdate('bio', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdate('bio', e.currentTarget.value);
              }}
            />
          ) : (
            <p
              onClick={() => setEditingField('bio')}
              style={{
                margin: 0,
                fontSize: 12,
                fontStyle: 'italic',
                color: '#666',
                lineHeight: 1.7,
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
              }}
            >
              {profile.bio}
            </p>
          )}
        </div>

        {/* Location */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {editingField === 'location' ? (
            <input
              autoFocus
              className="ef-input-edit"
              style={{ fontSize: 10, letterSpacing: '0.15em', color: '#888', width: 'auto' }}
              defaultValue={profile.location}
              onBlur={(e) => handleUpdate('location', e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && handleUpdate('location', e.currentTarget.value)
              }
            />
          ) : (
            <div
              onClick={() => setEditingField('location')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 10px',
                border: '0.75px solid #ccc',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 9, color: '#999', fontFamily: 'Georgia, serif' }}>◎</span>
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: '0.18em',
                  color: '#999',
                  textTransform: 'uppercase',
                  fontFamily: 'Georgia, serif',
                }}
              >
                {profile.location}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom rule */}
      <div style={{ height: 1, background: '#111', marginTop: 0 }} />
    </motion.div>
  );
};

// ─── 2. App 图标 ───────────────────────────────────────────────
interface AppIconProps {
  symbol: string;
  label: string;
  labelZh: string;
  onClick: () => void;
  delay?: number;
}

const AppIcon = ({ symbol, label, labelZh, onClick, delay = 0 }: AppIconProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    whileTap={{ scale: 0.94 }}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 5,
      cursor: 'pointer',
    }}
  >
    <div className="ef-app-icon">
      <span className="ef-symbol">{symbol}</span>
    </div>
    <span
      style={{
        fontSize: 7.5,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: '#333',
        textAlign: 'center',
        fontFamily: 'Georgia, serif',
        lineHeight: 1.3,
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: 8,
        color: '#aaa',
        fontStyle: 'italic',
        fontFamily: 'Georgia, serif',
        marginTop: -2,
      }}
    >
      {labelZh}
    </span>
  </motion.div>
);

// ─── 3. 主程序 ─────────────────────────────────────────────────
export default function App() {
  const [wallpaper, setWallpaper] = useState<string>('#fafaf8');
  const [activeApp, setActiveApp] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState<string>(
    () => localStorage.getItem('starry_os_api_key') || ''
  );
  const [baseUrl, setBaseUrl] = useState<string>(
    () =>
      localStorage.getItem('starry_os_base_url') || 'https://api.openai.com/v1'
  );

  useEffect(() => {
    localStorage.setItem('starry_os_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('starry_os_base_url', baseUrl);
  }, [baseUrl]);

  // 每个 app 对应的几何 Unicode 符号 + 双语名
  const apps = [
    { id: 'wechat',   symbol: '○',  label: 'Messages', labelZh: '微信' },
    { id: 'settings', symbol: '◎',  label: 'Settings', labelZh: '设置' },
    { id: 'diary',    symbol: '§',  label: 'Journal',  labelZh: '日记' },
    { id: 'beautify', symbol: '◆',  label: 'Beautify', labelZh: '美化' },
    { id: 'couples',  symbol: '♡',  label: 'Couple',   labelZh: '情侣' },
  ];

  const isImageWallpaper =
    wallpaper.startsWith('http') || wallpaper.startsWith('data');

  return (
    <>
      <style>{editorialStyle}</style>
      <div
        className="editorial-root"
        style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          userSelect: 'none',
          transition: 'background 0.7s',
          background: isImageWallpaper
            ? `url(${wallpaper}) center/cover no-repeat`
            : wallpaper,
        }}
        onClick={() => setActiveApp(null)}
      >
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 10,
            paddingTop: 'env(safe-area-inset-top)',
          }}
        >
          {/* ── Main content ── */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              overflowY: 'auto',
            }}
          >
            <HeroCard />

            {/* App grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px 12px',
                padding: '0 28px',
                width: '100%',
                maxWidth: 360,
              }}
            >
              {apps.map((app, i) => (
                <AppIcon
                  key={app.id}
                  symbol={app.symbol}
                  label={app.label}
                  labelZh={app.labelZh}
                  onClick={() => setActiveApp(app.id)}
                  delay={0.05 * i}
                />
              ))}
            </div>
          </div>

          {/* ── Bottom Dock ── */}
          <div
            style={{
              marginBottom: 32,
              marginLeft: 'auto',
              marginRight: 'auto',
              width: '85%',
              maxWidth: 340,
            }}
          >
            {/* Top rule of dock */}
            <div style={{ height: 1, background: '#111', marginBottom: 14 }} />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
              }}
            >
              {apps.slice(0, 4).map((app) => (
                <div
                  key={`dock-${app.id}`}
                  className="ef-dock-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveApp(app.id);
                  }}
                >
                  <span className="ef-symbol" style={{ fontSize: 18 }}>
                    {app.symbol}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom rule */}
            <div style={{ height: 0.5, background: '#ccc', marginTop: 14 }} />
          </div>
        </div>

        {/* ── App overlays (unchanged) ── */}
        <AnimatePresence>
          {activeApp === 'wechat' && (
            <WeChatApp
              onClose={() => setActiveApp(null)}
              {...({ apiKey, baseUrl } as any)}
            />
          )}
          {activeApp === 'settings' && (
            <SettingsApp
              onClose={() => setActiveApp(null)}
              {...({
                apiKey,
                onUpdateApiKey: setApiKey,
                baseUrl,
                onUpdateBaseUrl: setBaseUrl,
              } as any)}
            />
          )}
          {activeApp === 'diary' && (
            <DiaryApp
              onClose={() => setActiveApp(null)}
              {...({ apiKey } as any)}
            />
          )}
          {activeApp === 'beautify' && (
            <BeautifyApp
              onClose={() => setActiveApp(null)}
              onSetWallpaper={setWallpaper}
              currentWallpaper={wallpaper}
            />
          )}
          {activeApp === 'couples' && (
            <CouplesApp onClose={() => setActiveApp(null)} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}