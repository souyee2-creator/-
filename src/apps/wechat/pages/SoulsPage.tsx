import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AICharacter } from '../types';

interface SoulsPageProps {
  characters: AICharacter[];
  onAddCharacter: (char: AICharacter) => void;
  onUpdateCharacter: (char: AICharacter) => void;
  onDeleteCharacter: (id: string) => void;
}

/* ── 极简主义 & 质感样式定义 ── */
const T = {
  black: '#000000',
  white: '#ffffff',
  nearBlack: '#111111',
  softGray: '#f2f2f2',
  error: '#ff3b30',
  // 字体栈优化：经典的衬线体与极简无衬线体
  fontSerif: '"Didot", "Bodoni MT", "Playfair Display", "Times New Roman", serif',
  fontSans: '"Inter", "Helvetica Neue", Arial, sans-serif',
};

const ef = {
  // 磨砂效果底层逻辑
  glass: {
    backdropFilter: 'blur(16px) saturate(180%)',
    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  // 输入框：从粗边框改为发丝底线，增加高级感
  input: {
    fontFamily: T.fontSans,
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #000', // 极细底线
    outline: 'none',
    fontSize: '15px',
    color: T.black,
    padding: '12px 0',
    borderRadius: 0,
    transition: 'all 0.3s ease',
  },
  label: {
    fontFamily: T.fontSans,
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: T.black,
    opacity: 0.5,
    marginBottom: '4px',
    display: 'block',
  },
  hairline: { height: '1px', background: 'rgba(0,0,0,0.1)', width: '100%' },
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
    if (!formData.realName?.trim() || !formData.personality?.trim()) return;
    if (editingChar) {
      onUpdateCharacter({ ...editingChar, ...formData } as AICharacter);
    } else {
      onAddCharacter({
        id: Date.now().toString(),
        createdAt: Date.now(),
        ...formData,
      } as AICharacter);
    }
    setIsModalOpen(false);
  };

  return (
    <div style={{ flex: 1, height: '100%', background: T.white, overflowY: 'auto', padding: '40px 24px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        
        {/* ── 顶部添加按钮：悬浮感 & 纯黑高对比 ── */}
        <motion.button
          whileHover={{ scale: 1.01, backgroundColor: T.nearBlack }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreateModal}
          style={{
            width: '100%', background: T.black, color: T.white, border: 'none',
            padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', marginBottom: '48px', gap: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
            Initialize New Soul
          </span>
          <Plus size={18} strokeWidth={1.5} />
        </motion.button>

        {/* ── 列表部分 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {characters.map((char) => (
            <motion.div
              layout
              key={char.id}
              onClick={() => openEditModal(char)}
              style={{
                display: 'flex', alignItems: 'center', padding: '24px 0',
                borderBottom: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer',
              }}
            >
              <div style={{
                width: 60, height: 60, flexShrink: 0, marginRight: 24,
                border: `1px solid ${T.black}`, overflow: 'hidden', background: T.softGray
              }}>
                {char.avatar ? (
                  <img src={char.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontFamily: T.fontSerif }}>
                    {(char.remark || char.realName)?.[0]}
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 400, fontFamily: T.fontSerif, color: T.black }}>
                  {char.remark || char.realName}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '10px', letterSpacing: '0.1em', opacity: 0.4, textTransform: 'uppercase' }}>
                  {char.remark ? char.realName : 'Unmarked Soul'}
                </p>
              </div>
              
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.3 }}>
                Edit / 01
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── 磨砂质感 Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* 背景遮罩使用深色磨砂 */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              style={{ 
                position: 'absolute', inset: 0, 
                background: 'rgba(255,255,255,0.4)', 
                backdropFilter: 'blur(10px) grayscale(1)' 
              }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              style={{
                position: 'relative', width: '90%', maxWidth: '440px',
                background: T.white, border: `1px solid ${T.black}`,
                padding: '48px', boxShadow: '0 40px 80px rgba(0,0,0,0.15)',
                ...ef.glass // 赋予容器磨砂感
              }}
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} strokeWidth={1} />
              </button>

              <header style={{ marginBottom: 40 }}>
                <span style={ef.label}>{editingChar ? 'Database Update' : 'New Identity'}</span>
                <h2 style={{ margin: 0, fontSize: 32, fontFamily: T.fontSerif, fontStyle: 'italic', fontWeight: 400 }}>
                  {editingChar ? 'Refine Soul.' : 'Birth of Soul.'}
                </h2>
              </header>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {/* 头像上传：极简圆框改为方框 */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 80, height: 80, border: '1px solid rgba(0,0,0,0.1)',
                    alignSelf: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', overflow: 'hidden', background: T.white
                  }}
                >
                  {formData.avatar ? <img src={formData.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={20} opacity={0.3} />}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

                <div>
                  <label style={ef.label}>Real Name / 真实姓名</label>
                  <input style={ef.input} type="text" value={formData.realName} onChange={e => setFormData({ ...formData, realName: e.target.value })} />
                </div>

                <div>
                  <label style={ef.label}>Remark / 备注</label>
                  <input style={ef.input} type="text" value={formData.remark} onChange={e => setFormData({ ...formData, remark: e.target.value })} />
                </div>

                <div>
                  <label style={ef.label}>Personality / 核心人设</label>
                  <textarea 
                    rows={3} 
                    style={{ ...ef.input, resize: 'none' }} 
                    value={formData.personality} 
                    onChange={e => setFormData({ ...formData, personality: e.target.value })} 
                  />
                </div>
              </div>

              <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <button onClick={handleSave} style={{
                  background: T.black, color: T.white, border: 'none', padding: '18px',
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', cursor: 'pointer'
                }}>
                  {editingChar ? 'Update Protocol' : 'Execute Creation'}
                </button>
                
                {editingChar && (
                  <button onClick={() => setIsDeleteConfirmOpen(true)} style={{
                    background: 'none', border: 'none', color: T.error, fontSize: '10px',
                    fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', opacity: 0.8
                  }}>
                    [ Terminate Consciousness ]
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 极简删除确认 ── */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{
              position: 'relative', width: 300, background: T.white, padding: 40, textAlign: 'center'
            }}>
              <Trash2 size={32} strokeWidth={1} style={{ marginBottom: 20 }} />
              <h4 style={{ fontFamily: T.fontSerif, fontSize: 20, marginBottom: 12 }}>Purge Data?</h4>
              <p style={{ fontSize: 12, opacity: 0.5, lineHeight: 1.6, marginBottom: 32 }}>This entity will be permanently removed from the void.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => { onDeleteCharacter(editingChar!.id); setIsDeleteConfirmOpen(false); setIsModalOpen(false); }}
                  style={{ background: T.error, color: T.white, border: 'none', padding: '12px', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}>
                  Confirm Purge
                </button>
                <button onClick={() => setIsDeleteConfirmOpen(false)}
                  style={{ background: 'none', border: '1px solid black', padding: '12px', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}>
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