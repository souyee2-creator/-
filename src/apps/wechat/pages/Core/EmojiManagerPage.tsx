// src/apps/wechat/pages/Core/EmojiManagerPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  EmojiGroup, EmojiItem,
  loadGroups, saveGroups,
  saveImageToIDB, getImageFromIDB, deleteImageFromIDB,
  compressImage, parseBatchInput,
} from '../../utils/emojiStorage';

// ─── 简单联系人结构（从 localStorage 读取即可）──────────────────────────────────
interface Contact { id: string; name: string; avatar?: string; }

// ─── 单个表情缩略图 ────────────────────────────────────────────────────────────
const EmojiThumb: React.FC<{
  item: EmojiItem;
  onDelete: () => void;
}> = ({ item, onDelete }) => {
  const [src,       setSrc]       = useState<string | null>(item.type === 'url' ? (item.url ?? null) : null);
  const [showLabel, setShowLabel] = useState(false);
  const [imgError,  setImgError]  = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (item.type === 'local' && item.idbKey) {
      getImageFromIDB(item.idbKey).then(url => setSrc(url));
    }
  }, [item]);

  const startLongPress = () => {
    timerRef.current = setTimeout(() => setShowLabel(true), 500);
  };
  const endLongPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div
      style={{ position: 'relative', width: 72, height: 72, border: '1px solid #eee', flexShrink: 0, overflow: 'hidden' }}
      onMouseEnter={() => setShowLabel(true)}
      onMouseLeave={() => setShowLabel(false)}
      onTouchStart={startLongPress}
      onTouchEnd={endLongPress}
      onTouchCancel={endLongPress}
    >
      {/* 图片 */}
      {src && !imgError ? (
        <img
          src={src}
          alt={item.label}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 9, color: '#ccc', fontFamily: 'Georgia, serif', textAlign: 'center', padding: '0 4px', lineHeight: 1.3 }}>
            {imgError ? '加载\n失败' : '加载中'}
          </span>
        </div>
      )}

      {/* 释义浮层 */}
      <AnimatePresence>
        {showLabel && item.label && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.72)', padding: '3px 4px', textAlign: 'center', pointerEvents: 'none' }}
          >
            <span style={{ fontSize: 9, color: '#fff', fontFamily: 'Georgia, serif', lineHeight: 1.2 }}>{item.label}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 删除按钮 */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, background: '#111', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', lineHeight: 1, padding: 0 }}
      >×</button>
    </div>
  );
};

// ─── 主页面 ───────────────────────────────────────────────────────────────────
interface EmojiManagerPageProps { onBack: () => void; }

export const EmojiManagerPage: React.FC<EmojiManagerPageProps> = ({ onBack }) => {
  const [groups,          setGroups]          = useState<EmojiGroup[]>([]);
  const [selectedId,      setSelectedId]      = useState<string | null>(null);
  const [contacts,        setContacts]        = useState<Contact[]>([]);
  const [showNewGroup,    setShowNewGroup]    = useState(false);
  const [newGroupName,    setNewGroupName]    = useState('');
  const [showImportUrl,   setShowImportUrl]   = useState(false);
  const [urlInput,        setUrlInput]        = useState('');
  const [renamingId,      setRenamingId]      = useState<string | null>(null);
  const [renameValue,     setRenameValue]     = useState('');
  const [uploading,       setUploading]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化
  useEffect(() => {
    setGroups(loadGroups());
    try {
      const raw = localStorage.getItem('souyee_os_wechat_characters');
      if (raw) setContacts(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (updated: EmojiGroup[]) => { setGroups(updated); saveGroups(updated); };

  const selected = groups.find(g => g.id === selectedId) ?? null;

  // ── 组操作 ─────────────────────────────────────────────────────────────────
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const g: EmojiGroup = { id: `eg_${Date.now()}`, name: newGroupName.trim(), boundContactIds: [], emojis: [] };
    persist([...groups, g]);
    setNewGroupName('');
    setShowNewGroup(false);
    setSelectedId(g.id);
  };

  const handleDeleteGroup = (id: string) => {
    const g = groups.find(x => x.id === id);
    g?.emojis.forEach(e => { if (e.type === 'local' && e.idbKey) deleteImageFromIDB(e.idbKey); });
    persist(groups.filter(x => x.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleRename = (id: string) => {
    if (!renameValue.trim()) return;
    persist(groups.map(g => g.id === id ? { ...g, name: renameValue.trim() } : g));
    setRenamingId(null);
  };

  // ── 联系人绑定 ─────────────────────────────────────────────────────────────
  const toggleContact = (contactId: string) => {
    if (!selectedId) return;
    persist(groups.map(g => {
      if (g.id !== selectedId) return g;
      const bound = g.boundContactIds.includes(contactId)
        ? g.boundContactIds.filter(id => id !== contactId)
        : [...g.boundContactIds, contactId];
      return { ...g, boundContactIds: bound };
    }));
  };

  // ── 导入 URL ───────────────────────────────────────────────────────────────
  const handleImportUrls = () => {
    if (!selectedId || !urlInput.trim()) return;
    const parsed = parseBatchInput(urlInput);
    if (!parsed.length) return;
    const newItems: EmojiItem[] = parsed.map(({ url, label }) => ({
      id: `ei_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: 'url', url, label,
    }));
    persist(groups.map(g => g.id === selectedId ? { ...g, emojis: [...g.emojis, ...newItems] } : g));
    setUrlInput('');
    setShowImportUrl(false);
  };

  // ── 上传本地图片 ───────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedId) return;
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const newItems: EmojiItem[] = [];
    for (const file of files) {
      try {
        const compressed = await compressImage(file);
        const idbKey = `emoji_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await saveImageToIDB(idbKey, compressed);
        newItems.push({
          id: `ei_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: 'local', idbKey,
          label: file.name.replace(/\.[^.]+$/, '') || '表情',
        });
      } catch { /* 单张失败不阻断其余 */ }
    }
    persist(groups.map(g => g.id === selectedId ? { ...g, emojis: [...g.emojis, ...newItems] } : g));
    setUploading(false);
    e.target.value = '';
  };

  // ── 删除单个表情 ───────────────────────────────────────────────────────────
  const handleDeleteEmoji = (groupId: string, emojiId: string) => {
    const emoji = groups.find(g => g.id === groupId)?.emojis.find(e => e.id === emojiId);
    if (emoji?.type === 'local' && emoji.idbKey) deleteImageFromIDB(emoji.idbKey);
    persist(groups.map(g => g.id === groupId ? { ...g, emojis: g.emojis.filter(e => e.id !== emojiId) } : g));
  };

  // ─── 样式常量 ──────────────────────────────────────────────────────────────
  const rule     = { height: 1,       background: '#111', width: '100%' } as React.CSSProperties;
  const ruleThin = { height: '0.5px', background: '#ddd', width: '100%' } as React.CSSProperties;
  const serif    = 'Georgia, "Times New Roman", serif';

  const btnBase: React.CSSProperties = {
    fontFamily: serif, fontSize: 12, cursor: 'pointer',
    padding: '6px 12px', border: '1px solid #111',
    background: 'transparent', color: '#111',
  };
  const btnDark: React.CSSProperties = { ...btnBase, background: '#111', color: '#fff', border: 'none' };

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: serif }}>

      {/* ── 顶栏 ── */}
      <div style={{ padding: 'calc(env(safe-area-inset-top) + 12px) 20px 0', flexShrink: 0 }}>
        <div style={rule} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 8px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: serif, fontSize: 15, color: '#111', padding: 0 }}>
            ‹ 返回
          </button>
          <span style={{ fontSize: 9, letterSpacing: '0.34em', textTransform: 'uppercase', color: '#bbb', fontFamily: serif }}>
            Emoji / Assets
          </span>
          <button onClick={() => setShowNewGroup(true)} style={btnBase}>
            + 新建组
          </button>
        </div>
        <div style={rule} />
      </div>

      {/* ── 主体：左边组列表 + 右边详情 ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* 左：分组列表 */}
        <div style={{ width: 110, borderRight: '1px solid #eee', overflowY: 'auto', flexShrink: 0 }}>
          {groups.length === 0 && (
            <div style={{ padding: '28px 10px', textAlign: 'center' }}>
              <span style={{ fontSize: 10, color: '#ccc', letterSpacing: '0.1em', fontFamily: serif }}>暂无分组</span>
            </div>
          )}
          {groups.map(g => (
            <div
              key={g.id}
              onClick={() => setSelectedId(g.id)}
              style={{
                padding: '13px 12px', cursor: 'pointer',
                background: selectedId === g.id ? '#111' : 'transparent',
                borderBottom: '0.5px solid #eee',
              }}
            >
              {renamingId === g.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => handleRename(g.id)}
                  onKeyDown={e => e.key === 'Enter' && handleRename(g.id)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: '100%', fontFamily: serif, fontSize: 13, border: 'none', borderBottom: '1px solid #fff', background: 'transparent', color: '#fff', outline: 'none' }}
                />
              ) : (
                <span style={{ fontSize: 13, color: selectedId === g.id ? '#fff' : '#111', fontFamily: serif, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.name}
                </span>
              )}
              <span style={{ fontSize: 9, color: selectedId === g.id ? '#999' : '#bbb', letterSpacing: '0.1em' }}>
                {g.emojis.length} 个
              </span>
            </div>
          ))}
        </div>

        {/* 右：详情 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 32px' }}>
          {!selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <span style={{ fontSize: 11, color: '#ccc', letterSpacing: '0.2em', fontFamily: serif }}>← 选择分组</span>
            </div>
          ) : (
            <>
              {/* 组标题 */}
              <div style={{ padding: '16px 0 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: serif }}>{selected.name}</h3>
                  <span style={{ fontSize: 9, color: '#bbb', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    {selected.emojis.length} emojis
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                  <button
                    onClick={() => { setRenamingId(selected.id); setRenameValue(selected.name); }}
                    style={btnBase}
                  >重命名</button>
                  <button
                    onClick={() => { if (window.confirm(`删除"${selected.name}"及其全部表情？`)) handleDeleteGroup(selected.id); }}
                    style={btnDark}
                  >删除组</button>
                </div>
              </div>
              <div style={rule} />

              {/* 绑定联系人 */}
              <div style={{ padding: '14px 0 12px' }}>
                <span style={{ fontSize: 9, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#bbb', fontFamily: serif }}>
                  绑定联系人（聊天时显示此组）
                </span>
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {contacts.length === 0 && (
                    <span style={{ fontSize: 11, color: '#ccc', fontFamily: serif }}>暂无联系人</span>
                  )}
                  {contacts.map(c => {
                    const isBound = selected.boundContactIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleContact(c.id)}
                        style={{
                          padding: '5px 12px', border: '1px solid #111', cursor: 'pointer',
                          fontFamily: serif, fontSize: 12,
                          background: isBound ? '#111' : 'transparent',
                          color:      isBound ? '#fff' : '#111',
                        }}
                      >
                        {isBound ? '✓ ' : ''}{c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={ruleThin} />

              {/* 导入按钮区 */}
              <div style={{ padding: '14px 0 12px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setShowImportUrl(v => !v)} style={btnBase}>
                  + 批量导入 URL
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{ ...btnBase, opacity: uploading ? 0.5 : 1 }}
                >
                  {uploading ? '压缩中…' : '+ 上传本地图片'}
                </button>
                <input
                  type="file" ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*" multiple
                  style={{ display: 'none' }}
                />
              </div>

              {/* URL 导入面板 */}
              <AnimatePresence>
                {showImportUrl && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden', marginBottom: 14 }}
                  >
                    <div style={{ border: '1px solid #111', padding: 14 }}>
                      <p style={{ margin: '0 0 8px', fontSize: 10, color: '#888', letterSpacing: '0.08em', fontFamily: serif, lineHeight: 1.6 }}>
                        支持两种格式，可混用：<br />
                        「释义 URL」同一行 ／ 释义一行 + URL 下一行
                      </p>
                      <textarea
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        placeholder={"开心大笑 https://example.com/1.gif\n委屈\nhttps://example.com/2.gif\nhttps://example.com/3.gif"}
                        rows={6}
                        style={{ width: '100%', fontFamily: serif, fontSize: 12, border: '1px solid #ddd', padding: 8, resize: 'vertical', boxSizing: 'border-box', outline: 'none', display: 'block' }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                        <button onClick={() => { setShowImportUrl(false); setUrlInput(''); }} style={btnBase}>取消</button>
                        <button onClick={handleImportUrls} style={btnDark}>导入</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={ruleThin} />

              {/* 表情网格 */}
              <div style={{ padding: '14px 0' }}>
                {selected.emojis.length === 0 ? (
                  <span style={{ fontSize: 11, color: '#ccc', letterSpacing: '0.1em', fontFamily: serif }}>
                    暂无表情，点击上方按钮导入
                  </span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selected.emojis.map(emoji => (
                      <EmojiThumb
                        key={emoji.id}
                        item={emoji}
                        onDelete={() => handleDeleteEmoji(selected.id, emoji.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 新建组弹窗 ── */}
      <AnimatePresence>
        {showNewGroup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
            onClick={() => setShowNewGroup(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', border: '1px solid #111', padding: 24, width: 260, fontFamily: serif }}
            >
              <p style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, fontFamily: serif }}>新建表情组</p>
              <input
                autoFocus
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
                placeholder="组名（如：搞笑）"
                style={{ width: '100%', fontFamily: serif, fontSize: 14, border: 'none', borderBottom: '1px solid #111', outline: 'none', padding: '4px 0', marginBottom: 22, boxSizing: 'border-box', background: 'transparent' }}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowNewGroup(false); setNewGroupName(''); }} style={btnBase}>取消</button>
                <button onClick={handleCreateGroup} style={btnDark}>创建</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};