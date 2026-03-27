import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AICharacter } from '../types';

interface SoulsPageProps {
  characters: AICharacter[];
  onAddCharacter: (char: AICharacter) => void;
  onUpdateCharacter: (char: AICharacter) => void;
  onDeleteCharacter: (id: string) => void;
}

/* ── 统一高对比度样式定义 ── */
const T = {
  black: '#000000',
  white: '#ffffff',
  accent: '#000000',
  error: '#ff0000',
  fontSerif: '"Didot", "Bodoni MT", "Playfair Display", Georgia, serif',
  fontSans: '"Helvetica Neue", "Inter", Helvetica, Arial, sans-serif',
};

const ef: Record<string, React.CSSProperties> = {
  serif: { fontFamily: T.fontSerif },
  sans:  { fontFamily: T.fontSans },
  label: {
    fontFamily: T.fontSans,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: T.black,
    display: 'block',
    marginBottom: 8,
  },
  input: {
    fontFamily: T.fontSans,
    width: '100%',
    background: 'transparent',
    border: '2px solid #000000', // 强化边框
    outline: 'none',
    fontSize: 14,
    color: T.black,
    padding: '12px',
    boxSizing: 'border-box',
  },
  rule: { height: 2, background: T.black, width: '100%' },
};

export const SoulsPage: React.FC<SoulsPageProps> = ({
  characters,
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<AICharacter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<AICharacter>>({
    avatar: '', realName: '', remark: '', personality: '',
  });

  const openCreateModal = () => {
    setEditingChar(null);
    setFormData({ avatar: '', realName: '', remark: '', personality: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (char: AICharacter) => {
    setEditingChar(char);
    setFormData({ ...char });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, avatar: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.realName?.trim() || !formData.personality?.trim()) {
      setError('REQUIRED FIELDS MISSING');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (editingChar) {
      onUpdateCharacter({
        ...editingChar,
        avatar: formData.avatar || '',
        realName: formData.realName.trim(),
        remark: formData.remark?.trim() || '',
        personality: formData.personality.trim(),
      });
    } else {
      onAddCharacter({
        id: Date.now().toString(),
        avatar: formData.avatar || '',
        realName: formData.realName.trim(),
        remark: formData.remark?.trim() || '',
        personality: formData.personality.trim(),
        createdAt: Date.now(),
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (editingChar) {
      onDeleteCharacter(editingChar.id);
      setIsDeleteConfirmOpen(false);
      setIsModalOpen(false);
    }
  };

  const getInitial = (char: Partial<AICharacter>) =>
    (char.remark?.trim() || char.realName?.trim() || '?').charAt(0).toUpperCase();

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: T.white }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* ── Add button (极简黑白) ── */}
        <div style={{ marginBottom: 32 }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={openCreateModal}
            style={{
              width: '100%',
              background: T.black,
              color: T.white,
              border: 'none',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              ...ef.sans,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Add New Soul
            </span>
            <span style={{ fontSize: 24, fontWeight: 300 }}>+</span>
          </motion.button>
        </div>

        <div style={ef.rule} />

        {/* ── Character list ── */}
        {characters.length === 0 ? (
          <div style={{ padding: '64px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 11, letterSpacing: '0.4em', color: T.black, opacity: 0.3, textTransform: 'uppercase', ...ef.sans }}>
              Empty Database
            </p>
          </div>
        ) : (
          characters.map((char) => (
            <div key={char.id} style={{ 
              display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0',
              borderBottom: `2px solid ${T.black}` // 使用粗黑线分割
            }}>
              {/* Avatar (方框黑边) */}
              <div style={{
                width: 52, height: 52, flexShrink: 0,
                border: `2px solid ${T.black}`, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: T.white,
              }}>
                {char.avatar
                  ? <img src={char.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 20, fontWeight: 700, color: T.black, ...ef.serif }}>{getInitial(char)}</span>
                }
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.black, ...ef.serif }}>
                  {char.remark || char.realName}
                </p>
                {char.remark && (
                  <p style={{ margin: '4px 0 0', fontSize: 10, fontWeight: 600, color: T.black, opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {char.realName}
                  </p>
                )}
              </div>

              <button
                onClick={() => openEditModal(char)}
                style={{ 
                  background: T.white, border: `2px solid ${T.black}`, 
                  padding: '6px 12px', cursor: 'pointer', color: T.black, 
                  fontWeight: 800, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' 
                }}
              >
                Edit
              </button>
            </div>
          ))
        )}
      </div>

      {/* ── Create / Edit Modal (全屏高对比) ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'grayscale(1)' }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 35, stiffness: 350 }}
              style={{
                position: 'relative', width: '100%', maxWidth: 500,
                background: T.white, borderTop: `4px solid ${T.black}`, // 极粗顶部边框
                boxShadow: '0 -20px 40px rgba(0,0,0,0.1)',
                maxHeight: '92vh', display: 'flex', flexDirection: 'column',
              }}
            >
              <div style={{ padding: '24px 24px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    {editingChar ? 'Identity Update' : 'New Identity'}
                  </span>
                  <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={24} strokeWidth={3} />
                  </button>
                </div>
                <h2 style={{ margin: '0 0 16px', fontSize: 36, fontWeight: 700, ...ef.serif, fontStyle: 'italic' }}>
                  {editingChar ? 'Modify Soul.' : 'Create Soul.'}
                </h2>
                <div style={ef.rule} />
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>
                {/* Avatar Upload */}
                <div style={{ alignSelf: 'center' }}>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: 100, height: 100, border: `3px solid ${T.black}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', overflow: 'hidden', background: T.white,
                    }}
                  >
                    {formData.avatar
                      ? <img src={formData.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <ImageIcon size={32} />
                    }
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <label style={ef.label}>Real Name / 真实姓名</label>
                    <input style={ef.input} type="text" value={formData.realName} 
                      onChange={(e) => setFormData({ ...formData, realName: e.target.value })} />
                  </div>
                  <div>
                    <label style={ef.label}>Remark / 备注</label>
                    <input style={ef.input} type="text" value={formData.remark} 
                      onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
                  </div>
                  <div>
                    <label style={ef.label}>Personality / 人设</label>
                    <textarea rows={4} value={formData.personality} 
                      onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                      style={{ ...ef.input, resize: 'none' }} />
                  </div>
                </div>

                {editingChar && (
                  <button onClick={() => setIsDeleteConfirmOpen(true)}
                    style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#ff0000', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.1em' }}>
                    [ Terminate Soul ]
                  </button>
                )}
              </div>

              <div style={{ padding: '24px', background: T.white }}>
                <button onClick={handleSave}
                  style={{
                    width: '100%', background: T.black, color: T.white, border: 'none',
                    padding: '20px', cursor: 'pointer', fontSize: 12, fontWeight: 800,
                    letterSpacing: '0.3em', textTransform: 'uppercase'
                  }}>
                  {editingChar ? 'Save Changes' : 'Execute Creation'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation ── */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)' }} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              style={{ position: 'relative', width: '100%', maxWidth: 320, background: T.white, padding: '32px 24px', border: `4px solid ${T.black}` }}>
              <div style={{ textAlign: 'center' }}>
                <Trash2 size={40} style={{ marginBottom: 16 }} />
                <h4 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, ...ef.serif }}>PERMANENT DELETE?</h4>
                <p style={{ margin: '0 0 24px', fontSize: 12, fontWeight: 500, lineHeight: 1.5 }}>This action cannot be undone. Data will be purged.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={handleDelete}
                  style={{ padding: '14px', background: '#ff0000', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
                  Confirm Purge
                </button>
                <button onClick={() => setIsDeleteConfirmOpen(false)}
                  style={{ padding: '14px', background: 'none', border: `2px solid ${T.black}`, cursor: 'pointer', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};