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

/* ── 统一设计系统（与 index.tsx 保持一致）────────────────── */
const T = {
  // 基础色
  white:      '#ffffff',
  offWhite:   '#fafafa',
  black:      '#000000',
  ink:        '#1a1a1a',

  // 灰度系统
  bgPrimary:    '#fafafa',
  bgElevated:   '#ffffff',
  bgInverse:    '#111111',

  textPrimary:  '#1a1a1a',
  textSecondary:'#5e5e5e',
  textHint:     '#8e8e8e',
  textOnDark:   '#eeeeee',

  borderLight:  '#eaeef2',
  borderStrong: '#dddddd',

  hoverBg:      'rgba(0,0,0,0.04)',
  activeBg:     'rgba(0,0,0,0.08)',

  // 阴影
  shadowSm: '0 2px 8px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03)',
  shadowMd: '0 8px 20px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.02)',
  shadowLg: '0 20px 32px -12px rgba(0,0,0,0.1)',

  // 字体
  fontSerif: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
  fontSans:  '"Inter", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
  fontMono:  '"JetBrains Mono", "SF Mono", monospace',
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
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '32px 24px',
      background: T.bgPrimary,
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Add Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          whileHover={{ background: '#1f1f1f' }}
          onClick={openCreateModal}
          style={{
            width: '100%',
            background: T.bgInverse,
            color: T.textOnDark,
            border: 'none',
            borderRadius: 40,
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontFamily: T.fontSans,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 32,
            transition: 'all 0.2s',
            boxShadow: T.shadowSm,
          }}
        >
          <span>Add New Soul</span>
          <span style={{ fontSize: 24, fontWeight: 300 }}>+</span>
        </motion.button>

        {/* Character List */}
        {characters.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 0',
            color: T.textHint,
            fontFamily: T.fontMono,
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}>
            Empty Database
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {characters.map((char) => (
              <div
                key={char.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  background: T.bgElevated,
                  borderRadius: 24,
                  boxShadow: T.shadowSm,
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = T.shadowMd;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = T.shadowSm;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 56,
                  height: 56,
                  flexShrink: 0,
                  borderRadius: 28,
                  background: T.bgPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: T.shadowSm,
                }}>
                  {char.avatar ? (
                    <img src={char.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{
                      fontSize: 24,
                      fontWeight: 500,
                      fontFamily: T.fontSerif,
                      color: T.textPrimary,
                    }}>
                      {getInitial(char)}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 600,
                    fontFamily: T.fontSerif,
                    color: T.textPrimary,
                  }}>
                    {char.remark || char.realName}
                  </p>
                  {char.remark && (
                    <p style={{
                      margin: '4px 0 0',
                      fontSize: 11,
                      fontFamily: T.fontSans,
                      fontWeight: 400,
                      color: T.textSecondary,
                      letterSpacing: '0.02em',
                    }}>
                      {char.realName}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => openEditModal(char)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${T.borderLight}`,
                    borderRadius: 32,
                    padding: '8px 16px',
                    fontSize: 11,
                    fontWeight: 500,
                    fontFamily: T.fontSans,
                    color: T.textSecondary,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = T.textPrimary;
                    e.currentTarget.style.color = T.textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = T.borderLight;
                    e.currentTarget.style.color = T.textSecondary;
                  }}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal (底部滑出，圆角) */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
              }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 35, stiffness: 350 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 540,
                background: T.bgElevated,
                borderRadius: '32px 32px 0 0',
                boxShadow: T.shadowLg,
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '24px 24px 0',
                borderBottom: `1px solid ${T.borderLight}`,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <span style={{
                    fontFamily: T.fontMono,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: T.textHint,
                  }}>
                    {editingChar ? 'Identity Update' : 'New Identity'}
                  </span>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      color: T.textSecondary,
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = T.textPrimary}
                    onMouseLeave={(e) => e.currentTarget.style.color = T.textSecondary}
                  >
                    <X size={20} strokeWidth={2} />
                  </button>
                </div>
                <h2 style={{
                  margin: '0 0 20px',
                  fontSize: 32,
                  fontWeight: 500,
                  fontFamily: T.fontSerif,
                  fontStyle: 'italic',
                  color: T.textPrimary,
                }}>
                  {editingChar ? 'Modify Soul.' : 'Create Soul.'}
                </h2>
              </div>

              {/* Scrollable Content */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 28,
              }}>
                {/* Avatar Upload */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      background: T.bgPrimary,
                      border: `2px dashed ${T.borderLight}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = T.textSecondary}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = T.borderLight}
                  >
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon size={32} color={T.textHint} />
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontFamily: T.fontSans,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: T.textSecondary,
                      marginBottom: 8,
                    }}>
                      Real Name
                    </label>
                    <input
                      type="text"
                      value={formData.realName}
                      onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                      style={{
                        width: '100%',
                        background: T.bgPrimary,
                        border: `1px solid ${T.borderLight}`,
                        borderRadius: 16,
                        padding: '12px 16px',
                        fontFamily: T.fontSans,
                        fontSize: 14,
                        color: T.textPrimary,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = T.textSecondary}
                      onBlur={(e) => e.currentTarget.style.borderColor = T.borderLight}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontFamily: T.fontSans,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: T.textSecondary,
                      marginBottom: 8,
                    }}>
                      Remark
                    </label>
                    <input
                      type="text"
                      value={formData.remark}
                      onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                      style={{
                        width: '100%',
                        background: T.bgPrimary,
                        border: `1px solid ${T.borderLight}`,
                        borderRadius: 16,
                        padding: '12px 16px',
                        fontFamily: T.fontSans,
                        fontSize: 14,
                        color: T.textPrimary,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = T.textSecondary}
                      onBlur={(e) => e.currentTarget.style.borderColor = T.borderLight}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontFamily: T.fontSans,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: T.textSecondary,
                      marginBottom: 8,
                    }}>
                      Personality
                    </label>
                    <textarea
                      rows={4}
                      value={formData.personality}
                      onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                      style={{
                        width: '100%',
                        background: T.bgPrimary,
                        border: `1px solid ${T.borderLight}`,
                        borderRadius: 16,
                        padding: '12px 16px',
                        fontFamily: T.fontSans,
                        fontSize: 14,
                        color: T.textPrimary,
                        outline: 'none',
                        resize: 'vertical',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = T.textSecondary}
                      onBlur={(e) => e.currentTarget.style.borderColor = T.borderLight}
                    />
                  </div>
                </div>

                {error && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(255,0,0,0.05)',
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: `1px solid #ff0000`,
                  }}>
                    <AlertCircle size={14} color="#ff0000" />
                    <span style={{ fontSize: 11, color: '#ff0000', fontFamily: T.fontSans }}>
                      {error}
                    </span>
                  </div>
                )}

                {editingChar && (
                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    style={{
                      alignSelf: 'flex-start',
                      background: 'none',
                      border: 'none',
                      color: '#ff0000',
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: T.fontSans,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      cursor: 'pointer',
                      padding: 0,
                      marginTop: 8,
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    Terminate Soul
                  </button>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '20px 24px',
                borderTop: `1px solid ${T.borderLight}`,
                background: T.bgElevated,
              }}>
                {/* 修复：将普通 button 改为 motion.button 以支持 whileHover */}
                <motion.button
                  onClick={handleSave}
                  style={{
                    width: '100%',
                    background: T.bgInverse,
                    border: 'none',
                    borderRadius: 40,
                    padding: '14px 24px',
                    fontFamily: T.fontSans,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: T.textOnDark,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  whileHover={{ background: '#1f1f1f' }}
                >
                  {editingChar ? 'Save Changes' : 'Execute Creation'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteConfirmOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
              }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 360,
                background: T.bgElevated,
                borderRadius: 32,
                boxShadow: T.shadowLg,
                padding: '32px 24px',
                textAlign: 'center',
              }}
            >
              <Trash2 size={40} style={{ marginBottom: 16, color: T.textHint }} />
              <h4 style={{
                margin: '0 0 8px',
                fontSize: 20,
                fontWeight: 600,
                fontFamily: T.fontSerif,
                color: T.textPrimary,
              }}>
                PERMANENT DELETE?
              </h4>
              <p style={{
                margin: '0 0 24px',
                fontSize: 13,
                fontFamily: T.fontSans,
                color: T.textSecondary,
                lineHeight: 1.4,
              }}>
                This action cannot be undone. Data will be purged.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '12px 16px',
                    background: '#ff0000',
                    border: 'none',
                    borderRadius: 40,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: T.fontSans,
                    color: T.white,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Confirm Purge
                </button>
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  style={{
                    padding: '12px 16px',
                    background: 'transparent',
                    border: `1px solid ${T.borderLight}`,
                    borderRadius: 40,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: T.fontSans,
                    color: T.textSecondary,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = T.textPrimary;
                    e.currentTarget.style.color = T.textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = T.borderLight;
                    e.currentTarget.style.color = T.textSecondary;
                  }}
                >
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