import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, AlertCircle, Trash2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Mask {
  id: string;
  avatar: string;
  name: string;
  persona: string;
  createdAt: number;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const MASKS_KEY = 'starry_os_masks';

const loadMasks = (): Mask[] => {
  try {
    const raw = localStorage.getItem(MASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveMasks = (masks: Mask[]) => {
  localStorage.setItem(MASKS_KEY, JSON.stringify(masks));
};

// ─── Style helpers ────────────────────────────────────────────────────────────

const S = {
  serif: { fontFamily: 'Georgia, "Times New Roman", serif' } as React.CSSProperties,
  rule:  { height: 1,    background: '#111', width: '100%' } as React.CSSProperties,
  thin:  { height: .5,   background: '#ddd', width: '100%' } as React.CSSProperties,
  label: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 9, letterSpacing: '0.28em',
    textTransform: 'uppercase' as const,
    color: '#aaa', display: 'block', marginBottom: 6,
  } as React.CSSProperties,
  input: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    width: '100%', background: 'transparent',
    border: 'none', borderBottom: '1px solid #ccc',
    outline: 'none', fontSize: 14, color: '#111', padding: '6px 0',
  } as React.CSSProperties,
};

// ─── MaskFormModal ────────────────────────────────────────────────────────────

interface MaskFormModalProps {
  initial?: Mask;
  onSave: (data: Omit<Mask, 'id' | 'createdAt'>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const MaskFormModal: React.FC<MaskFormModalProps> = ({ initial, onSave, onDelete, onClose }) => {
  const [avatar,  setAvatar]  = useState(initial?.avatar  ?? '');
  const [name,    setName]    = useState(initial?.name    ?? '');
  const [persona, setPersona] = useState(initial?.persona ?? '');
  const [error,   setError]   = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('姓名为必填项');
      setTimeout(() => setError(null), 3000);
      return;
    }
    onSave({ avatar, name: name.trim(), persona: persona.trim() });
  };

  const title = initial ? (initial.name || '编辑面具') : '新建面具';
  const initial_char = name.trim().charAt(0).toUpperCase() || '·';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 300 }}
        style={{
          position: 'relative', width: '100%', maxWidth: 480,
          background: '#fafaf8', maxHeight: '92vh',
          display: 'flex', flexDirection: 'column', ...S.serif,
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 24px 0' }}>
          <div style={S.rule} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0 4px' }}>
            <span style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#999' }}>
              {initial ? 'Edit Mask' : 'New Mask'}
            </span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {initial && onDelete && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c00', ...S.serif }}
                >
                  Delete
                </button>
              )}
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', lineHeight: 1, padding: 0 }}>
                <X size={18} />
              </button>
            </div>
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: '#111' }}>
            {title}.
          </h2>
          <div style={S.rule} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Avatar picker */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: 80, height: 80, border: '1px solid #111',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden', background: '#eee', position: 'relative',
              }}
            >
              {avatar
                ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <ImageIcon size={20} color="#bbb" />
                    <span style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#bbb', ...S.serif }}>Upload</span>
                  </div>
              }
            </div>
            <input type="file" ref={fileRef} onChange={handleFile} accept="image/*" style={{ display: 'none' }} />
            {avatar && (
              <button
                onClick={() => setAvatar('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#bbb', ...S.serif }}
              >
                移除头像
              </button>
            )}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', border: '1px solid #c00', color: '#c00', fontSize: 12, ...S.serif }}
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={S.label}>姓名 <span style={{ color: '#c00' }}>*</span></label>
              <input
                style={S.input} type="text" value={name}
                placeholder="面具的名字"
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label style={S.label}>人设</label>
              <textarea
                rows={5} value={persona}
                placeholder="描述这个面具的性格、说话方式、背景故事…"
                onChange={e => setPersona(e.target.value)}
                style={{ ...S.input, resize: 'none', lineHeight: 1.7 } as React.CSSProperties}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px 32px', borderTop: '1px solid #111' }}>
          <button
            onClick={handleSave}
            style={{
              width: '100%', background: '#111', color: '#fafaf8', border: 'none',
              padding: 14, cursor: 'pointer', fontSize: 10,
              letterSpacing: '0.3em', textTransform: 'uppercase', ...S.serif,
            }}
          >
            {initial ? '保存修改' : '创建面具'}
          </button>
        </div>
      </motion.div>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 70,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
              background: 'rgba(0,0,0,0.7)',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ width: '100%', maxWidth: 320, background: '#fafaf8', padding: '28px 24px', ...S.serif }}
            >
              <div style={S.rule} />
              <div style={{ padding: '16px 0 20px', textAlign: 'center' }}>
                <Trash2 size={28} color="#c00" style={{ marginBottom: 12 }} />
                <h4 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#111' }}>确认删除面具？</h4>
                <p style={{ margin: 0, fontSize: 12, color: '#aaa', lineHeight: 1.6 }}>此操作不可撤销。</p>
              </div>
              <div style={S.rule} />
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{ flex: 1, padding: 12, background: 'none', border: '1px solid #ccc', cursor: 'pointer', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#666', ...S.serif }}
                >
                  取消
                </button>
                <button
                  onClick={onDelete}
                  style={{ flex: 1, padding: 12, background: '#c00', border: 'none', cursor: 'pointer', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fff', ...S.serif }}
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── MasksPage ────────────────────────────────────────────────────────────────

interface MasksPageProps {
  onBack: () => void;
}

export const MasksPage: React.FC<MasksPageProps> = ({ onBack }) => {
  const [masks, setMasks] = useState<Mask[]>(loadMasks);
  const [modal, setModal] = useState<'create' | Mask | null>(null);

  useEffect(() => { saveMasks(masks); }, [masks]);

  const handleSave = (data: Omit<Mask, 'id' | 'createdAt'>) => {
    if (modal === 'create') {
      setMasks(prev => [{ ...data, id: Date.now().toString(), createdAt: Date.now() }, ...prev]);
    } else if (modal && typeof modal === 'object') {
      setMasks(prev => prev.map(m => m.id === (modal as Mask).id ? { ...modal as Mask, ...data } : m));
    }
    setModal(null);
  };

  const handleDelete = (id: string) => {
    setMasks(prev => prev.filter(m => m.id !== id));
    setModal(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fafaf8', ...S.serif }}>

      {/* Header — matches CollectionsPage */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-black/2" style={{ flexShrink: 0 }}>
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
          <span style={{ fontSize: 22, color: '#111', lineHeight: 1 }}>‹</span>
        </button>
        <h2 className="text-[15px] font-black tracking-[0.2em] uppercase text-black">Masks</h2>
        <div style={{ width: 32 }} />
      </div>

      {/* Scroll body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ maxWidth: 440, margin: '0 auto' }}>

          {/* Add button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setModal('create')}
            style={{
              width: '100%', background: '#111', color: '#fafaf8',
              border: 'none', padding: '14px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', marginBottom: 20, ...S.serif,
            }}
          >
            <span style={{ fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase' }}>新建面具</span>
            <span style={{ fontSize: 22, lineHeight: 1, fontWeight: 300 }}>+</span>
          </motion.button>

          {/* Mask list */}
          <div style={S.rule} />
          {masks.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <p style={{ fontSize: 10, letterSpacing: '0.3em', color: '#ccc', textTransform: 'uppercase', ...S.serif }}>
                No Masks Yet
              </p>
            </div>
          ) : (
            masks.map((mask) => (
              <React.Fragment key={mask.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 44, height: 44, flexShrink: 0,
                    border: '1px solid #111', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#eee',
                  }}>
                    {mask.avatar
                      ? <img src={mask.avatar} alt={mask.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 18, color: '#999', ...S.serif }}>{mask.name.charAt(0).toUpperCase()}</span>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111', ...S.serif, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {mask.name}
                    </p>
                    {mask.persona && (
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: '#bbb', ...S.serif, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                        {mask.persona}
                      </p>
                    )}
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => setModal(mask)}
                    style={{ background: 'none', border: '1px solid #ddd', padding: '5px 10px', cursor: 'pointer', color: '#999', ...S.serif, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', flexShrink: 0 }}
                  >
                    Edit
                  </button>
                </div>
                <div style={S.thin} />
              </React.Fragment>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal !== null && (
          <MaskFormModal
            initial={modal === 'create' ? undefined : modal as Mask}
            onSave={handleSave}
            onDelete={modal !== 'create' ? () => handleDelete((modal as Mask).id) : undefined}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};