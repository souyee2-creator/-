import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Trash2, Plus, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AICharacter } from '../types';

interface SoulsPageProps {
  characters: AICharacter[];
  onAddCharacter: (char: AICharacter) => void;
  onUpdateCharacter: (char: AICharacter) => void;
  onDeleteCharacter: (id: string) => void;
}

/* ── 对齐 index.tsx 的高级黑白质感 Tokens ── */
const T = {
  white: '#ffffff',
  bgPrimary: '#fafafa',
  black: '#000000',
  textPrimary: '#1a1a1a',
  textSecondary: '#5e5e5e',
  textHint: '#8e8e8e',
  error: '#ff3b30',
  
  // 字体系统
  fontSerif: '"Cormorant Garamond", "Playfair Display", serif',
  fontSans: '"Inter", sans-serif',
  fontMono: '"JetBrains Mono", monospace',

  borderHairline: '0.5px solid rgba(0,0,0,0.1)',
  shadowLg: '0 20px 40px rgba(0,0,0,0.1)',
};

const ef = {
  glass: {
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    background: 'rgba(255, 255, 255, 0.75)',
  },
  input: {
    fontFamily: T.fontSans,
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: T.borderHairline,
    outline: 'none',
    fontSize: '14px',
    color: T.black,
    padding: '10px 0',
    transition: 'all 0.3s ease',
  }
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
    <div style={{ flex: 1, height: '100%', background: T.bgPrimary, overflowY: 'auto', padding: '24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 120 }}>
        
        {/* ── 初始化按钮：黑底白字，悬停加深 ── */}
        <motion.button
          whileHover={{ backgroundColor: '#2c2c2c' }}
          onClick={openCreateModal}
          style={{
            width: '100%',
            background: T.black,
            color: T.white,
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginBottom: '40px',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <span style={{ fontSize: '10px', fontFamily: T.fontMono, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Initialize New Soul
          </span>
          <Plus size={14} />
        </motion.button>

        {/* ── 列表部分：柔和卡片风格 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {characters.map((char, i) => (
            <motion.div
              layout
              key={char.id}
              onClick={() => openEditModal(char)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                background: T.white,
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              whileHover={{
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                flexShrink: 0,
                marginRight: 16,
                background: '#f5f5f5',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                {char.avatar ? (
                  <img src={char.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ 
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', fontSize: 16, fontFamily: T.fontSerif, fontStyle: 'italic',
                    color: T.textHint
                  }}>
                    {(char.remark || char.realName)?.[0]}
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '16px', 
                  fontWeight: 400, 
                  fontFamily: T.fontSerif, 
                  color: T.textPrimary,
                  lineHeight: 1.3
                }}>
                  {char.remark || char.realName}
                </h3>
                <p style={{ 
                  margin: '4px 0 0', 
                  fontSize: '10px', 
                  fontFamily: T.fontMono, 
                  letterSpacing: '0.05em', 
                  color: T.textHint, 
                  textTransform: 'uppercase' 
                }}>
                  {char.remark ? char.realName : 'Undefined Soul'}
                </p>
              </div>
              
              <div style={{ 
                fontFamily: T.fontMono, 
                fontSize: '8px', 
                color: T.textHint, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 4 
              }}>
                <span>EDIT</span>
                <ArrowUpRight size={10} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── 磨砂质感 Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ 
            position: 'fixed', inset: 0, zIndex: 100, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 
          }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              style={{ 
                position: 'absolute', inset: 0, 
                background: 'rgba(255,255,255,0.2)', 
                backdropFilter: 'blur(8px)' 
              }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              style={{
                position: 'relative', width: '100%', maxWidth: '400px',
                border: T.borderHairline, padding: '40px',
                boxShadow: T.shadowLg, ...ef.glass
              }}
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4 }}
              >
                <X size={18} strokeWidth={1} />
              </button>

              <header style={{ marginBottom: 32 }}>
                <div style={{ 
                  fontFamily: T.fontMono, fontSize: 8, letterSpacing: '0.3em', 
                  textTransform: 'uppercase', color: T.textHint, marginBottom: 8 
                }}>
                  {editingChar ? 'Identity Modification' : 'New consciousness'}
                </div>
                <h2 style={{ 
                  margin: 0, fontSize: 28, fontFamily: T.fontSerif, 
                  fontStyle: 'italic', fontWeight: 500, color: T.textPrimary 
                }}>
                  {editingChar ? 'Refine Soul.' : 'Initial Soul.'}
                </h2>
              </header>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 64, height: 64, border: T.borderHairline, borderRadius: '12px',
                    alignSelf: 'flex-start', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: T.white
                  }}
                >
                  {formData.avatar ? <img src={formData.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={16} strokeWidth={1} opacity={0.3} />}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

                <div>
                  <label style={{ fontFamily: T.fontMono, fontSize: 9, color: T.textHint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Real Name / 姓名</label>
                  <input style={ef.input} type="text" value={formData.realName} onChange={e => setFormData({ ...formData, realName: e.target.value })} />
                </div>

                <div>
                  <label style={{ fontFamily: T.fontMono, fontSize: 9, color: T.textHint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Remark / 备注</label>
                  <input style={ef.input} type="text" value={formData.remark} onChange={e => setFormData({ ...formData, remark: e.target.value })} />
                </div>

                <div>
                  <label style={{ fontFamily: T.fontMono, fontSize: 9, color: T.textHint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Personality / 设定</label>
                  <textarea 
                    rows={2} 
                    style={{ ...ef.input, resize: 'none' }} 
                    value={formData.personality} 
                    onChange={e => setFormData({ ...formData, personality: e.target.value })} 
                  />
                </div>
              </div>

              <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={handleSave} style={{
                  background: T.black, color: T.white, border: 'none', padding: '14px',
                  fontFamily: T.fontMono, fontSize: '10px', fontWeight: 600, 
                  letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer'
                }}>
                  {editingChar ? 'Save Changes' : 'Execute Creation'}
                </button>
                
                {editingChar && (
                  <button onClick={() => setIsDeleteConfirmOpen(true)} style={{
                    background: 'none', border: 'none', color: T.error, fontFamily: T.fontMono,
                    fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', 
                    cursor: 'pointer', opacity: 0.6, marginTop: 8
                  }}>
                    [ Terminate Consciousness ]
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 删除确认 ── */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{
              position: 'relative', width: '100%', maxWidth: 280, background: T.white, padding: 32, textAlign: 'center'
            }}>
              <h4 style={{ fontFamily: T.fontSerif, fontSize: 20, fontStyle: 'italic', marginBottom: 8 }}>Purge?</h4>
              <p style={{ fontSize: 11, color: T.textSecondary, marginBottom: 24, fontFamily: T.fontSans }}>This action will dissolve the soul permanently.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => { onDeleteCharacter(editingChar!.id); setIsDeleteConfirmOpen(false); setIsModalOpen(false); }}
                  style={{ background: T.black, color: T.white, border: 'none', padding: '12px', fontFamily: T.fontMono, fontSize: 9, textTransform: 'uppercase', cursor: 'pointer' }}>
                  Confirm
                </button>
                <button onClick={() => setIsDeleteConfirmOpen(false)}
                  style={{ background: 'none', border: T.borderHairline, padding: '12px', fontFamily: T.fontMono, fontSize: 9, textTransform: 'uppercase', cursor: 'pointer' }}>
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