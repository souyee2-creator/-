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

const ef: Record<string, React.CSSProperties> = {
  serif: { fontFamily: 'Georgia, "Times New Roman", serif' },
  label: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 9,
    letterSpacing: '0.28em',
    textTransform: 'uppercase' as const,
    color: '#aaa',
    display: 'block',
    marginBottom: 6,
  },
  input: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #ccc',
    outline: 'none',
    fontSize: 14,
    color: '#111',
    padding: '6px 0',
  },
  rule: { height: 1, background: '#111', width: '100%' },
  ruleThin: { height: '0.5px', background: '#ddd', width: '100%' },
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
      setError('真实姓名和人设为必填项');
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
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#fafaf8', ...ef.serif }}>
      <div style={{ maxWidth: 440, margin: '0 auto' }}>

        {/* ── Add button row ── */}
        <div style={{ marginBottom: 20 }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={openCreateModal}
            style={{
              width: '100%',
              background: '#111',
              color: '#fafaf8',
              border: 'none',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              ...ef.serif,
            }}
          >
            <span style={{ fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              添加联系人
            </span>
            <span style={{ fontSize: 22, lineHeight: 1, fontWeight: 300 }}>+</span>
          </motion.button>
        </div>

        {/* ── Character list ── */}
        <div style={ef.rule} />
        {characters.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.3em', color: '#ccc', textTransform: 'uppercase', ...ef.serif }}>
              No Souls Found
            </p>
          </div>
        ) : (
          characters.map((char, i) => (
            <React.Fragment key={char.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, flexShrink: 0,
                  border: '1px solid #111', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#eee',
                }}>
                  {char.avatar
                    ? <img src={char.avatar} alt={char.realName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                    : <span style={{ fontSize: 18, color: '#999', ...ef.serif }}>{getInitial(char)}</span>
                  }
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111', ...ef.serif, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {char.remark || char.realName}
                  </p>
                  {char.remark && (
                    <p style={{ margin: '2px 0 0', fontSize: 9, color: '#bbb', letterSpacing: '0.18em', textTransform: 'uppercase', ...ef.serif }}>
                      {char.realName}
                    </p>
                  )}
                </div>

                {/* Edit button */}
                <button
                  onClick={() => openEditModal(char)}
                  style={{ background: 'none', border: '1px solid #ddd', padding: '5px 10px', cursor: 'pointer', color: '#999', ...ef.serif, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' }}
                >
                  Edit
                </button>
              </div>
              <div style={ef.ruleThin} />
            </React.Fragment>
          ))
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              style={{
                position: 'relative', width: '100%', maxWidth: 480,
                background: '#fafaf8', maxHeight: '90vh',
                display: 'flex', flexDirection: 'column', ...ef.serif,
              }}
            >
              {/* Modal header */}
              <div style={{ padding: '16px 24px 0' }}>
                <div style={ef.rule} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0 4px' }}>
                  <span style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#999' }}>
                    {editingChar ? 'Edit Soul' : 'New Soul'}
                  </span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {editingChar && (
                      <button onClick={() => setIsDeleteConfirmOpen(true)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c00', ...ef.serif }}>
                        Delete
                      </button>
                    )}
                    <button onClick={() => setIsModalOpen(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', lineHeight: 1 }}>
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: '#111' }}>
                  {editingChar ? (editingChar.remark || editingChar.realName) : '创建角色'}.
                </h2>
                <div style={ef.rule} />
              </div>

              {/* Modal body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Avatar */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: 80, height: 80, border: '1px solid #111',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', overflow: 'hidden', background: '#eee', position: 'relative',
                    }}
                  >
                    {formData.avatar
                      ? <img src={formData.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <ImageIcon size={20} color="#bbb" />
                          <span style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#bbb', ...ef.serif }}>Upload</span>
                        </div>
                    }
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', border: '1px solid #c00', color: '#c00', fontSize: 12, ...ef.serif }}>
                      <AlertCircle size={14} />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={ef.label}>真实姓名 <span style={{ color: '#c00' }}>*</span></label>
                    <input style={ef.input} type="text" value={formData.realName} placeholder="例如：星空助手"
                      onChange={(e) => setFormData({ ...formData, realName: e.target.value })} />
                  </div>
                  <div>
                    <label style={ef.label}>备注</label>
                    <input style={ef.input} type="text" value={formData.remark} placeholder="例如：我的私人管家"
                      onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
                  </div>
                  <div>
                    <label style={ef.label}>人设 (Personality) <span style={{ color: '#c00' }}>*</span></label>
                    <textarea rows={4} value={formData.personality} placeholder="描述该角色的性格、说话方式等..."
                      onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                      style={{ ...ef.input, resize: 'none', lineHeight: 1.7 } as React.CSSProperties} />
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div style={{ padding: '16px 24px 32px', borderTop: '1px solid #111' }}>
                <button onClick={handleSave}
                  style={{
                    width: '100%', background: '#111', color: '#fafaf8', border: 'none',
                    padding: '14px', cursor: 'pointer', fontSize: 10,
                    letterSpacing: '0.3em', textTransform: 'uppercase', ...ef.serif,
                  }}>
                  {editingChar ? '保存修改' : '确认创建'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ── */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDeleteConfirmOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ position: 'relative', width: '100%', maxWidth: 320, background: '#fafaf8', padding: '28px 24px', ...ef.serif }}>
              <div style={ef.rule} />
              <div style={{ padding: '16px 0 20px', textAlign: 'center' }}>
                <Trash2 size={28} color="#c00" style={{ marginBottom: 12 }} />
                <h4 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#111' }}>确认删除？</h4>
                <p style={{ margin: 0, fontSize: 12, color: '#aaa', lineHeight: 1.6 }}>删除后聊天记录也将无法找回。</p>
              </div>
              <div style={ef.rule} />
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button onClick={() => setIsDeleteConfirmOpen(false)}
                  style={{ flex: 1, padding: '12px', background: 'none', border: '1px solid #ccc', cursor: 'pointer', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#666', ...ef.serif }}>
                  取消
                </button>
                <button onClick={handleDelete}
                  style={{ flex: 1, padding: '12px', background: '#c00', border: 'none', cursor: 'pointer', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fff', ...ef.serif }}>
                  确认删除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};